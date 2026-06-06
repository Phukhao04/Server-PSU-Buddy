// middleware/error.js (Fastify)
// Fastify Error Handler จะรับ (error, request, reply)
module.exports = (error, request, reply) => {
  request.log.error(error) // ใช้ logger ของ Fastify เพื่อบันทึกข้อผิดพลาด

  // คุณสามารถปรับการตอบกลับตามชนิดของ error ได้
  if (error.statusCode) { // หาก error มี statusCode (เช่นจาก Fastify เอง)
    reply.code(error.statusCode).send({ message: error.message || 'Error occurred' })
  } else {
    // สำหรับ error ทั่วไปที่ไม่ระบุ statusCode
    reply.code(500).send({ message: 'Internal Server Error', detail: error.message })
  }
}