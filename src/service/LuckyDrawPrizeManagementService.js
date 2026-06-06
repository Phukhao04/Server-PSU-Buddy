/**
 * คลาสสำหรับจัดการรางวัลในระบบ Lucky Draw
 * @module LuckyDrawPrizeManagementService
 */
const LuckyPrize = require("../model/luck_prize");

/**
 * บริการสำหรับจัดการรางวัล Lucky Draw
 * @class
 * @param {string} projectId - ไอดีโปรเจกต์ที่ใช้สำหรับกรองรางวัล
 */
class LuckyDrawPrizeManagementService {
  // Service methods for managing lucky draw prizes
  constructor(projectId) {
    this.lp = LuckyPrize;
    this.projectId = projectId;

  }

  /**
   * สร้างรางวัลใหม่
   * @param {Object} data - ข้อมูลรางวัล
   * @returns {Promise<Object>} รางวัลที่ถูกสร้าง
   */
  async createPrize(data) {
    const prize = new this.lp({ ...data, project_id: this.projectId });
    return await prize.save();
  }

  /**
   * ดึงข้อมูลรางวัลทั้งหมดของโปรเจกต์นี้
   * @returns {Promise<Array>} รายการรางวัล
   */
  async getPrizes() {
    return await this.lp.find({ project_id: this.projectId }).lean();
  }

  /**
   * ดึงข้อมูลรางวัลตามไอดี
   * @param {string} id - ไอดีรางวัล
   * @returns {Promise<Object|null>} ข้อมูลรางวัลหรือ null ถ้าไม่พบ
   */
  async getPrizeById(id) {
    return await this.lp.findById(id).lean();
  }

  /**
   * อัปเดตรางวัลตามไอดี
   * @param {string} id - ไอดีรางวัล
   * @param {Object} data - ข้อมูลรางวัลที่ต้องการอัปเดต
   * @returns {Promise<Object|null>} รางวัลที่ถูกอัปเดตหรือ null ถ้าไม่พบ
   */
  async updatePrize(id, data) {
    return await this.lp.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  /**
   * ลบรางวัลตามไอดี
   * @param {string} id - ไอดีรางวัล
   * @returns {Promise<Object|null>} รางวัลที่ถูกลบหรือ null ถ้าไม่พบ
   */
  async deletePrize(id) {
    return await this.lp.findByIdAndDelete(id).lean();
  }

  /**
   * ลบรางวัลทั้งหมดของโปรเจกต์นี้
   * @returns {Promise<Object>} ผลลัพธ์การลบ
   */
  async deleteAllPrizes() {
    return await this.lp.deleteMany({ project_id: this.projectId });
  }

}

/**
 * ส่งออกคลาส LuckyDrawPrizeManagementService
 */
module.exports = LuckyDrawPrizeManagementService;