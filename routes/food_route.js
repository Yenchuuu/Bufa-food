const express = require('express')
const router = express.Router()
const path = require('path')
const { wrapAsync } = require('../utils/util')
const { getDiaryRecord, generateSingleMeal, generateMultipleMeals, getFoodFromKeyword, getFoodTrend, getUserRecommendation } = require('../controller/food_controller')

/* Diet plan page */
router.route('/food/diary').get(wrapAsync(getDiaryRecord))
router.route('/food/single').post(wrapAsync(generateSingleMeal))
router.route('/food/multiple').get(wrapAsync(generateMultipleMeals))

/* search page */
router.route('/food/search').get(wrapAsync(getFoodFromKeyword))
router.route('/food/trend').get(wrapAsync(getFoodTrend))
router.route('/food/recommend').get(wrapAsync(getUserRecommendation))

module.exports = router
