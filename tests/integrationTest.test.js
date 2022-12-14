const express = require('express')
const { object } = require('joi')
const request = require('supertest')
const Food = require('../controller/food_controller')
const app = express()
app.use('/food/search', Food.getFoodFromKeyword)
app.use('/food/trend', Food.getFoodTrend)
app.use('/food/diary', Food.getDiaryRecord)

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

// FIXME: 沒辦法讀到authentication?
// describe('test getFoodTrend', () => {
//   test('should response 5 items of trend food', async () => {
//     const userId = 20
//     const date = '2022-11-19'
//     const res = await request(app).get('/food/diary').query({ date })
//     expect(res.body.mealRecords).toEqual(
//       expect.arrayContaining([
//         expect.objectContaining(
//           {
//             record_id: expect.any(Number),
//             meal: expect.any(Number),
//             food_id: expect.any(Number),
//             name: expect.any(String),
//             serving_amount: expect.any(String),
//             amountTotal: expect.any(String),
//             calories: expect.any(String),
//             carbs: expect.any(String),
//             protein: expect.any(String),
//             fat: expect.any(String)
//           }
//         )
//       ])
//     )
//   })
// })
