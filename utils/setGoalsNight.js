const moment = require('moment')
require('dotenv').config()
const db = require('./mysqlconf')

async function crontab() {
  try {
    /* 因ec2預設時區為格林威治時間，考量時差，應更新前一天的目標設定 */
    const date = moment().utc().add(-1, 'days').format('YYYY-MM-DD')
    const conn = await db.getConnection()
    await conn.query('START TRANSACTION')
    const [users] = await conn.execute('SELECT user_id, goal_calories, goal_carbs, goal_protein, goal_fat FROM `user_bodyInfo`')
    const [userGoal] = await conn.execute('SELECT DISTINCT(user_id) FROM `user_goal` WHERE date = ?;', [date])
    for (let userInfo of users) {
      if (userGoal.find(id => id.user_id === userInfo.user_id)) {
        await conn.execute('UPDATE `user_goal` SET goal_calories = ?, goal_carbs = ?, goal_protein = ?, goal_fat = ? WHERE user_id = ? AND date = ?;', [userInfo.goal_calories, userInfo.goal_carbs, userInfo.goal_protein, userInfo.goal_fat, userInfo.user_id, date])
      } else {
        await conn.execute('INSERT INTO `user_goal` (user_id, goal_calories, goal_carbs, goal_protein, goal_fat, date) VALUES (?, ?, ?, ?, ?, ?)', [userInfo.user_id, userInfo.goal_calories, userInfo.goal_carbs, userInfo.goal_protein, userInfo.goal_fat, date])
      }
    }
    console.log(`User goal on ${date} updated.`)
    await conn.query('COMMIT')
  } catch (error) {
    await conn.query('ROLLBACK')
    console.error(error)
    throw error
  } finally {
    process.exit()
  }
}
crontab()