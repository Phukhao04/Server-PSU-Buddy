const fastify = require('fastify');
require('dotenv').config()

// Fastify Plugins
const swagger = require('@fastify/swagger');
const swaggerUi = require('@fastify/swagger-ui');
const fastifyAuth = require('@fastify/auth');
const fastifyBasicAuth = require('@fastify/basic-auth');

// Utilities
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

// --- 1. สร้าง Fastify Instance ---
const app = fastify({ logger: false });
const { PORT } = process.env;

// --- 2. ลงทะเบียน Plugins พื้นฐาน ---
app.register(fastifyAuth); // สำหรับ @fastify/basic-auth

// ตั้งค่า Basic Authentication สำหรับ Swagger
app.register(fastifyBasicAuth, {
  authenticate: { realm: 'Swagger UI' },
  validate: async (username, password, req, reply) => {
    // ตรวจสอบ username/password กับค่าใน .env (default: admin/admin)
    const validUsername = process.env.SWAGGER_USER || 'admin';
    const validPassword = process.env.SWAGGER_PASSWORD || 'admin';

    if (username !== validUsername || password !== validPassword) {
      // หากข้อมูลไม่ถูกต้อง ปลั๊กอินจะส่ง 401 Unauthorized กลับไป
      throw new Error('Unauthorized');
    }
  },
});

// --- 3. ฟังก์ชันสำหรับลงทะเบียน Swagger UI ---
/**
 * Helper function to register a Swagger UI instance.
 * @param {object} options
 * @param {string} options.routePrefix - The URL prefix for the Swagger UI page.
 * @param {string} options.yamlFile - The name of the YAML file in `src/docs`.
 * @param {boolean} [options.withAuth=false] - Whether to protect the route with basic auth.
 */
const registerSwaggerUI = ({ routePrefix, yamlFile, withAuth = false }) => {
  app.register(async (instance) => {
    // เพิ่ม preHandler สำหรับ basic auth หากกำหนด
    if (withAuth) {
      instance.addHook('preHandler', instance.auth([instance.basicAuth]));
    }

    const specPath = path.join(__dirname, 'src/docs', yamlFile);
    const spec = yaml.load(fs.readFileSync(specPath, 'utf8'));

    // ลงทะเบียน @fastify/swagger
    instance.register(swagger, {
      mode: 'static',
      specification: {
        path: specPath,
        type: 'yaml',
      },
      swagger: {
        host: `localhost:${PORT || 3000}`,
        schemes: ['http'],
        securityDefinitions: {
          bearerAuth: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header',
            description:
              'ใส่ Token ในรูปแบบ "Bearer {token}" (เช่น "Bearer eyJ...")',
          },
        },
      },
    });

    // ลงทะเบียน @fastify/swagger-ui
    instance.register(swaggerUi, {
      routePrefix,
      exposeRoute: true, // เปิดให้เข้าถึงหน้า UI
      staticCSP: false,
      transformSpecification: () => spec,
      transformSpecificationClone: true,
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
      },
    });
  });
};

// --- 4. ลงทะเบียน Swagger UI Instances ---
// เอกสารสำหรับผู้ใช้ทั่วไป (ไม่ต้อง login)
registerSwaggerUI({
  routePrefix: '/docs',
  yamlFile: 'public.yaml',
  withAuth: false,
});

// เอกสารสำหรับแอดมิน (ต้อง login)
registerSwaggerUI({
  routePrefix: '/docsadmin',
  yamlFile: 'admin.yaml',
  withAuth: true,
});

// --- 5. กำหนดเส้นทางหลัก (Root Route) ---
app.get('/', async (request, reply) => {
  console.log(request.headers['x-forwarded-for'] || request.ip || 'Unknown');
  return { hello: 'world' };
});

// --- 6. โหลดการตั้งค่าอื่นๆ (DB, Routes) ---
require('./src/config/db')();
require('./src/config/routes')(app);

// --- 7. เริ่มต้น Fastify Server ---
app.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address} ✅`);
});
