// 測試 function

describe('test function calculateNutritionOfServingAmount', () => {
  test('calculateNutritionOfServingAmount', () => {
    let carbs = {
      per_serving: 90,
      calories: 300,
      carbs: 50,
      protein: 20,
      fat: 2
    }
    let output = {
      per_serving: 180,
      calories: 600,
      carbs: 100,
      protein: 40,
      fat: 4
    }
    expect(calculateNutritionOfServingAmount(carbs, 180, carbs.per_serving)).toEqual(output)
  })
})

const { calculateNutritionOfServingAmount, pushRecord, calculateBMR, calculateTDEE, calculateDefaultNutrition, calculateDefaultNutritionByDietGoal } = require('../service/service')

describe('test function pushRecord', () => {
  test('pushRecord array should be 0', () => {
    const records = {
      calories: [],
      carbs: [],
      protein: [],
      fat: []
    }
    const object = undefined
    expect(pushRecord(records, object)).toEqual({
      calories: [0],
      carbs: [0],
      protein: [0],
      fat: [0]
    })
  })
  test('pushRecord array should not be 0', () => {
    const records = {
      calories: [],
      carbs: [],
      protein: [],
      fat: []
    }
    const object = {
      calories: 300,
      carbs: 30,
      protein: 20,
      fat: 10
    }
    expect(pushRecord(records, object)).toEqual({
      calories: [300],
      carbs: [30],
      protein: [20],
      fat: [10]
    })
  })
})

describe('test function calculateBMR', () => {
  test('same weight, hright and age but female', () => {
    expect(calculateBMR(1, 60, 170, 26)).toBe(1372)
  })
  test('same weight, hright and age but male', () => {
    expect(calculateBMR(2, 60, 170, 26)).toBe(1538)
  })
})

describe('test function calculateTDEE', () => {
  test('TDEE should be 1.2 time of BMR', () => {
    expect(calculateTDEE(1, 1600)).toBe(1920)
  })
  test('TDEE should be 1.375 time of BMR', () => {
    expect(calculateTDEE(2, 1600)).toBe(2200)
  })
  test('TDEE should be 1.55 time of BMR', () => {
    expect(calculateTDEE(3, 1600)).toBe(2480)
  })
  test('TDEE should be 1.725 time of BMR', () => {
    expect(calculateTDEE(4, 1600)).toBe(2760)
  })
  test('TDEE should be 1.9 time of BMR', () => {
    expect(calculateTDEE(5, 1600)).toBe(3040)
  })
})

describe('test function calculateDefaultNutrition', () => {
  test('TDEE should be 85 percent', () => {
    expect(calculateDefaultNutritionByDietGoal(1, 1800)).toEqual({
      goalCalories: 1530,
      goalCarbs: 134,
      goalProtein: 153,
      goalFat: 43
    })
  })
  test('TDEE should remain the same', () => {
    expect(calculateDefaultNutritionByDietGoal(2, 1800)).toEqual({
      goalCalories: 1800,
      goalCarbs: 158,
      goalProtein: 180,
      goalFat: 50
    })
  })
  test('TDEE should be 1.15 time', () => {
    expect(calculateDefaultNutritionByDietGoal(3, 1800)).toEqual({
      goalCalories: 2070,
      goalCarbs: 233,
      goalProtein: 155,
      goalFat: 58
    })
  })
})

describe('test function calculateDefaultNutrition', () => {
  test('calculateDefaultNutrition', () => {
    expect(calculateDefaultNutrition(0.85, 0.35, 0.4, 0.25, 1440)).toEqual({
      goalCalories: 1224,
      goalCarbs: 107,
      goalProtein: 122,
      goalFat: 34
    })
    expect(calculateDefaultNutrition(1, 0.35, 0.4, 0.25, 1440)).toEqual({
      goalCalories: 1440,
      goalCarbs: 126,
      goalProtein: 144,
      goalFat: 40
    })
    expect(calculateDefaultNutrition(1.15, 0.45, 0.3, 0.25, 1440)).toEqual({
      goalCalories: 1656,
      goalCarbs: 186,
      goalProtein: 124,
      goalFat: 46
    })
  })
})

const { dateOfToday, isValidDate } = require('../utils/util')

describe('test function dateOfToday', () => {
  test('date of today should be today', () => {
    let today = new Date()
    today = today.toISOString().split('T')[0]
    expect(dateOfToday).toBe(today)
  })
})

describe('test function isValidDate', () => {
  test('should be valid date', () => {
    const date = '12345'
    expect(isValidDate(date)).toBeFalsy()
    expect(isValidDate(date)).not.toBeTruthy()
  })
  test('should be valid date', () => {
    const date = '2022-12-06'
    expect(isValidDate(date)).toBeTruthy()
    expect(isValidDate(date)).not.toBeFalsy()
  })
})