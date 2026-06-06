const fastifyMulter = require('fastify-multer')
const path = require('path')
const fs = require('fs')

// --- 1. กำหนดค่าคงที่และเตรียมไดเรกทอรี ---
// กำหนด Path ไปยังโฟลเดอร์สำหรับเก็บไฟล์ที่อัปโหลดให้เป็นระเบียบ
const UPLOAD_DIR = path.join(__dirname, '../../assets/uploads')

// ตรวจสอบและสร้างไดเรกทอรีสำหรับอัปโหลดหากยังไม่มี
// การทำขั้นตอนนี้ครั้งเดียวตอนเริ่มแอปพลิเคชันมีประสิทธิภาพกว่าการเช็คทุกครั้งที่มีการอัปโหลด
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

/**
 * Route สำหรับจัดการการอัปโหลดไฟล์
 * @param {import('fastify').FastifyInstance} app - Fastify instance
 * @param {object} options - ตัวเลือกสำหรับปลั๊กอิน
 */
module.exports = async (app, options) => {
  // --- 2. ตั้งค่า Multer Storage Engine ---
  // กำหนดวิธีการจัดเก็บไฟล์ลงบนดิสก์
  const storage = fastifyMulter.diskStorage({
    // กำหนดโฟลเดอร์ปลายทางสำหรับไฟล์
    destination: (req, file, cb) => {
      cb(null, UPLOAD_DIR)
    },
    // กำหนดชื่อไฟล์ใหม่เพื่อป้องกันชื่อซ้ำกัน
    filename: (req, file, cb) => {
      // สร้างชื่อไฟล์ที่ไม่ซ้ำกันโดยใช้ timestamp และแทนที่ช่องว่าง
      const uniqueFilename =
        Date.now() + '-' + file.originalname.replace(/\s+/g, '_')
      cb(null, uniqueFilename)
    },
  })

  // --- 3. สร้าง Multer Instance ---
  // สร้าง instance ของ multer พร้อมกับ storage engine ที่กำหนดไว้
  const upload = fastifyMulter({ storage: storage })

  app.post(
    '/single',
    {
      preHandler: upload.array('myFiles', 10),
    },
    async (request, reply) => {
      // preHandler ของ multer จะจัดการข้อผิดพลาดส่วนใหญ่ (เช่น ไฟล์ใหญ่ไป)
      // และส่งต่อไปยัง error handler กลางของ Fastify โดยอัตโนมัติ
      // ดังนั้นใน handler หลักจึงไม่จำเป็นต้องมี try...catch ที่ซับซ้อน

      // หลังจาก preHandler ทำงานเสร็จ ข้อมูลไฟล์จะอยู่ใน `request.files`
      // และข้อมูลอื่นๆ ในฟอร์มจะอยู่ใน `request.body`

      // ตรวจสอบว่ามีไฟล์ถูกอัปโหลดมาหรือไม่
      if (!request.files || request.files.length === 0) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'No files were uploaded.',
        })
      }

      // แสดงข้อมูลไฟล์และฟอร์มใน log (สำหรับดีบัก)
      app.log.info(
        { files: request.files, body: request.body },
        'Upload successful'
      )

      // ส่ง response กลับไปให้ client พร้อมข้อมูลไฟล์ที่จำเป็น
      return reply.code(200).send({
        message: 'Files uploaded successfully!',
        files: request.files.map((file) => ({
          originalname: file.originalname,
          filename: file.filename,
          size: file.size,
          mimetype: file.mimetype,
        })),
        formData: request.body,
      })
    }
  )
}
