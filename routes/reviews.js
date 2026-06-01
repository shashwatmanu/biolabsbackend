const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

const defaultReviews = [
  { name: 'Arjun S.', rating: 5, category: 'Morning Energy', comment: 'Baseless energy is back. Day 14 and I feel 10 years younger.', verified: true, approved: true },
  { name: 'Rahul M.', rating: 5, category: 'Daily Focus', comment: 'Best supplement for drive and focus. No jitters.', verified: true, approved: true },
  { name: 'Vikram K.', rating: 4, category: 'Recovery Support', comment: 'Noticeable difference in recovery after gym sessions.', verified: true, approved: true }
];

// @desc    Get all APPROVED reviews
// @route   GET /api/reviews
// @access  Public
router.get('/', async (req, res) => {
  try {
    const reviews = await Review.find({ approved: true }).sort({ date: -1 });
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching approved reviews:', error);
    res.status(500).json({ error: 'Server error fetching reviews' });
  }
});

// @desc    Get all PENDING (unapproved) reviews
// @route   GET /api/reviews/pending
// @access  Public (Can be protected with admin middleware later)
router.get('/pending', async (req, res) => {
  try {
    const reviews = await Review.find({ approved: false }).sort({ date: -1 });
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching pending reviews:', error);
    res.status(500).json({ error: 'Server error fetching pending reviews' });
  }
});

// @desc    Post a new review (pending by default)
// @route   POST /api/reviews
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name, rating, comment, category, verified } = req.body;

    if (!name || !rating || !comment) {
      return res.status(400).json({ error: 'Please fill in all review details' });
    }

    const review = await Review.create({
      name,
      rating: Number(rating),
      comment,
      category: category || 'Overall Vitality',
      approved: false, // Must be approved by administrators
      verified: verified !== undefined ? verified : true
    });

    res.status(201).json({
      message: 'Review submitted! It will appear on the site once approved by the administrators.',
      review
    });
  } catch (error) {
    console.error('Error posting review:', error);
    res.status(500).json({ error: 'Server error adding review' });
  }
});

// @desc    Approve a specific review
// @route   PUT /api/reviews/:id/approve
// @access  Public (Can be protected with admin middleware later)
router.put('/:id/approve', async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { approved: true },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ message: 'Review successfully approved!', review });
  } catch (error) {
    console.error('Error approving review:', error);
    res.status(500).json({ error: 'Server error approving review' });
  }
});

// @desc    Seed default reviews
// @route   POST /api/reviews/seed
// @access  Public
router.post('/seed', async (req, res) => {
  try {
    await Review.deleteMany({});
    const seededReviews = await Review.insertMany(defaultReviews);
    res.status(201).json({ message: 'Reviews database seeded successfully', reviews: seededReviews });
  } catch (error) {
    console.error('Error seeding reviews:', error);
    res.status(500).json({ error: 'Server error seeding reviews' });
  }
});

module.exports = router;
