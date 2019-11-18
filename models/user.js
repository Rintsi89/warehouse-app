const mongoose = require('mongoose')
const validator = require('validator')
const jwt = require('jsonwebtoken')
const _ = require('lodash')
const bcrypt = require('bcryptjs')

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  status:  {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    trim: true, // This removes any whitespace before saved in to db
    minlength: 1,
    unique: true,
    validate: {
      validator: validator.isEmail,
      message: '{VALUE} is not a valid email'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  tokens : [{
    access: {
      type: String,
      required: true
    },
    token: {
      type: String,
      required: true
    }
  }]
})

UserSchema.methods.toJSON = function () { // This determines what is send back when mongoose model is converted into JSON value and send to browser
  const user = this
  const userObject = user.toObject() // This takes mongoose variable user and converting it to regular object where only properties available on document exists

  return _.pick(userObject, ['_id', 'email', 'name', 'status'])  // When res.send is called, only _id and email properties are send back. Token is still in header
}

UserSchema.methods.generateAuthToken = function () { // .methods creates instance methods. function-keyword is needed because array functions do not support keyword "this"
  const user = this
  const access = 'auth'
  const token = jwt.sign({ _id: user._id.toHexString(), access }, process.env.JWT_SECRET).toString()

  user.tokens = user.tokens.concat([{ access, token }]) // This syntax was recommended because .push might not work

  return user.save().then(() => { // By returning this, we can use token in user routes
    return token // This will be passed as success argument to next then call in user routes
  })
}

UserSchema.methods.removeToken = function () {
  const user = this

  return user.updateOne({
    $set: {
      tokens: []
    }
  })
}

UserSchema.statics.findByToken = function (token) { // With .statics, model methods are created
  const User = this // This refers to the whole User Model
  let decoded

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET)
  } catch (e) {

    return Promise.reject()  // In case of error, this rejected promise will be returned to user routes where catch call handles this
  }

  return User.findOne({ // return so Promise chaining is possible
    _id: decoded._id, // This is same as user's id
    'tokens.token': token, // This token is same in argument of this function
    'tokens.access': 'auth'
  })
}

UserSchema.statics.findByCredentials = function (email, password) {

  const User = this

  return User.findOne({ email }).then((user) => {
    if (!user) {
      return Promise.reject() // catch call in user routes is triggered
    }

    return new Promise((resolve, reject) => { // bcrypt does only support call backs, that is why new Promise is created
      bcrypt.compare(password, user.password, (err, res) => {
        if (res) {
          resolve(user) // sends user to app.js for further use
        } else {
          reject()
        }
      })
    })
  })
}

UserSchema.pre('save', function (next) { // This .pre code is always run before saving a user to the db
  const user = this

  if (user.isModified('password')) { // Checks if property name "password" is modified
    bcrypt.genSalt(10, (err, salt) => {

      bcrypt.hash(user.password, salt, (err, hash) => {
        user.password = hash
        next()
      })
    })

  } else { //user.password = hash; and then call next();

    next()

  }
})

const User = mongoose.model('User', UserSchema)

module.exports = { User }