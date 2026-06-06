const Axios = require('../handler/Axios');
const { toUser } = require('../handler/utils');

class PSUAPIService {

  constructor() {

  }

  async getPSUDetails(base, _id) {
    if (base === 'personnel') {
      const url = `Personnel/GetStaffDetailsByUserName/${_id}`;
      const [adminApi] = (await Axios.psu.get(url)).data.data;
      // console.log(adminApi);
      return toUser('personnel', adminApi);
    } else if (base === 'student') {
      const url = `regist/Student/${_id}`;
      const [studentApi] = (await Axios.psu.get(url)).data.data;
      return toUser('student', studentApi);
    }
    return null;
  }
}

module.exports = PSUAPIService;