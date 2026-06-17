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

// @desc    Get all products (public, active only)
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

// @desc    Get all products for admin (including inactive)
// @route   GET /api/products/admin/all
// @access  Private/Admin
router.get('/admin/all', async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Admin fetch products error:', error);
    res.status(500).json({ error: 'Server error fetching admin product catalog' });
  }
});

// @desc    Update a product (stock, price, active status)
// @route   PUT /api/products/admin/:id
// @access  Private/Admin
router.put('/admin/:id', async (req, res) => {
  try {
    const { stock, price, mrp, isActive } = req.body;
    const updateFields = {};
    if (stock !== undefined) updateFields.stock = parseInt(stock, 10);
    if (price !== undefined) updateFields.price = parseFloat(price);
    if (mrp !== undefined) updateFields.mrp = parseFloat(mrp);
    if (isActive !== undefined) updateFields.isActive = Boolean(isActive);

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ success: true, message: 'Product updated successfully!', product });
  } catch (error) {
    console.error('Admin update product error:', error);
    res.status(500).json({ error: 'Server error updating product' });
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
