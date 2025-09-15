const express = require('express');
const Dog = require('../models/Dogs'); 
const { requireAuth } = require('../middlewares/authMiddleware');
const router = express.Router();

/**
 * GET /dogs?p=0
 * (3 dogs per page)
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.p, 10) || 0;
    const perPage = 3;

    const [dogs, total] = await Promise.all([
      Dog.find()
        .sort({ _id: -1 })               
        .skip(page * perPage)
        .limit(perPage)
        .lean(),
      Dog.countDocuments()
    ]);

    res.json({
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
      dogs
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching dogs' });
  }
});

/**
 * POST /dogs
 * Create a new dog
 */
router.post('/register', requireAuth, async (req, res) => {
  try {
    const dog = await Dog.create(req.body);
    res.status(201).json(dog);
  } catch (err) {
    console.error(err);

    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: err.errors
      });
    }
    res.status(500).json({ error: 'Could not create dog' });
  }
});

/**
 * PATCH /dogs/:id
 * users can adopt a dog by its ID, including a thank-you message for the original owner. 
 * Restrictions apply: 
 * only adopt if status is available, and users cannot adopt dogs they registered.
 */
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const dogId = req.params.id;
    const {  thankYouMessage } = req.body;

    const dog = await Dog.findById(dogId);
    if (!dog) {
      return res.status(404).json({ error: 'Dog not found' });
    }

    if (dog.status !== 'available') {
      return res.status(400).json({ error: 'Dog is not available for adoption' });
    }

    const currentUserId = req.user._id;

    if (dog.registered_by.toString() === currentUserId.toString()) {
      return res.status(400).json({ error: 'You cannot adopt a dog you registered' });
    }

    dog.status = 'adopted';
    dog.adopted_by = currentUserId;
    dog.adoption_message = thankYouMessage;
    dog.adoption_date = new Date();

    await dog.save();

    res.json(dog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error adopting dog' });
  }
});

module.exports = router;
