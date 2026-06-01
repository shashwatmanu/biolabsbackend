const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET || 'biolabs_super_secret_key';

// Helper to send transactional order emails
const sendOrderConfirmationEmail = async (email, order) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'placeholder@gmail.com',
        pass: process.env.EMAIL_PASS || 'placeholderpassword'
      }
    });

    const itemsList = order.items
      .map(
        (item) =>
          `<li><strong>${item.title}</strong> x ${item.quantity} - ₹${(item.price * item.quantity).toLocaleString()}</li>`
      )
      .join('');

    const mailOptions = {
      from: `"Biolabs Order Desk" <${process.env.EMAIL_USER || 'placeholder@gmail.com'}>`,
      to: email,
      subject: `Order Confirmed! Your Biolabs Vitality Protocol is processing (#${order._id})`,
      html: `
        <div style="background-color: #030705; color: #F4F6F2; font-family: 'Helvetica Neue', sans-serif; padding: 40px; border-radius: 16px; border: 1px solid #0FA36B; max-width: 600px; margin: auto;">
          <h1 style="color: #16C784; text-transform: uppercase; font-size: 24px; letter-spacing: 2px;">ORDER SECURED</h1>
          <p style="font-size: 16px;">Thank you for your order! Your Biolabs shipment is being prepared.</p>
          <hr style="border-color: rgba(255,255,255,0.1); margin: 20px 0;" />
          
          <h3 style="color: #BFA46A; text-transform: uppercase;">Order Summary</h3>
          <ul>
            ${itemsList}
          </ul>
          <p style="font-size: 16px; font-weight: bold; margin-top: 15px;">Subtotal: ₹${order.subtotal.toLocaleString()}</p>
          <p style="font-size: 16px; font-weight: bold;">Total Amount Paid: ₹${order.totalAmount.toLocaleString()}</p>
          
          <hr style="border-color: rgba(255,255,255,0.1); margin: 20px 0;" />
          <h3 style="color: #BFA46A; text-transform: uppercase;">Shipping Address</h3>
          <p style="font-size: 14px; line-height: 1.5; color: #A8B3AA;">
            ${order.shippingAddress.street}<br/>
            ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}<br/>
            ${order.shippingAddress.country}
          </p>

          <p style="font-size: 13px; color: #A8B3AA; margin-top: 30px;">
            If you have any questions, reply directly to this email support channel.
          </p>
        </div>
      `
    };

    if (process.env.EMAIL_USER && process.env.EMAIL_USER !== 'placeholder@gmail.com') {
      await transporter.sendMail(mailOptions);
      console.log(`Order confirmation email sent successfully to ${email}`);
    } else {
      console.log(`[Email Mock] Order confirmation email would be sent to: ${email}`);
    }
  } catch (err) {
    console.error('Nodemailer order email error:', err);
  }
};

// @desc    Create a new order & verify stock
// @route   POST /api/orders
// @access  Public (handles guest and registered checkouts)
router.post('/', async (req, res) => {
  try {
    const { items, shippingAddress, guestDetails, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty. Cannot place order.' });
    }

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.postalCode) {
      return res.status(400).json({ error: 'Complete shipping address is required.' });
    }

    // Optional: Determine if user is logged in
    let userId = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        console.log('Order processed without login session or invalid token (proceeding as Guest)');
      }
    }

    // If not logged in, guest details must be provided
    if (!userId && (!guestDetails || !guestDetails.name || !guestDetails.email || !guestDetails.phone)) {
      return res.status(400).json({ error: 'Customer details (name, email, phone) are required for Guest checkout.' });
    }

    // Get email to send order confirmation to
    let customerEmail = '';
    if (userId) {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: 'User account session not found.' });
      customerEmail = user.email;
    } else {
      customerEmail = guestDetails.email;
    }

    // Validate stock and compute amount
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findOne({ id: item.id });
      if (!product) {
        return res.status(404).json({ error: `Product not found: ${item.title}` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for product ${product.name}. Only ${product.stock} units remaining.` 
        });
      }

      subtotal += product.price * item.quantity;
      validatedItems.push({
        productId: product.id,
        title: product.name,
        price: product.price,
        quantity: item.quantity
      });
    }

    const shippingCharges = 0; // Free shipping
    const totalAmount = subtotal + shippingCharges;

    // Deduct stock levels for items purchased
    for (const item of items) {
      await Product.findOneAndUpdate(
        { id: item.id },
        { $inc: { stock: -item.quantity } }
      );
    }

    // Scaffold Order Entry in MongoDB
    const orderData = {
      items: validatedItems,
      subtotal,
      shippingCharges,
      totalAmount,
      shippingAddress,
      paymentMethod: paymentMethod || 'Razorpay',
      paymentStatus: 'paid', // Mark paid immediately for mock checkout flow
      razorpayOrderId: `rpay_order_${Date.now()}`,
      razorpayPaymentId: `rpay_pay_${Date.now()}`,
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`
    };

    if (userId) {
      orderData.user = userId;
    } else {
      orderData.guestDetails = guestDetails;
    }

    const order = await Order.create(orderData);

    // Send transactional order confirmation email
    await sendOrderConfirmationEmail(customerEmail, order);

    res.status(201).json({
      success: true,
      message: 'Order created successfully!',
      order
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Server error processing order checkout' });
  }
});

// @desc    Get order history for authenticated user
// @route   GET /api/orders/myorders
// @access  Private
router.get('/myorders', async (req, res) => {
  try {
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer')) {
      return res.status(401).json({ error: 'Unauthorized. Login token required.' });
    }

    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Fetch orders error:', error);
    res.status(500).json({ error: 'Server error retrieving order history' });
  }
});

