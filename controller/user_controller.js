/* eslint-disable camelcase */
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
    res.send({ error: 'Request Error: name, email and password are required.' })
    return
  }

  if (!validator.isEmail(email) || !email.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/gi)) {
    res.send({ error: 'Request Error: Invalid email format' })
    return
  }
  /* replace <, >, &, ', " and / with HTML entities */
  name = validator.escape(name)

  const result = await User.signUp(name, email, password)
  if (result.error) {
    res.send({ error: result.error })
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
  // console.log('email, password: ', email, password)
  if (!email || !password) {
    return res.json({ error: 'Request Error: email and password are required.' })
  }

  try {
    const result = await User.nativeSignIn(email, password)
    console.log('result', result)
    if (result.length === 0) {
      return res.json({ error: 'Email or password is wrong.' })
    } else if (!bcrypt.compareSync(password, result[0].password)) {
      return res.json({ error: 'Email or password is wrong.' })
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

const setUserTarget = async (req, res) => {
  try {
    const { email } = req.user
    const userDetail = await User.getUserDetail(email)
    const userId = userDetail[0].id
    let userInfo = {
      birthday: req.body.birthday,
      height: req.body.height,
      weight: req.body.weight,
      gender: req.body.gender,
      // diet_type: req.body.diet_type,
      diet_goal: req.body.diet_goal,
      activity_level: req.body.activity_level,
      goal_calories: req.body.goal_calories,
      goal_carbs: req.body.goal_carbs,
      goal_protein: req.body.goal_protein,
      goal_fat: req.body.goal_fat,
      TDEE: req.body.TDEE
    }
    /* 確認所有項目皆有輸入 */
    if (!userInfo.birthday || !userInfo.height || !userInfo.weight || !userInfo.gender || !userInfo.diet_goal || !userInfo.activity_level || !userInfo.goal_calories || !userInfo.goal_carbs || !userInfo.goal_protein || !userInfo.goal_fat || !userInfo.TDEE) return res.json({ error: 'imcomplete info' })

    /* 確認所有數字項之格式皆正確 */
    if (isNaN(userInfo.height) || isNaN(userInfo.weight) || isNaN(userInfo.gender) || isNaN(userInfo.diet_goal) || isNaN(userInfo.activity_level) || isNaN(userInfo.goal_calories) || isNaN(userInfo.goal_carbs) || isNaN(userInfo.goal_protein) || isNaN(userInfo.goal_fat) || isNaN(userInfo.TDEE)) return res.json({ error: 'incorrect format' })
    await User.setUserTarget(userId, userInfo)
    res.status(200).json({ message: 'data added successfully' })
  } catch (err) {
    console.log(err)
  }
}

const getUserProfile = async (req, res) => {
  const { name, email, picture } = req.user
  const userDetail = await User.getUserDetail(email)
  const [{ birthday, height, weight, gender, diet_type: dietType, diet_goal: dietGoal, activity_level: activityLevel, goal_calories: goalCalories, goal_carbs: goalCarbs, goal_protein: goalProtein, goal_fat: goalFat, TDEE }] = userDetail
  // console.log('userDetail', userDetail)
  res.status(200).json({
    data: {
      // provider,
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

/* PATCH api 更新使用者基本資訊 */
const updateUserProfile = async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const { email } = req.user
    const updateData = req.body
    const data = await User.getUserDetail(email)
    const userId = data[0].id
    if (id === userId) {
      await User.updateUserProfile(updateData, userId)
      return res.status(200).json({ message: 'User account information updated successfully.' })
    } else {
      return res.status(401).json({ errorMessage: 'Authentication failed to do any updates.' })
    }
  } catch (err) {
    console.error(err)
  }
}

/* PATCH TDEE相關參數 */
const updateUserBodyInfo = async (req, res) => {
  const id = parseInt(req.params.id)
  const { email } = req.user
  // const updateData = req.body
  let { birthday, height, weight, gender, diet_type, diet_goal, activity_level, TDEE } = req.body
  const data = await User.getUserDetail(email)
  const [{
    id: userId,
    birthday: originBirthday,
    height: originHeight,
    weight: originWeight,
    gender: originGender,
    diet_type: originDietType,
    diet_goal: originDietGoal,
    activity_level: originActivityLevel
  }] = data
  // console.log('userDetail', userId, originBirthday, originHeight, originWeight, originGender, originDietType, originDietGoal, originActivityLevel, originGoalCalories, originGoalCarbs, originGoalProtein, originGoalFat, originTDEE)

  if (id !== userId) return res.status(401).json({ errorMessage: 'Authentication failed to do any updates.' })
  let BMR, goal_carbs, goal_protein, goal_fat, goal_calories
  try {
    if (!height) height = originHeight
    if (!weight) weight = originWeight
    if (!birthday) birthday = originBirthday
    if (!gender) gender = originGender
    if (!diet_type) diet_type = originDietType
    if (!activity_level) activity_level = originActivityLevel
    if (!diet_goal) diet_goal = originDietGoal

    const date = new Date()
    const today = date.toISOString().split('T')[0]
    const age = parseInt(today) - parseInt(birthday)

    switch (gender) {
      case 1: {
        BMR = Math.round(10 * weight + 6.25 * height - 5 * age - 161)
        break
      }
      case 2: {
        BMR = Math.round(10 * weight + 6.25 * height - 5 * age + 5)
      }
    }

    switch (activity_level) {
      case 1: {
        TDEE = Math.round(1.2 * BMR)
        break
      }
      case 2: {
        TDEE = Math.round(1.375 * BMR)
        break
      }
      case 3: {
        TDEE = Math.round(1.55 * BMR)
        break
      }
      case 4: {
        TDEE = Math.round(1.725 * BMR)
        break
      }
      case 5: {
        TDEE = Math.round(1.9 * BMR)
        break
      }
    }

    /* 由系統依照diet goal計算default營養素 */
    switch (diet_goal) {
      case 1: {
        goal_calories = Math.round(0.85 * TDEE)
        goal_carbs = Math.round((goal_calories * 0.35) / 4)
        goal_protein = Math.round((goal_calories * 0.4) / 4)
        goal_fat = Math.round((goal_calories * 0.25) / 9)
        break
      }
      case 2: {
        goal_calories = TDEE
        goal_carbs = Math.round((goal_calories * 0.35) / 4)
        goal_protein = Math.round((goal_calories * 0.4) / 4)
        goal_fat = Math.round((goal_calories * 0.25) / 9)
        break
      }
      case 3: {
        goal_calories = Math.round(1.15 * TDEE)
        goal_carbs = Math.round((goal_calories * 0.45) / 4)
        goal_protein = Math.round((goal_calories * 0.3) / 4)
        goal_fat = Math.round((goal_calories * 0.25) / 9)
        break
      }
    }

    const updateData = { birthday, height, weight, gender, diet_type, diet_goal, activity_level, goal_calories, goal_carbs, goal_protein, goal_fat, TDEE }
    const updateInfo = await User.updateUserBodyInfo(updateData, userId)
    // console.log('updateData', updateData)
    return res.status(200).json({ message: 'User body information updated successfully.', updateData })
  } catch (err) {
    console.error(err)
  }
}

/* PATCH 使用者自行調整目標營養素比例 */
const updateNutritionTarget = async (req, res) => {
  const id = parseInt(req.params.id)
  const { email } = req.user
  // const updateData = req.body
  let { goal_calories, goal_carbs_percantage, goal_protein_percantage, goal_fat_percantage } = req.body
  console.log('nutrition target', goal_calories, goal_carbs_percantage, goal_protein_percantage, goal_fat_percantage)
  const data = await User.getUserDetail(email)
  const userId = data[0].id
  let goal_carbs, goal_protein, goal_fat
  try {
    if (id !== userId) return res.status(401).json({ errorMessage: 'Authentication failed to do any updates.' })

    /* 在profile頁面更新目標營養素時採用各營養素百分(ex. goal_carbs: 40 '%', goal_protein: 50 '%')，再加以計算出各營養素的克數 */
    /* validate: 目標熱量不可不輸入、為負數或字串 */
    if (!goal_calories || goal_calories < 0 || typeof goal_calories === 'string') return res.status(400).json({ errorMessage: 'Calories must be a positive integer.' })
    /* validate: 目標營養素比例相加必須等於一百 */
    if ((goal_carbs_percantage + goal_protein_percantage + goal_fat_percantage) !== 100) return res.status(400).json({ errorMessage: 'Nutrition proportions must equal 100!' })
    goal_calories = Math.round((goal_calories))
    goal_carbs = Math.round((goal_calories * (goal_carbs_percantage / 100)) / 4)
    goal_protein = Math.round((goal_calories * (goal_protein_percantage / 100)) / 4)
    goal_fat = Math.round((goal_calories * (goal_fat_percantage / 100)) / 9)

    const updateData = { goal_calories, goal_carbs, goal_protein, goal_fat }
    const updateInfo = await User.updateNutritionTarget(updateData, userId)
    // console.log('updateData', updateData)
    return res.status(200).json({ message: 'User nutrition target updated successfully.', updateData })
  } catch (err) {
    console.error(err)
  }
}

const getUserPreference = async (req, res) => {
  const { email } = req.user
  const userDetail = await User.getUserDetail(email)
  // console.log('userDetail', userDetail)
  const userId = userDetail[0].id
  const preference = await User.getUserPreference(userId)
  res.status(200).json({ preference })
}

module.exports = { signUp, nativeSignIn, setUserTarget, getUserProfile, updateUserProfile, updateUserBodyInfo, updateNutritionTarget, getUserPreference }
