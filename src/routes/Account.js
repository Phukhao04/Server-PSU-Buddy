const jwt = require('jsonwebtoken');
const axios = require('axios');

const Axios = require('../handler/Axios');
const Admin = require('../model/admin');
const { toUser } = require('../handler/utils');
const dbPsuBuddy = require('../config/dbPsuBuddy');

const psuapiservice = new (require('../service/PsuAPIService'))();

const { TOKEN_KEY, service_id, service_secret, tokenmeUrl, CHANNEL_ID } =
  process.env;

module.exports = async (app, options) => {
  app.post('/liff/verify', async (req, res) => {
    try {
      const { idToken } = req.body;
      if (!idToken)
        return res.code(400).send({ message: 'idToken is required.' });
      const api_data = await axios.post(
        `https://api.line.me/oauth2/v2.1/verify`,
        {
          id_token: idToken,
          client_id: CHANNEL_ID,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );
      const data = api_data.data;
      if (!data || !data.sub)
        return res.code(409).send({ message: langs.accessIsNotAllowed });

      // return res.send(data);
      const psubuddy = await dbPsuBuddy
        .collection('CBSUser')
        .findOne({ userId: data.sub }, { projection: { psupassport: 1 } });

      if (!psubuddy) return res.code(404).send({ message: langs.notFound });
      // psubuddy.psupassport is number or string
      if (!isNaN(+psubuddy.psupassport)) {
        // is number
        // if psuId is a student
        return jwtSign({ base: 'student', _id: psubuddy.psupassport, lineId: data.sub });
      } else {
        return jwtSign({ base: 'personnel', _id: psubuddy.psupassport, lineId: data.sub });
      }

      // return res.send(psubuddy);
    } catch (error) {
      console.log(error);
      return res.code(401).send({ message: langs.invalidToken });
    }
  });
//   app.post('/liff/verify', async (req, res) => {
//   // MOCK: ข้าม LINE Verify + DB Check ชั่วคราว
//   return jwtSign({
//     base: 'student',
//     _id: '6610210312',
//     lineId: 'mock',
//   });
// });
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
          // if psuId is a student
          return jwtSign({ base: 'student', _id: admin._id });
        } else {
          return jwtSign({ base: 'personnel', _id: admin._id });
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
        return toUser('personnel', data);
      } else if (base === 'student') {
        const student = await Admin.findById(_id).lean();
        if (!student)
          return res.code(404).send({ message: langs.invalidCredentials });

        const url = `regist/Student/${student.psuId}`;
        const [studentApi] = (await Axios.psu.get(url)).data.data;
        const data = { ...studentApi, ...student };
        return toUser('student', data);
      }
      return res.code(499).send({ message: langs.invalidToken });
    } catch (error) {
      console.log(error);
      return res.code(499).send({ message: langs.invalidToken });
    }
  });

  // app.post(
  //   '/liff/auth',
  //   { preHandler: [app.verifyLiffToken] },
  //   async (req, res) => {
  //     try {
  //       const { base, _id } = req.user;
  //       if (base === 'personnel' || base === 'student') {
  //         const userData = await psuapiservice.getPSUDetails(base, _id);
  //         if (!userData)
  //           return res.code(404).send({ message: langs.invalidCredentials });
  //         return userData;
  //       }
  //       return res.code(499).send({ message: langs.invalidToken });
  //     } catch (error) {
  //       console.log(error);
  //       return res.code(499).send({ message: langs.invalidToken });
  //     }
  //   },
  // );
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
        return userData;
      }
      return res.code(499).send({ message: langs.invalidToken });
    } catch (error) {
      console.log(error);
      return res.code(499).send({ message: langs.invalidToken });
    }
  },
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
