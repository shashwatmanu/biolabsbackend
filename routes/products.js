const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Default e-commerce products
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

// @desc    Get all products
// @route   GET /api/products
// @access  Public
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Server error fetching product catalog' });
  }
});

// @desc    Seed default product inventory
// @route   POST /api/products/seed
// @access  Public
router.post('/seed', async (req, res) => {
  try {
    await Product.deleteMany({});
    const seededProducts = await Product.insertMany(defaultProducts);
    res.status(201).json({ message: 'Products database seeded successfully', products: seededProducts });
  } catch (error) {
    console.error('Error seeding products:', error);
    res.status(500).json({ error: 'Server error seeding products' });
  }
});

module.exports = router;
