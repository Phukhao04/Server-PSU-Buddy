
const mongoose = require('mongoose');

const dbLuckyDraw = require('../config/dbLuckyDraw');

const luckyTicketSchema = new mongoose.Schema({
  ticket_type: { type: String, required: true }, // 'lineID' , 'psuID' ,'both','anonymous'
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'LuckyDrawProject', required: true },
  ticket_detail: {
    lineID: { type: String },
    psuID: { type: String },
    name: { type: String, required: true },
  },
  // status ว่าตั๋วนี้ถูกรางวัลหรือไม่
  is_winner: { type: Boolean, default: false },
  verify_code: { type: String, default: null }, // code for anonymous ticket verification
  prize_id: { type: mongoose.Schema.Types.ObjectId, ref: 'LuckyPrize', default: null },
  /*
    สถานะการแลกรางวัล
    - pending: รอการแลกรางวัล
    - redeemed: แลกรางวัลแล้ว
    - canceled: ยกเลิกการแลกรางวัล (สละสิทธิ์)
  */
  redeem_status: { type: String, enum: ['pending', 'redeemed', 'canceled'], default: 'pending' },
}, { timestamps: true });

const LuckyTicket = dbLuckyDraw.model('LuckyTicket', luckyTicketSchema);

module.exports = LuckyTicket;