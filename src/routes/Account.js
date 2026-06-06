const jwt = require('jsonwebtoken');
const axios = require('axios');
const qs = require('querystring');

const Axios = require('../handler/Axios');
const Admin = require('../model/admin');
const { toUser } = require('../handler/utils');
const dbPsuBuddy = require('../config/dbPsuBuddy');

const psuapiservice = new (require('../service/PsuAPIService'))();

const { TOKEN_KEY, service_id, service_secret, tokenmeUrl, CHANNEL_ID } =
  process.env;

module.exports = async (app, options) => {

  // ── ลงทะเบียนผูกบัญชี ─────────────────────────────────────────
  app.post('/liff/register', async (req, res) => {
    try {
      const { idToken, psuId } = req.body;
      if (!idToken || !psuId)
        return res.code(400).send({ message: 'idToken and psuId are required.' });

      // verify idToken กับ LINE
      const api_data = await axios.post(
        `https://api.line.me/oauth2/v2.1/verify`,
        qs.stringify({ id_token: idToken, client_id: CHANNEL_ID }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      const data = api_data.data;
      if (!data || !data.sub)
        return res.code(409).send({ message: langs.accessIsNotAllowed });

      // เช็คว่ามีอยู่แล้วไหม
      const existing = await dbPsuBuddy
        .collection('CBSUser')
        .findOne({ userId: data.sub });
      if (existing)
        return res.code(409).send({ message: 'already_registered' });

      // verify psuId กับ PSU API ว่ามีอยู่จริงไหม
      const psuCheck = await psuapiservice.getPSUDetails(
        isNaN(+psuId) ? 'personnel' : 'student',
        psuId
      );
      if (!psuCheck)
        return res.code(404).send({ message: 'psu_not_found' });

      // บันทึกลง CBSUser
      await dbPsuBuddy.collection('CBSUser').insertOne({
        userId: data.sub,
        psupassport: psuId,
        createdAt: new Date(),
      });

      return res.send({ message: 'registered_success' });
    } catch (error) {
      console.log(error);
      return res.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // ── verify LIFF token ──────────────────────────────────────────
  app.post('/liff/verify', async (req, res) => {
    try {
      const { idToken } = req.body;
      if (!idToken)
        return res.code(400).send({ message: 'idToken is required.' });

      const api_data = await axios.post(
        `https://api.line.me/oauth2/v2.1/verify`,
        qs.stringify({ id_token: idToken, client_id: CHANNEL_ID }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      const data = api_data.data;
      if (!data || !data.sub)
        return res.code(409).send({ message: langs.accessIsNotAllowed });

      const psubuddy = await dbPsuBuddy
        .collection('CBSUser')
        .findOne({ userId: data.sub }, { projection: { psupassport: 1 } });

      // ยังไม่ได้ผูกบัญชี → ให้ไปหน้า register
      if (!psubuddy)
        return res.code(403).send({ message: 'not_registered' });

      if (!isNaN(+psubuddy.psupassport)) {
        return res.send(jwtSign({ base: 'student', _id: psubuddy.psupassport, lineId: data.sub }));
      } else {
        return res.send(jwtSign({ base: 'personnel', _id: psubuddy.psupassport, lineId: data.sub }));
      }
    } catch (error) {
      console.log(error);
      return res.code(401).send({ message: langs.invalidToken });
    }
  });

  app.post('/verify', async (req, res) => {
    try {
      const { code } = req.body;
      const params = { code, service_id, service_secret };
      const { data } = await axios.post(tokenmeUrl, params);

      if (!data)
        return res.code(409).send({ message: langs.accessIsNotAllowed });
      const admin = await Admin.findOne({ psuId: data.psu_id });
      if (admin) {
        if (data.psu_id.length === 10) {
          return res.send(jwtSign({ base: 'student', _id: admin._id }));
        } else {
          return res.send(jwtSign({ base: 'personnel', _id: admin._id }));
        }
      }
      return res.code(409).send({ message: langs.accessIsNotAllowed });
    } catch (error) {
      console.log(error);
      return res.code(408).send({ message: langs.timeout });
    }
  });

  app.post('/auth', { preHandler: [app.verifyToken] }, async (req, res) => {
    try {
      const { base, _id } = req.user;
      if (base === 'personnel') {
        const admin = await Admin.findById(_id).lean();
        if (!admin)
          return res.code(404).send({ message: langs.invalidCredentials });
        const url = `Personnel/GetStaffDetailsByOrgUnit/${admin.psuId}`;
        const [adminApi] = (await Axios.psu.get(url)).data.data;
        const data = { ...adminApi, ...admin };
        return res.send(toUser('personnel', data));
      } else if (base === 'student') {
        const student = await Admin.findById(_id).lean();
        if (!student)
          return res.code(404).send({ message: langs.invalidCredentials });
        const url = `regist/Student/${student.psuId}`;
        const [studentApi] = (await Axios.psu.get(url)).data.data;
        const data = { ...studentApi, ...student };
        return res.send(toUser('student', data));
      }
      return res.code(499).send({ message: langs.invalidToken });
    } catch (error) {
      console.log(error);
      return res.code(499).send({ message: langs.invalidToken });
    }
  });

  app.post(
    '/liff/auth',
    { preHandler: [app.verifyLiffToken] },
    async (req, res) => {
      try {
        const { base, _id } = req.user;
        if (base === 'personnel' || base === 'student') {
          const userData = await psuapiservice.getPSUDetails(base, _id);
          if (!userData)
            return res.code(404).send({ message: langs.invalidCredentials });
          return res.send(userData);
        }
        return res.code(499).send({ message: langs.invalidToken });
      } catch (error) {
        console.log(error);
        return res.code(499).send({ message: langs.invalidToken });
      }
    }
  );

  app.get('/account/test', (req, res) => {
    res.send({ message: 'Account works!' });
  });
};

const jwtSign = (data) => jwt.sign(data, TOKEN_KEY, { expiresIn: '12h' });

const langs = {
  invalidToken: { en: 'Invalid Token', th: 'โทเค็นไม่ถูกต้อง' },
  allInputIsRequired: {
    en: 'All input is required',
    th: 'ข้อมูลทั้งหมดจำเป็นต้องกรอก',
  },
  accessIsNotAllowed: {
    en: 'Access is not allowed.',
    th: 'การเข้าถึงไม่ได้รับอนุญาต',
  },
  notFound: { en: 'Not Found', th: 'ไม่พบข้อมูล' },
  invalidCredentials: {
    en: 'Invalid Credentials',
    th: 'ข้อมูลประจำตัวไม่ถูกต้อง',
  },
  timeout: { en: 'Timeout', th: 'หมดเวลา' },
};