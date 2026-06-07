const EmailQueue = require('../models/EmailQueue');
const { templates } = require('./emailTemplates');
const nodemailer = require('nodemailer');

// Trigger timings configuration in milliseconds
const TIMINGS = {
  Welcome: {
    1: 0,
    2: 48 * 60 * 60 * 1000,
    3: 4 * 24 * 60 * 60 * 1000,
    4: 7 * 24 * 60 * 60 * 1000
  },
  'Browse Abandonment': {
    1: 4 * 60 * 60 * 1000,
    2: 48 * 60 * 60 * 1000,
    3: 5 * 24 * 60 * 60 * 1000
  },
  'Cart Recovery': {
    1: 1 * 60 * 60 * 1000,
    2: 24 * 60 * 60 * 1000,
    3: 36 * 60 * 60 * 1000,
    4: 72 * 60 * 60 * 1000
  },
  'Post-Purchase': {
    1: 0,
    2: 3 * 24 * 60 * 60 * 1000,
    3: 7 * 24 * 60 * 60 * 1000,
    4: 14 * 24 * 60 * 60 * 1000,
    5: 21 * 24 * 60 * 60 * 1000
  },
  Reorder: {
    1: 24 * 24 * 60 * 60 * 1000,
    2: 28 * 24 * 60 * 60 * 1000,
    3: 30 * 24 * 60 * 60 * 1000,
    4: 38 * 24 * 60 * 60 * 1000
  },
  Review: {
    1: 0,
    2: 2 * 24 * 60 * 60 * 1000
  },
  Winback: {
    1: 60 * 24 * 60 * 60 * 1000,
    2: 67 * 24 * 60 * 60 * 1000,
    3: 74 * 24 * 60 * 60 * 1000
  }
};

// Transporter logic using environment settings
const getTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER || 'placeholder@gmail.com',
      pass: process.env.EMAIL_PASS || 'placeholderpassword'
    },
    family: 4 // Force IPv4 to prevent IPv6 ENETUNREACH on Render's network environment
  });
};

/**
 * Triggers a retention flow and queues emails.
 * @param {string} flowName - Welcome, Cart Recovery, etc.
 * @param {string} email - Recipient email.
 * @param {string} firstName - Recipient's first name.
 * @param {object} metadata - Extra details like product links, order ID.
 * @param {boolean} testMode - If true, compresses delays to 5 seconds per step for testing.
 */
const triggerFlow = async (flowName, email, firstName = 'Customer', metadata = {}, testMode = false) => {
  try {
    const flowSteps = templates[flowName];
    if (!flowSteps) throw new Error(`Invalid flow: ${flowName}`);

    // If starting a fresh flow, suppress/cancel older pending items in the SAME flow
    await EmailQueue.updateMany(
      { email, flow: flowName, status: 'pending' },
      { status: 'cancelled', error: 'Cancelled by new flow trigger' }
    );

    const now = Date.now();
    const createdEmails = [];

    for (const stepNumStr of Object.keys(flowSteps)) {
      const step = parseInt(stepNumStr);
      let delay = TIMINGS[flowName][step] || 0;

      // In testing mode, make steps fire in 5, 10, 15, 20 seconds instead of hours/days
      if (testMode) {
        delay = step * 5 * 1000;
      }

      const scheduledFor = new Date(now + delay);

      // Construct dynamic variables
      const flowVars = {
        product_link: 'http://localhost:5173/product/tcore-1-bottle',
        cart_link: 'http://localhost:5173/checkout',
        reorder_link: 'http://localhost:5173/product/tcore-1-bottle',
        bundle_link: 'http://localhost:5173/product/tcore-3-bottles',
        guide_link: 'http://localhost:5173/science',
        review_link: 'http://localhost:5173/reviews',
        referral_link: 'http://localhost:5173/contact',
        instagram_handle: '@biomenlabs',
        support_email: 'support@biomenlabs.com',
        feedback_email: 'support@biomenlabs.com',
        discounted_price: '1,274',
        ...metadata
      };

      // Compile a mock evaluation of the subject
      const tempOutput = flowSteps[step](firstName, flowVars);

      const emailItem = await EmailQueue.create({
        email,
        firstName,
        flow: flowName,
        step,
        subject: tempOutput.subject,
        scheduledFor,
        status: 'pending',
        metadata: flowVars
      });
      createdEmails.push(emailItem);
    }

    console.log(`[EmailFlowsService] Triggered flow "${flowName}" for ${email}. Scheduled ${createdEmails.length} steps.`);
    return createdEmails;
  } catch (error) {
    console.error(`Error triggering flow "${flowName}":`, error);
    throw error;
  }
};

