$('#generateOneMeal').click(async function () {
  const values = []
  const meal = $('#inputGroupSelectMeal').val()
  const target = $('#inputGroupSelectTarget').val()
  const targetValue = $('#inputTargetValue').val()
  const webUrl = window.location.search
  const splitUrl = webUrl.split('=')
  let date = splitUrl[1]
  const d = new Date()
  if (!date) {
    date = d.toISOString().split('T')[0]
  }
  if (!meal || meal === '選餐') {
    Swal.fire({
      icon: 'warning',
      text: '請選擇要建立於哪一餐‼️'
    })
    return
  } else if (!target) {
    Swal.fire({
      icon: 'warning',
      text: '請選擇要建立之目標‼️'
    })
    return
  } else if (isNaN(targetValue) || !targetValue) {
    Swal.fire({
      icon: 'warning',
      text: '請輸入有效之數字‼️'
    })
    return
  }
  values.push(parseInt(meal), target, parseInt(targetValue))
  console.log(values)
  /* 判斷選擇哪一餐&目標打api */
  const targetMeal = await axios.post(`http://${location.host}/api/1.0/food/single`, { meal: values[0], target: values[1], value: values[2], date })
  console.log('targetMeal', targetMeal)
  if (target === 'calories' && targetMeal.data.errorMessage) {
    Swal.fire({
      icon: 'warning',
      text: '為求飲食均衡，一餐熱量不建議低於TDEE 10%喔！\b請重新輸入'
    })
  } else {
    const recommendMeal = targetMeal.data.recommendMeal
    // console.log('recommendMeal', recommendMeal)

    let switchMeal
    switch (targetMeal.data.meal) {
      case 1: {
        switchMeal = 'breakfast'
        break
      }
      case 2: {
        switchMeal = 'lunch'
        break
      }
      case 3: {
        switchMeal = 'dinner'
        break
      }
      case 4: {
        switchMeal = 'snack'
        break
      }
    }
    console.log('switchMeal', switchMeal)
    recommendMeal.map(food => $(`#${switchMeal}Record`).append += `<div class="col-4 text-secondary card-body-text">${food.name}</div><div class="col-8"><ul class="nav nav-pills"><li class="nav-card-title"><p class="text-secondary">${food.per_serving}</p></li><li class="nav-card-title"><p class="text-secondary">${Math.round(food.calories)}</p></li><li class="nav-card-title"><p class="text-secondary">${Math.round(food.carbs)}g</p></li><li class="nav-card-title"><p class="text-secondary">${Math.round(food.protein)}g</p></li><li class="nav-card-title"><p class="text-secondary">${Math.round(food.fat)}g</p></li></ul></div></div></div>`)
    window.location.href = `http://${location.host}/diary.html?date=${date}`
  }
})

$('#generateDayMeals').click(async function () {
  const webUrl = window.location.search
  const splitUrl = webUrl.split('=')
  let date = splitUrl[1]
  const d = new Date()
  if (!date) {
    date = d.toISOString().split('T')[0]
  }
  const getDailyRecord = await axios.get(`http://${location.host}/api/1.0/food/diary?date=${date}`)
  // console.log('getDailyRecord', getDailyRecord)
  if (getDailyRecord.data.mealRecords !== 0) {
    Swal.fire({
      icon: 'warning',
      text: '當日已有飲食紀錄，請使用上方列表選擇推薦單餐喔！'
    })
  } else {
    const getMeal = await axios.post(`http://${location.host}/api/1.0/food/multiple`, { date })
    // console.log('getMeal', getMeal, 'date', date)
    window.location.href = `http://${location.host}/diary.html?date=${date}`
  }
})

const webUrl = window.location.search
const splitUrl = webUrl.split('=')
let date = splitUrl[1]
const d = new Date()
if (!date) {
  date = d.toISOString().split('T')[0]
}
getDiaryRecord(date)

/* 往前按一天 */
$('#previousDay').click(function (changeDate) {
  const currenDate = $('#currentDate').text()
  const dateA = new Date(currenDate)
  const dateB = new Date(dateA - (1000 * 60 * 60 * 24))
  const previousDate = dateB.toISOString().split('T')[0]
  // console.log('dateB', dateB, 'previousDate', previousDate)
  const date = previousDate
  window.location.href = `http://${location.host}/diary.html?date=${date}`
})
// document.querySelector('#previousDay').addEventListener('click', function (changeDate) {
//   let currenDate = document.querySelector('#currentDate').textContent
//   let dateA = new Date(currenDate)
//   let dateB = new Date(dateA - (1000 * 60 * 60 * 24))
//   let previousDate = dateB.toISOString().split('T')[0]
//   // console.log('dateB', dateB, 'previousDate', previousDate)
//   let date = previousDate
//   window.location.href = `http://${location.host}/diary.html?date=${date}`
// })

