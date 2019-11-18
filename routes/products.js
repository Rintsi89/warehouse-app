const { ObjectID } = require('mongodb')
const express = require('express')
const router = express.Router()
const moment = require('moment')
const multer = require('multer')
const round = require('mongo-round')
const excel = require('excel4node')
const multerS3 = require('multer-s3')
const aws = require('aws-sdk')
const { Product } = require('../models/product')
const { Log } = require('../models/log')
const { Return } = require('../models/return')
const { mongoose } = require('../db/mongo-connect')
const functions = require('../functions/functions')
const { authenticate, authenticateAdmin } = require('../middleware/authenticate')
const { checkIfExists } = require('../middleware/check-product')

const s3 = new aws.S3({
  accessKeyId: process.env.BUCKET_KEYID,
  secretAccessKey: process.env.BUCKET_ACCESSKEY,
  Bucket: 'images-varaso'
})

const fileFilter = (req, file, callback) => {
  // accept a file
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    callback(null, true)
  } else {
    // reject a file
    callback(null, false)
  }
}

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'images-varaso',
    acl: 'public-read',
    key: function(req, file, callback) {
      callback(null, file.originalname)
    }
  }),
  limits: { fileSize: 1000000 },
  fileFilter: fileFilter
})

// Show the main page
router.get('/', authenticate, async (req, res) => {

  try {
    const products = await Product.find({ quantity: { $gt: 0 } }).sort({ code: 1 })
    res.render('home', { products, userStatus: res.locals })
  } catch (error) {
    res.status(400).send()
  }
})

// Excel route for stock
router.get('/excel', authenticate, async (req, res) => {
  try {
    const products = await Product.find({ quantity: { $gt: 0 } }).sort({ code: 1 })

    const date = moment()
    const time = date.format('DD.MM.YYYY')
    const sheetName = `Stock ${time}`
    const workbookName = `Stock levels on ${time}.xlsx`
    const workbook = new excel.Workbook()
    const worksheet = workbook.addWorksheet(sheetName)

    const style = workbook.createStyle({
      font: {
        bold: true,
        size: 12
      }
    })

    worksheet.cell(1, 1).string('Code').style(style)
    worksheet.cell(1, 2).string('Description').style(style)
    worksheet.cell(1, 3).string('Quantity').style(style)
    worksheet.cell(1, 4).string('Class').style(style)
    worksheet.cell(1, 5).string('Retail price').style(style)
    worksheet.cell(1, 6).string('Net price').style(style)

    products.forEach((product) => {

      const cell = products.indexOf(product) + 2

      worksheet.cell(cell, 1).string(product.code)
      worksheet.cell(cell, 2).string(product.description)
      worksheet.cell(cell, 3).number(product.quantity)
      worksheet.cell(cell, 4).string(product.class)
      worksheet.cell(cell, 5).number(product.price)
      worksheet.cell(cell, 6).number(product.netprice)
    })

    workbook.write(workbookName, res)
  } catch (error) {
    res.status(400).send('Could not write Excel file')
  }
})

// Get product summary

router.get('/summary', authenticate, async (req, res) => {
  try {
    const results = await Product.aggregate([{ $group: { _id: '$class', quantity: { $sum: '$quantity' }, quantitycoming: { $sum: '$quantitycoming' },
      value: { $sum: { $multiply: ['$netprice', '$quantity'] } },
    } }, { $project: { quantity: 1, quantitycoming: 1, value: round('$value', 2) } }, { $sort: { _id: 1 } }])

    let totalValue = 0

    results.forEach((result) => {

      totalValue += result.value
    })

    res.render('summary', { results, totalValue, userStatus: res.locals })
  } catch (error) {
    res.status(400).send()
  }
})

// Show the page with all products even with 0 quantity

router.get('/all', authenticate, async (req, res) => {
  try {
    const products = await Product.find().sort({ code: 1 })
    res.render('all', { products, userStatus: res.locals })
  } catch (error) {
    res.status(400).send()
  }
})

// Render add product page

router.get('/add', authenticateAdmin, (req, res) => {
  try {
    res.render('add', { userStatus: res.locals })
  } catch (error) {
    res.status(400).send()
  }
})

// Show products which wait for returns.

router.get('/returns', authenticate, async (req, res) => { // This has to be before GET :/id paremeter, route. Otherwise it wont work.

  try {
    const populateQuery = { path: 'returns', options: { sort: { 'returned_at': -1 } } }
    const products = await Product.find({ 'returns.0': { $exists: true } }).populate(populateQuery)
    res.render('returns', { products, userStatus: res.locals })
  } catch (error) {
    return res.status(404).send()
  }

})

// Show product detail page

