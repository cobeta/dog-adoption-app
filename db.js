// db.js
const mongoose = require('mongoose');

async function connectDB(uri) {
  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000, // fail fast if DB unreachable
  });

  mongoose.connection.on('connected', () => {
    console.log('✅ Mongoose connected');
  });
  mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose error:', err);
  });
  mongoose.connection.on('disconnected', () => {
    console.log('⚠️  Mongoose disconnected');
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('Mongoose connection closed due to app termination');
    process.exit(0);
  });

  return mongoose.connection;
}

module.exports = { connectDB };
