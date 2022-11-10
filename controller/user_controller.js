const User = require('../model/user_model')
const validator = require('validator')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const salt = parseInt(process.env.BCRYPT_SALT)
const { TOKEN_EXPIRE, TOKEN_SECRET } = process.env // 30 days by seconds

// FIXME: model 跟 controller 沒拆乾淨
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
    const result = await User.nativeSignIn(email)
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

const getUserTarget = async (req, res) => {
  // const { birthday, height, weight, gender, diet_type: dietType, diet_goal: dietGoal, activity_level: activityLevel, goal_calories: goalCalories, goal_carbs: goalCarbs, goal_protein: goalProtein, goal_fat: goalFat, TDEE } = req.body

  const { email } = req.user
  const userDetail = await User.getUserDetail(email)
  // console.log('userDetail', userDetail)
  const userId = userDetail[0].id
  const userInfo = {
    birthday: req.body.birthday,
    height: req.body.height,
    weight: req.body.weight,
    gender: req.body.gender,
    diet_type: req.body.diet_type,
    diet_goal: req.body.diet_goal,
    activity_level: req.body.activity_level,
    goal_calories: req.body.goal_calories,
    goal_carbs: req.body.goal_carbs,
    goal_protein: req.body.goal_protein,
    goal_fat: req.body.goal_fat,
    TDEE: req.body.TDEE
  }
  await User.setUserTarget(userId, userInfo)
  res.status(200).json({ message: 'data added successfully' })
}

const getUserProfile = async (req, res) => {
  const { provider, name, email, picture } = req.user
  const userDetail = await User.getUserDetail(email)
  const [{ birthday, height, weight, gender, diet_type: dietType, diet_goal: dietGoal, activity_level: activityLevel, goal_calories: goalCalories, goal_carbs: goalCarbs, goal_protein: goalProtein, goal_fat: goalFat, TDEE }] = userDetail
  // console.log('userDetail', userDetail)
  res.status(200).json({
    data: {
      provider,
      name,
      email,
      picture,
      birthday,
      height,
      weight,
      gender,
      dietType,
      dietGoal,
      activityLevel,
      goalCalories,
      goalCarbs,
      goalProtein,
      goalFat,
      TDEE
    }
  })
}

// TODO: PATCH api還沒寫完
const updateUserProfile = async (req, res) => {
  // const userId = req.params.id
  // const updateInfo = await updateUserProfile(email)
}

module.exports = { signUp, nativeSignIn, getUserTarget, getUserProfile, updateUserProfile }
