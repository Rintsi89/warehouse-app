const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const ProductSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  class: { type: String },
  price: { type: Number, default: 0 },
  netprice: { type: Number, default: 0 },
  quantity: { type: Number, default: 0 },
  quantitycoming: { type: Number, default: 0 },
  status: { type: String },
  image: { type: String, default: 'https://images-varaso.s3.amazonaws.com/No-image-found.jpg' },
  comment: { type: String },
  returns: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Return'
  }],
  relatedproducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  log: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Log'
  }]
})

ProductSchema.plugin(uniqueValidator, { message: 'Error, expected {PATH} to be unique.' })
const Product = mongoose.model('Product', ProductSchema)

module.exports = { Product }