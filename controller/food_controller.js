const Food = require('../model/food_model')
const User = require('../model/user_model')
const Euc = require('../utils/euclidean_distance')

const getDiaryRecord = async (req, res) => {
  const { userId, dateToday } = req.body
  const mealRecords = await Food.getUserRecord(userId, dateToday)
  res.json({ mealRecords })
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
      const remainCalories =
        value - (carbs.calories + protein.calories + veg.calories)
      const servingOfFat = Math.round((remainCalories / fat.calories) * 100)
      fat.per_serving = servingOfFat
      fat.calories = remainCalories
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
  // TODO: 目前先以亂數模擬登入之使用者，後續應改用解析jwt token辨識user_id
  const currentUserId = Math.floor(Math.random() * 15) + 1
  console.log('currentUserId', currentUserId)
  const userInfo = await User.getUserInfo(currentUserId)
  // console.log('userInfo', userInfo)
  const [{ diet_goal: dietGoal, goal_calories: goalCalories, goal_carbs: goalCarbs, goal_protein: goalProtein, goal_fat: goalFat }] = userInfo
  
  const multipleMealsList = await Food.getRecommendMultipleMeals(currentUserId)
  /* recommendmeal 1~3 分別為早中晚三餐，點心則不在推薦範圍內 */
  const recommendMeal1 = []
  const recommendMeal2 = []
  const recommendMeal3 = []

  /* 將每種營養素的array都隨機排序，隨後取出前兩樣 -> 達到不重複且不會每次都取到一樣的前兩項 */
  const shuffleArray = (arr) => arr.sort(() => 0.5 - Math.random())

  /* 定義每餐各種營養素之熱量佔比，並確認其營養素是否符合目標 */
  const carbsCalories = goalCarbs * 4
  const suffleCarbsArray = shuffleArray(multipleMealsList.filter(
    (e) => e.recommend_categories_id === 1
  ))
  // console.log('suffleCarbsArray', suffleCarbsArray)

  /* 早餐推薦水果 */
  const suffleDrinkArray = shuffleArray(multipleMealsList.filter(
    (e) => e.food_categories_id === 2
  ))
  recommendMeal1.push(suffleDrinkArray.pop())
  
  /* 隨機取出兩項澱粉，計算其熱量與分配之熱量比例，推算應攝取幾份 */
  const carbsCaloriesMeal2 = Math.round(carbsCalories * 0.45)
  const carbsOne = suffleCarbsArray.pop()
  const carbsTwo = suffleCarbsArray.pop()
  const servingAmountC1 = Math.round(carbsCaloriesMeal2 / carbsOne.calories * 100)
  carbsOne.per_serving = servingAmountC1
  carbsOne.calories = carbsCaloriesMeal2
  carbsOne.carbs = Math.round(carbsOne.carbs * (servingAmountC1 / 100))
  carbsOne.protein = Math.round(carbsOne.protein * (servingAmountC1 / 100))
  carbsOne.fat = Math.round(carbsOne.fat * (servingAmountC1 / 100))

  recommendMeal2.push(carbsOne)

  const carbsCaloriesMeal3 = Math.round(carbsCalories * 0.45)
  const servingAmountC2 = Math.round(carbsCaloriesMeal3 / carbsTwo.calories * 100)
  carbsTwo.per_serving = servingAmountC2
  carbsTwo.calories = carbsCaloriesMeal3
  carbsTwo.carbs = Math.round(carbsTwo.carbs * servingAmountC2 / 100)
  carbsTwo.protein = Math.round(carbsTwo.protein * servingAmountC2 / 100)
  carbsTwo.fat = Math.round(carbsTwo.fat * servingAmountC2 / 100)

  recommendMeal3.push(carbsTwo)

  const proteinCalories = goalProtein * 4
  const suffleProteinArray = shuffleArray(multipleMealsList.filter(
    (e) => e.recommend_categories_id === 2
  ))
  // console.log('suffleProteinArray', suffleProteinArray)

  /* 隨機取出兩項蛋白質，計算其熱量與分配之熱量比例，推算應攝取幾份 */
  // const proteinCaloriesMeal2 = Math.round(proteinCalories * 0.45)
  const proteinPortionMeal2 = Math.round(goalProtein * 0.45)
  const proteinOne = suffleProteinArray.pop()
  const proteinTwo = suffleProteinArray.pop()
  const servingAmountP1 = Math.round(proteinPortionMeal2 / proteinOne.protein * 100)
  proteinOne.per_serving = servingAmountP1
  proteinOne.calories = Math.round(proteinOne.calories * servingAmountP1 / 100)
  proteinOne.carbs = Math.round(proteinOne.carbs * servingAmountP1 / 100)
  proteinOne.protein = proteinPortionMeal2
  proteinOne.fat = Math.round(proteinOne.fat * servingAmountP1 / 100)

  recommendMeal2.push(proteinOne)

  // const proteinCaloriesMeal3 = Math.round(proteinCalories * 0.45)
  const proteinPortionMeal3 = Math.round(goalProtein * 0.45)
  const servingAmountP2 = Math.round(proteinPortionMeal3 / proteinTwo.protein * 100)
  proteinTwo.per_serving = servingAmountP2
  proteinTwo.calories = Math.round(proteinTwo.calories * (servingAmountP1 / 100))
  proteinTwo.carbs = Math.round(proteinTwo.carbs * (servingAmountP2 / 100))
  proteinTwo.protein = proteinPortionMeal3
  proteinTwo.fat = Math.round(proteinTwo.fat * (servingAmountP2 / 100))

  recommendMeal3.push(proteinTwo)

  const suffleVegArray = shuffleArray(multipleMealsList.filter(
    (e) => e.recommend_categories_id === 4
  ))
  const vegOne = suffleVegArray.slice(0, 2)
  const vegTwo = suffleVegArray.slice(2, 4)
  // console.log(vegOne, vegTwo)
  recommendMeal2.push(...vegOne)
  recommendMeal3.push(...vegTwo)

  /* 合計當天不包含脂肪之菜單總熱量與營養素 */
  const allMeals = [].concat(...recommendMeal1, ...recommendMeal2, ...recommendMeal3)
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

  // console.log('allMeals', allMeals)
  const fatList = multipleMealsList.filter(
    (e) => e.recommend_categories_id === 3
  )

  const fat = fatList[Math.floor(Math.random() * fatList.length)]

  const remainCalories = goalCalories - caloriesTotal
  const servingOfFat = Math.round((remainCalories / fat.calories) * 100)
  fat.per_serving = servingOfFat
  fat.calories = remainCalories
  fat.carbs = Math.round(fat.carbs * (servingOfFat / 100))
  fat.protein = Math.round(fat.protein * (servingOfFat / 100))
  fat.fat = Math.round(fat.fat * (servingOfFat / 100))
  recommendMeal2.push(fat)

  console.log(goalCarbs, carbsTotal, goalProtein, proteinTotal, goalFat, fatTotal, goalCalories, caloriesTotal)

  res.json({ recommendMeal1, recommendMeal2, recommendMeal3 })
}

