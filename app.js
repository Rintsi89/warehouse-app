// database configuration
require('./config/config')
const PORT = process.env.PORT
// external libraries
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const cookieParser = require('cookie-parser')

// routes imports
const productRoutes = require('./routes/products.js')
const userRoutes = require('./routes/user.js')
const indexRoutes = require('./routes/index.js')
const shipmentRoutes = require('./routes/shipments.js')

app.use('/products/images', express.static('images'))
app.use(bodyParser.urlencoded({ extended: true }))
app.set('view engine', 'ejs')
app.use(express.static(__dirname + '/public'))
app.use(methodOverride('_method'))
app.use(bodyParser.json())
app.use(cookieParser())

app.use('/products', productRoutes)
app.use('/user', userRoutes)
app.use('/', indexRoutes)
app.use('/shipments', shipmentRoutes)

app.listen(PORT, () => {
  console.log(`Started at port ${PORT}`)
})

module.exports = { app }