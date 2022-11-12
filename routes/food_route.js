const express = require('express')
const router = express.Router()
const path = require('path')
const { wrapAsync, authentication } = require('../utils/util')
const { getDiaryRecord, generateSingleMeal, generateMultipleMeals, getFoodFromKeyword, getFoodTrend, getUserRecommendation } = require('../controller/food_controller')

/* Diet plan page */
router.route('/food/diary').get(authentication(), wrapAsync(getDiaryRecord))
router.route('/food/single').post(authentication(), wrapAsync(generateSingleMeal))
router.route('/food/multiple').get(authentication(), wrapAsync(generateMultipleMeals))

/* search page */
router.route('/food/search').get(wrapAsync(getFoodFromKeyword))
router.route('/food/trend').get(wrapAsync(getFoodTrend))
router.route('/food/recommend').get(authentication(), wrapAsync(getUserRecommendation))

module.exports = router
