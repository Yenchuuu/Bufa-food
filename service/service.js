const model = require('../model/food_model')

function calculateNutritionOfServingAmount(nutrition, servingAmout, perServing) {
  nutrition.per_serving = servingAmout
  nutrition.calories = Math.round(nutrition.calories * (servingAmout / perServing))
  nutrition.carbs = Math.round(nutrition.carbs * servingAmout / perServing)
  nutrition.protein = Math.round(nutrition.protein * servingAmout / perServing)
  nutrition.fat = Math.round(nutrition.fat * servingAmout / perServing)
  return nutrition
}

function pushRecord(records, object) {
  if (object === undefined) {
    records.calories.push(0)
    records.carbs.push(0)
    records.protein.push(0)
    records.fat.push(0)
  } else {
    records.calories.push(parseInt(object.calories))
    records.carbs.push(parseInt(object.carbs))
    records.protein.push(parseInt(object.protein))
    records.fat.push(parseInt(object.fat))
  }
  return records
}

function calculateBMR(gender, weight, height, age) {
  switch (gender) {
    case 1: {
      const BMR = Math.round(10 * weight + 6.25 * height - 5 * age - 161)
      return BMR
    }
    case 2: {
      const BMR = Math.round(10 * weight + 6.25 * height - 5 * age + 5)
      return BMR
    }
  }
}

function calculateTDEE(activityLevel, BMR) {
  switch (activityLevel) {
    case 1: {
      const TDEE = Math.round(1.2 * BMR)
      return TDEE
    }
    case 2: {
      const TDEE = Math.round(1.375 * BMR)
      return TDEE
    }
    case 3: {
      const TDEE = Math.round(1.55 * BMR)
      return TDEE
    }
    case 4: {
      const TDEE = Math.round(1.725 * BMR)
      return TDEE
    }
    case 5: {
      const TDEE = Math.round(1.9 * BMR)
      return TDEE
    }
  }
}

function calculateDefaultNutritionByDietGoal(dietGoal, TDEE) {
  switch (dietGoal) {
    case 1: {
      const nutrition = calculateDefaultNutrition(0.85, 0.35, 0.4, 0.25, TDEE)
      return nutrition
    }
    case 2: {
      const nutrition = calculateDefaultNutrition(1, 0.35, 0.4, 0.25, TDEE)
      return nutrition
    }
    case 3: {
      const nutrition = calculateDefaultNutrition(1.15, 0.45, 0.3, 0.25, TDEE)
      return nutrition
    }
  }
}

function calculateDefaultNutrition(caloriesPercentage, carbsPercentage, proteinPercentage, fatPercentage, TDEE) {
  const goalCalories = Math.round(caloriesPercentage * TDEE)
  const goalCarbs = Math.round((goalCalories * carbsPercentage) / 4)
  const goalProtein = Math.round((goalCalories * proteinPercentage) / 4)
  const goalFat = Math.round((goalCalories * fatPercentage) / 9)
  return { goalCalories, goalCarbs, goalProtein, goalFat }
}

