const express = require('express')
const router = express.Router()
const { wrapAsync, authentication } = require('../utils/util')
const { signUp, nativeSignIn, fbSignIn, setUserTarget, getUserProfile, updateUserProfile, updateUserBodyInfo, updateNutritionTarget, getUserPreference } = require('../controller/user_controller')

router.route('/user/signup').post(wrapAsync(signUp))
router.route('/user/nativesignin').post(wrapAsync(nativeSignIn))
router.route('/user/fbsignin').post(wrapAsync(fbSignIn))
router.route('/user/target').post(authentication(), wrapAsync(setUserTarget))
router.route('/user/preference').get(authentication(), wrapAsync(getUserPreference))
router.route('/user/profile').get(authentication(), wrapAsync(getUserProfile))
router.route('/user/profile/account/:id').patch(authentication(), wrapAsync(updateUserProfile))
router.route('/user/profile/bodyinfo/:id').patch(authentication(), wrapAsync(updateUserBodyInfo))
router.route('/user/profile/nutritiontarget/:id').patch(authentication(), wrapAsync(updateNutritionTarget))

module.exports = router
