const fp = require('fastify-plugin');
const jwt = require('jsonwebtoken');

/**
 * ปลั๊กอินสำหรับ Fastify เพื่อจัดการการยืนยันตัวตนด้วย JWT (JWT Authentication)
 *
 * ปลั๊กอินนี้จะเพิ่ม `verifyToken` decorator เข้าไปใน Fastify instance
 * ซึ่งสามารถใช้เป็น `preHandler` hook ใน route ต่างๆ เพื่อป้องกันการเข้าถึง
 * โดยจะตรวจสอบ JWT จาก 'Authorization' header (ในรูปแบบ Bearer scheme)
 *
 * @param {import('fastify').FastifyInstance} fastify - Fastify instance
 * @param {object} options - ตัวเลือกสำหรับปลั๊กอิน
 * @param {string} [options.secretKey] - Secret key สำหรับ JWT (จะใช้ค่านี้ก่อนค่าจาก environment variable)
 */
module.exports = fp(async (fastify, options) => {
  // 1. ดึง Secret Key สำหรับใช้กับ JWT
  // โดยจะดึงจาก options ที่ส่งเข้ามาตอน register ก่อน, หากไม่มีจะไปดึงจาก environment variable
  const secretKey = options.secretKey || process.env.TOKEN_KEY;

  // 2. ตรวจสอบให้แน่ใจว่ามี Secret Key
  // หากไม่มี ให้ throw error เพื่อหยุดการทำงานของเซิร์ฟเวอร์ตั้งแต่เริ่มต้น
  if (!secretKey) {
    throw new Error(
      'JWT Secret Key is not provided. Please set TOKEN_KEY in your .env file or pass it as an option.',
    );
  }

  // 3. เพิ่มฟังก์ชัน `verifyToken` เข้าไปใน Fastify instance ด้วย `decorate`
  // ฟังก์ชันนี้จะทำหน้าที่เป็น middleware/hook สำหรับการยืนยันตัวตน
  fastify.decorate('verifyToken', async (request, reply) => {
    try {
      // ดึงค่า token จาก 'Authorization' header
      // รูปแบบมาตรฐานคือ "Bearer <token>"
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // หากไม่มี header หรือไม่ได้ขึ้นต้นด้วย "Bearer " ให้ปฏิเสธการเข้าถึง
        return reply.code(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Authorization header is missing or malformed.',
        });
      }

      // แยกเอาเฉพาะส่วนของ token ออกมาจาก header
      const token = authHeader.split(' ')[1];

      // ตรวจสอบความถูกต้องของ token ด้วย secretKey
      // หาก token ไม่ถูกต้อง (เช่น signature ผิด, หมดอายุ) `jwt.verify` จะ throw error ออกมา
      const decoded = jwt.verify(token, secretKey);

      // นำข้อมูลที่ถอดรหัสได้ (payload) ไปเก็บไว้ที่ `request.user`
      // เพื่อให้ route handler ที่เรียกใช้ต่อไปสามารถนำข้อมูล user ไปใช้ได้
      request.user = decoded;
    } catch (error) {
      // บันทึก error ที่เกิดขึ้นจริงไว้ใน log เพื่อการดีบัก
      fastify.log.error(error);

      // ส่ง response กลับไปหา client ว่าไม่ได้รับอนุญาต
      // เพื่อความปลอดภัย ไม่ควรส่งรายละเอียดของ error (เช่น 'jwt expired') กลับไปตรงๆ
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid or expired token.',
      });
    }
  });

  fastify.decorate('verifyLiffToken', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.code(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Authorization header is missing or malformed.',
        });
      }

      const token = authHeader.split(' ')[1];

      const decoded = jwt.verify(token, secretKey);

      req.user = decoded;
    } catch (error) {
      fastify.log.error(error);

      return res.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid or expired token.',
      });
    }
  });
});
