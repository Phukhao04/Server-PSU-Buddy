const { default: mongoose } = require("mongoose");
const dbLuckyDraw = require("../config/dbLuckyDraw");

const luckProjectSchema = new mongoose.Schema({
  project_pin: { type: String, required: true, unique: true }, // A-Z, 0-9
  name: { type: String, required: true },
  description: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  isBroadcast: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  psuIdAdmin: [{ type: String }],
}, { timestamps: true });

const LuckyDrawProject = dbLuckyDraw.model('LuckyDrawProject', luckProjectSchema);

module.exports = LuckyDrawProject;