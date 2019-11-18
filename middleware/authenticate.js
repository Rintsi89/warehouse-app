const { User } = require('.././models/user')

const authenticate = async (req, res, next) => { // middleware
  try {
    const token = req.cookies['x-auth'] // This takes value of cookie named "x-auth"
    const user = await User.findByToken(token)

    if (!user) { // If there is a valid token but for some reason document was not found
      return Promise.reject() // This goes straight to catch
    }

    req.user = user // This is the user we just found
    res.locals = user.status // Sets local variable
    req.token = token // This is the token which is in const token
    next() // Now this moves further
  } catch (error) {
    res.status(401).redirect('/')
  }
}

const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.cookies['x-auth']
    const user = await User.findByToken(token)

    if (!user || user.status !== 'admin') {
      return Promise.reject()
    }

    req.user = user
    res.locals = user.status
    req.token = token
    next()
  } catch (error) {
    const backURL = req.header('Referer')
    res.redirect(backURL)
  }
}

module.exports = { authenticate, authenticateAdmin }