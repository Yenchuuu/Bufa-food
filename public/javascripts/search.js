
/* 熱門食物排行榜top 5 */
const foodTrendElement = document.getElementById('food_trend')
async function getFoodTrendInfo() {
  const foodTrendInfo = await axios.get('/api/1.0/food/trend')
  // console.log('foodTrendInfo', foodTrendInfo);
  const foodTrend = foodTrendInfo.data.trendFood
  foodTrend.map(food =>
    foodTrendElement.innerHTML += `<a href="/detail.html?id=${food.food_id}" class="btn btn-outline-secondary">${food.name}</a>`
  )
}
getFoodTrendInfo()

/* 猜你喜歡的三樣食物 */
const accessToken = window.localStorage.getItem('accessToken')
const userId = window.localStorage.getItem('userId')

if (!accessToken) {
  $('#guess_title').hide()
  $('#hidden-div').show()
} else {
  $('#nav-profile-change').children().hide()
  $('#nav-profile-change').append('<a class="nav-link active" href="#" id="logout-btn">登出</a>')

  const currentUserId = window.localStorage.getItem('userId')
  const guessUserElement = document.getElementById('guess_user_preference')
  async function getUserRecommendation(currentUserId) {
    const foodRecommendInfo = await axios.get(`/api/1.0/food/recommend?currentUserId=${currentUserId}`, { headers: { Authorization: `Bearer ${accessToken}` } })
    console.log('foodRecommendInfo', foodRecommendInfo)
    const foodRecommendation = foodRecommendInfo.data.foodNutritionInfo
    foodRecommendation.map(recommendation =>
      guessUserElement.innerHTML += `<a href="/detail.html?id=${recommendation.id}"><div class="card text-center"><div style="padding:5px" class="card-header"></div><div class="card-body"><div class="row card-body-title"><div class="col-5"></div><div class="col-7"><ul class="nav nav-pills"><li class="nav-card-title"><p class="text-secondary">熱量<br>kcal</br></p></li><li class="nav-card-title"><p class="text-secondary">碳水化合物</p></li><li class="nav-card-title"><p class="text-secondary">蛋白質</p></li><li class="nav-card-title"><p class="text-secondary">脂肪</p></li></ul></div></div><div class="row card-body-title"><div class="col-5 text-secondary card-body-text">${recommendation.name}</div><div class="col-7"><ul class="nav nav-pills"><li class="nav-card-title"><p class="text-secondary">${recommendation.calories}</p></li><li class="nav-card-title"><p class="text-secondary">${recommendation.carbs}g</p></li><li class="nav-card-title"><p class="text-secondary">${recommendation.protein}g</p></li><li class="nav-card-title"><p class="text-secondary">${recommendation.fat}g</p></li></ul></div></div></div></a>`
    )
  }
  getUserRecommendation(currentUserId)
}

function loadData(query) {
  fetch(`/api/1.0/food/search?key=${query}`)
    .then(function (response) {
      return response.json()
    })
    .then(function (responseData) {
      let html = '<ul class="list-group">'
      const len = responseData.length
      if (len > 0) {
        for (let i = 0; i < len; i++) {
          // RegExp 物件被用來比對符合自訂規則的文字
          const regularExpression = new RegExp(`(${query})`)
          // span 中的$1表示搜尋的關鍵字
          html += `<a href="/detail.html?id=${responseData[i].id}" class="list-group-item list-group-item-action" onclick="getText(this)">${responseData[i].name.replace(regularExpression, '<span class="text-secondary fw-bold">$1</span>')}</a>`
        }
      } else {
        html += '<a href="#" class="list-group-item list-group-item-action disabled">No Data Found</a>'
      }
      html += '</ul>'
      document.getElementById('search_result').innerHTML = html
    })
}

const searchElement = document.getElementById('autocomplete_search')

// 追蹤使用者輸入的字元，並執行query
searchElement.onkeyup = function () {
  const query = searchElement.value
  loadData(query)
}

/* 滾動網頁時將搜尋結果隱藏 */
function myFunction() {
  $('#search_result').hide()
  $('#autocomplete_search').blur()
}