// ==========================================
// ADMINISTRATIVE ADMIN DASHBOARD ENDPOINTS
// ==========================================

// @desc    Get dashboard stats (aggregated numbers)
// @route   GET /api/orders/admin/stats
// @access  Private/Admin
router.get('/admin/stats', async (req, res) => {
  try {
    // 1. Calculate Total Revenue
    const paidOrders = await Order.find({ paymentStatus: 'paid' });
    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    // 2. Count Total Orders & Subscriber lists
    const totalOrdersCount = await Order.countDocuments();
    const Subscriber = require('../models/Subscriber');
    const totalSubscribers = await Subscriber.countDocuments();

    // 3. Segment Payment Status counts
    const paidCount = await Order.countDocuments({ paymentStatus: 'paid' });
    const pendingPaymentCount = await Order.countDocuments({ paymentStatus: 'pending' });
    const failedPaymentCount = await Order.countDocuments({ paymentStatus: 'failed' });

    // 4. Segment Shipping Status counts
    const processingCount = await Order.countDocuments({ shippingStatus: 'processing' });
    const shippedCount = await Order.countDocuments({ shippingStatus: 'shipped' });
    const deliveredCount = await Order.countDocuments({ shippingStatus: 'delivered' });

    // 5. Segment Retail vs Wholesale
    const retailCount = await Order.countDocuments({ orderType: 'retail' });
    const wholesaleCount = await Order.countDocuments({ orderType: 'wholesale' });

    // 6. Gather low inventory alert counts
    const Product = require('../models/Product');
    const lowStockProducts = await Product.find({ stock: { $lt: 10 } });

    res.json({
      totalRevenue,
      totalOrdersCount,
      totalSubscribers,
      payments: {
        paid: paidCount,
        pending: pendingPaymentCount,
        failed: failedPaymentCount
      },
      shipping: {
        processing: processingCount,
        shipped: shippedCount,
        delivered: deliveredCount
      },
      types: {
        retail: retailCount,
        wholesale: wholesaleCount
      },
      lowStockAlertCount: lowStockProducts.length
    });
  } catch (error) {
    console.error('Admin stats retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve administrative statistics' });
  }
});

// @desc    Get all orders (with advanced filtering)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
router.get('/admin/all', async (req, res) => {
  try {
    const { orderType, paymentStatus, shippingStatus, search } = req.query;
    let query = {};

    if (orderType) query.orderType = orderType;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (shippingStatus) query.shippingStatus = shippingStatus;

    if (search) {
      // Fuzzy search guest name or email
      query.$or = [
        { 'guestDetails.name': { $regex: search, $options: 'i' } },
        { 'guestDetails.email': { $regex: search, $options: 'i' } },
        { invoiceNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const allOrders = await Order.find(query).sort({ createdAt: -1 });
    res.json(allOrders);
  } catch (error) {
    console.error('Admin fetch all orders error:', error);
    res.status(500).json({ error: 'Failed to retrieve administrative order lists' });
  }
});

// @desc    Update shipping status of an order
// @route   PUT /api/orders/admin/:id/status
// @access  Private/Admin
router.put('/admin/:id/status', async (req, res) => {
  try {
    const { shippingStatus } = req.body;
    
    if (!['processing', 'shipped', 'delivered', 'cancelled'].includes(shippingStatus)) {
      return res.status(400).json({ error: 'Invalid shipping status type' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { shippingStatus },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ success: true, message: 'Shipping status updated successfully!', order });
  } catch (error) {
    console.error('Update shipping status error:', error);
    res.status(500).json({ error: 'Failed to update order shipping status' });
  }
});

// @desc    Toggle order classification type (Retail vs Wholesale)
// @route   PUT /api/orders/admin/:id/type
// @access  Private/Admin
router.put('/admin/:id/type', async (req, res) => {
  try {
    const { orderType } = req.body;

    if (!['retail', 'wholesale'].includes(orderType)) {
      return res.status(400).json({ error: 'Invalid order category classification' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderType },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ success: true, message: 'Order categorization updated!', order });
  } catch (error) {
    console.error('Toggle order type error:', error);
    res.status(500).json({ error: 'Failed to update order category classification' });
  }
});

// @desc    Mock Push order to Shiprocket (generates tracking AWB number)
// @route   PUT /api/orders/admin/:id/shiprocket
// @access  Private/Admin
router.put('/admin/:id/shiprocket', async (req, res) => {
  try {
    const trackingNumber = `SR-AWB-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const shipmentId = `SR-SH-${Math.floor(100000 + Math.random() * 900000)}`;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        shippingStatus: 'shipped',
        trackingNumber,
        shipmentId
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      success: true,
      message: 'Order successfully pushed and approved in Shiprocket!',
      order
    });
  } catch (error) {
    console.error('Shiprocket push error:', error);
    res.status(500).json({ error: 'Failed to register order with Shiprocket' });
  }
});

module.exports = router;
