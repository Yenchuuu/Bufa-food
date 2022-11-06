const Food = require('../model/food_model')
const Euc = require('../utils/euclidean_distance')

const getDiaryRecord = async (req, res) => {
  const { userId, dateToday } = req.body
  const mealRecords = await Food.getUserRecord(userId, dateToday)
  res.json({ mealRecords })
}

const generateAMeal = async (req, res) => {
  const { target, meal, value } = req.body
  const recommendMealList = await Food.getRecommendMeal(target, value)
  const len = recommendMealList.length
  const recommendMeal = []
  switch (target) {
    case 'calories': {
      const carbsList = recommendMealList.filter(e => e.recommend_categories_id === 1)
      const carbs = carbsList[Math.floor(Math.random() * carbsList.length)]
      recommendMeal.push(carbs)
      const ProteinList = recommendMealList.filter(e => e.recommend_categories_id === 2)
      const protein = ProteinList[Math.floor(Math.random() * ProteinList.length)]
      recommendMeal.push(protein)
      const vegList = recommendMealList.filter(e => e.recommend_categories_id === 4)
      const veg = vegList[Math.floor(Math.random() * vegList.length)]
      recommendMeal.push(veg)
      const fatList = recommendMealList.filter(e => e.recommend_categories_id === 3)
      const fat = fatList[Math.floor(Math.random() * fatList.length)]
      console.log('nutrition', recommendMeal)
      const remainCalories = value - (carbs.calories + protein.calories + veg.calories)
      const servingOfFat = Math.round(remainCalories / fat.calories * 100)
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
  generateAMeal,
  getFoodFromKeyword,
  getFoodTrend,
  getUserRecommendation
}
