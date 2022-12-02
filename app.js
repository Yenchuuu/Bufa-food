require('dotenv').config()
const express = require('express')
const path = require('path')
const axios = require('axios')
const moment = require('moment')
const { PORT, API_VERSION } = process.env

const app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'))

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use('/', express.static(path.join(__dirname, 'public')))
app.use('/', express.static(path.join(__dirname, 'views')))
app.use('/', express.static(path.join(__dirname, '/images')))

/* Build API route */
app.use('/api/' + API_VERSION, [require('./routes/food_route'), require('./routes/user_route')])

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  res.status(404).sendFile(path.join(__dirname, '/views/404page.html'))
})

// error handler
app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

module.exports = app
