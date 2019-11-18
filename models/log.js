const mongoose = require('mongoose')
const moment = require('moment')
const date = moment()

const logSchema = new mongoose.Schema({
  text: { type: String },
  created_at: { type: Date, default: date.format() }
})

logSchema.statics.createLogMessage = (message) => {

  const log = new Log({
    text: message
  })

  log.save()
  return log._id
}

const Log = mongoose.model('Log', logSchema)
module.exports = { Log }