const db = require('../utils/mysqlconf')
const { calculateUserPreference } = require('../service/service')

const createMealRecord = async (userId, foodId, meal, servingAmount, date) => {
  try {
    const [result] = await db.execute('INSERT INTO `user_meal` (user_id, food_id, meal, serving_amount, date_record) VALUES (?, ?, ?, ?, ?)', [userId, foodId, meal, servingAmount, date])
    return result
  } catch (err) {
    throw new Error(err)
  }
}

const updateMealRecord = async (userId, foodId, meal, servingAmount, date) => {
  try {
    const [result] = await db.execute('UPDATE `user_meal` SET serving_amount = ? WHERE user_id = ? AND food_id = ? AND meal = ?', [servingAmount, userId, foodId, meal])
    return result
  } catch (err) {
    throw new Error(err)
  }
}

const deleteMealRecord = async (recordId) => {
  try {
    const [result] = await db.execute('DELETE FROM `user_meal` WHERE id = ?', [recordId])
    return result
  } catch (err) {
    console.error(err)
    throw err
  }
}

const getUserRecord = async (userId, date) => {
  const conn = await db.getConnection()
  try {
    await conn.query('START TRANSACTION')
    const [mealRecords] = await conn.execute(
      'SELECT user_meal.id AS record_id, user_meal.meal, food.id AS food_id, food.name, user_meal.serving_amount, ROUND(food.per_serving * serving_amount, 0) AS amountTotal, ROUND(food.calories * serving_amount, 0) AS calories, ROUND(food.carbs * serving_amount, 0) AS carbs, ROUND(food.protein * serving_amount, 0) AS protein, ROUND(food.fat * serving_amount, 0) AS fat FROM `food` INNER JOIN `user_meal` ON user_meal.food_id = food.id WHERE user_id = (?) AND date_record = (?);',
      [userId, date])
    const [recordSummary] = await conn.execute('SELECT user_meal.meal, ROUND(SUM(food.calories * serving_amount), 0) AS caloriesTotal, ROUND(SUM(food.carbs * serving_amount), 0) AS carbsTotal, ROUND(SUM(food.protein * serving_amount), 0) AS proteinTotal, ROUND(SUM(food.fat * serving_amount), 0) AS fatTotal FROM `food` INNER JOIN `user_meal` ON user_meal.food_id = food.id WHERE user_id = (?) AND date_record = (?) GROUP BY user_meal.meal;', [userId, date])
    // console.log('mealRecords', mealRecords)
    await conn.query('COMMIT')
    return { mealRecords, recordSummary }
  } catch (err) {
    console.error(err)
    await conn.query('ROLL BACK')
    throw err
  } finally {
    await conn.release()
  }
}

const getFoodDetail = async (foodId) => {
  const [result] = await db.execute('SELECT id, name, per_serving, calories, carbs, protein, fat FROM `food` WHERE id = ?', [foodId])
  return result
}

const createFoodDetail = async (name, calories, carbs, protein, fat, perServing, userId) => {
  const conn = await db.getConnection()
  try {
    await conn.query('START TRANSACTION')
    const [food] = await conn.execute('INSERT INTO `food` (name, calories, carbs, protein, fat, per_serving, creator_user_id) VALUES (?, ?, ?, ?, ?, ?, ?)', [name, calories, carbs, protein, fat, perServing, userId])
    const foodId = food.insertId
    const [preference] = await conn.execute('INSERT INTO `user_preference` (preference, collection, likeIt, createdIt, dislikeIt, exclusion, food_id, user_id) VALUES (4, 0, 0, 1, 0, 0, ?, ?)', [foodId, userId])
    await conn.query('COMMIT')
    return preference
  } catch (err) {
    await conn.query('ROLLBACK')
    console.error(err)
    throw err
  } finally {
    await conn.release()
  }
}

const getRecommendSingleMeal = async (userId) => {
  try {
    const singleMealQuery = 'SELECT id, name, per_serving, calories, carbs, protein, fat, food_categories_id, recommend_categories_id FROM `food` WHERE food.recommend_categories_id BETWEEN 1 AND 4 AND id NOT IN (SELECT food_id FROM `user_preference` WHERE user_id = ? AND (preference IN (1, 2)))'
    const [recommendMealList] = await db.execute(
      singleMealQuery, [userId]
    )
    // console.log('recommendMealList', recommendMealList)
    return recommendMealList
  } catch (err) {
    throw new Error(err)
  }
}

