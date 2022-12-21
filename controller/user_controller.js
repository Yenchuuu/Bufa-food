/* eslint-disable camelcase */
const User = require('../model/user_model')
const moment = require('moment')
const validator = require('validator')
const service = require('../service/service')
const util = require('../utils/util')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const salt = parseInt(process.env.BCRYPT_SALT)
const { TOKEN_EXPIRE, TOKEN_SECRET } = process.env // 30 days by seconds
/* 圖片上傳--S3相關 */
const { uploadFile } = require('../utils/s3')
const Util = require('util')
const fs = require('fs')
const unlinkFile = Util.promisify(fs.unlink)
require('dotenv').config({ path: '../.env' })

const signUp = async (req, res) => {
  let { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ errorMessage: 'Request Error: name, email and password are required.' })
  }
  if (!validator.isEmail(email)) {
    return res.status(400).json({ errorMessage: 'Request Error: Invalid email format' })
  }
  const findUser = await User.getUserDetail(email)
  if (findUser.length !== 0) {
    return res.status(400).json({ errorMessage: 'Request Error: Email already exist.' })
  }
  /* replace <, >, &, ', " and / with HTML entities */
  name = validator.escape(name)
  const provider = 'native'

  password = bcrypt.hashSync(password, salt)
  const result = await User.signUp(provider, name, email, password)
  const id = result
  const user = {
    id,
    provider,
    email,
    name
  }
  // user.password = password

  const accessToken = jwt.sign(
    user,
    TOKEN_SECRET
  )
  user.access_token = accessToken

  if (result.error) {
    res.status(400).json({ errorMessage: result.error })
    return
  }
  res.status(200).json(user)
}

const nativeSignIn = async (req, res) => {
  const { email, password } = req.body
  // console.log('email, password: ', email, password)
  if (!email || !password) {
    return res.status(400).json({ errorMessage: 'Request Error: email and password are required.' })
  }

  const result = await User.nativeSignIn(email)
  // console.log('result', result)
  if (result.length === 0) {
    return res.status(400).json({ errorMessage: 'Email or password is wrong.' })
  }
  if (!bcrypt.compareSync(password, result[0].password)) {
    return res.status(400).json({ errorMessage: 'Email or password is wrong.' })
  }
  bcrypt.compare(password, result[0].password)
  delete result[0].password
  const user = result[0]
  const accessToken = jwt.sign(
    user,
    TOKEN_SECRET
  )
  return res.status(200).json({
    data: {
      access_token: accessToken,
      access_expired: TOKEN_EXPIRE,
      user
    }
  })
}

const fbSignIn = async (req, res) => {
  // 確認是否有fb token
  const token = req.body
  const fbAccessToken = token.access_token
  const profile = await User.getFacebookProfile(fbAccessToken)
  const { id, name, email } = profile

  if (!id || !name || !email) {
    return { error: 'Permissions Error: facebook access token can not get user id, name or email' }
  }

  const user = {
    provider: 'facebook',
    email,
    name,
    picture: 'https://graph.facebook.com/' + id + '/picture?type=large'
  }

  const data = await User.fbSignIn(email, user)
  user.id = data

  const accessToken = jwt.sign(
    user,
    TOKEN_SECRET
  )

  res.status(200).json({
    data: {
      access_token: accessToken,
      access_expired: TOKEN_EXPIRE,
      user
    }
  })
}

const setUserTarget = async (req, res) => {
  const { id: userId } = req.user
  const { birthday, height, weight, gender, diet_goal: dietGoal, activity_level: activityLevel, goal_calories: goalCalories, goal_carbs: goalCarbs, goal_protein: goalProtein, goal_fat: goalFat, TDEE } = req.body

  /* 確認所有項目皆有輸入 */
  if (!birthday || !height || !weight || !gender || !dietGoal || !activityLevel || !goalCalories || !goalCarbs || !goalProtein || !goalFat || !TDEE) return res.status(400).json({ errorMessage: 'imcomplete info' })

  /* 確認所有數字項之格式皆正確 */
  if (!Number.isInteger(parseInt(height)) || !Number.isInteger(parseInt(weight)) || !Number.isInteger(gender) || !Number.isInteger(dietGoal) || !Number.isInteger(activityLevel) || !Number.isInteger(goalCalories) || !Number.isInteger(goalCarbs) || !Number.isInteger(goalProtein) || !Number.isInteger(goalFat) || !Number.isInteger(TDEE) || !util.isValidDate(birthday)) return res.status(400).json({ errorMessage: 'incorrect format' })

  const userInfo = { birthday, height, weight, gender, dietGoal, activityLevel, goalCalories, goalCarbs, goalProtein, goalFat, TDEE }

  await User.setUserTarget(userId, userInfo)
  res.status(200).json({ message: 'data added successfully' })
}

