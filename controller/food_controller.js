const Food = require('../model/food_model')
const User = require('../model/user_model')
const Euc = require('../utils/euclidean_distance')
const Cache = require('../utils/cache')
const util = require('../utils/util')
const service = require('../service/service')
const moment = require('moment')
const CACHE_TRENDFOOD_KEY = 'cacheTrendFood'

const addMealRecord = async (req, res) => {
  const { id: userId } = req.user
  let foodId = req.query.id
  let { meal, servingAmount, date } = req.body
  if (!meal || !servingAmount || !date || !Number.isInteger(meal) || !Number.isInteger(servingAmount) || !util.isValidDate(date)) {
    return res.status(400).json({ errorMessage: 'Incorrect format.' })
  }
  meal = parseInt(meal)
  foodId = parseInt(foodId)
  /* req.body接近來的serving amount單位是g，故應以food table之per_serving計算到底有幾份 */
  const data = await Food.getFoodDetail(foodId)
  const perServing = data[0].per_serving
  servingAmount = parseFloat((servingAmount / perServing).toFixed(1))
  const mealRecords = await Food.getUserRecord(userId, date)

  /* 若當天飲食紀錄已有此餐點 -> 調整份數；若無則建立 */
  const findItem = mealRecords.mealRecords.filter(e => e.meal === meal).filter(e => e.food_id === foodId)
  // console.log('findItem', findItem)
  if (findItem.length !== 0) {
    servingAmount += parseFloat((findItem[0].serving_amount))
    servingAmount.toFixed(1)
    await Food.updateMealRecord(userId, foodId, meal, servingAmount, date)
  } else {
    await Food.createMealRecord(userId, foodId, meal, servingAmount, date)
  }
  res.status(200).json({ message: 'Record updated successfully.' })
}

const updateMealRecord = async (req, res) => {
  const { id: userId } = req.user
  let date = req.query.id
  if (!date || date === 'undefined') {
    date = util.dateOfToday
  }

  /* 用修改克數乘上食物之原始營養素渲染至前端 */
  const data = req.body
  parseInt(data.calories)
  parseInt(data.carbs)
  parseInt(data.protein)
  parseInt(data.fat)

  const foodId = data.food_id
  // console.log('data: ', data);
  const [foodDetail] = await Food.getFoodDetail(foodId)
  const perServing = foodDetail.per_serving
  const servingAmount = parseFloat((data.amountTotal / perServing).toFixed(2))
  data.calories = Math.round(foodDetail.calories * servingAmount)
  data.carbs = parseInt(foodDetail.carbs * servingAmount)
  data.protein = parseInt(foodDetail.protein * servingAmount)
  data.fat = parseInt(foodDetail.fat * servingAmount)

  const meal = data.meal
  await Food.updateMealRecord(userId, foodId, meal, servingAmount, date)

  res.status(200).json(data)
}

const deleteMealRecord = async (req, res) => {
  let date = req.query.id
  if (!date || date === 'undefined') {
    date = util.dateOfToday
  }
  const data = req.body
  const recordId = data.record_id
  await Food.deleteMealRecord(recordId)
  res.status(200).json(data)
}

const getDiaryRecord = async (req, res) => {
  const { id: userId } = req.user
  const getDate = req.query.date
  let date
  const today = util.dateOfToday
  if (!getDate || typeof getDate === 'undefined') {
    date = today
  } else {
    date = getDate
  }
  // console.log('date', date)
  const mealRecords = await Food.getUserRecord(userId, date)
  const totals = mealRecords.recordSummary.reduce((totals, item) => {
    totals.caloriesTotal += parseInt(item.caloriesTotal)
    totals.carbsTotal += parseInt(item.carbsTotal)
    totals.proteinTotal += parseInt(item.proteinTotal)
    totals.fatTotal += parseInt(item.fatTotal)
    return totals
  }, {
    caloriesTotal: 0,
    carbsTotal: 0,
    proteinTotal: 0,
    fatTotal: 0
  })

  res.status(200).json({ mealRecords, ...totals })
}

