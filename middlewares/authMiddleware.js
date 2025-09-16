require('dotenv').config();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const requireAuth = (req, res, next) => {
  const token = req.cookies.jwt;

  // check json web token exists & is verified
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      if (err) {
        // response status wrong creedentials
        return res.status(401).json({ error: 'Wrong credentials' });
      } else {
        next();
      }
    });
  } else {
    return res.status(401).json({ error: 'You must be logged in to access this resource' });
  }
};

// check current user
const checkUser = (req, res, next) => {
  const token = req.cookies.jwt;
  console.log('Check User Middleware - Token:', token);
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
      console.log('Check User Middleware - Decoded Token:', decodedToken);
      if (err) {
        console.log('Check User Middleware - Error:',  err.message);
        res.locals.user = null;
        next();
      } else {
        let user = await User.findById(decodedToken.id);
        res.locals.user = user;
        console.log('Check User Middleware - Authenticated User:', user);
        next();
      }
    });
  } else {
    res.locals.user = null;
    next();
  }
};


module.exports = { requireAuth, checkUser };