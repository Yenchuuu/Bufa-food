// FIXME: jsGrid更新時總計不會跟著更新
// const userName = window.localStorage.getItem('userName');
const userId = window.localStorage.getItem('userId')
const userEmail = window.localStorage.getItem('userEmail')

const accessToken = window.localStorage.getItem('accessToken')
if (!accessToken) {
  alert('請先登入')
  window.location.href = '/index.html'
}

$('#nav-profile-change').children().hide()
$('#nav-profile-change').append('<a class="nav-link active" href="#" id="logout-btn">登出</a>')

$('#nav-profile-change').click(() => {
  localStorage.clear()
  alert('已成功登出～')
  window.location.href = '/index.html'
})

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
  const targetMeal = await axios.post('/api/1.0/food/single', { meal: values[0], target: values[1], value: values[2], date }, { headers: { Authorization: `Bearer ${accessToken}` } })
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
    window.location.href = `/diary.html?date=${date}`
  }
})

$('#generateDayMeals').click(async function () {
  const webUrl = window.location.search
  const splitUrl = webUrl.split('=')
  let date = splitUrl[1]
  // const d = new Date()
  if (!date) {
    date = moment().format('YYYY-MM-DD')
    // date = d.toISOString().split('T')[0]
  }
  const getDailyRecord = await axios.get(`/api/1.0/food/diary?date=${date}`, { headers: { Authorization: `Bearer ${accessToken}` } })
  // console.log('getDailyRecord', getDailyRecord)
  if (getDailyRecord.data.mealRecords.length !== 0) {
    Swal.fire({
      icon: 'warning',
      text: '當日已有飲食紀錄，請使用上方列表選擇推薦單餐喔！'
    })
  } else {
    const getMeal = await axios.post('/api/1.0/food/multiple', { date }, { headers: { Authorization: `Bearer ${accessToken}` } })
    // console.log('getMeal', getMeal, 'date', date)
    window.location.href = `/diary.html?date=${date}`
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
  window.location.href = `/diary.html?date=${date}`
})

/* 往後按一天 */
$('#followingDay').click(function (changeDate) {
  const currenDate = $('#currentDate').text()
  const dateA = new Date(currenDate)
  const dateB = new Date(dateA.getTime() + (1000 * 60 * 60 * 24))
  const followingDate = dateB.toISOString().split('T')[0]
  console.log('dateB', dateB, 'followingDate', followingDate)
  const date = followingDate
  window.location.href = `/diary.html?date=${date}`
})

$('#generateOneMeal').click(function () {
  const currenDate = $('#currentDate').val()
  const dateA = new Date(currenDate)
  const dateB = dateA - (1000 * 60 * 60 * 24)
  console.log('dateB', dateB)
})
// getDiaryRecord(date)
// onclick="changeDate(this)"

// FIXME: 用.hide() .show()優化
/* 取得飲食紀錄資訊 */
const getDate = $('#showDate')
const getBreakfast = $('#breakfastRecord')
const getLunch = $('#lunchRecord')
const getDinner = $('#dinnerRecord')
const getSnack = $('#snackRecord')

async function getDiaryRecord(date) {
  const diaryRecord = await axios.get(`/api/1.0/food/diary?date=${date}`, { headers: { Authorization: `Bearer ${accessToken}` } })
  console.log('diaryRecord', diaryRecord)
  getDate.append(`<span class="text-secondary" id="currentDate">${date}</span>`)

  const breakfast = diaryRecord.data.mealRecords.filter(e => e.meal === 1)

  /* 早餐 */
  if (breakfast.length === 0) {
    getBreakfast.append('<div class="col-12 text-secondary card-body-text"><p>今日還沒有早餐紀錄喔～</p></div>')
  } else {
    $('#breakfastRecord').jsGrid({
      width: '100%',
      // height: '400px',

      inserting: true,
      editing: true,
      sorting: false,
      paging: false,

      data: breakfast,

      fields: [
        { name: 'name', type: 'text', width: 150, validate: 'required', editing: false },
        { name: 'serving_amount', type: 'number', width: 50, editing: true },
        { name: 'calories', type: 'number', width: 50, editing: false },
        { name: 'carbs', type: 'number', width: 50, editing: false },
        { name: 'protein', type: 'number', width: 50, editing: false },
        { name: 'fat', type: 'number', width: 50, editing: false },
        { type: 'control' }
      ],

      controller: {
        updateItem: function (item) {
          // console.log('item: ', item)
          return $.ajax({
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
              accept: 'application/json'
            },
            type: 'PATCH',
            url: `/api/1.0/food/diary?date=${date}`,
            data: JSON.stringify(item)
          })
        },
        deleteItem: function (item) {
          console.log('item: ', item)
          return $.ajax({
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
              accept: 'application/json'
            },
            type: 'DELETE',
            url: `/api/1.0/food/diary?date=${date}`,
            data: JSON.stringify(item)
          })
        }
      }
    })
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

  /* 午餐 */
  const lunch = diaryRecord.data.mealRecords.filter(e => e.meal === 2)
  if (lunch.length === 0) {
    getLunch.append('<div class="col-12 text-secondary card-body-text"><p>今日還沒有午餐紀錄喔～</p></div>')
  } else {
    $('#lunchRecord').jsGrid({
      width: '100%',

      inserting: true,
      editing: true,
      sorting: false,
      paging: false,

      data: lunch,

      fields: [
        { name: 'name', type: 'text', width: 150, validate: 'required', editing: false },
        { name: 'serving_amount', type: 'number', width: 50, editing: true },
        { name: 'calories', type: 'number', width: 50, editing: false },
        { name: 'carbs', type: 'number', width: 50, editing: false },
        { name: 'protein', type: 'number', width: 50, editing: false },
        { name: 'fat', type: 'number', width: 50, editing: false },
        { type: 'control' }
      ],

      controller: {
        updateItem: function (item) {
          return $.ajax({
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
              accept: 'application/json'
            },
            type: 'PATCH',
            url: `/api/1.0/food/diary?date=${date}`,
            data: JSON.stringify(item)
          })
        },
        deleteItem: function (item) {
          // console.log('item: ', item)
          // $('.jsgrid-header-cell').parent().hide()
          return $.ajax({
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
              accept: 'application/json'
            },
            type: 'DELETE',
            url: `/api/1.0/food/diary?date=${date}`,
            data: JSON.stringify(item)
          })
        }
      }
    })
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

  /* 晚餐 */
  const dinner = diaryRecord.data.mealRecords.filter(e => e.meal === 3)
  if (dinner.length === 0) {
    getDinner.append('<div class="col-12 text-secondary card-body-text"><p>今日還沒有晚餐紀錄喔～</p></div>')
  } else {
    $('#dinnerRecord').jsGrid({
      width: '100%',

      inserting: true,
      editing: true,
      sorting: false,
      paging: false,

      data: dinner,

      fields: [
        { name: 'name', type: 'text', width: 150, validate: 'required', editing: false },
        { name: 'serving_amount', type: 'number', width: 50, editing: true },
        { name: 'calories', type: 'number', width: 50, editing: false },
        { name: 'carbs', type: 'number', width: 50, editing: false },
        { name: 'protein', type: 'number', width: 50, editing: false },
        { name: 'fat', type: 'number', width: 50, editing: false },
        { type: 'control' }
      ],

      controller: {
        updateItem: function (item) {
          return $.ajax({
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
              accept: 'application/json'
            },
            type: 'PATCH',
            url: `/api/1.0/food/diary?date=${date}`,
            data: JSON.stringify(item)
          })
        },
        deleteItem: function (item) {
          console.log('item: ', item)
          return $.ajax({
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
              accept: 'application/json'
            },
            type: 'DELETE',
            url: `/api/1.0/food/diary?date=${date}`,
            data: JSON.stringify(item)
          })
        }
      }
    })
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

  /* 點心 */
  const snack = diaryRecord.data.mealRecords.filter(e => e.meal === 4)
  if (snack.length === 0) {
    getSnack.append('<div class="col-12 text-secondary card-body-text"><p>今日還沒有點心紀錄喔～</p></div>')
  } else {
    $('#snackRecord').jsGrid({
      width: '100%',

      inserting: true,
      editing: true,
      sorting: false,
      paging: false,

      data: snack,

      fields: [
        { name: 'name', type: 'text', width: 150, validate: 'required', editing: false },
        { name: 'serving_amount', type: 'number', width: 50, editing: true },
        { name: 'calories', type: 'number', width: 50, editing: false },
        { name: 'carbs', type: 'number', width: 50, editing: false },
        { name: 'protein', type: 'number', width: 50, editing: false },
        { name: 'fat', type: 'number', width: 50, editing: false },
        { type: 'control' }
      ],

      controller: {
        updateItem: function (item) {
          return $.ajax({
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
              accept: 'application/json'
            },
            type: 'PATCH',
            url: `/api/1.0/food/diary?date=${date}`,
            data: JSON.stringify(item)
          })
        },
        deleteItem: function (item) {
          console.log('item: ', item)
          return $.ajax({
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
              accept: 'application/json'
            },
            type: 'DELETE',
            url: `/api/1.0/food/diary?date=${date}`,
            data: JSON.stringify(item)
          })
        }
      }
    })
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

  /* 總計圓餅圖 */
  $('#dailyCaloriesTotal').append(`<p class="text-secondary">${diaryRecord.data.caloriesTotal}</p>`)
  $('#dailyCarbsTotal').append(`<p class="text-secondary">${diaryRecord.data.carbsTotal}g</p>`)
  $('#dailyProteinTotal').append(`<p class="text-secondary">${diaryRecord.data.proteinTotal}g</p>`)
  $('#dailyFatTotal').append(`<p class="text-secondary">${diaryRecord.data.fatTotal}g</p>`)
  const carbsPercentage = parseFloat(diaryRecord.data.carbsTotal * 4 / diaryRecord.data.caloriesTotal).toFixed(3)
  const proteinPercentage = parseFloat(diaryRecord.data.proteinTotal * 4 / diaryRecord.data.caloriesTotal).toFixed(3)
  const fatPercentage = parseFloat(diaryRecord.data.fatTotal * 9 / diaryRecord.data.caloriesTotal).toFixed(3)

  if (diaryRecord.data.caloriesTotal === 0) {
    $('#pieChartContainer').children().hide()
  } else {
    const pieData = {
      data: [{
        values: [carbsPercentage, proteinPercentage, fatPercentage],
        type: 'pie',
        marker: {
          colors: ['#607D8B', '#9E9E9E', '#EF9A9A']
        },
        labels: ['碳水化合物', '蛋白質', '脂肪']
      }],
      layout: {
        title: {
          text: '營養素彙總',
          font: {
            family: 'Microsoft JhengHei',
            color: '#6c757d'
          }
        },
        plot_bgcolor: 'black',
        paper_bgcolor: '#F4F4F2'
      }
    }
    pie = document.querySelector('#pieChart')
    Plotly.newPlot(pie, pieData.data, pieData.layout)
  }
}

getOverallRecord(date)
async function getOverallRecord(date) {
  const diaryRecord = await axios.get(`/api/1.0/food/diary?date=${date}`, { headers: { Authorization: `Bearer ${accessToken}` } })

  const userGoal = await axios.get('/api/1.0/user/profile', { headers: { Authorization: `Bearer ${accessToken}` } })

  /* 目標差距表格 */
  $('#goalCalories').append(userGoal.data.data.goalCalories)
  $('#goalCarbs').append(userGoal.data.data.goalCarbs)
  $('#goalProtein').append(userGoal.data.data.goalProtein)
  $('#goalFat').append(userGoal.data.data.goalFat)

  const diffCalories = userGoal.data.data.goalCalories - diaryRecord.data.caloriesTotal
  const diffCarbs = userGoal.data.data.goalCarbs - diaryRecord.data.carbsTotal
  const diffProtein = userGoal.data.data.goalProtein - diaryRecord.data.proteinTotal
  const diffFat = userGoal.data.data.goalFat - diaryRecord.data.fatTotal

  $('#diffCalories').append(diffCalories)
  $('#diffCarbs').append(diffCarbs)
  $('#diffProtein').append(diffProtein)
  $('#diffFat').append(diffFat)
}
