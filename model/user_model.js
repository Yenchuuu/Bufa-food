require('dotenv').config()
const db = require('../utils/mysqlconf')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const salt = parseInt(process.env.BCRYPT_SALT)
const { TOKEN_EXPIRE, TOKEN_SECRET } = process.env // 30 days by seconds

const getUserInfo = async (currentUserId) => {
  const [userInfo] = await db.execute(
    'SELECT diet_goal, goal_calories, goal_carbs, goal_protein, goal_fat FROM `user_bodyInfo` WHERE id = ?',
    [currentUserId]
  )
  return userInfo
}

// (birthday, height, weight, gender, diet_type, diet_goal, activity_level, goal_calories, goal_carbs, goal_protein, goal_fat, TDEE) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

const setUserTarget = async (userId, userInfo) => {
  const [result] = await db.execute('INSERT INTO `user_bodyInfo` (user_id, birthday, height, weight, gender, diet_type, diet_goal, activity_level, goal_calories, goal_carbs, goal_protein, goal_fat, TDEE) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [userId, userInfo.birthday, userInfo.height, userInfo.weight, userInfo.gender, userInfo.diet_type, userInfo.diet_goal, userInfo.activity_level, userInfo.goal_calories, userInfo.goal_carbs, userInfo.goal_protein, userInfo.goal_fat, userInfo.TDEE])
  return result
}

const getUserDetail = async (email) => {
  const [userDetail] = await db.execute('SELECT user.id,user.name, user.email,user.picture, user_bodyInfo.birthday, user_bodyInfo.height, user_bodyInfo.weight, user_bodyInfo.gender, user_bodyInfo.diet_type, user_bodyInfo.diet_goal, user_bodyInfo.activity_level, user_bodyInfo.goal_calories, user_bodyInfo.goal_carbs, user_bodyInfo.goal_protein, user_bodyInfo.goal_fat, user_bodyInfo.TDEE FROM `user` LEFT JOIN `user_bodyInfo` ON user.id = user_bodyInfo.user_id  WHERE email = ?', [email])
  return userDetail
}

// TODO: update user profile info
// const updateUserProfile = async (email) => {
//   const [result] = await db.execute('UPDATE ') 
// }

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

const nativeSignIn = async (email) => {
  const [user] = await db.query('SELECT * FROM user WHERE email = ?', [
    email
  ])
  return user
}

module.exports = { getUserInfo, setUserTarget, getUserDetail, signUp, nativeSignIn }
