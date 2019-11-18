const { Product } = require('../models/product')

const bulkWriteAdd = async (requestId, productId, req, res) => {

  try {

    const bulkUpdateOps = [ // const for bulkWrite method which allows multiple methods to be done
      {
        'updateOne': {
          'filter': { '_id': requestId },
          'update': { '$addToSet': { 'relatedproducts': productId } }
        }
      },
      {
        'updateOne': {
          'filter': { '_id': productId },
          'update': { '$addToSet': { 'relatedproducts': requestId } }
        }
      }
    ]

    const products = await Product.bulkWrite(bulkUpdateOps)

    if (!products) {
      return res.status(404)
    }
  } catch (error) {
    res.status(400).send()
  }
}

const bulkWriteRemove = async (requestId, productId, req, res) => {

  try {

    const bulkUpdateOps = [
      {
        'updateOne': {
          'filter': { '_id': requestId },
          'update': { '$pull': { 'relatedproducts': productId } }
        }
      },
      {
        'updateOne': {
          'filter': { '_id': productId },
          'update': { '$pull': { 'relatedproducts': requestId } }
        }
      }
    ]

    const products = await Product.bulkWrite(bulkUpdateOps)

    if (!products) {
      return res.status(404)
    }
  } catch (error) {
    res.status(400).send()
  }
}

module.exports = {
  bulkWriteAdd,
  bulkWriteRemove
}