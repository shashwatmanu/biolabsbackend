const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const dns = require('dns');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'biolabs_super_secret_key';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_T1DPpvbyCF8PbS',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '6zC5FvgoQPdCD8yYrRZWuox1'
});


// Helper to send admin alert email when a new paid order comes in
const sendAdminOrderAlert = async (order) => {
  try {
    const adminEmail = process.env.ADMIN_ALERT_EMAIL || process.env.EMAIL_USER || 'info@biomenlabs.com';
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'placeholder@gmail.com') {
      console.log(`[Admin Alert Mock] New order notification would be sent to admin: ${adminEmail}`);
      return;
    }

    const ip = await new Promise((resolve) => {
      dns.lookup('smtp.gmail.com', { family: 4 }, (err, address) => {
        resolve(address || 'smtp.gmail.com');
      });
    });

    const transporter = nodemailer.createTransport({
      host: ip,
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      servername: 'smtp.gmail.com',
      tls: { servername: 'smtp.gmail.com' }
    });

    const customerName = order.guestDetails?.name || 'Registered User';
    const customerEmail = order.guestDetails?.email || 'N/A';
    const customerPhone = order.guestDetails?.phone || 'N/A';
    const itemsList = order.items
      .map(i => `<li><strong>${i.title}</strong> × ${i.quantity} — ₹${(i.price * i.quantity).toLocaleString()}</li>`)
      .join('');
    const addr = order.shippingAddress;

    await transporter.sendMail({
      from: `"Biomen Labs Admin" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `🟢 New Order Paid! ₹${order.totalAmount.toLocaleString()} — ${customerName} [${order.invoiceNumber}]`,
      html: `
        <div style="background:#030705;color:#F4F6F2;font-family:'Helvetica Neue',sans-serif;padding:32px;border-radius:16px;border:2px solid #0FA36B;max-width:600px;margin:auto">
          <h1 style="color:#16C784;font-size:22px;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px">💰 New Order Received!</h1>
          <p style="color:#A8B3AA;font-size:13px;margin-top:0">Paid via Razorpay — Action required: Approve & Ship</p>
          <hr style="border-color:rgba(255,255,255,0.1);margin:20px 0"/>

          <table style="width:100%;font-size:14px;border-collapse:collapse">
            <tr><td style="color:#A8B3AA;padding:6px 0;width:40%">Invoice</td><td style="color:#fff;font-weight:bold">${order.invoiceNumber}</td></tr>
            <tr><td style="color:#A8B3AA;padding:6px 0">Customer</td><td style="color:#fff;font-weight:bold">${customerName}</td></tr>
            <tr><td style="color:#A8B3AA;padding:6px 0">Email</td><td style="color:#fff">${customerEmail}</td></tr>
            <tr><td style="color:#A8B3AA;padding:6px 0">Phone</td><td style="color:#16C784;font-weight:bold;font-size:16px">${customerPhone}</td></tr>
            <tr><td style="color:#A8B3AA;padding:6px 0">Total</td><td style="color:#16C784;font-weight:900;font-size:20px">₹${order.totalAmount.toLocaleString()}</td></tr>
            <tr><td style="color:#A8B3AA;padding:6px 0">Payment ID</td><td style="color:#fff;font-family:monospace">${order.razorpayPaymentId || 'N/A'}</td></tr>
          </table>

          <hr style="border-color:rgba(255,255,255,0.1);margin:20px 0"/>
          <h3 style="color:#BFA46A;text-transform:uppercase;font-size:12px;letter-spacing:2px">Order Items</h3>
          <ul style="padding-left:20px;font-size:14px">${itemsList}</ul>

          <hr style="border-color:rgba(255,255,255,0.1);margin:20px 0"/>
          <h3 style="color:#BFA46A;text-transform:uppercase;font-size:12px;letter-spacing:2px">Ship To</h3>
          <p style="font-size:14px;color:#A8B3AA;line-height:1.7">
            ${addr.street}<br/>
            ${addr.city}, ${addr.state} — ${addr.postalCode}<br/>
            ${addr.country}
          </p>

          <div style="margin-top:24px;text-align:center">
            <a href="${process.env.FRONTEND_URL || 'https://biomenlabs.com'}/admin" style="background:#0FA36B;color:#fff;padding:14px 32px;border-radius:50px;font-weight:900;font-size:12px;text-decoration:none;text-transform:uppercase;letter-spacing:2px">Open Admin Panel →</a>
          </div>
        </div>
      `
    });
    console.log(`Admin order alert sent to ${adminEmail}`);
  } catch (err) {
    console.error('Admin alert email error:', err);
  }
};

// Helper to send transactional order emails
const sendOrderConfirmationEmail = async (email, order) => {
  try {
    const ip = await new Promise((resolve) => {
      dns.lookup('smtp.gmail.com', { family: 4 }, (err, address) => {
        resolve(address || 'smtp.gmail.com');
      });
    });

    const transporter = nodemailer.createTransport({
      host: ip,
      port: 587,
      secure: false, // Port 587 with STARTTLS bypasses firewall restrictions
      auth: {
        user: process.env.EMAIL_USER || 'placeholder@gmail.com',
        pass: process.env.EMAIL_PASS || 'placeholderpassword'
      },
      servername: 'smtp.gmail.com',
      tls: {
        servername: 'smtp.gmail.com'
      }
    });

    const itemsList = order.items
      .map(
        (item) =>
          `<li><strong>${item.title}</strong> x ${item.quantity} - ₹${(item.price * item.quantity).toLocaleString()}</li>`
      )
      .join('');

    const mailOptions = {
      from: `"Biomen Labs" <${process.env.EMAIL_USER || 'placeholder@gmail.com'}>`,
      to: email,
      subject: `Order Confirmed! Your Biomen Labs Vitality Protocol is processing (#${order._id})`,
      html: `
        <div style="background-color: #030705; color: #F4F6F2; font-family: 'Helvetica Neue', sans-serif; padding: 40px; border-radius: 16px; border: 1px solid #0FA36B; max-width: 600px; margin: auto;">
          <h1 style="color: #16C784; text-transform: uppercase; font-size: 24px; letter-spacing: 2px;">ORDER SECURED</h1>
          <p style="font-size: 16px;">Thank you for your order! Your Biomen Labs shipment is being prepared.</p>
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
    const { items, shippingAddress, guestDetails, paymentMethod, couponCode } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty. Cannot place order.' });
    }

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.postalCode) {
      return res.status(400).json({ error: 'Complete shipping address is required.' });
    }

    // Optional: Determine if user is logged in
    let userId = null;
    if (req.headers.authorization) {
      if (req.headers.authorization.startsWith('Bearer')) {
        try {
          const token = req.headers.authorization.split(' ')[1];
          const decoded = jwt.verify(token, JWT_SECRET);
          userId = decoded.id;
        } catch (err) {
          return res.status(401).json({ error: 'Unauthorized: Invalid or expired token.' });
        }
      } else {
        return res.status(401).json({ error: 'Unauthorized: Invalid token format.' });
      }
    }

    // If not logged in, guest details must be provided
    if (!userId && (!guestDetails || !guestDetails.name || !guestDetails.email || !guestDetails.phone)) {
      return res.status(400).json({ error: 'Customer details (name, email, phone) are required for Guest checkout.' });
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

      let itemPrice = product.price;
      if (item.isSubscription) {
        // apply 15% discount for auto-pay subscription (round to integer)
        itemPrice = Math.round(product.price * 0.85);
      }

      subtotal += itemPrice * item.quantity;
      validatedItems.push({
        productId: product.id,
        title: item.isSubscription ? `${product.name} (Auto-Pay Subscription)` : product.name,
        price: itemPrice,
        quantity: item.quantity
      });
    }

    const shippingCharges = 0; // Free shipping
    let discountAmount = 0;
    if (couponCode === 'FOUNDER10') {
      discountAmount = Math.round(subtotal * 0.10);
    }
    const totalAmount = subtotal + shippingCharges - discountAmount;

    // Validate amount is at least 100 paise (₹1)
    const totalAmountPaise = totalAmount * 100;
    if (totalAmountPaise < 100) {
      return res.status(400).json({ error: 'Order amount must be at least 100 paise (₹1).' });
    }

    // Create order via Razorpay API
    let rzpOrder;
    try {
      rzpOrder = await razorpay.orders.create({
        amount: totalAmountPaise,
        currency: 'INR',
        receipt: `receipt_order_${Date.now()}`
      });
    } catch (rzpErr) {
      console.error('Razorpay API Error during order creation:', rzpErr);
      return res.status(500).json({ error: 'Failed to create payment transaction order with Razorpay.' });
    }

    // Scaffold Order Entry in MongoDB as pending
    const orderData = {
      items: validatedItems,
      subtotal,
      shippingCharges,
      totalAmount,
      shippingAddress,
      paymentMethod: paymentMethod || 'Razorpay',
      paymentStatus: 'pending',
      razorpayOrderId: rzpOrder.id,
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`
    };

    if (userId) {
      orderData.user = userId;
    } else {
      orderData.guestDetails = guestDetails;
    }

    const order = await Order.create(orderData);

    res.status(201).json({
      success: true,
      message: 'Razorpay order created successfully!',
      order,
      razorpayOrder: {
        id: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency
      }
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Server error processing order checkout' });
  }
});

// @desc    Verify Razorpay payment signature and fulfill order
// @route   POST /api/orders/verify-payment
// @access  Public
router.post('/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing required payment verification fields.' });
    }

    // Validate signature
    const secret = process.env.RAZORPAY_KEY_SECRET || '6zC5FvgoQPdCD8yYrRZWuox1';
    const text = razorpay_order_id + '|' + razorpay_payment_id;
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(text)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      console.error('Payment verification failed: signature mismatch');
      return res.status(400).json({ error: 'Payment verification failed. Signatures do not match.' });
    }

    // Locate the pending order in database
    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) {
      return res.status(404).json({ error: 'Order associated with this payment transaction was not found.' });
    }

    // If order is already paid, return success to prevent double stock decrement
    if (order.paymentStatus === 'paid') {
      return res.status(200).json({
        success: true,
        message: 'Order already fulfilled.',
        order
      });
    }

    // Deduct stock levels for items purchased
    for (const item of order.items) {
      await Product.findOneAndUpdate(
        { id: item.productId },
        { $inc: { stock: -item.quantity } }
      );
    }

    // Update payment status
    order.paymentStatus = 'paid';
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    // Get email & name to send order confirmation and run retention flows
    let customerEmail = '';
    let customerName = 'Customer';
    if (order.user) {
      const user = await User.findById(order.user);
      if (user) {
        customerEmail = user.email;
        customerName = user.name || 'Customer';
      }
    } else if (order.guestDetails) {
      customerEmail = order.guestDetails.email;
      customerName = order.guestDetails.name || 'Customer';
    }
    const firstName = customerName.trim().split(' ')[0] || 'Customer';

    // Send transactional order confirmation email (non-blocking background task)
    sendOrderConfirmationEmail(customerEmail, order);

    // Send admin alert email so founders are notified instantly
    sendAdminOrderAlert(order);

    // Trigger v2 Retention lifecycle integration
    const { applySuppressionRules, triggerFlow } = require('../utils/emailFlowsService');
    try {
      // 1. Suppress pre-purchase abandonment flows for this email
      await applySuppressionRules(customerEmail, 'PLACED_ORDER');
      // 2. Start the 5-step Post-Purchase Onboarding flow
      const baseUrl = process.env.FRONTEND_URL || 'https://biomenlabs.com';
      await triggerFlow('Post-Purchase', customerEmail, firstName, {
        order_id: order._id,
        tracking_link: `${baseUrl}/admin` // Redirect to admin panel/order page
      });
      // 3. Schedule Reorder flow at same time (timing delays handle spacing)
      await triggerFlow('Reorder', customerEmail, firstName, {
        reorder_link: `${baseUrl}/products/t-core`,
        bundle_link: `${baseUrl}/products/t-core`
      });
    } catch (flowErr) {
      console.error('Failed to trigger retention flows for order:', flowErr);
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified and order finalized successfully!',
      order
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Server error processing payment verification' });
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

// @desc    Get dashboard stats (aggregated numbers + 7-day revenue chart)
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
    const cancelledCount = await Order.countDocuments({ shippingStatus: 'cancelled' });

    // 5. Segment Retail vs Wholesale
    const retailCount = await Order.countDocuments({ orderType: 'retail' });
    const wholesaleCount = await Order.countDocuments({ orderType: 'wholesale' });

    // 6. Gather low inventory alert counts
    const Product = require('../models/Product');
    const lowStockProducts = await Product.find({ stock: { $lt: 10 } });

    // 7. Average Order Value
    const avgOrderValue = paidCount > 0 ? Math.round(totalRevenue / paidCount) : 0;

    // 8. 7-day revenue breakdown for chart
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentOrders = await Order.find({
      paymentStatus: 'paid',
      createdAt: { $gte: sevenDaysAgo }
    });

    // Build daily revenue map for last 7 days
    const dailyRevenue = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const dayOrders = recentOrders.filter(o => {
        const d = new Date(o.createdAt);
        return d >= day && d <= dayEnd;
      });
      const dayRevenue = dayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const dayOrderCount = dayOrders.length;

      dailyRevenue.push({
        date: day.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        revenue: dayRevenue,
        orders: dayOrderCount
      });
    }

    // 9. Recent 5 orders for activity feed
    const recentActivity = await Order.find({ paymentStatus: 'paid' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('invoiceNumber guestDetails totalAmount createdAt shippingStatus');

    res.json({
      totalRevenue,
      totalOrdersCount,
      totalSubscribers,
      avgOrderValue,
      payments: {
        paid: paidCount,
        pending: pendingPaymentCount,
        failed: failedPaymentCount
      },
      shipping: {
        processing: processingCount,
        shipped: shippedCount,
        delivered: deliveredCount,
        cancelled: cancelledCount
      },
      types: {
        retail: retailCount,
        wholesale: wholesaleCount
      },
      lowStockAlertCount: lowStockProducts.length,
      dailyRevenue,
      recentActivity
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

// @desc    Set manual tracking number for an order
// @route   PUT /api/orders/admin/:id/tracking
// @access  Private/Admin
router.put('/admin/:id/tracking', async (req, res) => {
  try {
    const { trackingNumber, shipmentId } = req.body;

    if (!trackingNumber) {
      return res.status(400).json({ error: 'Tracking number is required' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        trackingNumber: trackingNumber.trim(),
        shipmentId: shipmentId ? shipmentId.trim() : undefined,
        shippingStatus: 'shipped'
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ success: true, message: 'Tracking number saved and order marked as shipped!', order });
  } catch (error) {
    console.error('Set tracking number error:', error);
    res.status(500).json({ error: 'Failed to update tracking number' });
  }
});

// @desc    Get all customers derived from orders (guest + users)
// @route   GET /api/orders/admin/customers
// @access  Private/Admin
router.get('/admin/customers', async (req, res) => {
  try {
    const { search } = req.query;

    // Aggregate unique guest customers from orders
    const allOrders = await Order.find({ 'guestDetails.email': { $exists: true, $ne: '' } })
      .sort({ createdAt: -1 })
      .select('guestDetails totalAmount paymentStatus shippingStatus createdAt invoiceNumber items');

    // Build customer map indexed by email
    const customerMap = {};
    for (const order of allOrders) {
      const email = order.guestDetails?.email;
      if (!email) continue;

      if (!customerMap[email]) {
        customerMap[email] = {
          name: order.guestDetails?.name || 'Unknown',
          email,
          phone: order.guestDetails?.phone || 'N/A',
          totalSpent: 0,
          orderCount: 0,
          lastOrderDate: order.createdAt,
          orders: []
        };
      }

      if (order.paymentStatus === 'paid') {
        customerMap[email].totalSpent += order.totalAmount;
      }
      customerMap[email].orderCount += 1;
      customerMap[email].orders.push({
        invoiceNumber: order.invoiceNumber,
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus,
        shippingStatus: order.shippingStatus,
        createdAt: order.createdAt,
        items: order.items
      });
    }

    let customers = Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent);

    // Apply search filter
    if (search) {
      const q = search.toLowerCase();
      customers = customers.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q)
      );
    }

    res.json(customers);
  } catch (error) {
    console.error('Admin customers fetch error:', error);
    res.status(500).json({ error: 'Failed to retrieve customer list' });
  }
});

module.exports = router;