const getFoodFromKeyword = async (req, res) => {
  const key = req.query.key
  const searchFood = await Food.getFoodFromSearchbox(key)
  // console.log('searchFoodC', searchFood)
  res.send(searchFood)
}

const getFoodTrend = async (req, res) => {
  /* 設定撈取熱門食物之區間 */
  const startDate = new Date()
  const endDate = new Date()
  const periodStart = new Date(startDate.setDate(startDate.getDate() - 7))
    .toISOString()
    .split('T')[0]
  const periodEnd = endDate.toISOString().split('T')[0]
  const trendFoodInfo = await Food.getFoodTrend(periodStart, periodEnd)
  const trendFood = trendFoodInfo.map((e) => e.name)
  // console.log('trendFood', trendFood)
  res.json({ trendFood })
}

const getUserRecommendation = async (req, res) => {
  // TODO: 目前先以亂數模擬登入之使用者，後續應改用解析jwt token辨識user_id
  const currentUserId = Math.floor(Math.random() * 15) + 1
  const recommendFood = await Euc.getUserPreference(currentUserId)
  res.json({ recommendFood })
}

module.exports = {
  getDiaryRecord,
  generateSingleMeal,
  getFoodFromKeyword,
  getFoodTrend,
  getUserRecommendation,
  generateMultipleMeals
}
