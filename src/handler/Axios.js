const axios = require('axios')

const { psuApiUrl, psuApiCredential } = process.env

exports.psu = axios.create({
  baseURL: psuApiUrl,
  headers: { credential: psuApiCredential },
})
