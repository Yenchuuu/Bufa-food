const User = require('../model/user_model')
const validator = require('validator')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const salt = parseInt(process.env.BCRYPT_SALT)
const { TOKEN_EXPIRE, TOKEN_SECRET } = process.env // 30 days by seconds

const signUp = async (req, res) => {
  let { name } = req.body
  const { email, password } = req.body

  if (!name || !email || !password) {
    res
      .status(400)
      .send({ error: 'Request Error: name, email and password are required.' })
    return
  }

  if (!validator.isEmail(email)) {
    res.status(400).send({ error: 'Request Error: Invalid email format' })
    return
  }
  /* replace <, >, &, ', " and / with HTML entities */
  name = validator.escape(name)

  const result = await User.signUp(name, email, password)
  if (result.error) {
    res.status(400).send({ error: result.error })
    return
  }

  const user = result.user
  if (!user) {
    res.status(500).send({ error: 'Database Query Error' })
    return
  }

  res.status(200).send({
    data: {
      access_token: user.access_token,
      access_expired: user.access_expired,
      login_at: user.login_at,
      user: {
        id: user.id,
        provider: user.provider,
        name: user.name,
        email: user.email,
        picture: user.picture
      }
    }
  })
}

const nativeSignIn = async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    res
      .status(400)
      .json({ error: 'Request Error: email and password are required.' })
    return
  }

  try {
    const result = await User.nativeSignIn(email, password)
    // console.log('result', result)
    if (result.length === 0) {
      return res
        .status(401)
        .json({ errorMessage: 'Invalid email or password. Please try again.' })
    } else {
      bcrypt.compare(password, result[0].password)
      delete result[0].password
      const user = result[0]
      const accessToken = jwt.sign(
        {
          provider: user.provider,
          name: user.name,
          email: user.email,
          picture: user.picture
        },
        TOKEN_SECRET
      )
      return res.status(200).json({
        data: {
          access_token: accessToken,
          access_expired: 3600,
          user
        }
      })
    }
  } catch (error) {
    console.error(error)
    return { error }
  }
}

module.exports = { signUp, nativeSignIn }
