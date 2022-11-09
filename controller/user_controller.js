const User = require('../model/user_model')
const validator = require('validator')

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

module.exports = { signUp }
