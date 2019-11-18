const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const shipmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  client: { type: String },
  created_at: { type: String },
  url: { type: String },
  notes: { type: String }
})

shipmentSchema.plugin(uniqueValidator, { message: 'Error, expected {PATH} to be unique.' })
const Shipment = mongoose.model('Shipment', shipmentSchema )

module.exports = { Shipment }