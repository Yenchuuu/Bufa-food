const User = require('../model/user_model')
const cron = require('node-cron')
const moment = require('moment')
require('dotenv').config()
const db = require('./mysqlconf')


const insertUserGoalDaily = cron.schedule('50 */23 * * *', async () => {
  try {
    const date = moment().format('YYYY-MM-DD')
    await User.setDailyGoal(date)
    console.log(`User goals of ${date} insert successfully`)
  } catch (err) {
    console.error(err)
    throw err
  }
}, {
  scheduled: true,
  timezone: 'Asia/Taipei'
})

module.exports = insertUserGoalDaily