router.get('/:id', authenticate, async (req, res) => {

  try {

    const id = req.params.id

    if (!ObjectID.isValid(id)) {
      res.status(404).send('The ID is incorrect') // 404 means that client was able to communicate with server but the server could not find what was requested
    }

    const populateQuery = [{ path: 'log' }, { path: 'relatedproducts', options: { sort: ['code'] } }]
    const products = await Product.findById(id).populate(populateQuery)

    if (!products) { // This checks if requested products exists in the db. It means that connection is ok and objectId already valid and proper form
      return res.status(404).send()
    }

    res.render('details', { products, userStatus: res.locals })

  } catch (error) {
    res.status(400).send()
  }
})

// Show edit page

router.get('/:id/edit', authenticateAdmin, async (req, res) => {

  try {

    const id = req.params.id

    if (!ObjectID.isValid(id)) {
      res.status(404).send()
    }

    const product = await Product.findById(id)

    if (!product) {
      return res.status(404).send()
    }
    res.render('edit', { product, userStatus: res.locals })

  } catch (error) {
    res.status(400).send()
  }
})

// Update product

router.patch('/:id', authenticateAdmin, upload.single('image'), async (req, res) => {

  try {

    let imagelink = null
    const id = req.params.id

    if (!ObjectID.isValid(id)) {
      res.status(404).send()
    }

    if (req.file) {
      imagelink = req.file.location
    } else if (req.body.imageurl !== '') {
      imagelink = req.body.imageurl
    } else {
      imagelink = 'https://images-varaso.s3.amazonaws.com/No-image-found.jpg'
    }

    const product = await Product.findByIdAndUpdate(id, {
      code: req.body.code,
      description: req.body.description,
      class: req.body.class,
      price: req.body.price,
      netprice: ((req.body.price / 1.24) * 0.7).toFixed(2),
      quantity: req.body.quantity,
      quantitycoming: req.body.quantitycoming,
      status: req.body.status,
      image: imagelink,
      comment: req.body.comment
    })

    if (!product) {
      return res.status(404).send()
    }

    const newQuantity = parseInt(req.body.quantity)
    const time = moment().format('DD.MM.YYYY, HH:mm:')
    const userName = req.user.name
    const oldQuantity = product.quantity

    if (oldQuantity !== newQuantity) {

      const message = `${time} Quantity adjusted from ${oldQuantity} to ${newQuantity} (${userName})`

      const log = new Log({
        text: message
      })

      await log.save()
      product.log.push(log._id)
      await product.save()
      res.redirect('/products')

    } else {
      res.redirect('/products')
    }
  } catch (error) {
    res.status(400).send()
  }
})

// Add return
router.patch('/returns/add', authenticateAdmin, checkIfExists, async (req, res) => {

  try {
    const time = moment().format('DD.MM.YYYY, HH:mm:')
    const userName = req.user.name

    const returnProduct = new Return({
      code: req.body.code,
      customer: req.body.customer,
      quantity: req.body.quantity,
      notes: req.body.notes,
      created_at: time,
      created_by: userName
    })

    await returnProduct.save()
    const product = await Product.findOneAndUpdate({ code: returnProduct.code }, { $push: { returns: returnProduct._id } })

    if (!product) {
      return res.status(404).send()
    }

    res.redirect('/products/returns')

  } catch (error) {
    res.status(400).send()
  }

})

// Return product

router.patch('/returns/:id', authenticateAdmin, async (req, res) => {

  try {
    const id = req.params.id
    const time = moment().format('DD.MM.YYYY, HH:mm:')
    const number = req.body.quantity
    const userName = req.user.name
    const customer = req.body.customer
    const message = `${time} ${customer} returned ${number} (${userName})`
    const returnID = req.body.returnID

    if (!ObjectID.isValid(id)) {
      res.status(404).send()
    }

    const log = new Log({
      text: message
    })

    await log.save()
    const product = await Product.findByIdAndUpdate(id, { $inc: { quantity: number }, $push: { log: log._id } })

    if (!product) {
      return res.status(404).send()
    }

    const returnProduct = await Return.findByIdAndUpdate(returnID, { $set: { returned: 'yes', returned_at: time, returned_by: userName } })
    if (!returnProduct) {
      return res.status(404).send()
    }
    res.redirect('/products/returns')
  } catch (error) {
    res.status(400).send()
  }
})

// Update product quantity

router.patch('/:id/inc', authenticateAdmin, async (req, res) => {

  try {
    const id = req.params.id
    const number = req.body.number
    const time = moment().format('DD.MM.YYYY, HH:mm:')
    const userName = req.user.name
    const message = number < 0 ? `${time} Quantity deducted by ${Math.abs(number)} (${userName})` : `${time} Quantity increased by ${number} (${userName})`

    if (!ObjectID.isValid(id)) {
      res.status(404).send()
    }

    const log = new Log({
      text: message
    })

    await log.save()
    const product = await Product.findByIdAndUpdate(id, { $inc: { quantity: number }, $push: { log: log._id } })

    if (!product) {
      return res.status(404).send()
    }

    res.redirect('/products')
  } catch (error) {
    res.status(400).send()
  }
})

