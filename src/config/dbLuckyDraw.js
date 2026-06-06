const mongoose = require('mongoose');

const dbLuckyDraw = mongoose.createConnection(process.env.MONGO_LUCKYDRAW_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});

dbLuckyDraw.on('connected', () => {
  console.log('LuckyDraw Database connected successfully');
});
dbLuckyDraw.on('error', (err) => {
  console.error('LuckyDraw Database connection error:', err);
});
dbLuckyDraw.on('disconnected', () => {
  console.log('LuckyDraw Database disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await dbLuckyDraw.close();
  console.log('LuckyDraw Database connection closed.');
  process.exit(0);
});

module.exports = dbLuckyDraw;