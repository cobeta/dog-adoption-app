// app.js
// Read environment variables from .env file
const path = require('path');
const env = process.env.NODE_ENV || 'development';

// Use .env for production by default; .env.development / .env.test otherwise
const dotenvPath = env === 'production' ? '.env' : `.env.${env}`;
require('dotenv').config({ path: path.resolve(process.cwd(), dotenvPath) });

const express = require('express');
const cookieParser = require('cookie-parser');
const { checkUser } = require('./middlewares/authMiddleware');
const { connectDB } = require('./db');

const app = express();

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(checkUser);

// Routes
const dogsRoutes = require('./routes/dogs');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/authRoutes');
app.use('/dogs', dogsRoutes);
app.use('/users', userRoutes);
app.use('/auth', authRoutes);

module.exports = app;