const getFoodDetail = async (req, res) => {
  const foodId = req.query.id
  const foodDetail = await Food.getFoodDetail(foodId)
  res.status(200).json({ foodDetail })
}

const createFoodDetail = async (req, res) => {
  const { id: userId } = req.user
  let { name, calories, carbs, protein, fat, perServing } = req.body

  if (!name || !calories || carbs === null || protein === null || fat === null || !perServing || !Number.isInteger(calories) || !Number.isInteger(perServing) || !Number.isInteger(carbs) || !Number.isInteger(protein) || !Number.isInteger(fat) || (carbs + protein + fat) > perServing || (carbs * 4 + protein * 4 + fat * 9) > calories || calories > perServing * 9) {
    return res.status(400).json({ errorMessage: 'Incorrect format.' })
  }

  calories = parseInt(calories)
  carbs = parseInt(carbs)
  protein = parseInt(protein)
  fat = parseInt(fat)
  perServing = parseInt(perServing)

  await Food.createFoodDetail(name, calories, carbs, protein, fat, perServing, userId)
  res.status(200).json({ message: 'Food created successfully.' })
}

// complexity reduce from 43 to 26
const generateSingleMeal = async (req, res) => {
  const { target, meal, value, date } = req.body
  const { email } = req.user
  const userDetail = await User.getUserDetail(email)
  const [{ id: userId, goal_calories: goalCalories, goal_carbs: goalCarbs, goal_protein: goalProtein, goal_fat: goalFat }] = userDetail

  /* 一餐熱量不應低於TDEE 10% */
  if (target === 'calories' && value < (goalCalories * 0.1)) {
    return res.status(400).json({ errorMessage: 'lowCalories' })
  }

  /* 輸入過高之熱量 */
  if (target === 'calories' && value > (goalCalories * 0.7)) {
    return res.status(400).json({ errorMessage: 'highCalories' })
  }

  /* 不建議營養素過度集中在某一餐攝取 */
  if ((target === 'carbs' && value > goalCarbs * 0.7) ||
    (target === 'protein' && value > goalProtein * 0.7) ||
    (target === 'fat' && value > goalFat * 0.7)) {
    return res.status(400).json({ errorMessage: 'outOfRange' })
  }

  /* 計算使用者C P的目標營養素分別對總熱量佔比為多少 */
  const userCarbsPercentage = Math.round((goalCarbs * 4) / goalCalories * 100) / 100
  const userProteinPercentage = Math.round((goalProtein * 4) / goalCalories * 100) / 100

  const recommendMealList = await Food.getRecommendSingleMeal(userId)
  const recommendMeal = []

  const nutritionLookup = {
    carbs: 1,
    protein: 2,
    fat: 3
  }

  function selectFoodByNutrition(target, value) {
    const FoodList = recommendMealList.filter(
      (food) => food.recommend_categories_id === nutritionLookup[target]
    )
    const selectFood = FoodList[Math.floor(Math.random() * FoodList.length)]
    const servingAmountNutrition = Math.round(value / selectFood[`${target}`] * selectFood.per_serving)
    service.calculateNutritionOfServingAmount(selectFood, servingAmountNutrition, selectFood.per_serving)
    recommendMeal.push(selectFood)
  }

  if (target !== 'calories') {
    selectFoodByNutrition(target, value)
  } else {
    /* 若目標為calories，先將C P F分別變成三個array再從中抓取random index作為推薦項目 */
    const carbsList = recommendMealList.filter(
      (e) => e.recommend_categories_id === 1
    )
    const carbs = carbsList[Math.floor(Math.random() * carbsList.length)]
    /* 依目標碳水比例乘以總熱量，計算碳水應攝取幾份 */
    const carbsCalories = Math.round(value * userCarbsPercentage * 0.8) // 留 20% buffer
    const servingAmountCarbs = Math.round(carbsCalories / carbs.calories * carbs.per_serving)
    // console.log('carbsCalories', carbsCalories, 'servingAmountCarbs', servingAmountCarbs)
    service.calculateNutritionOfServingAmount(carbs, servingAmountCarbs, carbs.per_serving)
    carbs.calories = carbsCalories
    recommendMeal.push(carbs)

    const ProteinList = recommendMealList.filter(
      (e) => e.recommend_categories_id === 2
    )
    const protein = ProteinList[Math.floor(Math.random() * ProteinList.length)]
    const proteinCalories = Math.round(value * userProteinPercentage * 0.8) // 留 20% buffer
    const servingAmountProtein = Math.round(proteinCalories / protein.calories * protein.per_serving)
    service.calculateNutritionOfServingAmount(protein, servingAmountProtein, protein.per_serving)
    protein.calories = proteinCalories
    recommendMeal.push(protein)

    const vegList = recommendMealList.filter(
      (e) => e.recommend_categories_id === 4
    )
    const veg = vegList[Math.floor(Math.random() * vegList.length)]
    if (veg.calories > value * 0.2) {
      const servingAmountVeg = Math.round(veg.calories * 0.5 / veg.calories * veg.per_serving)
      service.calculateNutritionOfServingAmount(veg, servingAmountVeg, veg.per_serving)
    }
    recommendMeal.push(veg)

    /* 計算剩餘的熱量，將脂肪成算份量以符合需求 */
    const caloriesSubtotal = recommendMeal.reduce((acc, item) => {
      return acc + item.calories
    }, 0)

    const remainCalories = value - caloriesSubtotal
    // console.log('remainCalories: ', remainCalories)
    if (remainCalories > 0) {
      const fatList = recommendMealList.filter(
        (e) => e.recommend_categories_id === 3
      )
      const fat = fatList[Math.floor(Math.random() * fatList.length)]
      // console.log('nutrition', recommendMeal)

      const servingOfFat = Math.round((remainCalories / fat.calories) * fat.per_serving)
      service.calculateNutritionOfServingAmount(fat, servingOfFat, fat.per_serving)
      fat.calories = remainCalories
      recommendMeal.push(fat)
    }
  }

  await Food.setRecommendSingleMeal(userId, meal, recommendMeal, date)
  // console.log('InfoC', userId, recommendMeal, date)
  return res.status(200).json({ meal, recommendMeal })
}

