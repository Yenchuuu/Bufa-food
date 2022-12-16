const express = require('express')
const request = require('supertest')
const Food = require('../controller/food_controller')
const User = require('../controller/user_controller')
const app = express()
app.use('/food/search', Food.getFoodFromKeyword)
app.use('/food/trend', Food.getFoodTrend)
app.use('/food/diary', Food.getDiaryRecord)
app.use('/user/nativesignin', User.nativeSignIn)

/* search page */
describe('test getFoodFromKeyword', () => {
  test('should response food related to keywords', async () => {
    const key = '無花果'
    const res = await request(app).get('/food/search').query({ key })
    expect(res.body).toEqual([{
      id: 4985,
      name: '無花果'
    }])
  })
})

describe('test getFoodTrend', () => {
  test('should response 5 items of trend food', async () => {
    const res = await request(app).get('/food/trend')
    expect(res.body.trendFood).toEqual(
      expect.arrayContaining([
        expect.objectContaining(
          {
            food_id: expect.any(Number),
            counts: expect.any(Number),
            name: expect.any(String)
          },
        )
      ])
    )
  })
})
