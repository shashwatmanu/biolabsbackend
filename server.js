const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// MongoDB Connection Setup
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/biolabs-vitality';

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log('💚 MongoDB Database Connected Successfully!');
    
    // Auto-seeding products if empty
    try {
      const Product = require('./models/Product');
      const count = await Product.countDocuments();
      if (count === 0) {
        console.log('🚀 Seeding default product inventory...');
        const defaultProducts = [
          {
            id: 'tcore-3-bottles',
            name: '3 Bottles | 90 Days',
            title: 'Full Reset System',
            price: 3999,
            mrp: 9000,
            description: 'Evaluate full recovery, stamina & drive baseline. 90-day clinical herbal stack.',
            stock: 100,
            isActive: true
          },
          {
            id: 'tcore-2-bottles',
            name: '2 Bottles | 60 Days',
            title: 'Consistency System',
            price: 2799,
            mrp: 6000,
            description: 'Build serious masculine performance baseline. 60-day clinical herbal stack.',
            stock: 100,
            isActive: true
          },
          {
            id: 'tcore-1-bottle',
            name: '1 Bottle | 30 Days',
            title: 'Entry System',
            price: 1499,
            mrp: 3000,
            description: 'For first-time customers starting their routine. 30-day clinical herbal stack.',
            stock: 100,
            isActive: true
          }
        ];
        await Product.insertMany(defaultProducts);
        console.log('✅ Default products seeded!');
      }

      // Auto-seeding reviews if empty
      const Review = require('./models/Review');
      const reviewCount = await Review.countDocuments();
      if (reviewCount === 0) {
        console.log('🚀 Seeding default reviews...');
        const defaultReviews = [
          { name: 'Arjun S.', rating: 5, category: 'Morning Energy', comment: 'Baseless energy is back. Day 14 and I feel 10 years younger.', verified: true, approved: true },
          { name: 'Rahul M.', rating: 5, category: 'Daily Focus', comment: 'Best supplement for drive and focus. No jitters.', verified: true, approved: true },
          { name: 'Vikram K.', rating: 4, category: 'Recovery Support', comment: 'Noticeable difference in recovery after gym sessions.', verified: true, approved: true }
        ];
        await Review.insertMany(defaultReviews);
        console.log('✅ Default reviews seeded!');
      }
      // Start the background email retention scheduler
      const { startScheduler } = require('./utils/emailFlowsService');
      startScheduler();
    } catch (err) {
      console.error('Error auto-seeding collections:', err);
    }
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Failure:', err.message);
  });

// API Routes Mounting
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/subscribe', require('./routes/subscribers'));
app.use('/api/email-flows', require('./routes/emailFlows'));

// System Status Endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'Biolabs Backend is running',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date()
  });
});

// Global Fallback Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled internal server error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error. Please try again.' });
});

app.listen(PORT, () => {
  console.log(`📡 Biolabs Server running on port ${PORT}`);
});
