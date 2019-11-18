const mongoose = require('mongoose')
const moment = require('moment')
const date = moment()

const returnSchema = new mongoose.Schema({
  code: { type: String, required: true },
  customer: { type: String, required: true },
  quantity: { type: Number, required: true },
  returned: { type: String, default: 'no' },
  notes: { type: String },
  created_at: { type: String, default: date.format('DD.MM.YYYY, HH:mm:') },
  created_by: { type: String },
  returned_at: { type: String },
  returned_by: { type: String }
})

const Return = mongoose.model('Return', returnSchema)

module.exports = { Return }