const setRecommendSingleMeal = async (userId, meal, recommendMeal, date) => {
  // console.log('Info', userId, typeof meal, meal, recommendMeal, date)
  const conn = await db.getConnection()
  const writeRecommendMeals = []
  try {
    await conn.query('START TRANSACTION')
    for (let i = 0; i < recommendMeal.length; i++) {
      const [writeRecommendMeal] = await conn.query('INSERT INTO `user_meal` (user_id, meal, serving_amount, food_id, date_record) VALUES (?, ?, ?, ?, ?)', [userId, meal, recommendMeal[i].per_serving / 100, recommendMeal[i].id, date])
      writeRecommendMeals.push(writeRecommendMeal)
    }
    await conn.query('COMMIT')
    return writeRecommendMeals
  } catch (err) {
    await conn.query('ROLLBACK')
    throw new Error(err)
  } finally {
    await conn.release()
  }
}

const setRecommendMultipleMeals = async (userId, recommendBreakfast, recommendLunch, recommendDinner, date) => {
  // console.log('Info', userId, recommendBreakfast, recommendLunch, recommendDinner, date)
  const conn = await db.getConnection()
  try {
    await conn.query('START TRANSACTION')
    for (let i = 0; i < recommendBreakfast.length; i++) {
      await conn.query('INSERT INTO `user_meal` (user_id, meal, serving_amount, food_id, date_record) VALUES (?, ?, ?, ?, ?)', [userId, 1, recommendBreakfast[i].per_serving / 100, recommendBreakfast[i].id, date])
    }
    for (let i = 0; i < recommendLunch.length; i++) {
      await conn.query('INSERT INTO `user_meal` (user_id, meal, serving_amount, food_id, date_record) VALUES (?, ?, ?, ?, ?)', [userId, 2, recommendLunch[i].per_serving / 100, recommendLunch[i].id, date])
    }
    for (let i = 0; i < recommendDinner.length; i++) {
      await conn.query('INSERT INTO `user_meal` (user_id, meal, serving_amount, food_id, date_record) VALUES (?, ?, ?, ?, ?)', [userId, 3, recommendDinner[i].per_serving / 100, recommendDinner[i].id, date])
    }
    await conn.query('COMMIT')
    return
  } catch (err) {
    await conn.query('ROLLBACK')
    throw new Error(err)
  } finally {
    await conn.release()
  }
}

/* 選出所有recommend食物，排除該使用者不喜歡的食物 */
const getRecommendMultipleMeals = async (userId) => {
  try {
    const multipleMealsQuery =
      'SELECT id, name, per_serving, calories, carbs, protein, fat, food_categories_id, recommend_categories_id FROM `food` WHERE food.recommend_categories_id BETWEEN 1 AND 4 AND id NOT IN (SELECT food_id FROM `user_preference` WHERE user_id = ? AND (preference IN (1, 2)))'
    const [recommendMealsList] = await db.execute(multipleMealsQuery, [userId])
    // console.log('recommendMealsList', recommendMealsList)
    return recommendMealsList
  } catch (err) {
    throw new Error(err)
  }
}

const getFoodFromSearchbox = async (keyword) => {
  try {
    const [searchFood] = await db.query(
      `SELECT id, name FROM food WHERE name LIKE '%${keyword}%' LIMIT 7`
    )
    // console.log('searchFoodM', searchFood)
    return searchFood
  } catch (err) {
    throw new Error(err)
  }
}

const getFoodTrend = async (periodStart, periodEnd) => {
  try {
    const [trendFood] = await db.execute(
      'SELECT food_id, COUNT(food_id) AS counts, food.name FROM `user_meal` INNER JOIN `food` ON user_meal.food_id = food.id WHERE `date_record` BETWEEN ? AND ? GROUP BY `food_id` ORDER BY counts DESC LIMIT 5;',
      [periodStart, periodEnd]
    )
    return trendFood
  } catch (err) {
    throw new Error(err)
  }
}