const getUserProfile = async (req, res) => {
  const { email } = req.user
  const userDetail = await User.getUserDetail(email)
  const [{ name, picture, birthday, height, weight, gender, diet_goal: dietGoal, activity_level: activityLevel, goal_calories: goalCalories, goal_carbs: goalCarbs, goal_protein: goalProtein, goal_fat: goalFat, TDEE }] = userDetail
  let imagePath
  if (picture == null) {
    imagePath = ''
  } else {
    imagePath = `${process.env.CLOUDFRONT_URL}/${picture}`
  }
  res.status(200).json({
    data: {
      name,
      email,
      imagePath,
      birthday,
      height,
      weight,
      gender,
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

const uploadUserImage = async (req, res) => {
  const id = parseInt(req.params.id)
  const { id: userId } = req.user
  const img = req.file.filename
  const imgPath = req.file.path

  /* 把使用者照片上傳至S3，並於本機刪除 */
  await uploadFile(req.file)
  try {
    await unlinkFile(imgPath)
  } catch (err) {
    throw err
  }
  if (id === userId) {
    await User.uploadUserImage(img, userId)
    return res.status(200).json({ message: 'User image uploaded successfully.' })
  } else {
    return res.status(401).json({ error: 'Authentication failed to do any uploads.' })
  }
}

const deleteUserImage = async (req, res) => {
  const id = parseInt(req.params.id)
  const { id: userId } = req.user
  if (id === userId) {
    await User.deleteUserImage(userId)
    return res.status(200).json({ message: 'User image removed successfully.' })
  } else {
    return res.status(401).json({ error: 'Authentication failed to do any updates.' })
  }
}

/* PATCH api 更新使用者基本資訊 */
const updateUserProfile = async (req, res) => {
  const id = parseInt(req.params.id)
  const { id: userId } = req.user
  const updateData = req.body
  if (id === userId) {
    await User.updateUserProfile(updateData, userId)
    return res.status(200).json({ message: 'User account information updated successfully.' })
  } else {
    return res.status(401).json({ errorMessage: 'Authentication failed to do any updates.' })
  }
}

/* PATCH TDEE相關參數 */
const updateUserBodyInfo = async (req, res) => {
  const id = parseInt(req.params.id)
  const { email } = req.user
  let { birthday, height, weight, gender, diet_goal, activity_level, TDEE } = req.body
  const data = await User.getUserDetail(email)
  const [{
    id: userId,
    birthday: originBirthday,
    height: originHeight,
    weight: originWeight,
    gender: originGender,
    diet_goal: originDietGoal,
    activity_level: originActivityLevel
  }] = data

  if (id !== userId) return res.status(401).json({ errorMessage: 'Authentication failed to do any updates.' })
  // let goal_carbs, goal_protein, goal_fat, goal_calories

  if (!height) height = originHeight
  if (!weight) weight = originWeight
  if (!birthday) birthday = originBirthday
  if (!gender) gender = originGender
  if (!activity_level) activity_level = originActivityLevel
  if (!diet_goal) diet_goal = originDietGoal

  const today = util.dateOfToday
  const age = parseInt(today) - parseInt(birthday)
  if (age <= 0) return res.status(400).json({ errorMessage: 'age should not less than one' })

  const BMR = service.calculateBMR(gender, weight, height, age)

  TDEE = service.calculateTDEE(activity_level, BMR)

  /* 由系統依照diet goal計算default營養素 */
  const goalNutrition = service.calculateDefaultNutritionByDietGoal(diet_goal, TDEE)

  const goal_calories = goalNutrition.goalCalories
  const goal_carbs = goalNutrition.goalCarbs
  const goal_protein = goalNutrition.goalProtein
  const goal_fat = goalNutrition.goalFat

  const updateData = { birthday, height, weight, gender, diet_goal, activity_level, goal_calories, goal_carbs, goal_protein, goal_fat, TDEE }
  await User.updateUserBodyInfo(updateData, userId)
  // console.log('updateData', updateData)
  return res.status(200).json({ message: 'User body information updated successfully.', updateData })
}

/* PATCH 使用者自行調整目標營養素比例 */
const updateNutritionTarget = async (req, res) => {
  const id = parseInt(req.params.id)
  const { id: userId } = req.user
  // const updateData = req.body
  let { goal_calories, goal_carbs_percantage, goal_protein_percantage, goal_fat_percantage } = req.body
  let goal_carbs, goal_protein, goal_fat
  if (id !== userId) return res.status(401).json({ error: 'Authentication failed to do any updates.' })

  /* 在profile頁面更新目標營養素時採用各營養素百分(ex. goal_carbs: 40 '%', goal_protein: 50 '%')，再加以計算出各營養素的克數 */
  /* validate: 目標熱量不可不輸入、為負數或字串 */
  if (!goal_calories || goal_calories < 0 || typeof goal_calories === 'string') return
  /* validate: 目標營養素比例相加必須等於一百 */
  if ((goal_carbs_percantage + goal_protein_percantage + goal_fat_percantage) !== 100) return
  goal_calories = Math.round((goal_calories))
  goal_carbs = Math.round((goal_calories * (goal_carbs_percantage / 100)) / 4)
  goal_protein = Math.round((goal_calories * (goal_protein_percantage / 100)) / 4)
  goal_fat = Math.round((goal_calories * (goal_fat_percantage / 100)) / 9)

  const updateData = { goal_calories, goal_carbs, goal_protein, goal_fat }
  await User.updateNutritionTarget(updateData, userId)
  // console.log('updateData', updateData)
  return res.status(200).json({ message: 'User nutrition target updated successfully.', updateData })
}

const getUserPreference = async (req, res) => {
  const { id: userId } = req.user
  const preference = await User.getUserPreference(userId)
  res.status(200).json({ preference })
}

const getDailyGoal = async (req, res) => {
  const { id: userId } = req.user
  const startDate = req.query.date
  const endDate = moment(startDate, 'YYYY-MM-DD').add(6, 'day').format('YYYY-MM-DD')

  const goalRecords = await User.getDailyGoal(userId, startDate, endDate)

  const dailyRecords = await User.getDailySummary(userId, startDate, endDate)

  const dateArray = [startDate]
  for (let i = 1; i < 7; i++) {
    dateArray.push(moment(dateArray[i - 1], 'YYYY-MM-DD').add(1, 'day').format('YYYY-MM-DD'))
  }

  const goalRecordsItem = {
    calories: [],
    carbs: [],
    protein: [],
    fat: []
  }

  const dailyRecordsItem = {
    calories: [],
    carbs: [],
    protein: [],
    fat: []
  }

  function pushDailyGoals(object) {
    return service.pushRecord(goalRecordsItem, object)
  }

  function pushDailyRecords(object) {
    return service.pushRecord(dailyRecordsItem, object)
  }

  dateArray.forEach(day => {
    const [dayRecord] = dailyRecords.filter(e => e.date_record === day)
    pushDailyRecords(dayRecord)
  })

  dateArray.forEach(day => {
    const [dayGoal] = goalRecords.filter(e => e.date === day)
    pushDailyGoals(dayGoal)
  })

  const { calories: dailyCaloriesArray, carbs: dailyCarbsArray, protein: dailyProteinArray, fat: dailyFatArray } = dailyRecordsItem
  const { calories: goalCaloriesArray, carbs: goalCarbsArray, protein: goalProteinArray, fat: goalFatArray } = goalRecordsItem

  res.status(200).json({ dailyCaloriesArray, dailyCarbsArray, dailyProteinArray, dailyFatArray, goalCaloriesArray, goalCarbsArray, goalProteinArray, goalFatArray })
}

module.exports = { signUp, nativeSignIn, fbSignIn, setUserTarget, getUserProfile, uploadUserImage, deleteUserImage, updateUserProfile, updateUserBodyInfo, updateNutritionTarget, getUserPreference, getDailyGoal }