/* 往後按一天 */
$('#followingDay').click(function (changeDate) {
  const currenDate = $('#currentDate').text()
  const dateA = new Date(currenDate)
  const dateB = new Date(dateA.getTime() + (1000 * 60 * 60 * 24))
  const followingDate = dateB.toISOString().split('T')[0]
  console.log('dateB', dateB, 'followingDate', followingDate)
  const date = followingDate
  window.location.href = `http://${location.host}/diary.html?date=${date}`
})

// document.querySelector('#followingDay').addEventListener('click', function (changeDate) {
//   let currenDate = document.querySelector('#currentDate').textContent
//   let dateA = new Date(currenDate)
//   let dateB = new Date(dateA.getTime() + (1000 * 60 * 60 * 24))
//   let followingDate = dateB.toISOString().split('T')[0]
//   console.log('dateB', dateB, 'followingDate', followingDate)
//   let date = followingDate
//   window.location.href = `http://${location.host}/diary.html?date=${date}`
// })

$('#generateOneMeal').click(function () {
  const currenDate = $('#currentDate').val()
  const dateA = new Date(currenDate)
  const dateB = dateA - (1000 * 60 * 60 * 24)
  console.log('dateB', dateB)
})
// getDiaryRecord(date)
// onclick="changeDate(this)"

