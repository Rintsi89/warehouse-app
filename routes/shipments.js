const { ObjectID } = require('mongodb')
const express = require('express')
const router = express.Router()
const moment = require('moment')
const { Shipment } = require('../models/shipment')
const { authenticate, authenticateAdmin } = require('../middleware/authenticate')

// Get shipment summary

router.get('/', authenticate, async (req, res) => {

  try {
    const shipments = await Shipment.find().sort({ name: 1 })
    res.render('shipments', { shipments, userStatus: res.locals })
  } catch (error) {
    res.status(400).send()
  }

})

// Save new shipment summary item

router.post('/', authenticateAdmin, async (req, res) => {

  try {
    const date = moment().format('DD.MM.YYYY')
    const shipment = new Shipment({
      name: req.body.name,
      client: req.body.client,
      created_at: date,
      url: req.body.url,
      notes: req.body.notes
    })

    await shipment.save()
    res.redirect('/shipments')
  } catch (error) {

    if (error.name === 'ValidationError') {
      return res.status(400).send('This shipper already exists in the database')
    }

    res.status(400).send()
  }
})

// Update shipment
router.patch('/:id', authenticateAdmin, async (req, res) => {

  try {
    const id = req.params.id
    const date = moment().format('DD.MM.YYYY')

    if (!ObjectID.isValid(id)) {
      res.status(404).send()
    }

    const shipment = await Shipment.findByIdAndUpdate(id, {
      client: req.body.client,
      created_at: date
    })

    if (!shipment) {
      return res.status(404).send()
    }

    res.redirect('/shipments')
  } catch (error) {
    res.status(400).send()
  }
})

// Delete shipment
router.delete('/:id', authenticateAdmin, async (req, res) => {

  try {
    const id = req.params.id

    if (!ObjectID.isValid(id)) {
      res.status(404).send()
    }

    const shipment = await Shipment.findByIdAndRemove(id)

    if (!shipment) {
      return res.status(404).send()
    }
    res.redirect('/shipments')
  } catch (error) {
    res.status(400).send()
  }
})

module.exports = router