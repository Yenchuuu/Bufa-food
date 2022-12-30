const moment = require('moment')
require('dotenv').config()
const db = require('./mysqlconf')

async function crontab() {
  try {
    const date = moment().utc().format('YYYY-MM-DD')
    const [users] = await db.execute('SELECT user_id, goal_calories, goal_carbs, goal_protein, goal_fat FROM `user_bodyInfo`')
    for (let userInfo of users) {
      await db.execute('INSERT INTO `user_goal` (user_id, goal_calories, goal_carbs, goal_protein, goal_fat, date) VALUES (?, ?, ?, ?, ?, ?)', [userInfo.user_id, userInfo.goal_calories, userInfo.goal_carbs, userInfo.goal_protein, userInfo.goal_fat, date])
    }
    console.log(`User goal on ${date} insert into DB successfully.`)
    process.exit()
  } catch (error) {
    console.error(error)
    throw error
  }
}
crontab()