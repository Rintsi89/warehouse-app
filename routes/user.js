const { ObjectID } = require('mongodb')
const _ = require('lodash')
const express = require('express')
const router = express.Router()
const { User } = require('../models/user')
const { authenticate, authenticateAdmin } = require('../middleware/authenticate')

// Show users page

router.get('/', authenticate, async (req, res) => {
  try {
    const users = await User.find()
    res.render('users', { users, userStatus: res.locals })
  } catch (error) {
    res.status(400).send()
  }
})

// Create user

router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const body = _.pick(req.body, ['email', 'password', 'name', 'status'])
    const user = new User(body)
    await user.save()
    res.redirect('/user')
  } catch (error) {
    res.status(400).send()
  }
})

// Update user

router.patch('/:id', authenticateAdmin, async (req, res) => {
  let updateArguments = null

  try {
    const id = req.params.id

    if (req.body.status !== '' && req.body.email === '') {
      updateArguments = { status: req.body.status }
    } else if (req.body.status === '' && req.body.email !== '') {
      updateArguments = { email: req.body.email }
    } else {
      updateArguments = {
        status: req.body.status === '' ? undefined : req.body.status,
        email: req.body.email === '' ? undefined : req.body.email
      }
    }

    const user = await User.findByIdAndUpdate(id, updateArguments)

    if (!user) {
      return res.status(404).send('User not found')
    }

    res.redirect('/user')
  } catch (error) {
    res.status(400).send()
  }
})

// Logout user - This has to be before Delete user route https://stackoverflow.com/questions/7042340/error-cant-set-headers-after-they-are-sent-to-the-client

router.delete('/logout', authenticate, async (req, res) => {
  try {
    await req.user.removeToken(req.cookies['x-auth'])
    res.redirect('/')
  } catch (error) {
    res.status(400).send()
  }
})

// Delete user

router.delete('/:id', authenticateAdmin, async (req, res) => {

  try {
    const id = req.params.id

    if (!ObjectID.isValid(id)) {
      res.status(404).send()
    }
    const user = await User.findByIdAndRemove(id)

    if (!user) {
      return res.status(404).send()
    }
    res.redirect('/user')
  } catch (error) {
    res.status(400).send()
  }
})

// POST / users/login (email, password)

router.post('/login', async (req, res) => {
  try {
    const body = _.pick(req.body, ['email', 'password'])
    const user = await User.findByCredentials(body.email, body.password)
    const token = await user.generateAuthToken()
    res.cookie('x-auth', token, { maxAge: 60000 * 180, httpOnly: true })
    res.redirect('/products')
  } catch (error) {
    res.redirect('/')
  }
})

module.exports = router