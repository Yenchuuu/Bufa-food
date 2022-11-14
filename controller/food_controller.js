const Food = require('../model/food_model')
const User = require('../model/user_model')
const Euc = require('../utils/euclidean_distance')
const Util = require('../utils/util')
const moment = require('moment')

const createMealRecord = async (req, res) => {
  const { email } = req.user
  const userDetail = await User.getUserDetail(email)
  const currentUserId = userDetail[0].id
  const createdRecord = await Food.createMealRecord(currentUserId)
  res.json({ createdRecord })
}

const getDiaryRecord = async (req, res) => {
  // TODO: 若沒帶token要跳出alert並跳轉回首頁
  const { email } = req.user
  // FIXME: getDate一直是2022-11-13??? WHY???
  const getDate = req.query.date
  // const getDate = queryDate
  let date
  console.log('getDate', typeof getDate, getDate)
  const today = moment().format('YYYY-MM-DD')
  console.log('today', today)
  if (!getDate || typeof getDate === 'undefined') {
    date = today
  } else {
    date = getDate
  }
  console.log('date', date)
  const userDetail = await User.getUserDetail(email)
  const userId = userDetail[0].id
  const mealRecords = await Food.getUserRecord(userId, date)
  res.json({ mealRecords })
}

const getFoodDetail = async (req, res) => {
  const foodId = req.query.id
  const foodDetail = await Food.getFoodDetail(foodId)
  res.json({ foodDetail })
}

// TODO: code好醜，應優化
const generateSingleMeal = async (req, res) => {
  const { target, meal, value } = req.body
  const recommendMealList = await Food.getRecommendSingleMeal(target, value)
  const len = recommendMealList.length
  const recommendMeal = []
  switch (target) {
    case 'calories': {
      /* 若目標為calories，先將C P F分別變成三個array再從中抓取random index作為推薦項目 */
      const carbsList = recommendMealList.filter(
        (e) => e.recommend_categories_id === 1
      )
      const carbs = carbsList[Math.floor(Math.random() * carbsList.length)]
      recommendMeal.push(carbs)
      const ProteinList = recommendMealList.filter(
        (e) => e.recommend_categories_id === 2
      )
      const protein =
        ProteinList[Math.floor(Math.random() * ProteinList.length)]
      recommendMeal.push(protein)
      const vegList = recommendMealList.filter(
        (e) => e.recommend_categories_id === 4
      )
      const veg = vegList[Math.floor(Math.random() * vegList.length)]
      recommendMeal.push(veg)
      const fatList = recommendMealList.filter(
        (e) => e.recommend_categories_id === 3
      )
      const fat = fatList[Math.floor(Math.random() * fatList.length)]
      console.log('nutrition', recommendMeal)
      const remainCaloriesV1 =
        value - (carbs.calories + protein.calories + veg.calories)
      const servingOfFat = Math.round((remainCaloriesV1 / fat.calories) * 100)
      fat.per_serving = servingOfFat
      fat.calories = remainCaloriesV1
      recommendMeal.push(fat)
      break
    }
    case 'protein':
    case 'carbs':
    case 'fat': {
      const randomNum = Math.floor(Math.random() * len)
      recommendMeal.push(recommendMealList[randomNum])
      break
    }
  }
  res.json({ meal, recommendMeal })
}

