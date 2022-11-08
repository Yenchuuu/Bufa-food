const db = require('../utils/mysqlconf')

const getUserRecord = async (userId, dateToday) => {
  const [mealRecords] = await db.execute(
    'SELECT user_meal.meal, food.id AS food_id, food.name, user_meal.serving_amount, food.calories, food.carbs, food.protein, food.fat FROM `food` INNER JOIN `user_meal` ON user_meal.food_id = food.id WHERE user_id = (?) AND date_record = (?);',
    [userId, dateToday]
  )
  // console.log('mealRecords', mealRecords)
  return mealRecords
}

const getRecommendSingleMeal = async (target, value) => {
  const condition = { sql: '', binding: [] }
  if (target === 'calories') {
    condition.sql =
      'WHERE (recommend_categories_id = 5 AND calories BETWEEN ? AND ?) OR (recommend_categories_id = 1 AND calories BETWEEN ? AND ?) OR (recommend_categories_id = 2 AND calories BETWEEN ? AND ?) OR (recommend_categories_id = 3) OR (recommend_categories_id = 4);'
    condition.binding = [value - 30, value + 30, (value * 0.35) - 30, (value * 0.35) + 30, (value * 0.40) - 30, (value * 0.40) + 30]
  } else if (target === 'carbs') {
    condition.sql =
      'WHERE recommend_categories_id = 1 AND carbs BETWEEN ? AND ?'
    condition.binding = [value - 5, value + 5]
  } else if (target === 'protein') {
    condition.sql =
      'WHERE recommend_categories_id = 2 AND protein BETWEEN ? AND ?'
    condition.binding = [value - 5, value + 5]
  } else if (target === 'fat') {
    condition.sql = 'WHERE recommend_categories_id = 3 AND fat BETWEEN ? AND ?'
    condition.binding = [value - 5, value + 5]
  }
  const recommendMealQuery =
    'SELECT name, per_serving, calories, carbs, protein, fat, recommend_categories_id FROM `food`' + condition.sql
  const [recommendMealList] = await db.execute(
    recommendMealQuery,
    condition.binding
  )
  // console.log('recommendMealList', recommendMealList)
  return recommendMealList
}

const getRecommendMultipleMeals = async () => {
  const multipleMealsQuery =
    'SELECT name, per_serving, calories, carbs, protein, fat, food_categories_id, recommend_categories_id FROM `food` WHERE recommend_categories_id BETWEEN 1 AND 4'
  const [recommendMealsList] = await db.execute(multipleMealsQuery)
  // console.log('recommendMealsList', recommendMealsList)
  return recommendMealsList
}

const getFoodFromSearchbox = async (keyword) => {
  const [searchFood] = await db.query(
    `SELECT name FROM food WHERE name LIKE '%${keyword}%' LIMIT 7`
  )
  // console.log('searchFoodM', searchFood)
  return searchFood
}

const getFoodTrend = async (periodStart, periodEnd) => {
  const [trendFood] = await db.execute(
    'SELECT food_id, COUNT(food_id), food.name FROM `user_meal` INNER JOIN `food` ON user_meal.food_id = food.id WHERE `date_record` BETWEEN ? AND ? GROUP BY `food_id` LIMIT 5;',
    [periodStart, periodEnd]
  )
  console.log('trendFood', trendFood)
  return trendFood
}

/* 比較使用者之喜好分數計算歐式距離 */
const getCurrentUserPreference = async (currentUserId) => {
  const [currentUser] = await db.execute(
    'SELECT food_id, preference FROM `user_preference` WHERE user_id = ?',
    [currentUserId]
  )
  return currentUser
}

const getOtherUsersPreference = async (currentUserId) => {
  const [otherUsers] = await db.execute(
    'SELECT DISTINCT(user_id) FROM `user_preference` WHERE user_id != (?);',
    [currentUserId]
  )
  return otherUsers
}

const getAllUserRecords = async (currentUserId) => {
  const [allRecords] = await db.execute(
    'SELECT user_preference.user_id, user_preference.preference, food.id AS food_id, food.name AS food_name FROM `user_preference` INNER JOIN `food` ON user_preference.food_id = food.id WHERE user_id != (?);',
    [currentUserId]
  )
  return allRecords
}

module.exports = {
  getUserRecord,
  getRecommendSingleMeal,
  getRecommendMultipleMeals,
  getFoodFromSearchbox,
  getFoodTrend,
  getCurrentUserPreference,
  getOtherUsersPreference,
  getAllUserRecords
}
