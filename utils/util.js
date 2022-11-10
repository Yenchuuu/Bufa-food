const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const User = require('../model/user_model')
const { TOKEN_SECRET } = process.env
const { promisify } = require('util')

const wrapAsync = (fn) => {
  return function (req, res, next) {
    // Make sure to `.catch()` any errors and pass them along to the `next()`
    // middleware in the chain, in this case the error handler.
    fn(req, res, next).catch(next)
  }
}

const authentication = () => {
  return async function (req, res, next) {
    let accessToken = req.get('Authorization')
    if (!accessToken) {
      res.status(401).send({ error: 'Unauthenticated' })
      return
    }

    accessToken = accessToken.replace('Bearer ', '')
    if (accessToken === 'null') {
      res.status(401).send({ error: 'Unauthenticated' })
    }
    try {
      const user = await promisify(jwt.verify)(accessToken, TOKEN_SECRET)
      req.user = user
      // console.log('user', user)
      const userDetail = await User.getUserDetail(user.email)
      if (!userDetail) {
        res.status(400).send({ error: 'Invalid token' })
      } else {
        req.user.id = userDetail.id
        next()
      }
      return
    } catch (err) {
      console.error(err)
      res.status(403).send({ error: 'Forbidden' })
    }
  }
}

module.exports = { wrapAsync, authentication }
