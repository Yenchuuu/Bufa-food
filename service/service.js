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

module.exports = { calculateNutritionOfServingAmount, pushRecord, calculateBMR, calculateTDEE, calculateDefaultNutrition, calculateDefaultNutritionByDietGoal }
