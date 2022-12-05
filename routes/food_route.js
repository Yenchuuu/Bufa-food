const express = require('express')
const router = express.Router()
const { wrapAsync, authentication } = require('../utils/util')
const { addMealRecord, updateMealRecord, deleteMealRecord, getDiaryRecord, generateSingleMeal, generateMultipleMeals, getFoodFromKeyword, getFoodTrend, getUserRecommendation, getFoodDetail, createFoodDetail, updateFoodPreference } = require('../controller/food_controller')

/* Diet plan page */
// TODO: 相同開頭可以刪減
router.route('/food/diary').get(authentication, wrapAsync(getDiaryRecord))
router.route('/food/diary').patch(authentication, wrapAsync(updateMealRecord))
router.route('/food/diary').delete(authentication, wrapAsync(deleteMealRecord))
router.route('/food/single').post(authentication, wrapAsync(generateSingleMeal))
router.route('/food/multiple').post(authentication, wrapAsync(generateMultipleMeals))

/* search page */
router.route('/food/search').get(wrapAsync(getFoodFromKeyword))
router.route('/food/trend').get(wrapAsync(getFoodTrend))
router.route('/food/recommend').get(authentication, wrapAsync(getUserRecommendation))

router.route('/food/mealrecord').post(authentication, wrapAsync(addMealRecord))
router.route('/food/detail').post(authentication, wrapAsync(createFoodDetail))
router.route('/food/detail').get(wrapAsync(getFoodDetail))
router.route('/food/detail').patch(authentication, wrapAsync(updateFoodPreference))

module.exports = router
