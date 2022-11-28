require('dotenv').config()
const mysql = require('mysql2/promise')
const {
  DB_HOST,
  DB_USERNAME,
  DB_PASSWORD,
  DB_DATABASE
} = process.env

const db = mysql.createPool({
  host: DB_HOST,
  user: DB_USERNAME,
  password: DB_PASSWORD,
  database: DB_DATABASE,
  /* 讓SQL撈出的時間資料不會自動轉換型態 */
  dateStrings: true
})

module.exports = db
