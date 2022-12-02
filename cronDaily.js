const moment = require('moment')
require('dotenv').config()
const mysql = require('mysql2/promise')
const {
  DB_HOST,
  DB_USERNAME,
  DB_PASSWORD,
  DB_DATABASE
} = process.env

const conn = mysql.createConnection({
  host: DB_HOST,
  user: DB_USERNAME,
  password: DB_PASSWORD,
  database: DB_DATABASE,
  /* 讓SQL撈出的時間資料不會自動轉換型態 */
  dateStrings: true
})

conn.connect()

async function () {
  try {
    const date = moment().format('YYYY-MM-DD')
    const [users] = await conn.execute('SELECT user_id, goal_calories, goal_carbs, goal_protein, goal_fat FROM `user_bodyInfo`')
    for (let userInfo of users) {
      await conn.execute('INSERT INTO `user_goal` (user_id, goal_calories, goal_carbs, goal_protein, goal_fat, date) VALUES (?, ?, ?, ?, ?, ?)', [userInfo.user_id, userInfo.goal_calories, userInfo.goal_carbs, userInfo.goal_protein, userInfo.goal_fat, date])
    }
    console.log(`User goal on ${date} insert into DB successfully.`)
  } catch (error) {
    console.error(error)
    throw error
  }
}

conn.end()