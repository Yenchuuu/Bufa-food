const moment = require('moment')
require('dotenv').config()
const db = require('./mysqlconf')

async function crontab() {
  try {
    const date = moment().format('YYYY-MM-DD')
    const [users] = await db.execute('SELECT user_id, goal_calories, goal_carbs, goal_protein, goal_fat FROM `user_bodyInfo`')
    for (let userInfo of users) {
      await db.execute('UPDATE `user_goal` SET goal_calories = ?, goal_carbs = ?, goal_protein = ?, goal_fat = ? WHERE user_id = ? AND date = ?;', [userInfo.goal_calories, userInfo.goal_carbs, userInfo.goal_protein, userInfo.goal_fat, userInfo.user_id, date])
    }
    console.log(`User goal on ${date} updated.`)
    // TODO: 小賴說這種寫法不好
    process.exit()
  } catch (error) {
    console.error(error)
    throw error
  }
}
crontab()