const express = require('express')
const router = express.Router()
const { wrapAsync, authentication } = require('../utils/util')
const { signUp, nativeSignIn, getUserTarget, getUserProfile, updateUserProfile } = require('../controller/user_controller')

router.route('/user/signup').post(wrapAsync(signUp))
router.route('/user/nativesignin').post(wrapAsync(nativeSignIn))
router.route('/user/target').post(authentication(), wrapAsync(getUserTarget))
router.route('/user/profile').get(authentication(), wrapAsync(getUserProfile))
router.route('/user/profile/:id').patch(authentication(), wrapAsync(updateUserProfile))

module.exports = router
