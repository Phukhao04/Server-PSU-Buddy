const path = require("path");
const fs = require("fs");

// นำเข้าปลั๊กอินที่จำเป็นสำหรับ Fastify
const fastifyCors = require("@fastify/cors");
const multipart = require("@fastify/multipart");
// นำเข้า Error Handler ที่สร้างขึ้นเอง
const errorHandlerPlugin = require("../handler/error");

/**
 * ฟังก์ชันสำหรับอ่านไฟล์ทั้งหมดในไดเรกทอรีและลงทะเบียนกับ Fastify
 * @param {import('fastify').FastifyInstance} app - Fastify instance
 * @param {string} directory - Path ไปยังไดเรกทอรี
 * @param {(file: string) => object} [optionsFactory] - ฟังก์ชันสำหรับสร้าง options ในการ register (เช่น prefix)
 */
const registerDirectoryFiles = (app, directory, optionsFactory) => {
  // อ่านรายชื่อไฟล์ทั้งหมดในไดเรกทอรีแบบ synchronous
  const files = fs.readdirSync(directory);

  files.forEach((file) => {
    // ตรวจสอบว่าเป็นไฟล์ JavaScript หรือไม่
    if (file.endsWith(".js") && !file.startsWith(".")) {
      const filePath = path.join(directory, file);
      const module = require(filePath);

      // สร้าง options ถ้ามี optionsFactory ให้มา
      const options = optionsFactory ? optionsFactory(file) : {};

      // ลงทะเบียนโมดูล (plugin หรือ route)
      app.register(module, options);

      // แสดง log การลงทะเบียน
      // const logMessage = options.prefix
      //   ? ` - Registered ${file} with prefix ${options.prefix}`
      //   : ` - Registered ${file}`
      // console.log(logMessage)
    }
  });
};

/**
 * ฟังก์ชันหลักสำหรับตั้งค่าและลงทะเบียน Routes และ Plugins ทั้งหมด
 * @param {import('fastify').FastifyInstance} app - Fastify instance
 */
module.exports = (app) => {
  // 1. ลงทะเบียนปลั๊กอินพื้นฐาน
  // - @fastify/cors: จัดการ Cross-Origin Resource Sharing (CORS)
  // - @fastify/multipart: รองรับการอัปโหลดไฟล์ (multipart/form-data)
  app.register(fastifyCors, {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  });
  app.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // จำกัดขนาดไฟล์สูงสุดที่ 50MB
      fieldSize: 50 * 1024 * 1024, // จำกัดขนาดฟิลด์สูงสุดที่ 20MB
    },
  });

  // console.log('START:PLUGIN - Fastify Loading...')
  // 2. ลงทะเบียนปลั๊กอินที่สร้างขึ้นเองทั้งหมดจากโฟลเดอร์ 'plugin'
  const pluginsDir = path.join(__dirname, "../plugin");
  registerDirectoryFiles(app, pluginsDir);
  // console.log('Fastify Loaded Successfully ✅')

  // console.log('START:ROUTES - Fastify Loading...')
  // 3. ลงทะเบียน Routes ทั้งหมดจากโฟลเดอร์ 'routes'
  // โดยจะสร้าง prefix จากชื่อไฟล์โดยอัตโนมัติ (เช่น 'r_users.js' -> '/users')
  const routesDir = path.join(__dirname, "../routes");
  // registerDirectoryFiles(app, routesDir, (file) => ({
  //   prefix: '/' + file.replace('r_', '').replace('.js', ''),
  // }))

  registerDirectoryFiles(app, routesDir);

  // 4. ตั้งค่า Handler สำหรับกรณีที่ไม่พบ Route (404 Not Found)
  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      statusCode: 404,
      error: "Not Found",
      message: "Route not found",
    });
  });

  // 5. ตั้งค่า Error Handler กลางสำหรับจัดการข้อผิดพลาดทั้งหมดในแอปพลิเคชัน
  app.setErrorHandler(errorHandlerPlugin);

  console.log("Fastify Loaded Successfully ✅");
};
