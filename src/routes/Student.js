const axios = require('axios')

const TOKEN = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoibGluZW9hLml0a29uZ2tpdC5wc3UuYWMudGgifQ.EqZqHvoThfX5d4zp7i1XHP9ItvR9ghehuX95buA65jA`

module.exports = async (app, options) => {
  app.get(
    '/liff/student/activity-check',
    { preHandler: [app.verifyLiffToken] },
    async (req, res) => {
      try {
        const activity = await axios.get(
          `https://transcript.psu.ac.th/transcript_api/api/student_events/${req.user._id}`,
          { headers: { token: TOKEN } }
        )
        let { hrsTarget, events } = activity.data
        return res.send({ hrsTarget, events })
      } catch (error) {
        console.log(error)
        return res.code(500).send({ message: 'Internal Server Error' })
      }
    }
  )

  app.get('/api/events', async (req, res) => {
    try {
      const campus = req.query.campus || '01'
      const now = new Date().toISOString()

      const find = JSON.stringify({
        campus,
        isPublish: true,
        end: { $gte: now }
      })

      const { data } = await axios.get(
        `https://transcript.psu.ac.th/transcript_api/events`,
        {
          params: {
            find,
            'populate[]': ['organization', 'club'],
            'sort[start]': 'asc'
          },
          headers: { token: TOKEN }
        }
      )

      return res.send(data)
    } catch (error) {
      console.log(error)
      return res.code(500).send({ message: 'Internal Server Error' })
    }
  })
}