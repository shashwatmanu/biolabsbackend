const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  id: {
    type: String,
    required: [true, 'Product SKU ID is required'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  title: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Product price is required']
  },
  mrp: {
    type: Number,
    required: [true, 'Product MRP is required']
  },
  description: {
    type: String,
    trim: true
  },
  stock: {
    type: Number,
    required: [true, 'Product stock is required'],
    default: 100
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', ProductSchema);
