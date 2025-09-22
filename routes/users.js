const express = require('express');
const Dog = require('../models/Dogs'); 
const { requireAuth } = require('../middlewares/authMiddleware');
const router = express.Router();

/**
 * GET /users/me/dogs?p=0
 * Lists all dogs registered by the authenticated user
 * (3 dogs per page)
 */
router.get('/me/dogs', requireAuth, async (req, res) => {
  try {
    // Retrieve only dogs registered by the authenticated user
    const currentUserId = "" + res.locals.user._id;

    const page = parseInt(req.query.p, 10) || 0;
    const perPage = 3;

    const [dogs, total] = await Promise.all([
      Dog.find({ registered_by: currentUserId })
        .sort({ _id: -1 })               
        .skip(page * perPage)
        .limit(perPage)
        .lean(),
      Dog.countDocuments({ registered_by: currentUserId })
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
 * GET /users/me/adoptedDogs
 * Lists all dogs adopted by the authenticated user
 * (3 dogs per page)
 */
router.get('/me/adoptedDogs', requireAuth, async (req, res) => {
  try {

    // List only dogs adopted by the authenticated user
    const currentUserId = "" + res.locals.user._id;

    const page = parseInt(req.query.p, 10) || 0;
    const perPage = 3;

    const [dogs, total] = await Promise.all([
      Dog.find({ adopted_by: currentUserId })
        .sort({ _id: -1 })               
        .skip(page * perPage)
        .limit(perPage)
        .lean(),
      Dog.countDocuments({ adopted_by: currentUserId })
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
module.exports = router;
