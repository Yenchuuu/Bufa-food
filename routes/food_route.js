const express = require('express')
const router = express.Router()
const { wrapAsync, authentication } = require('../utils/util')
const { createMealRecord, getDiaryRecord, generateSingleMeal, generateMultipleMeals, getFoodFromKeyword, getFoodTrend, getUserRecommendation, getFoodDetail, updateFoodPreference } = require('../controller/food_controller')

/* Diet plan page */
router.route('/food/diary').get(authentication(), wrapAsync(getDiaryRecord))
router.route('/food/single').post(authentication(), wrapAsync(generateSingleMeal))
router.route('/food/multiple').post(authentication(), wrapAsync(generateMultipleMeals))

/* search page */
router.route('/food/search').get(wrapAsync(getFoodFromKeyword))
router.route('/food/trend').get(wrapAsync(getFoodTrend))
router.route('/food/recommend').get(authentication(), wrapAsync(getUserRecommendation))

router.route('/food/create').post(authentication(), wrapAsync(createMealRecord))
router.route('/food/detail').get(wrapAsync(getFoodDetail))
router.route('/food/detail').patch(authentication(), wrapAsync(updateFoodPreference))

module.exports = router
