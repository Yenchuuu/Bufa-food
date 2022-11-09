const express = require('express')
const router = express.Router()
const { wrapAsync } = require('../utils/util')
const { signUp } = require('../controller/user_controller')

router.route('/user/signup').post(wrapAsync(signUp))

module.exports = router