const generateMultipleMeals = async (req, res) => {
  const { email } = req.user
  const userDetail = await User.getUserDetail(email)
  const [{ id: currentUserId, goal_calories: goalCalories, goal_carbs: goalCarbs, goal_protein: goalProtein, goal_fat: goalFat }] = userDetail
  console.log('userInfo', currentUserId, goalCalories, goalCarbs, goalProtein, goalFat)

  // TODO: 設條件：如過當天無任何飲食紀錄才可以產生一日菜單，若已有紀錄則不行
  // const mealRecords = await Food.getUserRecord
  // if () 

  const multipleMealsList = await Food.getRecommendMultipleMeals(currentUserId)

  /* recommendmeal 1~3 分別為早中晚三餐，點心則不在推薦範圍內 */
  const recommendBreakfast = []
  const recommendLunch = []
  const recommendDinner = []

  /* 將每種營養素的array都隨機排序，隨後取出前兩樣 -> 達到不重複且不會每次都取到一樣的前兩項 */
  const shuffleArray = (arr) => arr.sort(() => 0.5 - Math.random())

  /* 早餐推薦水果，並排除熱量過高的水果種類 */
  const suffleFruitArray = shuffleArray(multipleMealsList.filter(
    (e) => e.food_categories_id === 2
  ))
  let breakfast = suffleFruitArray.pop()
  // console.log('breakfast', breakfast)
  while (breakfast.calories > 100) {
    breakfast = suffleFruitArray.pop()
  }
  recommendBreakfast.push(breakfast)

  /* 計算使用者C P F的營養素分別對總熱量佔比為多少 => 目前沒用到 */
  const userCarbsPercentage = Math.round((goalCarbs * 4) / goalCalories * 100) / 100
  const userProteinPercentage = Math.round((goalProtein * 4) / goalCalories * 100) / 100
  const userFatPercentage = Math.round((goalFat * 9) / goalCalories * 100) / 100
  // console.log('user goal nutrion percentage, C:P:F', userCarbsPercentage, userProteinPercentage, userFatPercentage)

  const carbsCalories = goalCarbs * 4
  const suffleCarbsArray = shuffleArray(multipleMealsList.filter(
    (e) => e.recommend_categories_id === 1))
  // console.log('suffleCarbsArray', suffleCarbsArray)

  /* 隨機取出兩項澱粉，計算其熱量與分配之熱量比例，推算應攝取幾份 */
  /* 因早餐吃水果(熱量僅佔整體2~7%)以及蛋白質，故主要將碳水分配於午晚餐，午餐抓整天熱量之45%作為計算 */
  const carbsCaloriesLunch = Math.round(carbsCalories * 0.45)
  const carbsLunch = suffleCarbsArray.pop()
  const carbsDinner = suffleCarbsArray.pop()
  const servingAmountCarbsLunch = Math.round(carbsCaloriesLunch / carbsLunch.calories * 100)
  carbsLunch.per_serving = servingAmountCarbsLunch
  carbsLunch.calories = carbsCaloriesLunch
  carbsLunch.carbs = Math.round(carbsLunch.carbs * (servingAmountCarbsLunch / 100))
  carbsLunch.protein = Math.round(carbsLunch.protein * (servingAmountCarbsLunch / 100))
  carbsLunch.fat = Math.round(carbsLunch.fat * (servingAmountCarbsLunch / 100))
  /* 把第一個碳水塞進午餐 */
  recommendLunch.push(carbsLunch)

  const proteinCalories = goalProtein * 4
  const suffleProteinArray = shuffleArray(multipleMealsList.filter(
    (e) => e.recommend_categories_id === 2))
  // console.log('suffleProteinArray', suffleProteinArray)

  /* 隨機取出三項蛋白質，計算其熱量與分配之熱量比例，推算應攝取幾份 */
  const proteinBreakfast = suffleProteinArray.pop()
  const proteinLunch = suffleProteinArray.pop()
  const proteinDinner = suffleProteinArray.pop()

  /* 若將蛋白質集中於午晚餐攝取將造成蛋白質來源過於單一，故分散於三餐中 */
  const proteinCaloriesBreakfast = Math.round(proteinCalories * 0.15)
  const servingAmountProteinBreakfast = Math.round(proteinCaloriesBreakfast / proteinBreakfast.calories * 100)
  proteinBreakfast.per_serving = servingAmountProteinBreakfast
  proteinBreakfast.calories = proteinCaloriesBreakfast
  proteinBreakfast.carbs = Math.round(proteinBreakfast.carbs * servingAmountProteinBreakfast / 100)
  proteinBreakfast.protein = Math.round(proteinBreakfast.protein * servingAmountProteinBreakfast / 100)
  proteinBreakfast.fat = Math.round(proteinBreakfast.fat * servingAmountProteinBreakfast / 100)
  /* 把蛋白質塞進早餐 */
  recommendBreakfast.push(proteinBreakfast)

  const proteinCaloriesLunch = Math.round(proteinCalories * 0.40)
  const servingAmountProteinLunch = Math.round(proteinCaloriesLunch / proteinLunch.calories * 100)
  proteinLunch.per_serving = servingAmountProteinLunch
  proteinLunch.calories = proteinCaloriesLunch
  proteinLunch.carbs = Math.round(proteinLunch.carbs * servingAmountProteinLunch / 100)
  proteinLunch.protein = Math.round(proteinLunch.protein * servingAmountProteinLunch / 100)
  proteinLunch.fat = Math.round(proteinLunch.fat * servingAmountProteinLunch / 100)
  /* 把蛋白質塞進午餐 */
  recommendLunch.push(proteinLunch)

  const fatCalories = goalFat * 9

  const suffleFatArray = shuffleArray(multipleMealsList.filter(
    (e) => e.recommend_categories_id === 3))
  /* 隨機取出兩項脂肪，計算其熱量與分配之熱量比例，推算應攝取幾份 */
  const fatCaloriesLunch = Math.round(fatCalories * 0.5)
  const fatLunch = suffleFatArray.pop()
  const fatDinner = suffleFatArray.pop()
  const servingAmountFatLunch = Math.round(fatCaloriesLunch / fatLunch.calories * 100)
  fatLunch.per_serving = servingAmountFatLunch
  fatLunch.calories = fatCaloriesLunch
  fatLunch.carbs = Math.round(fatLunch.carbs * (servingAmountFatLunch / 100))
  fatLunch.protein = Math.round(fatLunch.protein * (servingAmountFatLunch / 100))
  fatLunch.fat = Math.round(fatLunch.fat * (servingAmountFatLunch / 100))
  /* 把第一個脂肪塞進午餐 */
  recommendLunch.push(fatLunch)

  const suffleVegArray = shuffleArray(multipleMealsList.filter(
    (e) => e.recommend_categories_id === 4
  ))
  const vegLunch = suffleVegArray.slice(0, 2)
  const vegDinner = suffleVegArray.slice(2, 4)
  // console.log(vegLunch, vegDinner)
  recommendLunch.push(...vegLunch)
  recommendDinner.push(...vegDinner)

  /* 合計當天早餐&午餐(含晚餐的蔬果)菜單總熱量與營養素 */
  const BreakfastPlusLunch = [].concat(...recommendBreakfast, ...recommendLunch, ...recommendDinner)
  const caloriesSubtotal = BreakfastPlusLunch.reduce((acc, item) => {
    return acc + item.calories
  }, 0)
  const carbsSubtotal = BreakfastPlusLunch.reduce((acc, item) => {
    return acc + item.carbs
  }, 0)
  const proteinSubtotal = BreakfastPlusLunch.reduce((acc, item) => {
    return acc + item.protein
  }, 0)
  const fatSubtotal = BreakfastPlusLunch.reduce((acc, item) => {
    return acc + item.fat
  }, 0)

  console.log('早餐&午餐(含晚餐的蔬果)', goalCalories, caloriesSubtotal, goalCarbs, carbsSubtotal, goalProtein, proteinSubtotal, goalFat, fatSubtotal)

  /* 因推薦食物類別中的脂肪食品營養素較多元，故設定先將脂肪克數逼近達標之後再看其餘營養素剩下多少 */
  const fatGramDinner = Math.round((goalFat - fatSubtotal) * 0.9) // 暫時抓90%，留一些buffer
  const servingAmountFatDinner = Math.round(fatGramDinner / fatDinner.fat * 100)
  fatDinner.per_serving = servingAmountFatDinner
  fatDinner.calories = Math.round(fatDinner.calories * (servingAmountFatDinner / 100))
  fatDinner.carbs = Math.round(fatDinner.carbs * (servingAmountFatDinner / 100))
  fatDinner.protein = Math.round(fatDinner.protein * (servingAmountFatDinner / 100))
  fatDinner.fat = fatGramDinner
  recommendDinner.push(fatDinner)

  // => check 扣掉脂肪之後剩餘的熱量與營養素
  const remainCaloriesV1 = goalCalories - (caloriesSubtotal + fatDinner.calories)
  const remainCarbsV1 = goalCarbs - (carbsSubtotal + fatDinner.carbs)
  const remainProteinV1 = goalProtein - (proteinSubtotal + fatDinner.protein)
  const remainFatV1 = goalFat - (fatSubtotal + fatDinner.fat)
  // console.log('remaining:', remainCaloriesV1, remainCarbsV1, remainProteinV1, remainFatV1)

  const proteinGramDinner = Math.round(remainProteinV1 * 0.9) // 暫時抓90%，留一些buffer
  const servingAmountProteinDinner = Math.round(proteinGramDinner / proteinDinner.protein * 100)
  proteinDinner.per_serving = servingAmountProteinDinner
  proteinDinner.calories = Math.round(proteinDinner.calories * (servingAmountProteinDinner / 100))
  proteinDinner.carbs = Math.round(proteinDinner.carbs * (servingAmountProteinDinner / 100))
  proteinDinner.protein = proteinGramDinner
  proteinDinner.fat = Math.round(proteinDinner.fat * (servingAmountProteinDinner / 100))

  /* 把第三個蛋白質塞進晚餐 */
  recommendDinner.push(proteinDinner)

  // => check 扣掉蛋白質之後剩餘的熱量與營養素
  const remainCaloriesV2 = remainCaloriesV1 - proteinDinner.calories
  const remainCarbsV2 = remainCarbsV1 - proteinDinner.carbs
  const remainProteinV2 = remainProteinV1 - proteinDinner.protein
  const remainFatV2 = remainFatV1 - proteinDinner.fat
  // console.log('remaining:', remainCaloriesV2, remainCarbsV2, remainProteinV2, remainFatV2)

  if (remainCarbsV2 > 0) {
    const carbsGramDinner = Math.round(remainCarbsV2 * 0.9) // 暫時抓90%，留一些buffer
    const servingAmountCarbsDinner = Math.round(carbsGramDinner / carbsDinner.carbs * 100)
    carbsDinner.per_serving = servingAmountCarbsDinner
    carbsDinner.calories = Math.round(carbsDinner.calories * servingAmountCarbsDinner / 100)
    carbsDinner.carbs = carbsGramDinner
    carbsDinner.protein = Math.round(carbsDinner.protein * servingAmountCarbsDinner / 100)
    carbsDinner.fat = Math.round(carbsDinner.fat * servingAmountCarbsDinner / 100)
    /* 把第二個碳水塞進晚餐 */
    recommendDinner.push(carbsDinner)
    // console.log('carbsDinner', carbsDinner.calories, carbsDinner.carbs, carbsDinner.protein, carbsDinner.fat)
  }
  /* 合計當天菜單總熱量與營養素 */
  const allMeals = [].concat(...recommendBreakfast, ...recommendLunch, ...recommendDinner)
  const caloriesTotal = allMeals.reduce((acc, item) => {
    return acc + item.calories
  }, 0)
  const carbsTotal = allMeals.reduce((acc, item) => {
    return acc + item.carbs
  }, 0)
  const proteinTotal = allMeals.reduce((acc, item) => {
    return acc + item.protein
  }, 0)
  const fatTotal = allMeals.reduce((acc, item) => {
    return acc + item.fat
  }, 0)

  console.log('當日菜單與目標差距: kcal, C, P, F', goalCalories, caloriesTotal, goalCarbs, carbsTotal, goalProtein, proteinTotal, goalFat, fatTotal)

  //   return res.json({ recommendBreakfast, recommendLunch, recommendDinner })
  // }
  return res.json({ recommendBreakfast, recommendLunch, recommendDinner })
}