async function calculateUserPreference(conn, userId, foodId, clickedBtn) {
  const userPreference = await model.getUserPreference(conn, foodId, userId)

  const score = { collection: 16, likeIt: 8, createdIt: 4, dislikeIt: 2, exclusion: 1 }
  let preferenceScore

  if (clickedBtn === 'add_collection') {
    /* 如果尚未對此食物表達過喜好，則建立 */
    if (userPreference === null) {
      preferenceScore = score.collection
      model.insertUserPreference(conn, userId, foodId, preferenceScore, 1, 0, 0, 0, 0)
      return
    }
    if (userPreference.collection === 1) {
      preferenceScore = userPreference.preference - score.collection
      model.updateUserPreference(conn, userId, foodId, preferenceScore, 0, userPreference.likeIt, userPreference.createdIt, userPreference.dislikeIt, userPreference.exclusion)
    } else {
      preferenceScore = userPreference.preference + score.collection
      model.updateUserPreference(conn, userId, foodId, preferenceScore, 1, userPreference.likeIt, userPreference.createdIt, userPreference.dislikeIt, userPreference.exclusion)
    }
  } else if (clickedBtn === 'thumb_up') {
    if (userPreference === null) {
      preferenceScore = score.likeIt
      model.insertUserPreference(conn, userId, foodId, preferenceScore, 0, 1, 0, 0, 0)
      return
    }
    if (userPreference.likeIt === 1) {
      preferenceScore = userPreference.preference - score.likeIt
      model.updateUserPreference(conn, userId, foodId, preferenceScore, userPreference.collection, 0, userPreference.createdIt, userPreference.dislikeIt, userPreference.exclusion)
    } else if (userPreference.likeIt === 0 && userPreference.dislikeIt === 1 && userPreference.exclusion === 1) {
      /* 因為喜歡、不喜歡、不吃是獨立事件，第一項與後兩項只能有一個是1 */
      preferenceScore = userPreference.preference + (score.likeIt - score.dislikeIt - score.exclusion)
      model.updateUserPreference(conn, userId, foodId, preferenceScore, userPreference.collection, 1, userPreference.createdIt, 0, 0)
    } else if (userPreference.likeIt === 0 && userPreference.dislikeIt === 1) {
      /* 因為喜歡、不喜歡、不吃是獨立事件，第一項與後兩項只能有一個是1 */
      preferenceScore = userPreference.preference + (score.likeIt - score.dislikeIt)
      model.updateUserPreference(conn, userId, foodId, preferenceScore, userPreference.collection, 1, userPreference.createdIt, 0, userPreference.exclusion)

    } else if (userPreference.likeIt === 0 && userPreference.exclusion === 1) {
      /* 因為喜歡、不喜歡、不吃是獨立事件，第一項與後兩項只能有一個是1 */
      preferenceScore = userPreference.preference + (score.likeIt - score.exclusion)
      model.updateUserPreference(conn, userId, foodId, preferenceScore, userPreference.collection, 1, userPreference.createdIt, userPreference.dislikeIt, 0)
    } else {
      preferenceScore = userPreference.preference + score.likeIt
      model.updateUserPreference(conn, userId, foodId, preferenceScore, userPreference.collection, 1, userPreference.createdIt, userPreference.dislikeIt, userPreference.exclusion)
    }
  } else if (clickedBtn === 'thumb_down') {
    if (userPreference === null) {
      preferenceScore = score.dislikeIt
      model.insertUserPreference(conn, userId, foodId, preferenceScore, 0, 0, 0, 1, 0)
      return
    }
    if (userPreference.dislikeIt === 1) {
      preferenceScore = userPreference.preference - score.dislikeIt
      model.updateUserPreference(conn, userId, foodId, preferenceScore, userPreference.collection, userPreference.likeIt, userPreference.createdIt, 0, userPreference.exclusion)
    } else if (userPreference.dislikeIt === 0 && userPreference.likeIt === 1) {
      /* 因為喜歡、不喜歡是獨立事件，兩者只能有一個是1 */
      preferenceScore = userPreference.preference - (score.likeIt - score.dislikeIt)
      model.updateUserPreference(conn, userId, foodId, preferenceScore, userPreference.collection, 0, userPreference.createdIt, 1, userPreference.exclusion)
    } else {
      preferenceScore = userPreference.preference + score.dislikeIt
      model.updateUserPreference(conn, userId, foodId, preferenceScore, userPreference.collection, userPreference.likeIt, userPreference.createdIt, 1, userPreference.exclusion)
    }
  } else if (clickedBtn === 'add_exclusiion') {
    if (userPreference === null) {
      preferenceScore = score.exclusion
      model.insertUserPreference(conn, userId, foodId, preferenceScore, 0, 0, 0, 0, 1)
      return
    }
    if (userPreference.exclusion === 1) {
      preferenceScore = userPreference.preference - score.exclusion
      model.updateUserPreference(conn, userId, foodId, preferenceScore, userPreference.collection, userPreference.likeIt, userPreference.createdIt, userPreference.dislikeIt, 0)
    } else if (userPreference.exclusion === 0 && userPreference.likeIt === 1) {
      /* 因為喜歡、不吃是獨立事件，兩者只能有一個是1 */
      preferenceScore = userPreference.preference - (score.likeIt - score.exclusion)
      model.updateUserPreference(conn, userId, foodId, preferenceScore, userPreference.collection, 0, userPreference.createdIt, userPreference.dislikeIt, 1)
    } else {
      preferenceScore = userPreference.preference + score.exclusion
      model.updateUserPreference(conn, userId, foodId, preferenceScore, userPreference.collection, userPreference.likeIt, userPreference.createdIt, userPreference.dislikeIt, 1)
    }
  }
}

module.exports = { calculateNutritionOfServingAmount, pushRecord, calculateBMR, calculateTDEE, calculateDefaultNutrition, calculateDefaultNutritionByDietGoal, calculateUserPreference }
