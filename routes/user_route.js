const express = require('express')
const router = express.Router()
const { wrapAsync, authentication } = require('../utils/util')
const { signUp, nativeSignIn, getUserTarget, getUserProfile, updateUserProfile, updateUserBodyInfo, updateNutritionTarget } = require('../controller/user_controller')

router.route('/user/signup').post(wrapAsync(signUp))
router.route('/user/nativesignin').post(wrapAsync(nativeSignIn))
router.route('/user/target').post(authentication(), wrapAsync(getUserTarget))
router.route('/user/profile').get(authentication(), wrapAsync(getUserProfile))
router.route('/user/profile/account/:id').patch(authentication(), wrapAsync(updateUserProfile))
router.route('/user/profile/bodyinfo/:id').patch(authentication(), wrapAsync(updateUserBodyInfo))
router.route('/user/profile/nutritiontarget/:id').patch(authentication(), wrapAsync(updateNutritionTarget))

module.exports = router
