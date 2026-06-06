const mongoose = require('mongoose')

module.exports = () => {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('Connected MongoDB ✅'))
    .catch((err) => console.log(err))
}
