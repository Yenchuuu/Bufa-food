// FIXME: jsGrid更新時總計不會跟著更新

const accessToken = window.localStorage.getItem('accessToken')
if (!accessToken) {
  Swal.fire({
    icon: 'warning',
    text: '請先登入'
  }).then((result) => { window.location.href = '/index.html' })
} else {
  $('#nav-profile-change').children().hide()
  $('#nav-profile-change').append('<a class="nav-link active" href="#" id="logout-btn">登出</a>')

  $('#nav-profile-change').click(() => {
    localStorage.clear()
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
    if (!date) {
      date = moment().format('YYYY-MM-DD')
    }
    if (!validator.isInt(meal, { min: 1 })) {
      Swal.fire({
        icon: 'warning',
        text: '請選擇要建立於哪一餐‼️'
      })
      return
    } else if (!target || target === '選目標') {
      Swal.fire({
        icon: 'warning',
        text: '請選擇要建立之目標‼️'
      })
      return
    } else if (!validator.isInt(targetValue, { min: 1 })) {
      Swal.fire({
        icon: 'warning',
        text: '請輸入有效之數字‼️'
      })
      return
    }
    values.push(parseInt(meal), target, parseInt(targetValue))
    // console.log('values: ', values)
    /* 判斷選擇哪一餐&目標打api */
    try {
      const targetMeal = await axios.post('/api/1.0/food/single', { meal: values[0], target: values[1], value: values[2], date }, { headers: { Authorization: `Bearer ${accessToken}` } })
      // console.log('targetMeal', targetMeal)

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
      // console.log('switchMeal', switchMeal)
      window.location.href = `/diary.html?date=${date}`
    } catch (err) {
      if (target === 'calories' && err.response.data.errorMessage === 'lowCalories') {
        Swal.fire({
          icon: 'warning',
          text: '為求飲食均衡，一餐熱量不建議低於TDEE 10%喔！\b請重新輸入'
        })
      } else if (target === 'calories' && err.response.data.errorMessage === 'highCalories') {
        Swal.fire({
          icon: 'warning',
          text: '為求飲食均衡，不建議將一日熱量集中於一餐！\b請重新輸入'
        })
      } else if (err.response.data.errorMessage === 'outOfRange') {
        Swal.fire({
          icon: 'warning',
          text: '為求飲食均衡，不建議將營養素過度集中攝取於某一餐，請重新輸入'
        })
      }
    }
  })

  $('#generateDayMeals').click(async function () {
    const webUrl = window.location.search
    const splitUrl = webUrl.split('=')
    let date = splitUrl[1]
    if (!date) {
      date = moment().format('YYYY-MM-DD')
    }
    try {
      await axios.post('/api/1.0/food/multiple', { date }, { headers: { Authorization: `Bearer ${accessToken}` } })
      // console.log('getMeal', getMeal, 'date', date)
      window.location.href = `/diary.html?date=${date}`
    } catch (err) {
      Swal.fire({
        icon: 'warning',
        text: err.response.data.errorMessage
      })
    }
  })

  const webUrl = window.location.search
  const splitUrl = webUrl.split('=')
  let date = splitUrl[1]
  if (!date) {
    date = moment().format('YYYY-MM-DD')
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
    const date = followingDate
    window.location.href = `/diary.html?date=${date}`
  })

  /* 注入隱形input box for 使用者快速選取日期 */
  $('#showDate').click((e) => {
    const clickedDate = $(e.target).parent()
    clickedDate.children().show()
    clickedDate.children().next().hide()
  })
  // TODO: 目前用onblur，還是應該改成用按鈕跳轉？
  function chooseDate() {
    const clickedDate = $('#showDate')
    clickedDate.children().prev().hide()
    const date = $('#datepicker').val()
    clickedDate.children().next().text(date)
    clickedDate.children().next().show()
    window.location.href = `/diary.html?date=${date}`
  }

  $('#generateOneMeal').click(function () {
    const currenDate = $('#currentDate').val()
    const dateA = new Date(currenDate)
    const dateB = dateA - (1000 * 60 * 60 * 24)
    // console.log('dateB', dateB)
  })

  /* 取得飲食紀錄資訊 */
  const getDate = $('#showDate')
  const getBreakfast = $('#breakfastRecord')
  const getLunch = $('#lunchRecord')
  const getDinner = $('#dinnerRecord')
  const getSnack = $('#snackRecord')

  async function getDiaryRecord(date) {
    const diaryRecord = await axios.get(`/api/1.0/food/diary?date=${date}`, { headers: { Authorization: `Bearer ${accessToken}` } })
    getDate.append(`<span class="text-secondary" id="currentDate" title="以日曆切換至指定日期">${date}</span>`)

    const breakfast = diaryRecord.data.mealRecords.mealRecords.filter(e => e.meal === 1)
    const [breakfastSummary] = diaryRecord.data.mealRecords.recordSummary.filter(e => e.meal === 1)

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
          { name: 'amountTotal', type: 'number', width: 50, editing: true },
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
      $('#breakfastTotal').show()
      $('#breakfastCaloriesTotal').text(breakfastSummary.caloriesTotal)
      $('#breakfastCarbsTotal').text(`${breakfastSummary.carbsTotal}g`)
      $('#breakfastProteinTotal').text(`${breakfastSummary.proteinTotal}g`)
      $('#breakfastFatTotal').text(`${breakfastSummary.fatTotal}g`)
    }

    /* 午餐 */
    const lunch = diaryRecord.data.mealRecords.mealRecords.filter(e => e.meal === 2)
    const [lunchSummary] = diaryRecord.data.mealRecords.recordSummary.filter(e => e.meal === 2)
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
          { name: 'amountTotal', type: 'number', width: 50, editing: true },
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
      $('#lunchTotal').show()
      $('#lunchCaloriesTotal').text(lunchSummary.caloriesTotal)
      $('#lunchCarbsTotal').text(`${lunchSummary.carbsTotal}g`)
      $('#lunchProteinTotal').text(`${lunchSummary.proteinTotal}g`)
      $('#lunchFatTotal').text(`${lunchSummary.fatTotal}g`)
    }

    /* 晚餐 */
    const dinner = diaryRecord.data.mealRecords.mealRecords.filter(e => e.meal === 3)
    const [dinnerSummary] = diaryRecord.data.mealRecords.recordSummary.filter(e => e.meal === 3)
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
          { name: 'amountTotal', type: 'number', width: 50, editing: true },
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
      $('#dinnerTotal').show()
      $('#dinnerCaloriesTotal').text(dinnerSummary.caloriesTotal)
      $('#dinnerCarbsTotal').text(`${dinnerSummary.carbsTotal}g`)
      $('#dinnerProteinTotal').text(`${dinnerSummary.proteinTotal}g`)
      $('#dinnerFatTotal').text(`${dinnerSummary.fatTotal}g`)
    }

    /* 點心 */
    const snack = diaryRecord.data.mealRecords.mealRecords.filter(e => e.meal === 4)
    const [snackSummary] = diaryRecord.data.mealRecords.recordSummary.filter(e => e.meal === 4)
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
          { name: 'amountTotal', type: 'number', width: 50, editing: true },
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
      $('#snackTotal').show()
      $('#snackCaloriesTotal').text(snackSummary.caloriesTotal)
      $('#snackCarbsTotal').text(`${snackSummary.carbsTotal}g`)
      $('#snackProteinTotal').text(`${snackSummary.proteinTotal}g`)
      $('#snackFatTotal').text(`${snackSummary.fatTotal}g`)
    }

    /* 總計圓餅圖 */
    $('#dailyCaloriesTotal').text(diaryRecord.data.caloriesTotal)
    $('#dailyCarbsTotal').text(`${diaryRecord.data.carbsTotal}g`)
    $('#dailyProteinTotal').text(`${diaryRecord.data.proteinTotal}g`)
    $('#dailyFatTotal').text(`${diaryRecord.data.fatTotal}g`)
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
      const config = {
        displayModeBar: false // this is the line that hides the bar.
      }
      pie = document.querySelector('#pieChart')
      Plotly.newPlot(pie, pieData.data, pieData.layout, config)
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

  /* 頁面導覽 */
  $('#hint').click(function () {
    $('.pop-background').fadeIn(100)
    $('.pop-window').fadeIn(100)
  })
  $('.pop-background').click(function () {
    $('.pop-background').fadeOut(200)
    $('.pop-window').fadeOut(200)
  })
}