// Add related product to array. addToSet adds only unique

router.patch('/:id/addrelated', authenticateAdmin, async (req, res) => {

  try {
    const id = req.params.id
    const codes = req.body.id
    const codesArray = codes.split(',')
    const mappedCodesArray = [...new Set(codesArray.map(code => code.trim()))] // This removes duplicates and extra whitespace
    const products = await Product.find({ code: mappedCodesArray  } )
    const foundCodes = products.map(product => product.code)
    const foundIds = products.map(product => product._id.toString())

    if (mappedCodesArray.length !== products.length) {

      const difference = mappedCodesArray.filter(code => !foundCodes.includes(code))

      res.status(404).send(`The following product codes do not exist in the database: ${difference}. None of the related products were saved. Please check if the codes were
                mispelled. If it doesn't help, create missing products or try to save without them.`)
    } else if (foundIds.includes(id.toString())) {
      res.status(404).send('Product can\'t relate to itself. One of the codes you entered is the same as this product. None of the related products were saved.')
    }

    products.forEach(product => {
      const requestId = req.params.id
      const productId = product._id

      functions.bulkWriteAdd(requestId, productId, req, res)
    })

    res.redirect('/products/' + req.params.id)
  } catch (error) {
    res.status(400).send(error)
  }
})

//  Pull out related product from array
router.patch('/:id/removerelated', authenticateAdmin, async (req, res) => {

  try {
    const requestId = req.params.id
    const productId = mongoose.Types.ObjectId(req.body.id)

    if (!ObjectID(productId) || !ObjectID(requestId)) {
      res.status(404).send()
    }

    functions.bulkWriteRemove(requestId, productId, req, res)
    res.redirect('/products/' + req.params.id)
  } catch (error) {
    res.status(400).send()
  }
})

// Delete product
router.delete('/:id', authenticateAdmin, async (req, res) => {

  try {
    const id = req.params.id

    if (!ObjectID.isValid(id)) {
      res.status(404).send()
    }
    const product = await Product.findByIdAndRemove(id)

    if (!product) {
      return res.status(404).send()
    }

    res.redirect('/products')
  } catch (error) {
    res.status(400).send()
  }
})

// Delete product return

router.delete('/returns/:id', authenticateAdmin, async (req, res) => {

  try {
    const id = req.params.id
    const productId = req.body.productID

    if (!ObjectID.isValid(id)) {
      res.status(404).send()
    }
    const deletedReturn = await Return.findByIdAndRemove(id)

    if (!deletedReturn) {
      return res.status(404).send()
    }

    const product = Product.findByIdAndUpdate(productId, { '$pull': { 'returns': deletedReturn._id } })

    if (!product) {
      return res.status(404).send()
    }
    res.redirect('/products/returns')
  } catch (error) {
    res.status(400).send()
  }
})

router.post('/', authenticateAdmin, upload.single('image'), async (req, res) => {

  try {
    let imagelink = null
    const date = moment()
    const userName = req.user.name
    const message = `${date.format('DD.MM.YYYY, HH:mm:')} Created to the database with quantity of ${req.body.quantity === '' ? 0 : req.body.quantity} (${userName})`
    const logId = Log.createLogMessage(message)

    if (req.file) {
      imagelink = req.file.location
    } else if (req.body.imageurl !== '') {
      imagelink = req.body.imageurl
    } else {
      imagelink = undefined
    }

    const product = new Product({
      code: req.body.code,
      description: req.body.description,
      class: req.body.class,
      price: req.body.price === '' ? undefined : req.body.price,
      netprice: ((req.body.price / 1.24) * 0.7).toFixed(2),
      quantity: req.body.quantity === '' ? undefined : req.body.quantity,
      quantitycoming: req.body.quantitycoming === '' ? undefined : req.body.quantitycoming,
      status: req.body.status,
      image: imagelink,
      comment: req.body.comment,
      relatedproducts: req.body.relatedproducts,
      log: logId
    })
    await product.save()
    res.redirect('/products')
  } catch (e) {
    try {
      const errorCode = e.errors.code.kind

      if (errorCode === 'unique') {
        res.status(400).send('Product already exists in the database. Please insert unique product')
      } else if (errorCode === 'required') {
        res.status(400).send('Product code and description are required')
      }

    } catch (error) {
      res.status(400).send()
    }
  }
})

module.exports = router