// 使用者點選input顯示搜尋結果
searchElement.onfocus = function () {
  $('#search_result').show()
  // let query = searchElement.value;
  // loadData(query)
}

function getText(event) {
  // console.log('event', event);
  const foodName = event.textContent
  // console.log(foodName)
  document.getElementById('autocomplete_search').value = foodName
  // document.getElementById('search_result').innerHTML = '';
}

/* 點選 按此建立 時跳出的彈窗 */
$('#add_food').click(function () {
  if (!accessToken) {
    Swal.fire({
      icon: 'warning',
      text: '請先登入'
    })
    return
  }
  $('.pop-background').fadeIn(100)
  $('.pop-window').fadeIn(100)
})
$('.pop-background').click(function () {
  $('.pop-background').fadeOut(200)
  $('.pop-window').fadeOut(200)
})

function checkFoodname() {
  const reg = new RegExp('^[A-Za-z0-9\u4e00-\u9fa5]+$')
  const name = $('#name').val().trim()
  if (!reg.test(name) || validator.isNumeric(name)) {
    Swal.fire({
      icon: 'warning',
      text: '請重新輸入食物名稱',
      footer: '註：請檢查名稱是否為有效文字(不應空白、輸入純數字或包含特殊符號，字數上限為20字元)'
    })
    $('#name').val('')
  }
}

$('#submit_foodInfo').click(async function () {
  const name = $('#name').val()
  let calories = $('#calories').val()
  let carbs = $('#carbs').val()
  let protein = $('#protein').val()
  let fat = $('#fat').val()
  let perServing = $('#per_serving').val()

  /* 若數字為0將被判斷為true，故不將C P F檢查放置於此 */
  if (!perServing || !calories) {
    Swal.fire({
      icon: 'warning',
      text: '填寫資訊不完整',
      footer: '註：請檢查每個欄位是否皆已填寫完全且不包含特殊符號'
    })
    return
  }

  if (calories < 1 || perServing < 1) {
    Swal.fire({
      icon: 'warning',
      text: '請確認份量資訊',
      footer: '註：份量與熱量資訊不應小於1'
    })
    return
  }

  if (!validator.isInt(calories) || !validator.isInt(perServing) || !validator.isInt(carbs, { min: 0 }) || !validator.isInt(protein, { min: 0 }) || !validator.isInt(fat, { min: 0 })) {
    Swal.fire({
      icon: 'warning',
      text: '各項營養素皆須填寫且為正整數'
    })
    return
  }

  calories = parseInt(calories)
  carbs = parseInt(carbs)
  protein = parseInt(protein)
  fat = parseInt(fat)
  perServing = parseInt(perServing)

  if ((carbs + protein + fat) > perServing) {
    Swal.fire({
      icon: 'warning',
      text: '請確認營養素資訊填寫是否正確',
      footer: '註：碳水化合物、蛋白質與脂肪的克數總和不應大於每份量克數'
    })
    return
  }

  /* 因熱量來源最高為脂肪(1g = 9 kcal)，故熱量理當不該超過份量*9 */
  if ((carbs * 4 + protein * 4 + fat * 9) > calories || calories > perServing * 9) {
    Swal.fire({
      icon: 'warning',
      text: '請確認熱量資訊填寫是否正確',
      footer: '輸入之熱量值不應小於營養素所產生之熱量<br>註：1g碳水化合物與蛋白質能提供4 kcal的熱量，脂肪為9 kcal'
    })
    return
  }

  const data = await axios.post('/api/1.0/food/detail', { name, calories, carbs, protein, fat, perServing }, { headers: { Authorization: `Bearer ${accessToken}` } })
  // console.log('data: ', data)
  if (data.data.error) {
    Swal.fire({
      icon: 'warning',
      text: '建立失敗，請再試一次'
    })
  } else if (data.data.message) {
    Swal.fire({
      icon: 'success',
      title: '建立成功',
      footer: '<a href="/mine.html" class="text-secondary">前往我的食物</a>'
    })
  }
})

$('#nav-profile-change').click(() => {
  localStorage.clear()
  window.location.href = '/index.html'
})
