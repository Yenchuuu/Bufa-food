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

  $('#weekSubmit').click(async function () {
    $('.hiddenChart').show()
    const weekVal = $('#weekPicker').val()
    const year = weekVal.split('-')[0]
    const week = parseInt(weekVal.split('-')[1].split('W')[1])
    // FIXME: 不知道為什麼2022年的週數都會少一，但+1週後2023的日期又會錯
    const startDate = moment().year(year).week((week + 1)).format('YYYY-MM-DD')
    const endDate = moment(startDate, 'YYYY-MM-DD').add(6, 'day').format('YYYY-MM-DD')

    const data = await axios.get(`/api/1.0/user/footprint?date=${startDate}`, { headers: { Authorization: `Bearer ${accessToken}` } })
    // console.log('data: ', data);

    const calories = document.getElementById('calories').getContext('2d')

    const caloriesChart = new Chart(calories, {
      type: 'bar',
      data: {
        datasets: [
          {
            label: '累積',
            data: data.data.dailyCaloriesArray,
            backgroundColor: [
              'rgba(75, 192, 192, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(75, 192, 192, 0.2)'
            ],
            borderColor: [
              'rgba(75, 192, 192, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(75, 192, 192, 0.2)'
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
              'rgba(54, 162, 235, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(54, 162, 235, 0.2)'
            ],
            borderColor: [
              'rgba(54, 162, 235, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(54, 162, 235, 0.2)'
            ],
            borderWidth: 1
          },
          {
            label: '蛋白質',
            data: data.data.dailyProteinArray,
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(255, 99, 132, 0.2)',
              'rgba(255, 99, 132, 0.2)',
              'rgba(255, 99, 132, 0.2)',
              'rgba(255, 99, 132, 0.2)',
              'rgba(255, 99, 132, 0.2)',
              'rgba(255, 99, 132, 0.2)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(255, 99, 132, 0.2)',
              'rgba(255, 99, 132, 0.2)',
              'rgba(255, 99, 132, 0.2)',
              'rgba(255, 99, 132, 0.2)',
              'rgba(255, 99, 132, 0.2)',
              'rgba(255, 99, 132, 0.2)'
            ],
            borderWidth: 1
          },
          {
            label: '脂肪',
            data: data.data.dailyFatArray,
            backgroundColor: [
              'rgba(75, 192, 192, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(75, 192, 192, 0.2)'
            ],
            borderColor: [
              'rgba(75, 192, 192, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(75, 192, 192, 0.2)'
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
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 0.2)',
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
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 0.2)',
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
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 0.2)',
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
  })
}
