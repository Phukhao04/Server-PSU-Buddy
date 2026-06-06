const mongoose = require('mongoose');
const dbLuckyDraw = require('../config/dbLuckyDraw');

const luckyPrizeSchema = new mongoose.Schema({
  prize_name: { type: String, required: true },
  prize_description: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'LuckyDrawProject', required: true },
}, { timestamps: true });

const LuckyPrize = dbLuckyDraw.model('LuckyPrize', luckyPrizeSchema);

module.exports = LuckyPrize;