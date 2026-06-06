const mongoose = require('mongoose');

const dbPsuBuddy = mongoose.createConnection(process.env.MONGO_PSU_BUDDY_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});

dbPsuBuddy.on('connected', () => {
  console.log('PSU Buddy Database connected successfully');
});
dbPsuBuddy.on('error', (err) => {
  console.error('PSU Buddy Database connection error:', err);
});
dbPsuBuddy.on('disconnected', () => {
  console.log('PSU Buddy Database disconnected');
});
// Graceful shutdown
process.on('SIGINT', async () => {
  await dbPsuBuddy.close();
  console.log('PSU Buddy Database connection closed.');
  process.exit(0);
});

module.exports = dbPsuBuddy;
