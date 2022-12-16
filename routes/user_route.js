const express = require('express')
const router = express.Router()
const { wrapAsync, authentication, upload } = require('../utils/util')
const { signUp, nativeSignIn, fbSignIn, setUserTarget, getUserProfile, updateUserProfile, uploadUserImage, deleteUserImage, updateUserBodyInfo, updateNutritionTarget, getUserPreference, getDailyGoal } = require('../controller/user_controller')
/* ('放fieldname') -> 前端input name */
const cpUpload = upload.single('user_photo')

router.route('/user/signup').post(wrapAsync(signUp))
router.route('/user/nativesignin').post(wrapAsync(nativeSignIn))
router.route('/user/fbsignin').post(wrapAsync(fbSignIn))
router.route('/user/target').post(authentication, wrapAsync(setUserTarget))
router.route('/user/preference').get(authentication, wrapAsync(getUserPreference))
router.route('/user/profile').get(authentication, wrapAsync(getUserProfile))
router.route('/user/profile/image/:id')
  .patch(authentication, cpUpload, wrapAsync(uploadUserImage))
  .delete(authentication, wrapAsync(deleteUserImage))
router.route('/user/profile/account/:id').patch(authentication, wrapAsync(updateUserProfile))
router.route('/user/profile/bodyinfo/:id').patch(authentication, wrapAsync(updateUserBodyInfo))
router.route('/user/profile/nutritiontarget/:id').patch(authentication, wrapAsync(updateNutritionTarget))
router.route('/user/footprint').get(authentication, wrapAsync(getDailyGoal))

module.exports = router
