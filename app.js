require('dotenv').config()
const express = require('express')
const path = require('path')
const axios = require('axios')
const moment = require('moment')
const { PORT, API_VERSION } = process.env
// const indexRouter = require('./routes/index')
// const usersRouter = require('./routes/users')

const app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use('/', express.static(path.join(__dirname, 'public')))
app.use('/', express.static(path.join(__dirname, 'views')))

// app.use('/', indexRouter)
// app.use('/users', usersRouter);

/* Build API route */
app.use('/api/' + API_VERSION, [require('./routes/food_route'), require('./routes/user_route')])

// catch 404 and forward to error handler
// app.use(function (req, res, next) {
//   next(createError(404))
// })

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

module.exports = app
