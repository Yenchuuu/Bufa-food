const express = require('express')
const router = express.Router()
const { wrapAsync } = require('../utils/util')
const { signUp, nativeSignIn } = require('../controller/user_controller')

router.route('/user/signup').post(wrapAsync(signUp))
router.route('/user/nativesignin').post(wrapAsync(nativeSignIn))

module.exports = router