// complexity reduce from 30 to 19
const generateMultipleMeals = async (req, res) => {
  const { email } = req.user
  const { date } = req.body
  if (!date || date === null || !util.isValidDate(date)) {
    return res.status(400).json({ errorMessage: 'Incorrect format.' })
  }
  const userDetail = await User.getUserDetail(email)
  const [{ id: userId, goal_calories: goalCalories, goal_carbs: goalCarbs, goal_protein: goalProtein, goal_fat: goalFat }] = userDetail
  // console.log('userInfo', userId, goalCalories, goalCarbs, goalProtein, goalFat)

  const mealRecords = await Food.getUserRecord(userId, date)
  if (mealRecords.mealRecords.length !== 0) {
    return res.status(400).json({ errorMessage: '當日已有飲食紀錄，請使用上方列表選擇推薦單餐喔！' })
  }
  const multipleMealsList = await Food.getRecommendMultipleMeals(userId)

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

  const carbsCalories = goalCarbs * 4
  const suffleCarbsArray = shuffleArray(multipleMealsList.filter(
    (e) => e.recommend_categories_id === 1))
  // console.log('suffleCarbsArray', suffleCarbsArray)

  /* 隨機取出兩項澱粉，計算其熱量與分配之熱量比例，推算應攝取幾份 */
  /* 因早餐吃水果(熱量僅佔整體2~7%)以及蛋白質，故主要將碳水分配於午晚餐，午餐抓整天熱量之45%作為計算 */
  const carbsCaloriesLunch = Math.round(carbsCalories * 0.45)
  const carbsLunch = suffleCarbsArray.pop()
  const carbsDinner = suffleCarbsArray.pop()
  const servingAmountCarbsLunch = Math.round(carbsCaloriesLunch / carbsLunch.calories * carbsLunch.per_serving)
  service.calculateNutritionOfServingAmount(carbsLunch, servingAmountCarbsLunch, carbsLunch.per_serving)
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
  const servingAmountProteinBreakfast = Math.round(proteinCaloriesBreakfast / proteinBreakfast.calories * proteinBreakfast.per_serving)
  service.calculateNutritionOfServingAmount(proteinBreakfast, servingAmountProteinBreakfast, proteinBreakfast.per_serving)
  /* 把蛋白質塞進早餐 */
  recommendBreakfast.push(proteinBreakfast)

  const proteinCaloriesLunch = Math.round(proteinCalories * 0.40)
  const servingAmountProteinLunch = Math.round(proteinCaloriesLunch / proteinLunch.calories * proteinLunch.per_serving)
  service.calculateNutritionOfServingAmount(proteinLunch, servingAmountProteinLunch, proteinLunch.per_serving)
  /* 把蛋白質塞進午餐 */
  recommendLunch.push(proteinLunch)

  const fatCalories = goalFat * 9

  const suffleFatArray = shuffleArray(multipleMealsList.filter(
    (e) => e.recommend_categories_id === 3))
  /* 隨機取出兩項脂肪，計算其熱量與分配之熱量比例，推算應攝取幾份 */
  const fatCaloriesLunch = Math.round(fatCalories * 0.5)
  const fatLunch = suffleFatArray.pop()
  const fatDinner = suffleFatArray.pop()
  const servingAmountFatLunch = Math.round(fatCaloriesLunch / fatLunch.calories * fatLunch.per_serving)
  service.calculateNutritionOfServingAmount(fatLunch, servingAmountFatLunch, fatLunch.per_serving)
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
  // const caloriesSubtotal = BreakfastPlusLunch.reduce((acc, item) => {
  //   return acc + item.calories
  // }, 0)
  const carbsSubtotal = BreakfastPlusLunch.reduce((acc, item) => {
    return acc + item.carbs
  }, 0)
  const proteinSubtotal = BreakfastPlusLunch.reduce((acc, item) => {
    return acc + item.protein
  }, 0)
  const fatSubtotal = BreakfastPlusLunch.reduce((acc, item) => {
    return acc + item.fat
  }, 0)

  // console.log('早餐&午餐(含晚餐的蔬果)', goalCalories, caloriesSubtotal, goalCarbs, carbsSubtotal, goalProtein, proteinSubtotal, goalFat, fatSubtotal)

  /* 因推薦食物類別中的脂肪食品營養素較多元，故設定先將脂肪克數逼近達標之後再看其餘營養素剩下多少 */
  const fatGramDinner = Math.round((goalFat - fatSubtotal) * 0.9) // 暫時抓90%，留一些buffer
  const servingAmountFatDinner = Math.round(fatGramDinner / fatDinner.fat * fatDinner.per_serving)
  service.calculateNutritionOfServingAmount(fatDinner, servingAmountFatDinner, fatDinner.per_serving)
  recommendDinner.push(fatDinner)

  // => check 扣掉脂肪之後剩餘的熱量與營養素
  const remainCarbsV1 = goalCarbs - (carbsSubtotal + fatDinner.carbs)
  const remainProteinV1 = goalProtein - (proteinSubtotal + fatDinner.protein)

  const proteinGramDinner = Math.round(remainProteinV1 * 0.9) // 暫時抓90%，留一些buffer
  const servingAmountProteinDinner = Math.round(proteinGramDinner / proteinDinner.protein * proteinDinner.per_serving)
  service.calculateNutritionOfServingAmount(proteinDinner, servingAmountProteinDinner, proteinDinner.per_serving)
  /* 把第三個蛋白質塞進晚餐 */
  recommendDinner.push(proteinDinner)

  // => check 扣掉蛋白質之後剩餘的熱量與營養素
  const remainCarbsV2 = remainCarbsV1 - proteinDinner.carbs
  // console.log('remaining:', remainCaloriesV2, remainCarbsV2, remainProteinV2, remainFatV2)

  if (remainCarbsV2 > 0) {
    const carbsGramDinner = Math.round(remainCarbsV2 * 0.9) // 暫時抓90%，留一些buffer
    const servingAmountCarbsDinner = Math.round(carbsGramDinner / carbsDinner.carbs * carbsDinner.per_serving)
    service.calculateNutritionOfServingAmount(carbsDinner, servingAmountCarbsDinner, carbsDinner.per_serving)
    /* 把第二個碳水塞進晚餐 */
    recommendDinner.push(carbsDinner)
    // console.log('carbsDinner', carbsDinner.calories, carbsDinner.carbs, carbsDinner.protein, carbsDinner.fat)
  }

  await Food.setRecommendMultipleMeals(userId, recommendBreakfast, recommendLunch, recommendDinner, date)
  // console.log('Meals write into DB successfully.')
  return res.status(200).json({ recommendBreakfast, recommendLunch, recommendDinner })
}

