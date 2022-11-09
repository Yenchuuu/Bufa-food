require('dotenv').config()
const db = require('../utils/mysqlconf')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const salt = parseInt(process.env.BCRYPT_SALT)
const { TOKEN_EXPIRE, TOKEN_SECRET } = process.env // 30 days by seconds

const getUserInfo = async (currentUserId) => {
  const [userInfo] = await db.execute(
    'SELECT diet_goal, goal_calories, goal_carbs, goal_protein, goal_fat FROM `user` WHERE id = ?',
    [currentUserId]
  )
  return userInfo
}

const signUp = async (name, email, password) => {
  const conn = await db.getConnection()
  try {
    const loginAt = new Date()
    const user = {
      provider: 'native',
      email,
      password: bcrypt.hashSync(password, salt),
      name,
      picture: null,
      access_expired: TOKEN_EXPIRE,
      login_at: loginAt
    }
    const accessToken = jwt.sign(
      {
        provider: user.provider,
        name: user.name,
        email: user.email,
        picture: user.picture
      },
      TOKEN_SECRET
    )
    user.access_token = accessToken

    const [result] = await conn.execute(
      'INSERT INTO `user` (name, email, password, provider) VALUES (?, ?, ?, ?)',
      [user.name, user.email, user.password, user.provider]
    )
    user.id = result.insertId
    return { user }
  } catch (error) {
    console.error(error)
    return {
      error: 'Email Already Exists',
      status: 400
    }
  } finally {
    await conn.release()
  }
}

const nativeSignIn = async (email, password) => {
  const [user] = await db.query('SELECT * FROM user WHERE email = ?', [
    email
  ])
  return user
}
module.exports = { getUserInfo, signUp, nativeSignIn }