/**
 * Apply suppression rules for high-intent actions.
 * @param {string} email - Recipient email.
 * @param {string} event - Action triggering suppression (e.g., 'PLACED_ORDER').
 */
const applySuppressionRules = async (email, event) => {
  if (event === 'PLACED_ORDER') {
    // Suppress Welcome, Cart Recovery, and Browse Abandonment, plus active Reorders since they just ordered
    const result = await EmailQueue.updateMany(
      {
        email,
        flow: { $in: ['Welcome', 'Cart Recovery', 'Browse Abandonment', 'Reorder'] },
        status: 'pending'
      },
      { status: 'cancelled', error: `Suppressed by PLACED_ORDER event` }
    );
    if (result.modifiedCount > 0) {
      console.log(`[EmailFlowsService] Suppressed ${result.modifiedCount} pending emails for ${email} due to purchase.`);
    }
  }
};

/**
 * Process and send due emails in the queue.
 */
const runEmailSenderJob = async () => {
  try {
    const now = new Date();
    const pendingEmails = await EmailQueue.find({
      status: 'pending',
      scheduledFor: { $lte: now }
    });

    if (pendingEmails.length === 0) return;

    console.log(`[EmailFlowsService] Found ${pendingEmails.length} emails due for dispatch.`);

    const transporter = getTransporter();
    const isLive = process.env.EMAIL_USER && process.env.EMAIL_USER !== 'placeholder@gmail.com';

    for (const emailItem of pendingEmails) {
      try {
        const flowSteps = templates[emailItem.flow];
        if (!flowSteps || !flowSteps[emailItem.step]) {
          throw new Error(`Template not found for flow: ${emailItem.flow}, step: ${emailItem.step}`);
        }

        // Generate actual HTML content
        const compiled = flowSteps[emailItem.step](emailItem.firstName, emailItem.metadata);

        if (isLive) {
          await transporter.sendMail({
            from: `"Biolabs Support" <${process.env.EMAIL_USER}>`,
            to: emailItem.email,
            subject: compiled.subject,
            html: compiled.html
          });
          console.log(`[EmailFlowsService] LIVE sent flow "${emailItem.flow}" step ${emailItem.step} to ${emailItem.email}`);
        } else {
          console.log(`[EmailFlowsService] MOCK sent flow "${emailItem.flow}" step ${emailItem.step} to ${emailItem.email}. Subject: "${compiled.subject}"`);
        }

        emailItem.status = 'sent';
        emailItem.sentAt = new Date();
        await emailItem.save();
      } catch (err) {
        console.error(`Failed to send email ID ${emailItem._id} to ${emailItem.email}:`, err);
        emailItem.status = 'failed';
        emailItem.error = err.message;
        await emailItem.save();
      }
    }
  } catch (error) {
    console.error('[EmailFlowsService] Error in runEmailSenderJob:', error);
    throw error;
  }
};

// Start background interval checker (runs every 10 seconds locally to keep things responsive)
let jobInterval = null;
const startScheduler = () => {
  if (jobInterval) return;
  jobInterval = setInterval(runEmailSenderJob, 10000);
  console.log('💚 [EmailFlowsService] Background retention scheduler active (checking every 10s)');
};

module.exports = {
  triggerFlow,
  applySuppressionRules,
  runEmailSenderJob,
  startScheduler
};