const getFoodFromKeyword = async (req, res) => {
  const key = req.query.key
  const searchFood = await Food.getFoodFromSearchbox(key)
  res.status(200).json(searchFood)
}

const getFoodTrend = async (req, res) => {
  /* 設定撈取熱門食物之區間 */
  const periodStart = moment().add(-6, 'days').format('YYYY-MM-DD')
  const periodEnd = util.dateOfToday
  let trendFood
  try {
    if (Cache.ready) {
      trendFood = await Cache.get(CACHE_TRENDFOOD_KEY)
    }
  } catch (err) {
    console.error(`Get trend food cache error: ${err}`)
  }
  if (trendFood) {
    // console.log('Get trend food from cache')
    res.status(200).json(JSON.parse(trendFood))
    return
  }

  trendFood = await Food.getFoodTrend(periodStart, periodEnd)
  // console.log('trendFood: ', trendFood)

  try {
    if (Cache.ready) {
      await Cache.set(CACHE_TRENDFOOD_KEY, JSON.stringify(trendFood))
      const todayEnd = new Date().setHours(23, 59, 59, 999)
      /* 熱搜食物快取於每日11:59pm清除 */
      await Cache.expireAt(CACHE_TRENDFOOD_KEY, parseInt(todayEnd / 1000))
    }
  } catch (err) {
    console.error(`Set trend food cache error: ${err}`)
  }
  res.status(200).json(trendFood)
}

const getUserRecommendation = async (req, res) => {
  const { id: currentUserId } = req.user
  const recommendFood = await Euc.getUserPreference(currentUserId)
  const foodNutritionInfo = await Food.getFoodNutritionInfo(recommendFood)
  res.status(200).json({ foodNutritionInfo })
}

const updateFoodPreference = async (req, res) => {
  const { id: userId } = req.user
  const foodId = req.query.id
  const { clickedBtn } = req.body
  // console.log(userId, foodId, clickedBtn)
  await Food.updateFoodPreference(userId, foodId, clickedBtn)
  res.status(200).json({ message: 'Preference score updated successfully.' })
}

module.exports = {
  addMealRecord,
  updateMealRecord,
  deleteMealRecord,
  getDiaryRecord,
  getFoodDetail,
  createFoodDetail,
  generateSingleMeal,
  getFoodFromKeyword,
  getFoodTrend,
  getUserRecommendation,
  generateMultipleMeals,
  updateFoodPreference
}
