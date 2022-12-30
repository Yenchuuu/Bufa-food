const moment = require('moment')
require('dotenv').config()
const db = require('./mysqlconf')

// 製造假飲食紀錄，確保近期熱搜永遠有東西
async function crontab() {
  try {
    const date = moment().utc().format('YYYY-MM-DD')
    // 隨機產生資料庫的有效食物編號
    const food = Math.round(Math.random() * 1000 + 4600)
    for (let i = 1; i < 5; i++) {
      await db.execute('INSERT INTO `user_meal` (user_id, meal, serving_amount, food_id, date_record) VALUES (?, ?, ?, ?, ?)', [19, i, 1.00, food, date])
    }
    console.log('Meal records inserted.');
    process.exit()
  } catch (err) {
    throw err
  }
}
crontab()