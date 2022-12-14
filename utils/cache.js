require('dotenv').config()
const redis = require('redis')
const { CACHE_USER, CACHE_PASSWORD, CACHE_HOST, CACHE_PORT } = process.env

const redisClient = redis.createClient({
  url: `redis://${CACHE_USER}:${CACHE_PASSWORD}@${CACHE_HOST}:${CACHE_PORT}`
})

redisClient.ready = false

redisClient.on('ready', () => {
  redisClient.ready = true
  console.log('Redis is ready')
})

redisClient.on('error', () => {
  redisClient.ready = false
  console.log('Redis connection error')
})

redisClient.on('end', () => {
  redisClient.ready = false
  console.log('Redis is disconnected')
})

module.exports = redisClient
