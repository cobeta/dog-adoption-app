const app = require('./app');
const { connectDB } = require('./db');

(async () => {
  try {
    await connectDB(process.env.MONGODB_URI);

    const PORT = process.env.PORT;
    app.listen(PORT, () => {
      console.log(`🚀 App listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start app:', err);
    process.exit(1);
  }
})();