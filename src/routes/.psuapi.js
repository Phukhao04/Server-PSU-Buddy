const Axios = require('../handler/Axios')
const { toUser } = require('../handler/utils')

module.exports = async (app, options) => {
  app.get('/psuapi/campuses', async (req, res) => {
    try {
      const url = 'Central/GetCampus'
      const campuses = (await Axios.psu.get(url)).data.data
      return campuses.map((campus) => ({
        campusId: campus.campId,
        name: { th: campus.campNameThai, en: campus.campNameEng },
      }))
    } catch (error) {
      console.log(error)
      return res.code(400).send({ message: langs.notFound })
    }
  })
  app.get('/psuapi/faculties', async (req, res) => {
    try {
      const { campusId } = req.query
      const url = `Central/GetFacultyByCampusID/${campusId}`
      const faculties = (await Axios.psu.get(url)).data.data
      return faculties.map((fac) => ({
        facId: fac.facId,
        name: { th: fac.facNameThai, en: fac.facNameEng },
      }))
    } catch (error) {
      console.log(error)
      return res.code(400).send({ message: langs.notFound })
    }
  })
  app.get('/psuapi/personnel/psuId', async (req, res) => {
    try {
      const { psuId } = req.query
      const url = `Personnel/GetStaffDetailsByOrgUnit/${psuId}`
      const [admin] = (await Axios.psu.get(url)).data.data
      return admin ? toUser('personnel', admin) : null
    } catch (error) {
      console.log(error)
      return res.code(400).send({ message: langs.notFound })
    }
  })
}

const langs = {
  notFound: { en: 'Not Found', th: 'ไม่พบข้อมูล' },
}
