const LuckyTicket = require("../model/luck_ticket");
// const lucky_prize = require("../model/luck_prize");
// const luck_project = require("../model/luck_project");
/**
 * จัดการข้อมูลการจับสลากรายบุคคล
 * @class LuckyDrawPersonalManage
 * @param {string} type - ประเภทของผู้ใช้ ('lineID' หรือ 'psuID')
 * @param {string} idFind - รหัสผู้ใช้ที่ต้องการค้นหา
 */
class LuckyDrawPersonalManage {
  /**
   * สร้างอินสแตนซ์ใหม่สำหรับจัดการข้อมูลจับสลากรายบุคคล
   * @param {string} type - ประเภทของผู้ใช้ ('lineID' หรือ 'psuID')
   * @param {string} idFind - รหัสผู้ใช้ที่ต้องการค้นหา
   */
  constructor(type, idFind) {
    this.type = type; // 'lineID' or 'psuID'


    this.ticketUser = idFind;
  }

  /**
   * ดึงข้อมูลรายการจับสลากของผู้ใช้รายบุคคล
   * @returns {Promise<Array>} ข้อมูลรายการจับสลากของผู้ใช้
   */
  async getPersonalEntries() {

    // unwind data 
    const entries = await LuckyTicket.aggregate([
      { $match: { [`ticket_detail.${this.type}`]: this.ticketUser } },
      {
        $lookup: {
          from: 'luckyprizes',
          localField: 'prize_id',
          foreignField: '_id',
          as: 'prize_info'
        }
      },
      { $unwind: { path: '$prize_info', preserveNullAndEmptyArrays: true } }
      ,
      {
        $lookup: {
          from: 'luckydrawprojects',
          localField: 'project_id',
          foreignField: '_id',
          as: 'project_info'
        }
      },
      { $unwind: { path: '$project_info', preserveNullAndEmptyArrays: true } }

    ]);

    return entries;
  }



}


module.exports = LuckyDrawPersonalManage;