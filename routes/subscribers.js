const express = require('express');
const router = express.Router();
const Subscriber = require('../models/Subscriber');
const nodemailer = require('nodemailer');

// Optional nodemailer configuration helper
const sendNewsletterWelcomeEmail = async (email) => {
  try {
    // Scaffold transporter (to be customized by user with actual credentials in .env later)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'placeholder@gmail.com',
        pass: process.env.EMAIL_PASS || 'placeholderpassword'
      }
    });

    const mailOptions = {
      from: `"Biolabs Premium Support" <${process.env.EMAIL_USER || 'placeholder@gmail.com'}>`,
      to: email,
      subject: 'Welcome to Biolabs - Start Your 90-Day Masculine Vitality Reset Protocol',
      html: `
        <div style="background-color: #030705; color: #F4F6F2; font-family: 'Helvetica Neue', sans-serif; padding: 40px; border-radius: 16px; border: 1px solid #0FA36B;">
          <h1 style="color: #16C784; text-transform: uppercase; letter-spacing: 2px;">WELCOME TO BIOLABS</h1>
          <p style="font-size: 16px; line-height: 1.6;">You are now subcribed to the Biolabs newsletter.</p>
          <p style="font-size: 16px; line-height: 1.6;">Prepare yourself for the ultimate clinical-grade protocol to unlock daily performance, stamina, and drive rhythm.</p>
          <hr style="border-color: rgba(255,255,255,0.1); margin: 20px 0;" />
          <div style="font-size: 12px; color: #A8B3AA;">
            🔒 Safe & Secure. Unsubscribe at any time.<br/>
            Biolabs Premium Vitality, India.
          </div>
        </div>
      `
    };

    // Only send if configured, otherwise just log it
    if (process.env.EMAIL_USER && process.env.EMAIL_USER !== 'placeholder@gmail.com') {
      await transporter.sendMail(mailOptions);
      console.log(`Newsletter confirmation email successfully sent to ${email}`);
    } else {
      console.log(`[Email Mock] Welcome email would be sent to: ${email}`);
    }
  } catch (err) {
    console.error('Nodemailer newsletter notification error:', err);
  }
};

// @desc    Subscribe a new email to newsletter
// @route   POST /api/subscribe
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    // Check if email already subscribed
    let subscriber = await Subscriber.findOne({ email });
    if (subscriber) {
      return res.status(400).json({ error: 'This email is already subscribed' });
    }

    // Save subscriber
    subscriber = await Subscriber.create({ email });

    // Trigger v2 Welcome email flow (4 steps)
    const { triggerFlow } = require('../utils/emailFlowsService');
    try {
      await triggerFlow('Welcome', email, 'Customer');
    } catch (flowErr) {
      console.error('Failed to trigger Welcome flow for new subscriber:', flowErr);
    }

    res.status(201).json({ message: 'Subscribed successfully', subscriber });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    res.status(500).json({ error: 'Server error subscribing to newsletter' });
  }
});

module.exports = router;
