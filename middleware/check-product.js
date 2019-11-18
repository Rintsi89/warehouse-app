const { Product } = require('.././models/product')

const checkIfExists = async (req, res, next) => {
  try {
    const productCode = req.body.code
    const product = await Product.findOne({ code: productCode })

    if (!product) {
      return res.status(404).send('The product does not exist in the database')
    }

    next()
  } catch (error) {
    res.status(400).send()
  }
}

module.exports = { checkIfExists }