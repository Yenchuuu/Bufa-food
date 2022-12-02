const userId = window.localStorage.getItem('userId')

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

  $(document).ready(async function () {
    const webUrl = window.location.search
    const splitUrl = webUrl.split('=')[1]
    console.log('splitUrl: ', splitUrl);
    // const weekVal = $('#weekPicker').val()
    if (splitUrl === undefined) {
      const today = moment().format('YYYY-MM-DD')
      const dayOfweek = moment(today).day()
      const startDate = moment(today).add(-(dayOfweek - 1), 'day').format('YYYY-MM-DD')
      const endDate = moment(today).add((7 - dayOfweek), 'day').format('YYYY-MM-DD')

      const data = await axios.get(`/api/1.0/user/footprint?date=${startDate}`, { headers: { Authorization: `Bearer ${accessToken}` } })
      chart(data)
      $('#weekInfo').text(`當週數據 ( ${startDate} ~ ${endDate} )`)
    } else {
      const startDate = splitUrl
      const data = await axios.get(`/api/1.0/user/footprint?date=${startDate}`, { headers: { Authorization: `Bearer ${accessToken}` } })
      const endDate = moment(startDate).add(6, 'day').format('YYYY-MM-DD')
      chart(data)
      $('#weekInfo').text(`彙總數據 ( ${startDate} ~ ${endDate} )`)
    }
  })

  $('#weekSubmit').click(async function () {
    $('#currentWeek').hide()
    const weekVal = $('#weekPicker').val()
    const year = weekVal.split('-')[0]
    const week = parseInt(weekVal.split('-')[1].split('W')[1])
    // FIXME: 不知道為什麼2022年的週數都會少一，但+1週後2023的日期又會錯
    const dayInChosenWeek = moment().year(year).week((week + 1)).format('YYYY-MM-DD')
    /* 選取某週取到的日期會因為今天星期幾而有所不同，所以先辨識出今天星期幾，再分別推斷星期一與星期日作為start and end date */
    const dayOfweek = moment(dayInChosenWeek).day()
    const startDate = moment(dayInChosenWeek).add(-(dayOfweek - 1), 'day').format('YYYY-MM-DD')
    const endDate = moment(dayInChosenWeek).add((7 - dayOfweek), 'day').format('YYYY-MM-DD')

    window.location.href = `/footprint.html?date=${startDate}`
  })
  function chart(data) {
    const calories = document.getElementById('calories').getContext('2d')

    const caloriesChart = new Chart(calories, {
      type: 'bar',
      data: {
        datasets: [
          {
            label: '累積',
            data: data.data.dailyCaloriesArray,
            backgroundColor: [
              'rgb(205, 194, 174, 1)',
              'rgb(205, 194, 174, 1)',
              'rgb(205, 194, 174, 1)',
              'rgb(205, 194, 174, 1)',
              'rgb(205, 194, 174, 1)',
              'rgb(205, 194, 174, 1)',
              'rgb(205, 194, 174, 1)'
            ],
            borderColor: [
              'rgb(205, 194, 174, 1)',
              'rgb(205, 194, 174, 1)',
              'rgb(205, 194, 174, 1)',
              'rgb(205, 194, 174, 1)',
              'rgb(205, 194, 174, 1)',
              'rgb(205, 194, 174, 1)',
              'rgb(205, 194, 174, 1)'
            ],
            borderWidth: 1
          },
          {
            label: '目標',
            fill: false,
            pointRadius: 2,
            showLine: true,
            data: data.data.goalCaloriesArray,
            type: 'line'
          }
        ],
        labels: ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日']
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    })

    const nutrition = document.getElementById('nutrition').getContext('2d')

    const nutritionChart = new Chart(nutrition, {
      type: 'bar',
      data: {
        datasets: [
          {
            label: '碳水化合物',
            data: data.data.dailyCarbsArray,
            backgroundColor: [
              'rgb(205, 194, 174, 1)',
              'rgb(205, 194, 174, 1)',
              'rgb(205, 194, 174, 1)',
              'rgb(205, 194, 174, 1)',
              'rgb(205, 194, 174, 1)',
              'rgb(205, 194, 174, 1)',
              'rgb(205, 194, 174, 1)'
            ],
            borderColor: [
              'rgb(205, 194, 174, 1)',
              'rgb(205, 194, 174, 1)',
              'rgb(205, 194, 174, 1)',
              'rgb(205, 194, 174, 1)',
              'rgb(205, 194, 174, 1)',
              'rgb(205, 194, 174, 1)',
              'rgb(205, 194, 174, 1)'
            ],
            borderWidth: 1
          },
          {
            label: '蛋白質',
            data: data.data.dailyProteinArray,
            backgroundColor: [
              'rgb(194, 222, 209, 1)',
              'rgb(194, 222, 209, 1)',
              'rgb(194, 222, 209, 1)',
              'rgb(194, 222, 209, 1)',
              'rgb(194, 222, 209, 1)',
              'rgb(194, 222, 209, 1)',
              'rgb(194, 222, 209, 1)'
            ],
            borderColor: [
              'rgb(194, 222, 209, 1)',
              'rgb(194, 222, 209, 1)',
              'rgb(194, 222, 209, 1)',
              'rgb(194, 222, 209, 1)',
              'rgb(194, 222, 209, 1)',
              'rgb(194, 222, 209, 1)',
              'rgb(194, 222, 209, 1)'
            ],
            borderWidth: 1
          },
          {
            label: '脂肪',
            data: data.data.dailyFatArray,
            backgroundColor: [
              'rgb(236, 229, 199, 1)',
              'rgb(236, 229, 199, 1)',
              'rgb(236, 229, 199, 1)',
              'rgb(236, 229, 199, 1)',
              'rgb(236, 229, 199, 1)',
              'rgb(236, 229, 199, 1)',
              'rgb(236, 229, 199, 1)'
            ],
            borderColor: [
              'rgb(236, 229, 199, 1)',
              'rgb(236, 229, 199, 1)',
              'rgb(236, 229, 199, 1)',
              'rgb(236, 229, 199, 1)',
              'rgb(236, 229, 199, 1)',
              'rgb(236, 229, 199, 1)',
              'rgb(236, 229, 199, 1)'
            ],
            borderWidth: 1
          },
          {
            label: '目標碳水化合物',
            fill: false,
            showLine: false,
            pointRadius: 4,
            pointHoverRadius: 7,
            data: data.data.goalCarbsArray,
            backgroundColor: 'rgb(205, 194, 174, 1)',
            borderColor: 'rgb(205, 194, 174, 1)',
            type: 'line'
          },
          {
            label: '目標蛋白質',
            fill: false,
            showLine: false,
            pointStyle: 'triangle',
            pointRadius: 4,
            pointHoverRadius: 7,
            data: data.data.goalProteinArray,
            backgroundColor: 'rgb(194, 222, 209, 1)',
            borderColor: 'rgb(194, 222, 209, 1)',
            type: 'line'
          },
          {
            label: '目標脂肪',
            fill: false,
            showLine: false,
            pointStyle: 'rectRot',
            pointRadius: 6,
            pointHoverRadius: 9,
            data: data.data.goalFatArray,
            backgroundColor: 'rgb(236, 229, 199, 1)',
            borderColor: 'rgb(236, 229, 199, 1)',
            type: 'line'
          }
        ],
        labels: ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日']
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    })
  }
}
