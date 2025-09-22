const express = require('express');
const Dog = require('../models/Dogs'); 
const { requireAuth } = require('../middlewares/authMiddleware');
const router = express.Router();

/**
 * GET /dogs?p=0
 * This endpoint is not required in the exercise, it lists all dogs in the system
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
router.post('/', requireAuth, async (req, res) => {
  try {
    const dogData = {
      ...req.body,
      registered_by: res.locals.user._id
    };
    const dog = await Dog.create(dogData);
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
 * PATCH /dogs/:id/adopt
 * users can adopt a dog by its ID, including a thank-you message for the original owner. 
 * Restrictions apply: 
 * only adopt if status is available, and users cannot adopt dogs they registered.
 */
router.patch('/:id/adopt', requireAuth, async (req, res) => {
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

    const currentUserId = "" + res.locals.user._id; 
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

/**
 * PATCH /dogs/:id/remove
 * Owners can remove their registered dogs from the platform unless the dog has been adopted. Users cannot remove dogs registered by others.
 */
router.patch('/:id/remove', requireAuth, async (req, res) => {
  try {
    const dogId = req.params.id;

    const dog = await Dog.findById(dogId);
    if (!dog) {
      return res.status(404).json({ error: 'Dog not found' });
    }

    const currentUserId = "" + res.locals.user._id;

    if (dog.registered_by.toString() !== currentUserId.toString()) {
      return res.status(403).json({ error: 'You can only remove dogs you registered' });
    }

    dog.status = 'removed';
    dog.removed_at = new Date();

    await dog.save();

    res.json(dog);
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error removing dog' });
  }
});

module.exports = router;
