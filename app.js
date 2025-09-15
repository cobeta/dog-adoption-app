// app.js
require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const { connectDB } = require('./db');

const app = express();

// Middleware
app.use(cookieParser());
app.use(express.json());

// Routes
const dogsRoutes = require('./routes/dogs');
const authRoutes = require('./routes/authRoutes');

(async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;

    await connectDB(MONGODB_URI);

    app.use('/dogs', dogsRoutes);
    app.use('/auth', authRoutes);

    const PORT = process.env.PORT;
    app.listen(PORT, () => {
      console.log(`🚀 App listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start app:', err);
    process.exit(1);
  }
})();
