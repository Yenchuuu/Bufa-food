require('dotenv').config()
const express = require('express')
const path = require('path')
const Cache = require('./utils/cache')
const { PORT, API_VERSION, NODE_ENV, PORT_TEST } = process.env
const port = NODE_ENV == 'test' ? PORT_TEST : PORT

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
  // FIXME: 不可以只有這種種簡單訊息，應該在別的地方用new Error
  // TODO: 可以用class...extend的寫法客製化error message，還可以toJSON把它組起來 -> 也剛好回傳JSON給前端
  // TODO: error message可以離出bug的地方越近越好，比較知道源頭到底在哪
  // https://javascript.info/custom-errors
  res.status(500).send('Something broke!')
})

if (NODE_ENV === 'development') {
  app.listen(port, async () => {
    console.log(`Listening on port: ${port}`)
    Cache.connect()
  })
}

module.exports = app