const getFoodFromKeyword = async (req, res) => {
  const key = req.query.key
  const searchFood = await Food.getFoodFromSearchbox(key)
  // console.log('searchFoodC', searchFood)
  res.send(searchFood)
}

const getFoodTrend = async (req, res) => {
  /* 設定撈取熱門食物之區間 */
  const periodStart = moment().add(-7, 'days').format('YYYY-MM-DD')
  const periodEnd = moment().format('YYYY-MM-DD')
  const trendFood = await Food.getFoodTrend(periodStart, periodEnd)
  // const trendFood = trendFoodInfo.map((e) => e.name)
  // console.log('trendFood', trendFood)
  res.json({ trendFood })
}

const getUserRecommendation = async (req, res) => {
  // FIXME: 如果沒有帶token的時候應該顯示其他文字
  const { email } = req.user
  const userDetail = await User.getUserDetail(email)
  const currentUserId = userDetail[0].id
  const recommendFood = await Euc.getUserPreference(currentUserId)
  const foodNutritionInfo = await Food.getFoodNutritionInfo(recommendFood)
  res.json({ foodNutritionInfo })
}

const updateFoodPreference = async (req, res) => {
  try {
    const { email } = req.user
    const userDetail = await User.getUserDetail(email)
    const foodId = req.query.id
    const { clickedBtn } = req.body
    const userId = userDetail[0].id
    console.log(userId, foodId, clickedBtn)
    const preferenceScore = await Food.updateFoodPreference(userId, foodId, clickedBtn)
    res.json({ message: 'Preference score updated successfully.' })
  } catch (err) {
    console.error(err)
  }
}

module.exports = {
  createMealRecord,
  getDiaryRecord,
  getFoodDetail,
  generateSingleMeal,
  getFoodFromKeyword,
  getFoodTrend,
  getUserRecommendation,
  generateMultipleMeals,
  updateFoodPreference
}
