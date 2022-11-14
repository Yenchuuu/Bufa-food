const db = require('../utils/mysqlconf')

const createMealRecord = async (userId, foodId, mealInfo) => {
  const [result] = await db.execute('INSERT INTO `user_meal` (user_id, food_id, meal, serving_amount, date_record) VALUES (?, ?, ?, ?)', [userId, foodId, mealInfo])
  return result
}

const getUserRecord = async (userId, date) => {
  const [mealRecords] = await db.execute(
    'SELECT user_meal.meal, food.id AS food_id, food.name, user_meal.serving_amount, (food.calories * serving_amount) AS calories, (food.carbs * serving_amount) AS carbs, (food.protein * serving_amount) AS protein, (food.fat * serving_amount) AS fat FROM `food` INNER JOIN `user_meal` ON user_meal.food_id = food.id WHERE user_id = (?) AND date_record = (?);',
    [userId, date]
  )
  // console.log('mealRecords', mealRecords)
  return mealRecords
}

const getFoodDetail = async (foodId) => {
  const [result] = await db.execute('SELECT id, name, per_serving, calories, carbs, protein, fat FROM `food` WHERE id = ?', [foodId])
  return result
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
/* 選出所有recommend食物，排除該使用者不喜歡的食物 */
const getRecommendMultipleMeals = async (currentUserId) => {
  const multipleMealsQuery =
    'SELECT name, per_serving, calories, carbs, protein, fat, food_categories_id, recommend_categories_id FROM `food` WHERE food.recommend_categories_id BETWEEN 1 AND 4 AND id NOT IN (SELECT food_id FROM `user_preference` WHERE user_id = ? AND (preference IN (1, 2)))'
  const [recommendMealsList] = await db.execute(multipleMealsQuery, [currentUserId])
  // console.log('recommendMealsList', recommendMealsList)
  return recommendMealsList
}

const getFoodFromSearchbox = async (keyword) => {
  const [searchFood] = await db.query(
    `SELECT id, name FROM food WHERE name LIKE '%${keyword}%' LIMIT 7`
  )
  // console.log('searchFoodM', searchFood)
  return searchFood
}

const getFoodTrend = async (periodStart, periodEnd) => {
  const [trendFood] = await db.execute(
    'SELECT food_id, COUNT(food_id), food.name FROM `user_meal` INNER JOIN `food` ON user_meal.food_id = food.id WHERE `date_record` BETWEEN ? AND ? GROUP BY `food_id` LIMIT 5;',
    [periodStart, periodEnd]
  )
  return trendFood
}

/* 比較使用者之喜好分數計算歐式距離 */
const getCurrentUserPreference = async (currentUserId) => {
  const [currentUser] = await db.execute(
    'SELECT food_id, preference FROM `user_preference` WHERE user_id = ? AND preference NOT IN (1, 2)',
    [currentUserId]
  )
  return currentUser
}

const getOtherUsersList = async (currentUserId) => {
  const [otherUsers] = await db.execute(
    'SELECT DISTINCT(user_id) FROM `user_preference` WHERE user_id != (?) AND preference NOT IN (1, 2);',
    [currentUserId]
  )
  return otherUsers
}

const getAllUserRecords = async (currentUserId) => {
  const [allRecords] = await db.execute(
    'SELECT user_preference.user_id, user_preference.preference, food.id AS food_id, food.name AS food_name FROM `user_preference` INNER JOIN `food` ON user_preference.food_id = food.id WHERE user_id != (?) AND preference NOT IN (1, 2);',
    [currentUserId]
  )
  return allRecords
}

const getDistinctFoodList = async (currentUserId) => {
  const [distinctFood] = await db.execute(
    'SELECT DISTINCT(food.id) AS food_id, food.name AS food_name FROM `user_preference` INNER JOIN `food` ON user_preference.food_id = food.id WHERE user_id != (?);',
    [currentUserId]
  )
  return distinctFood
}

const getFoodNutritionInfo = async (recommendFood) => {
  const [foodNutritionInfo] = await db.execute('SELECT id, name, calories, carbs, protein, fat FROM `food` WHERE id IN (?, ?, ?)', [recommendFood[0], recommendFood[1], recommendFood[2]])
  return foodNutritionInfo
}

const updateFoodPreference = async (userId, foodId, clickedBtn) => {
  const conn = await db.getConnection()
  try {
    await conn.query('START TRANSACTION')
    const [getUserPreference] = await conn.execute('SELECT * FROM `user_preference` WHERE food_id = ? AND user_id = ?', [foodId, userId])
    console.log('getUserPreference', getUserPreference)

    // const score = { collection: 16, likeIt: 8, createdIt: 4, dislikeIt: 2, exclusion: 1 }
    let preferenceScore

    const condition = { sql: '', binding: [] }
    if (clickedBtn === 'add_collection') {
      /* 如果尚未對此食物表達過喜好，則建立 */
      if (getUserPreference.length === 0) {
        preferenceScore = 16
        const [result] = await conn.query('INSERT INTO `user_preference` (preference, collection, likeIt, createdIt, dislikeIt, exclusion, food_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [preferenceScore, 1, 0, 0, 0, 0, foodId, userId])
        await conn.query('COMMIT')
        return result
      }
      if (getUserPreference[0].collection === 1) {
        preferenceScore = getUserPreference[0].preference - 16
        condition.sql = 'SET preference = ?, collection = 0 WHERE food_id = ? AND user_id = ?;'
      } else {
        preferenceScore = getUserPreference[0].preference + 16
        condition.sql = 'SET preference = ?, collection = 1 WHERE food_id = ? AND user_id = ?;'
      }
    } else if (clickedBtn === 'thumb_up') {
      if (getUserPreference.length === 0) {
        preferenceScore = 8
        const [result] = await conn.query('INSERT INTO `user_preference` (preference, collection, likeIt, createdIt, dislikeIt, exclusion, food_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [preferenceScore, 0, 1, 0, 0, 0, foodId, userId])
        await conn.query('COMMIT')
        return result
      }
      if (getUserPreference[0].likeIt === 1) {
        preferenceScore = getUserPreference[0].preference - 8
        condition.sql = 'SET preference = ?, likeIt = 0 WHERE food_id = ? AND user_id = ?;'
      } else if (getUserPreference[0].likeIt === 0 && getUserPreference[0].dislikeIt === 1 &&  getUserPreference[0].exclusion === 1) {
        /* 因為喜歡、不喜歡、不吃是獨立事件，第一項與後兩項只能有一個是1 */
        preferenceScore = getUserPreference[0].preference + 5
        condition.sql = 'SET preference = ?, likeIt = 1, dislike = 0, exclusion = 0 WHERE food_id = ? AND user_id = ?;'
      } else if (getUserPreference[0].likeIt === 0 && getUserPreference[0].dislikeIt === 1) {
        /* 因為喜歡、不喜歡、不吃是獨立事件，第一項與後兩項只能有一個是1 */
        preferenceScore = getUserPreference[0].preference + 6
        condition.sql = 'SET preference = ?, likeIt = 1, dislikeIt = 0 WHERE food_id = ? AND user_id = ?;'
      } else if (getUserPreference[0].likeIt === 0 && getUserPreference[0].exclusion === 1) {
        /* 因為喜歡、不喜歡、不吃是獨立事件，第一項與後兩項只能有一個是1 */
        preferenceScore = getUserPreference[0].preference + 7
        condition.sql = 'SET preference = ?, likeIt = 1, exclusion = 0 WHERE food_id = ? AND user_id = ?;'
      } else {
        preferenceScore = getUserPreference[0].preference + 8
        condition.sql = 'SET preference = ?, likeIt = 1 WHERE food_id = ? AND user_id = ?;'
      }
    } else if (clickedBtn === 'thumb_down') {
      if (getUserPreference.length === 0) {
        preferenceScore = 2
        const [result] = await conn.query('INSERT INTO `user_preference` (preference, collection, likeIt, createdIt, dislikeIt, exclusion, food_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [preferenceScore, 0, 0, 0, 1, 0, foodId, userId])
        await conn.query('COMMIT')
        return result
      }
      if (getUserPreference[0].dislikeIt === 1) {
        preferenceScore = getUserPreference[0].preference - 2
        condition.sql = 'SET preference = ?, dislikeIt = 0 WHERE food_id = ? AND user_id = ?;'
      } else if (getUserPreference[0].dislikeIt === 0 && getUserPreference[0].likeIt === 1) {
        /* 因為喜歡、不喜歡是獨立事件，兩者只能有一個是1 */
        preferenceScore = getUserPreference[0].preference - 6
        condition.sql = 'SET preference = ?, dislikeIt = 1, likeIt = 0 WHERE food_id = ? AND user_id = ?;'
      } else {
        preferenceScore = getUserPreference[0].preference + 2
        condition.sql = 'SET preference = ?, dislikeIt = 1 WHERE food_id = ? AND user_id = ?;'
      }
      // TODO: 目前還沒有可以加入挑食項目的按鈕
    } else if (clickedBtn === 'add_exclusiion') {
      if (getUserPreference.length === 0) {
        preferenceScore = 1
        const [result] = await conn.query('INSERT INTO `user_preference` (preference, collection, likeIt, createdIt, dislikeIt, exclusion, food_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [preferenceScore, 0, 0, 0, 0, 1, foodId, userId])
        await conn.query('COMMIT')
        return result
      }
      if (getUserPreference[0].exclusion === 1) {
        preferenceScore = getUserPreference[0].preference - 1
        condition.sql = 'SET preference = ?, exclusion = 0 WHERE food_id = ? AND user_id = ?;'
      } else if (getUserPreference[0].exclusion === 0 && getUserPreference[0].likeIt === 1) {
        /* 因為喜歡、不吃是獨立事件，兩者只能有一個是1 */
        preferenceScore = getUserPreference[0].preference - 7
        condition.sql = 'SET preference = ?, exclusion = 1, likeIt = 0 WHERE food_id = ? AND user_id = ?;'
      } else {
        preferenceScore = getUserPreference[0].preference - 1
        condition.sql = 'SET preference = ?, exclusion = 1 WHERE food_id = ? AND user_id = ?;'
      }
    }
    condition.binding = [preferenceScore, foodId, userId]
    // console.log('preferenceScore', preferenceScore)
    const recommendMealQuery =
      'UPDATE `user_preference` ' + condition.sql
    const [result] = await db.query(recommendMealQuery, condition.binding)
    await conn.query('COMMIT')
    return result
  } catch (err) {
    await conn.query('ROLLBACK')
    console.error(err)
    process.exit()
  } finally {
    await conn.release()
  }
}

module.exports = {
  createMealRecord,
  getUserRecord,
  getFoodDetail,
  getRecommendSingleMeal,
  getRecommendMultipleMeals,
  getFoodFromSearchbox,
  getFoodTrend,
  getCurrentUserPreference,
  getOtherUsersList,
  getAllUserRecords,
  getDistinctFoodList,
  getFoodNutritionInfo,
  updateFoodPreference
}