/* 取得飲食紀錄資訊 */
// FIXME: 如果把getDate 改成 $('#showDate') 則網頁無法讀取
// const getDate = $('#showDate')
const getDate = document.querySelector('#showDate')
const getBreakfast = document.getElementById('breakfastRecord')
const getLunch = document.getElementById('lunchRecord')
const getDinner = document.getElementById('dinnerRecord')
const getSnack = document.getElementById('snackRecord')
async function getDiaryRecord(date) {
  const diaryRecord = await axios.get(`http://${location.host}/api/1.0/food/diary?date=${date}`)
  console.log('date', date)

  // let breakfastCaloriesTotal, lunchCaloriesTotal, dinnerCaloriesTotal, snackCaloriesTotal, breakfastCarbsTotal, lunchCarbsTotal, dinnerCarbsTotal, snackCarbsTotal, breakfastProteinTotal, lunchProteinTotal, dinnerProteinTotal, snackProteinTotal, breakfastFatTotal, lunchFatTotal, dinnerFatTotal, snackFatTotal
  // getDate.attr($('#currentDate'), `${date}`)
  getDate.innerHTML = `<span class="text-secondary" id="currentDate">${date}</span>`
  const breakfast = diaryRecord.data.mealRecords.filter(e => e.meal === 1)
  if (breakfast.length === 0) {
    getBreakfast.innerHTML = '<div class="col-12 text-secondary card-body-text"><p>今日還沒有早餐紀錄喔～</p></div>'
  } else {
    breakfast.map(food => getBreakfast.innerHTML += `<div class="col-4 text-secondary card-body-text">${food.name}</div><div class="col-8"><ul class="nav nav-pills"><li class="nav-card-title"><p class="text-secondary">${food.serving_amount}</p></li><li class="nav-card-title"><p class="text-secondary">${Math.round(food.calories)}</p></li><li class="nav-card-title"><p class="text-secondary">${Math.round(food.carbs)}g</p></li><li class="nav-card-title"><p class="text-secondary">${Math.round(food.protein)}g</p></li><li class="nav-card-title"><p class="text-secondary">${Math.round(food.fat)}g</p></li></ul></div></div></div>`
    )
    const breakfastCaloriesTotal = breakfast.reduce((acc, item) => {
      return acc + parseInt(item.calories)
    }, 0)
    const breakfastCarbsTotal = breakfast.reduce((acc, item) => {
      return acc + parseInt(item.carbs)
    }, 0)
    const breakfastProteinTotal = breakfast.reduce((acc, item) => {
      return acc + parseInt(item.protein)
    }, 0)
    const breakfastFatTotal = breakfast.reduce((acc, item) => {
      return acc + parseInt(item.fat)
    }, 0)
    document.querySelector('#breakfastTotal').innerHTML += `<div class="col-4 text-secondary card-body-text">總計</div><div class="col-8"><ul class="nav nav-pills"><li class="nav-card-title"><p class="text-secondary"></p></li><li class="nav-card-title"><p class="text-secondary">${breakfastCaloriesTotal}</p></li><li class="nav-card-title"><p class="text-secondary">${breakfastCarbsTotal}g</p></li><li class="nav-card-title"><p class="text-secondary">${breakfastProteinTotal}g</p></li><li class="nav-card-title"><p class="text-secondary">${breakfastFatTotal}g</p></li></ul></div></div></div>`
  }

  const lunch = diaryRecord.data.mealRecords.filter(e => e.meal === 2)
  if (lunch.length === 0) {
    getLunch.innerHTML = '<div class="col-12 text-secondary card-body-text"><p>今日還沒有午餐紀錄喔～</p></div>'
  } else {
    lunch.map(food => getLunch.innerHTML += `<div class="col-4 text-secondary card-body-text">${food.name}</div><div class="col-8"><ul class="nav nav-pills"><li class="nav-card-title"><p class="text-secondary">${food.serving_amount}</p></li><li class="nav-card-title"><p class="text-secondary">${Math.round(food.calories)}</p></li><li class="nav-card-title"><p class="text-secondary">${Math.round(food.carbs)}g</p></li><li class="nav-card-title"><p class="text-secondary">${Math.round(food.protein)}g</p></li><li class="nav-card-title"><p class="text-secondary">${Math.round(food.fat)}g</p></li></ul></div></div></div>`
    )
    const lunchCaloriesTotal = lunch.reduce((acc, item) => {
      return acc + parseInt(item.calories)
    }, 0)
    const lunchCarbsTotal = lunch.reduce((acc, item) => {
      return acc + parseInt(item.carbs)
    }, 0)
    const lunchProteinTotal = lunch.reduce((acc, item) => {
      return acc + parseInt(item.protein)
    }, 0)
    const lunchFatTotal = lunch.reduce((acc, item) => {
      return acc + parseInt(item.fat)
    }, 0)
    document.querySelector('#lunchTotal').innerHTML += `<div class="col-4 text-secondary card-body-text">總計</div><div class="col-8"><ul class="nav nav-pills"><li class="nav-card-title"><p class="text-secondary"></p></li><li class="nav-card-title"><p class="text-secondary">${lunchCaloriesTotal}</p></li><li class="nav-card-title"><p class="text-secondary">${lunchCarbsTotal}g</p></li><li class="nav-card-title"><p class="text-secondary">${lunchProteinTotal}g</p></li><li class="nav-card-title"><p class="text-secondary">${lunchFatTotal}g</p></li></ul></div></div></div>`
  }
  const dinner = diaryRecord.data.mealRecords.filter(e => e.meal === 3)
  if (dinner.length === 0) {
    getDinner.innerHTML = '<div class="col-12 text-secondary card-body-text"><p>今日還沒有晚餐紀錄喔～</p></div>'
  } else {
    dinner.map(food => getDinner.innerHTML += `<div class="col-4 text-secondary card-body-text">${food.name}</div><div class="col-8"><ul class="nav nav-pills"><li class="nav-card-title"><p class="text-secondary">${food.serving_amount}</p></li><li class="nav-card-title"><p class="text-secondary">${Math.round(food.calories)}</p></li><li class="nav-card-title"><p class="text-secondary">${Math.round(food.carbs)}g</p></li><li class="nav-card-title"><p class="text-secondary">${Math.round(food.protein)}g</p></li><li class="nav-card-title"><p class="text-secondary">${Math.round(food.fat)}g</p></li></ul></div></div></div>`
    )
    const dinnerCaloriesTotal = dinner.reduce((acc, item) => {
      return acc + parseInt(item.calories)
    }, 0)
    const dinnerCarbsTotal = dinner.reduce((acc, item) => {
      return acc + parseInt(item.carbs)
    }, 0)
    const dinnerProteinTotal = dinner.reduce((acc, item) => {
      return acc + parseInt(item.protein)
    }, 0)
    const dinnerFatTotal = dinner.reduce((acc, item) => {
      return acc + parseInt(item.fat)
    }, 0)
    document.querySelector('#dinnerTotal').innerHTML += `<div class="col-4 text-secondary card-body-text">總計</div><div class="col-8"><ul class="nav nav-pills"><li class="nav-card-title"><p class="text-secondary"></p></li><li class="nav-card-title"><p class="text-secondary">${dinnerCaloriesTotal}</p></li><li class="nav-card-title"><p class="text-secondary">${dinnerCarbsTotal}g</p></li><li class="nav-card-title"><p class="text-secondary">${dinnerProteinTotal}g</p></li><li class="nav-card-title"><p class="text-secondary">${dinnerFatTotal}g</p></li></ul></div></div></div>`
  }

  const snack = diaryRecord.data.mealRecords.filter(e => e.meal === 4)
  if (snack.length === 0) {
    getSnack.innerHTML = '<div class="col-12 text-secondary card-body-text"><p>今日還沒有點心紀錄喔～</p></div>'
  } else {
    snack.map(food => getSnack.innerHTML += `<div class="col-4 text-secondary card-body-text">${food.name}</div><div class="col-8"><ul class="nav nav-pills"><li class="nav-card-title"><p class="text-secondary">${food.serving_amount}</p></li><li class="nav-card-title"><p class="text-secondary">${Math.round(food.calories)}</p></li><li class="nav-card-title"><p class="text-secondary">${Math.round(food.carbs)}g</p></li><li class="nav-card-title"><p class="text-secondary">${Math.round(food.protein)}g</p></li><li class="nav-card-title"><p class="text-secondary">${Math.round(food.fat)}g</p></li></ul></div></div></div>`
    )
    const snackCaloriesTotal = snack.reduce((acc, item) => {
      return acc + parseInt(item.calories)
    }, 0)
    const snackCarbsTotal = snack.reduce((acc, item) => {
      return acc + parseInt(item.carbs)
    }, 0)
    const snackProteinTotal = snack.reduce((acc, item) => {
      return acc + parseInt(item.protein)
    }, 0)
    const snackFatTotal = snack.reduce((acc, item) => {
      return acc + parseInt(item.fat)
    }, 0)
    document.querySelector('#snackTotal').innerHTML += `<div class="col-4 text-secondary card-body-text">總計</div><div class="col-8"><ul class="nav nav-pills"><li class="nav-card-title"><p class="text-secondary"></p></li><li class="nav-card-title"><p class="text-secondary">${snackCaloriesTotal}</p></li><li class="nav-card-title"><p class="text-secondary">${snackCarbsTotal}g</p></li><li class="nav-card-title"><p class="text-secondary">${snackProteinTotal}g</p></li><li class="nav-card-title"><p class="text-secondary">${snackFatTotal}g</p></li></ul></div></div></div>`
  }

  // const dailyCaloriesTotal = breakfastCaloriesTotal + lunchCaloriesTotal + dinnerCaloriesTotal + snackCaloriesTotal
  // const dailyCarbsTotal = breakfastCarbsTotal + lunchCarbsTotal + dinnerCarbsTotal + snackCarbsTotal
  // const dailyProteinTotal = breakfastProteinTotal + lunchProteinTotal + dinnerProteinTotal + snackProteinTotal
  // const dailyFatTotal = breakfastFatTotal + lunchFatTotal + dinnerFatTotal + snackFatTotal

  document.querySelector('#dailyCaloriesTotal').innerHTML = `<p class="text-secondary">${diaryRecord.data.caloriesTotal}</p>`
  document.querySelector('#dailyCarbsTotal').innerHTML = `<p class="text-secondary">${diaryRecord.data.carbsTotal}g</p>`
  document.querySelector('#dailyProteinTotal').innerHTML = `<p class="text-secondary">${diaryRecord.data.proteinTotal}g</p>`
  document.querySelector('#dailyFatTotal').innerHTML = `<p class="text-secondary">${diaryRecord.data.fatTotal}g</p>`
  const carbsPercentage = diaryRecord.data.carbsTotal * 4 / diaryRecord.data.caloriesTotal
  const proteinPercentage = diaryRecord.data.proteinTotal * 4 / diaryRecord.data.caloriesTotal
  const fatPercentage = diaryRecord.data.fatTotal * 9 / diaryRecord.data.caloriesTotal
  const pieData = [{
    values: [carbsPercentage, proteinPercentage, fatPercentage],
    labels: ['碳水化合物', '蛋白質', '脂肪'],
    type: 'pie',
    marker: {
      colors: ['#607D8B', '#9E9E9E', '#EF9A9A']
    }
  }]
  pie = document.querySelector('#pieChart')
  Plotly.newPlot(pie, pieData)
}
