const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const User = require('../model/user_model')
const port = process.env.PORT
const { TOKEN_SECRET } = process.env
const { promisify } = require('util')
/* 圖片上傳--S3相關 */
const multer = require('multer')
const { uploadFile } = require('./s3')

const wrapAsync = (fn) => {
  return function (req, res, next) {
    // Make sure to `.catch()` any errors and pass them along to the `next()`
    // middleware in the chain, in this case the error handler.
    fn(req, res, next).catch(next)
  }
}

async function authentication (req, res, next) {
  let accessToken = req.get('Authorization')
  if (!accessToken) {
    res.status(401).json({ error: 'Unauthenticated' })
    return
  }

  accessToken = accessToken.replace('Bearer ', '')
  if (accessToken === 'null') {
    res.status(401).json({ error: 'Unauthenticated' })
  }
  try {
    const user = jwt.verify(accessToken, TOKEN_SECRET)
    req.user = user
    // console.log('user', user)
    const [userDetail] = await User.getUserDetail(user.email)
    if (!userDetail) {
      res.status(401).json({ error: 'Invalid token' })
      // } else {
      // req.user.id = userDetail.id
    }
    next()
    // return
  } catch (err) {
    console.error(err)
    res.status(403).json({ error: 'Forbidden' })
  }
}

const upload = multer({
  limit: {
    /* 限制上傳檔案的大小為 1MB */
    fileSize: 1000000
  },
  fileFilter (req, file, cb) {
    /* 只接受三種圖片格式 */
    const imageType = ['image/jpg', 'image/jpeg', 'image/png']
    if (!imageType.includes(file.mimetype)) {
      return cb(null, false, new Error('請上傳圖片格式'))
    }
    cb(null, true)
  },
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'images')
    },
    filename: (req, file, cb) => {
      /* 有些使用者若上傳含有中文字的圖片檔，名稱將變類亂碼，故加上random number作為不重複的名稱 */
      cb(null, `${new Date().toISOString()}-${Math.round(Math.random() * 10000, 0)}.png`)
    }
  })
})

module.exports = { wrapAsync, authentication, upload }
