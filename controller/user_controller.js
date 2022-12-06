/* eslint-disable camelcase */
const User = require('../model/user_model')
const moment = require('moment')
const validator = require('validator')
const joi = require('joi')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const salt = parseInt(process.env.BCRYPT_SALT)
const { TOKEN_EXPIRE, TOKEN_SECRET } = process.env // 30 days by seconds
/* 圖片上傳--S3相關 */
const { uploadFile } = require('../utils/s3')
const util = require('util')
const fs = require('fs')
const unlinkFile = util.promisify(fs.unlink)
require('dotenv').config({ path: '../.env' })

const signUp = async (req, res) => {
  let { name, email, password } = req.body

  if (!name || !email || !password) {
    res.json({ errorMessage: 'Request Error: name, email and password are required.' })
    return
  }

  if (!validator.isEmail(email) || !email.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/gi)) {
    res.json({ errorMessage: 'Request Error: Invalid email format' })
    return
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
  user.password = password

  const accessToken = jwt.sign(
    user,
    TOKEN_SECRET
  )
  user.access_token = accessToken

  if (result.error) {
    res.json({ errorMessage: result.error })
    return
  }
  res.status(200).json(user)
}

const nativeSignIn = async (req, res) => {
  const { email, password } = req.body
  // console.log('email, password: ', email, password)
  if (!email || !password) {
    return res.json({ errorMessage: 'Request Error: email and password are required.' })
  }

  const result = await User.nativeSignIn(email)
  // console.log('result', result)
  if (result.length === 0) {
    return res.json({ errorMessage: 'Email or password is wrong.' })
  }
  if (!bcrypt.compareSync(password, result[0].password)) {
    return res.json({ errorMessage: 'Email or password is wrong.' })
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
  const accessToken = token.access_token
  const profile = await User.getFacebookProfile(accessToken)
  const { id, name, email } = profile

  if (!id || !name || !email) {
    return { error: 'Permissions Error: facebook access token can not get user id, name or email' }
  }
  const data = await User.fbSignIn(id, name, email)
  res.status(200).json(data)
}

const setUserTarget = async (req, res) => {
  const { id: userId } = req.user
  const userInfo = {
    birthday: req.body.birthday,
    height: req.body.height,
    weight: req.body.weight,
    gender: req.body.gender,
    dietGoal: req.body.diet_goal,
    activityLevel: req.body.activity_level,
    goalCalories: req.body.goal_calories,
    goalCarbs: req.body.goal_carbs,
    goalProtein: req.body.goal_protein,
    goalFat: req.body.goal_fat,
    TDEE: req.body.TDEE
  }
  /* 確認所有項目皆有輸入 */
  // FIXME: 可以改用套件驗證 -> 寫得更簡潔
  if (!userInfo.birthday || !userInfo.height || !userInfo.weight || !userInfo.gender || !userInfo.dietGoal || !userInfo.activityLevel || !userInfo.goalCalories || !userInfo.goalCarbs || !userInfo.goalProtein || !userInfo.goalFat || !userInfo.TDEE) return res.json({ errorMessage: 'imcomplete info' })

  /* 確認所有數字項之格式皆正確 */
  if (isNaN(userInfo.height) || isNaN(userInfo.weight) || isNaN(userInfo.gender) || isNaN(userInfo.dietGoal) || isNaN(userInfo.activityLevel) || isNaN(userInfo.goalCalories) || isNaN(userInfo.goalCarbs) || isNaN(userInfo.goalProtein) || isNaN(userInfo.goalFat) || isNaN(userInfo.TDEE)) return res.json({ errorMessage: 'incorrect format' })
  await User.setUserTarget(userId, userInfo)
  res.status(200).json({ message: 'data added successfully' })
}

const getUserProfile = async (req, res) => {
  const { email } = req.user
  const userDetail = await User.getUserDetail(email)
  const [{ name, picture, birthday, height, weight, gender, diet_goal: dietGoal, activity_level: activityLevel, goal_calories: goalCalories, goal_carbs: goalCarbs, goal_protein: goalProtein, goal_fat: goalFat, TDEE }] = userDetail
  // console.log('userDetail', userDetail)
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
  const img = req.file.filename // FIXME: 可能因為他抓不到filename?

  /* 把使用者照片上傳至S3，並於本機刪除 */
  // FIXME: 照片都有上傳成功但會噴s3 err: [Error: ENOENT: no such file or directory, unlink
  try {
    const uploadPhoto = await uploadFile(req.file)
    // console.log('userPhoto_result:', uploadPhoto)
    await unlinkFile(img)
  } catch (err) {
    console.log('s3 err:', err)
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
  // console.log('userDetail', userId, originBirthday, originHeight, originWeight, originGender, originDietType, originDietGoal, originActivityLevel, originGoalCalories, originGoalCarbs, originGoalProtein, originGoalFat, originTDEE)

  if (id !== userId) return res.status(401).json({ errorMessage: 'Authentication failed to do any updates.' })
  let BMR, goal_carbs, goal_protein, goal_fat, goal_calories

  if (!height) height = originHeight
  if (!weight) weight = originWeight
  if (!birthday) birthday = originBirthday
  if (!gender) gender = originGender
  // if (!diet_type) diet_type = originDietType
  if (!activity_level) activity_level = originActivityLevel
  if (!diet_goal) diet_goal = originDietGoal

  const date = new Date()
  const today = date.toISOString().split('T')[0]
  const age = parseInt(today) - parseInt(birthday)
  if (age <= 0) return res.status(400).json({ errorMessage: 'age should not less than one' })

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

  const day2 = moment(startDate, 'YYYY-MM-DD').add(1, 'day').format('YYYY-MM-DD')
  const day3 = moment(day2, 'YYYY-MM-DD').add(1, 'day').format('YYYY-MM-DD')
  const day4 = moment(day3, 'YYYY-MM-DD').add(1, 'day').format('YYYY-MM-DD')
  const day5 = moment(day4, 'YYYY-MM-DD').add(1, 'day').format('YYYY-MM-DD')
  const day6 = moment(day5, 'YYYY-MM-DD').add(1, 'day').format('YYYY-MM-DD')
  const day7 = moment(day6, 'YYYY-MM-DD').add(1, 'day').format('YYYY-MM-DD')

  const dailyCaloriesArray = []
  const dailyCarbsArray = []
  const dailyProteinArray = []
  const dailyFatArray = []

  const [startDateObj] = dailyRecords.filter(e => e.date_record === startDate)
  if (startDateObj === undefined) {
    dailyCaloriesArray.push(0)
    dailyCarbsArray.push(0)
    dailyProteinArray.push(0)
    dailyFatArray.push(0)
  } else {
    dailyCaloriesArray.push(parseInt(startDateObj.calories))
    dailyCarbsArray.push(parseInt(startDateObj.carbs))
    dailyProteinArray.push(parseInt(startDateObj.protein))
    dailyFatArray.push(parseInt(startDateObj.fat))
  }

  const [day2Obj] = dailyRecords.filter(e => e.date_record === day2)
  if (day2Obj === undefined) {
    dailyCaloriesArray.push(0)
    dailyCarbsArray.push(0)
    dailyProteinArray.push(0)
    dailyFatArray.push(0)
  } else {
    dailyCaloriesArray.push(parseInt(day2Obj.calories))
    dailyCarbsArray.push(parseInt(day2Obj.carbs))
    dailyProteinArray.push(parseInt(day2Obj.protein))
    dailyFatArray.push(parseInt(day2Obj.fat))
  }

  const [day3Obj] = dailyRecords.filter(e => e.date_record === day3)
  if (day3Obj === undefined) {
    dailyCaloriesArray.push(0)
    dailyCarbsArray.push(0)
    dailyProteinArray.push(0)
    dailyFatArray.push(0)
  } else {
    dailyCaloriesArray.push(parseInt(day3Obj.calories))
    dailyCarbsArray.push(parseInt(day3Obj.carbs))
    dailyProteinArray.push(parseInt(day3Obj.protein))
    dailyFatArray.push(parseInt(day3Obj.fat))
  }

  const [day4Obj] = dailyRecords.filter(e => e.date_record === day4)
  if (day4Obj === undefined) {
    dailyCaloriesArray.push(0)
    dailyCarbsArray.push(0)
    dailyProteinArray.push(0)
    dailyFatArray.push(0)
  } else {
    dailyCaloriesArray.push(parseInt(day4Obj.calories))
    dailyCarbsArray.push(parseInt(day4Obj.carbs))
    dailyProteinArray.push(parseInt(day4Obj.protein))
    dailyFatArray.push(parseInt(day4Obj.fat))
  }

  const [day5Obj] = dailyRecords.filter(e => e.date_record === day5)
  if (day5Obj === undefined) {
    dailyCaloriesArray.push(0)
    dailyCarbsArray.push(0)
    dailyProteinArray.push(0)
    dailyFatArray.push(0)
  } else {
    dailyCaloriesArray.push(parseInt(day5Obj.calories))
    dailyCarbsArray.push(parseInt(day5Obj.carbs))
    dailyProteinArray.push(parseInt(day5Obj.protein))
    dailyFatArray.push(parseInt(day5Obj.fat))
  }

  const [day6Obj] = dailyRecords.filter(e => e.date_record === day6)
  if (day6Obj === undefined) {
    dailyCaloriesArray.push(0)
    dailyCarbsArray.push(0)
    dailyProteinArray.push(0)
    dailyFatArray.push(0)
  } else {
    dailyCaloriesArray.push(parseInt(day6Obj.calories))
    dailyCarbsArray.push(parseInt(day6Obj.carbs))
    dailyProteinArray.push(parseInt(day6Obj.protein))
    dailyFatArray.push(parseInt(day6Obj.fat))
  }

  const [day7Obj] = dailyRecords.filter(e => e.date_record === day7)
  if (day7Obj === undefined) {
    dailyCaloriesArray.push(0)
    dailyCarbsArray.push(0)
    dailyProteinArray.push(0)
    dailyFatArray.push(0)
  } else {
    dailyCaloriesArray.push(parseInt(day7Obj.calories))
    dailyCarbsArray.push(parseInt(day7Obj.carbs))
    dailyProteinArray.push(parseInt(day7Obj.protein))
    dailyFatArray.push(parseInt(day7Obj.fat))
  }
  // FIXME: 真的要寫得這麼笨嗎？
  // console.log('dailyCaloriesArray: ', dailyCaloriesArray)
  // console.log('dailyCarbsArray: ', dailyCarbsArray)
  // console.log('dailyProteinArray: ', dailyProteinArray)
  // console.log('dailyFatArray: ', dailyFatArray)

  const goalCaloriesArray = []
  const goalCarbsArray = []
  const goalProteinArray = []
  const goalFatArray = []

  const [startDateGoal] = goalRecords.filter(e => e.date === startDate)
  if (startDateGoal === undefined) {
    goalCaloriesArray.push(0)
    goalCarbsArray.push(0)
    goalProteinArray.push(0)
    goalFatArray.push(0)
  } else {
    goalCaloriesArray.push(parseInt(startDateGoal.goal_calories))
    goalCarbsArray.push(parseInt(startDateGoal.goal_carbs))
    goalProteinArray.push(parseInt(startDateGoal.goal_protein))
    goalFatArray.push(parseInt(startDateGoal.goal_fat))
  }

  const [day2Goal] = goalRecords.filter(e => e.date === day2)
  if (day2Goal === undefined) {
    goalCaloriesArray.push(0)
    goalCarbsArray.push(0)
    goalProteinArray.push(0)
    goalFatArray.push(0)
  } else {
    goalCaloriesArray.push(parseInt(day2Goal.goal_calories))
    goalCarbsArray.push(parseInt(day2Goal.goal_carbs))
    goalProteinArray.push(parseInt(day2Goal.goal_protein))
    goalFatArray.push(parseInt(day2Goal.goal_fat))
  }

  const [day3Goal] = goalRecords.filter(e => e.date === day3)
  if (day3Goal === undefined) {
    goalCaloriesArray.push(0)
    goalCarbsArray.push(0)
    goalProteinArray.push(0)
    goalFatArray.push(0)
  } else {
    goalCaloriesArray.push(parseInt(day3Goal.goal_calories))
    goalCarbsArray.push(parseInt(day3Goal.goal_carbs))
    goalProteinArray.push(parseInt(day3Goal.goal_protein))
    goalFatArray.push(parseInt(day3Goal.goal_fat))
  }

  const [day4Goal] = goalRecords.filter(e => e.date === day4)
  if (day4Goal === undefined) {
    goalCaloriesArray.push(0)
    goalCarbsArray.push(0)
    goalProteinArray.push(0)
    goalFatArray.push(0)
  } else {
    goalCaloriesArray.push(parseInt(day4Goal.goal_calories))
    goalCarbsArray.push(parseInt(day4Goal.goal_carbs))
    goalProteinArray.push(parseInt(day4Goal.goal_protein))
    goalFatArray.push(parseInt(day4Goal.goal_fat))
  }

  const [day5Goal] = goalRecords.filter(e => e.date === day5)
  if (day5Goal === undefined) {
    goalCaloriesArray.push(0)
    goalCarbsArray.push(0)
    goalProteinArray.push(0)
    goalFatArray.push(0)
  } else {
    goalCaloriesArray.push(parseInt(day5Goal.goal_calories))
    goalCarbsArray.push(parseInt(day5Goal.goal_carbs))
    goalProteinArray.push(parseInt(day5Goal.goal_protein))
    goalFatArray.push(parseInt(day5Goal.goal_fat))
  }

  const [day6Goal] = goalRecords.filter(e => e.date === day6)
  if (day6Goal === undefined) {
    goalCaloriesArray.push(0)
    goalCarbsArray.push(0)
    goalProteinArray.push(0)
    goalFatArray.push(0)
  } else {
    goalCaloriesArray.push(parseInt(day6Goal.goal_calories))
    goalCarbsArray.push(parseInt(day6Goal.goal_carbs))
    goalProteinArray.push(parseInt(day6Goal.goal_protein))
    goalFatArray.push(parseInt(day6Goal.goal_fat))
  }

  const [day7Goal] = goalRecords.filter(e => e.date === day7)
  if (day7Goal === undefined) {
    goalCaloriesArray.push(0)
    goalCarbsArray.push(0)
    goalProteinArray.push(0)
    goalFatArray.push(0)
  } else {
    goalCaloriesArray.push(parseInt(day7Goal.goal_calories))
    goalCarbsArray.push(parseInt(day7Goal.goal_carbs))
    goalProteinArray.push(parseInt(day7Goal.goal_protein))
    goalFatArray.push(parseInt(day7Goal.goal_fat))
  }

  res.json({ dailyCaloriesArray, dailyCarbsArray, dailyProteinArray, dailyFatArray, goalCaloriesArray, goalCarbsArray, goalProteinArray, goalFatArray })
}

module.exports = { signUp, nativeSignIn, fbSignIn, setUserTarget, getUserProfile, uploadUserImage, deleteUserImage, updateUserProfile, updateUserBodyInfo, updateNutritionTarget, getUserPreference, getDailyGoal }
