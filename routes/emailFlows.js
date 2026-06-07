const express = require('express');
const router = express.Router();
const EmailQueue = require('../models/EmailQueue');
const { triggerFlow, runEmailSenderJob } = require('../utils/emailFlowsService');
const { templates } = require('../utils/emailTemplates');

// @desc    Get all queued emails
// @route   GET /api/email-flows/queue
router.get('/queue', async (req, res) => {
  try {
    const queue = await EmailQueue.find().sort({ scheduledFor: 1 });
    res.json(queue);
  } catch (error) {
    console.error('Error fetching email queue:', error);
    res.status(500).json({ error: 'Failed to fetch email queue' });
  }
});

// @desc    Manually trigger a flow for an email
// @route   POST /api/email-flows/trigger
router.post('/trigger', async (req, res) => {
  try {
    const { email, firstName, flow, testMode } = req.body;

    if (!email || !flow) {
      return res.status(400).json({ error: 'Email and Flow parameters are required' });
    }

    const name = firstName || 'Customer';
    const queuedItems = await triggerFlow(flow, email, name, {}, !!testMode);

    res.status(201).json({
      success: true,
      message: `Successfully triggered flow "${flow}" for ${email}`,
      itemsCount: queuedItems.length,
      items: queuedItems
    });
  } catch (error) {
    console.error('Error triggering manual flow:', error);
    res.status(500).json({ error: error.message || 'Failed to trigger flow' });
  }
});

// @desc    Instantly process and send due emails
// @route   POST /api/email-flows/run-scheduler
router.post('/run-scheduler', async (req, res) => {
  try {
    await runEmailSenderJob();
    res.json({ success: true, message: 'Scheduler job triggered successfully' });
  } catch (error) {
    console.error('Error running scheduler:', error);
    res.status(500).json({ error: 'Failed to run scheduler job' });
  }
});

// @desc    Instantly send a specific queued email
// @route   POST /api/email-flows/send-now/:id
router.post('/send-now/:id', async (req, res) => {
  try {
    const emailItem = await EmailQueue.findById(req.params.id);
    if (!emailItem) {
      return res.status(404).json({ error: 'Email item not found' });
    }

    // Temporarily set scheduledFor to past so the scheduler will pick it up, or send it immediately
    emailItem.scheduledFor = new Date(Date.now() - 1000);
    emailItem.status = 'pending';
    await emailItem.save();

    await runEmailSenderJob();

    // Reload item to check final state
    const updated = await EmailQueue.findById(req.params.id);
    res.json({
      success: updated.status === 'sent',
      status: updated.status,
      error: updated.error,
      message: updated.status === 'sent' ? 'Email sent successfully!' : 'Email dispatch failed'
    });
  } catch (error) {
    console.error('Error sending email instantly:', error);
    res.status(500).json({ error: 'Failed to process email dispatch' });
  }
});

// @desc    Cancel a queued email
// @route   POST /api/email-flows/cancel/:id
router.post('/cancel/:id', async (req, res) => {
  try {
    const emailItem = await EmailQueue.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled', error: 'Manually cancelled via Admin dashboard' },
      { new: true }
    );
    if (!emailItem) return res.status(404).json({ error: 'Email item not found' });
    res.json({ success: true, message: 'Email cancelled successfully', emailItem });
  } catch (error) {
    console.error('Error cancelling email:', error);
    res.status(500).json({ error: 'Failed to cancel email' });
  }
});

// @desc    Clear all emails from the queue
// @route   POST /api/email-flows/clear
router.post('/clear', async (req, res) => {
  try {
    await EmailQueue.deleteMany({});
    res.json({ success: true, message: 'All queued items cleared successfully!' });
  } catch (error) {
    console.error('Error clearing email queue:', error);
    res.status(500).json({ error: 'Failed to clear queue' });
  }
});

// @desc    Get preview HTML for a specific flow and step
// @route   GET /api/email-flows/preview/:flow/:step
router.get('/preview/:flow/:step', (req, res) => {
  try {
    const { flow, step } = req.params;
    const flowSteps = templates[flow];

    if (!flowSteps || !flowSteps[step]) {
      return res.status(404).send('<h2>Email template step not found</h2>');
    }

    const mockVars = {
      first_name: 'John',
      product_link: '#',
      cart_link: '#',
      reorder_link: '#',
      bundle_link: '#',
      guide_link: '#',
      review_link: '#',
      referral_link: '#',
      instagram_handle: '@biomenlabs',
      support_email: 'support@biomenlabs.com',
      feedback_email: 'support@biomenlabs.com',
      discounted_price: '1,274',
      order_id: 'ORDER-12345'
    };

    const compiled = flowSteps[step]('John', mockVars);
    res.setHeader('Content-Type', 'text/html');
    res.send(compiled.html);
  } catch (error) {
    console.error('Error generating email preview:', error);
    res.status(500).send(`<h2>Error rendering template: ${error.message}</h2>`);
  }
});

module.exports = router;