/* 比較使用者之喜好分數計算歐式距離 */
const getCurrentUserPreference = async (currentUserId) => {
  try {
    const [currentUser] = await db.execute(
      'SELECT food_id, preference FROM `user_preference` WHERE user_id = ? AND preference NOT IN (1, 2)',
      [currentUserId]
    )
    return currentUser
  } catch (err) {
    throw new Error(err)
  }
}

const getOtherUsersList = async (currentUserId) => {
  try {
    const [otherUsers] = await db.execute(
      'SELECT DISTINCT(user_id) FROM `user_preference` WHERE user_id != (?) AND preference NOT IN (1, 2);',
      [currentUserId]
    )
    return otherUsers
  } catch (err) {
    throw new Error(err)
  }
}

const getAllUserRecords = async (currentUserId) => {
  try {
    const [allRecords] = await db.execute(
      'SELECT user_preference.user_id, user_preference.preference, food.id AS food_id, food.name AS food_name FROM `user_preference` INNER JOIN `food` ON user_preference.food_id = food.id WHERE user_id != (?) AND preference NOT IN (1, 2);',
      [currentUserId]
    )
    return allRecords
  } catch (err) {
    throw new Error(err)
  }
}

const getDistinctFoodList = async (currentUserId) => {
  try {
    const [distinctFood] = await db.execute(
      'SELECT DISTINCT(food.id) AS food_id, food.name AS food_name FROM `user_preference` INNER JOIN `food` ON user_preference.food_id = food.id WHERE user_id != (?);',
      [currentUserId]
    )
    return distinctFood
  } catch (err) {
    throw new Error(err)
  }
}

const getFoodNutritionInfo = async (recommendFood) => {
  try {
    const [foodNutritionInfo] = await db.execute('SELECT id, name, calories, carbs, protein, fat FROM `food` WHERE id IN (?, ?, ?)', [recommendFood[0], recommendFood[1], recommendFood[2]])
    return foodNutritionInfo
  } catch (err) {
    throw new Error(err)
  }
}

const updateFoodPreference = async (userId, foodId, clickedBtn) => {
  const conn = await db.getConnection()
  try {
    await conn.query('START TRANSACTION')
    calculateUserPreference(conn, userId, foodId, clickedBtn)
  } catch (err) {
    await conn.query('ROLLBACK')
    throw new Error(err)
  } finally {
    await conn.release()
  }
}

const getUserPreference = async (conn, foodId, userId) => {
  const [result] = await conn.execute('SELECT * FROM `user_preference` WHERE food_id = ? AND user_id = ?', [foodId, userId])
  if (result.length === 1) {
    return result[0]
  } else {
    return null
  }
}

const insertUserPreference = async (conn, userId, foodId, preferenceScore, collection, likeIt, createdIt, dislikeIt, exclusion) => {
  const [result] = await conn.query('INSERT INTO `user_preference` (preference, collection, likeIt, createdIt, dislikeIt, exclusion, food_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [preferenceScore, collection, likeIt, createdIt, dislikeIt, exclusion, foodId, userId])
  await conn.query('COMMIT')
  return result
}

const updateUserPreference = async (conn, userId, foodId, preferenceScore, collection, likeIt, createdIt, dislikeIt, exclusion) => {
  const [result] = await conn.query('UPDATE `user_preference` SET preference = ?, collection = ?, likeIt = ?, createdIt = ?, dislikeIt = ?, exclusion = ? WHERE food_id = ? AND user_id = ?;', [preferenceScore, collection, likeIt, createdIt, dislikeIt, exclusion, foodId, userId])
  await conn.query('COMMIT')
  return result
}

module.exports = {
  createMealRecord,
  updateMealRecord,
  deleteMealRecord,
  getUserRecord,
  getFoodDetail,
  createFoodDetail,
  getRecommendSingleMeal,
  setRecommendSingleMeal,
  getRecommendMultipleMeals,
  setRecommendMultipleMeals,
  getFoodFromSearchbox,
  getFoodTrend,
  getCurrentUserPreference,
  getOtherUsersList,
  getAllUserRecords,
  getDistinctFoodList,
  getFoodNutritionInfo,
  updateFoodPreference
}

exports.getUserPreference = getUserPreference
exports.insertUserPreference = insertUserPreference
exports.updateUserPreference = updateUserPreference