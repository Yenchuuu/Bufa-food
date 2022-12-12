const userId = window.localStorage.getItem('userId')

const accessToken = window.localStorage.getItem('accessToken')

if (accessToken) {
  $('#nav-profile-change').children().hide()
  $('#nav-profile-change').append('<a class="nav-link active" href="#" id="logout-btn">登出</a>')
}

$('#nav-profile-change').click(() => {
  localStorage.clear()
  window.location.href = '/index.html'
})

const webUrl = window.location.search
// console.log(webUrl);
const splitUrl = webUrl.split('=')
const foodId = splitUrl[1]
if (!foodId) {
  window.location.href = '/search.html'
}
// console.log('foodId', foodId);
getFoodDetail(foodId)

async function getFoodDetail(foodId) {
  const detail = await axios.get(`/api/1.0/food/detail?id=${foodId}`)
  // console.log('detail', detail);
  if (detail.data.foodDetail.length === 0) {
    window.location.href = '/search.html'
  }
  const foodDetailInfo = detail.data.foodDetail[0]
  // console.log('foodDetailInfo', foodDetailInfo)
  $('#foodName').append(`<h4 class="text-secondary" id="food_name">${foodDetailInfo.name}</h4>`)
  $('#foodServing').append(`<p class="text-secondary">${foodDetailInfo.per_serving}g</p>`)
  $('#foodCalories').append(`<p class="text-secondary">${foodDetailInfo.calories}</p>`)
  $('#foodCarbs').append(`<p class="text-secondary">${foodDetailInfo.carbs}g</p>`)
  $('#foodProtein').append(`<p class="text-secondary">${foodDetailInfo.protein}g</p>`)
  $('#foodFat').append(`<p class="text-secondary">${foodDetailInfo.fat}g</p>`)
  const carbsPercentage = foodDetailInfo.carbs * 4 / foodDetailInfo.calories
  const proteinPercentage = foodDetailInfo.protein * 4 / foodDetailInfo.calories
  const fatPercentage = foodDetailInfo.fat * 9 / foodDetailInfo.calories
  const pieData = [{
    values: [carbsPercentage, proteinPercentage, fatPercentage],
    labels: ['碳水化合物', '蛋白質', '脂肪'],
    type: 'pie',
    marker: {
      colors: ['#607D8B', '#9E9E9E', '#EF9A9A']
    }
  }]
  pie = document.querySelector('#nutritionPie')
  Plotly.newPlot(pie, pieData)
}

$(document).ready(async function () {
  if (!accessToken) {
    $('#add_collection').append('<i class="click_icon fa-regular fa-heart" title="收藏"></i>')
    $('#thumb_up').append('<i class="click_icon fa-regular fa-thumbs-up" title="喜歡"></i>')
    $('#thumb_down').append('<i class="click_icon fa-regular fa-thumbs-down" title="不喜歡"></i>')
    $('#add_exclusiion').append('<i class="click_icon fa-regular fa-circle-xmark" title="挑食"></i>')
    $('#add_diary').append('<i class="click_icon fa-regular fa-calendar-plus" title="新增至飲食紀錄"></i>')
  } else {
    $('#add_diary').append('<i class="click_icon fa-regular fa-calendar-plus" title="新增至飲食紀錄"></i>')
    const data = await axios.get(`/api/1.0/user/preference?id=${userId}`, { headers: { Authorization: `Bearer ${accessToken}` } })
    // console.log('data', data);
    const preference = data.data.preference.filter(e => e.food_id == foodId)
    if (preference.length === 0) {
      $('#add_collection').append('<i class="click_icon fa-regular fa-heart" title="收藏"></i>')
      $('#thumb_up').append('<i class="click_icon fa-regular fa-thumbs-up" title="喜歡"></i>')
      $('#thumb_down').append('<i class="click_icon fa-regular fa-thumbs-down" title="不喜歡"></i>')
      $('#add_exclusiion').append('<i class="click_icon fa-regular fa-circle-xmark" title="挑食"></i>')
      return
    }
    if (preference[0].collection === 0) {
      $('#add_collection').append('<i class="click_icon fa-regular fa-heart" title="收藏"></i>')
    } else if (preference[0].collection === 1) {
      $('#add_collection').append('<i class="click_icon fa-solid fa-heart" title="取消收藏"></i>')
    }

    if (preference[0].likeIt === 0) {
      $('#thumb_up').append('<i class="click_icon fa-regular fa-thumbs-up" title="喜歡"></i>')
    } else if (preference[0].likeIt === 1) {
      $('#thumb_up').append('<i class="click_icon fa-solid fa-thumbs-up" title="收回喜歡"></i>')
    }
    if (preference[0].dislikeIt === 0) {
      $('#thumb_down').append('<i class="click_icon fa-regular fa-thumbs-down" title="不喜歡"></i>')
    } else if (preference[0].dislikeIt === 1) {
      $('#thumb_down').append('<i class="click_icon fa-solid fa-thumbs-down" title="收回不喜歡"></i>')
    }
    if (preference[0].exclusion === 0) {
      $('#add_exclusiion').append('<i class="click_icon fa-regular fa-circle-xmark" title="挑食"></i>')
    } else if (preference[0].exclusion === 1) {
      $('#add_exclusiion').append('<i class="click_icon fa-solid fa-circle-xmark" title="取消挑食"></i>')
    }
  }
})

$('.datepicker').datepicker({
  dateFormat: 'yy-mm-dd',
  forceParse: false
})

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  icon: 'success',
  title: 'Your work has been saved',
  showConfirmButton: false,
  timer: 1500
})

// FIXME: 應該是因為用replaceWith的關係，按過的按鈕若沒重整就不能再按一次了
/* 當按下喜歡、不喜歡、不吃以及收藏按鈕時觸發 */
async function updateInfo(iconBtn) {
  const btnVal = $(iconBtn).attr('id')
  const foodName = document.querySelector('#food_name').textContent
  if (!accessToken) {
    Swal.fire({
      icon: 'warning',
      text: '請先登入'
    })
    return
  }
  // console.log('foodName', foodName)
  // if(btnVal === 'add_collection'){
  switch (btnVal) {
    case 'add_collection': {
      const data = await axios.get(`/api/1.0/user/preference?id=${userId}`, { headers: { Authorization: `Bearer ${accessToken}` } })
      // console.log('data', data);
      const collection = data.data.preference.filter(e => e.food_id == foodId)
      // console.log('collection', collection)
      if (collection.length === 0 || collection[0].collection === 0) {
        const setPreference = await axios.patch(`/api/1.0/food/detail?id=${foodId}`, { clickedBtn: btnVal }, { headers: { Authorization: `Bearer ${accessToken}` } })
        $('#add_collection').replaceWith('<i class="click_icon fa-solid fa-heart" title="取消收藏"></i>')
        Toast.fire({
          icon: 'success',
          title: `已將${foodName}加入收藏列表`,
          footer: '<a href="/mine.html" class="text-secondary">前往喜好清單</a>'
        })
      } else if (collection[0].collection === 1) {
        const setPreference = await axios.patch(`/api/1.0/food/detail?id=${foodId}`, { clickedBtn: btnVal }, { headers: { Authorization: `Bearer ${accessToken}` } })
        $('#add_collection').replaceWith('<i class="click_icon fa-regular fa-heart" title="收藏"></i>')
        Toast.fire({
          icon: 'success',
          title: `已將${foodName}從收藏列表移除`,
          footer: '<a href="/mine.html" class="text-secondary">前往喜好清單</a>'
        })
      }
      break
    }
    case 'thumb_up': {
      const data = await axios.get(`/api/1.0/user/preference?id=${userId}`, { headers: { Authorization: `Bearer ${accessToken}` } })
      const likedItem = data.data.preference.filter(e => e.food_id == foodId)
      // console.log('likedItem', likedItem)
      if (likedItem.length === 0 || likedItem[0].likeIt === 0) {
        const setPreference = await axios.patch(`/api/1.0/food/detail?id=${foodId}`, { clickedBtn: btnVal }, { headers: { Authorization: `Bearer ${accessToken}` } })
        $('#thumb_up').replaceWith('<i class="click_icon fa-solid fa-thumbs-up" title="收回喜歡"></i>')
        $('#thumb_down').replaceWith('<i class="click_icon fa-regular fa-thumbs-down" title="不喜歡"></i>')
        $('#add_exclusiion').replaceWith('<i class="click_icon fa-regular fa-circle-xmark" title="挑食"></i>')
        Toast.fire({
          icon: 'success',
          title: `我喜歡${foodName}😍`
        })
      } else if (likedItem[0].likeIt === 1) {
        const setPreference = await axios.patch(`/api/1.0/food/detail?id=${foodId}`, { clickedBtn: btnVal }, { headers: { Authorization: `Bearer ${accessToken}` } })
        $('#thumb_up').replaceWith('<i class="click_icon fa-regular fa-thumbs-up" title="喜歡"></i>')
        Toast.fire({
          icon: 'success',
          title: `收回對${foodName}的喜歡`
        })
      }
      break
    }
    case 'thumb_down': {
      const data = await axios.get(`/api/1.0/user/preference?id=${userId}`, { headers: { Authorization: `Bearer ${accessToken}` } })
      const dislikedItem = data.data.preference.filter(e => e.food_id == foodId)
      // console.log('dislikedItem', dislikedItem)
      if (dislikedItem.length === 0 || dislikedItem[0].dislikeIt === 0) {
        const setPreference = await axios.patch(`/api/1.0/food/detail?id=${foodId}`, { clickedBtn: btnVal }, { headers: { Authorization: `Bearer ${accessToken}` } })
        $('#thumb_down').replaceWith('<i class="click_icon fa-solid fa-thumbs-down" title="收回不喜歡"></i>')
        $('#thumb_up').replaceWith('<i class="click_icon fa-regular fa-thumbs-up" title="喜歡"></i>')
        Toast.fire({
          icon: 'success',
          title: `我不喜歡${foodName}🤢`
        })
      } else if (dislikedItem[0].dislikeIt === 1) {
        const setPreference = await axios.patch(`/api/1.0/food/detail?id=${foodId}`, { clickedBtn: btnVal }, { headers: { Authorization: `Bearer ${accessToken}` } })
        $('#thumb_down').replaceWith('<i class="click_icon fa-regular fa-thumbs-down" title="不喜歡"></i>')
        Toast.fire({
          icon: 'success',
          title: `收回對${foodName}的不喜歡`
        })
      }
      break
    }
    case 'add_exclusiion': {
      const data = await axios.get(`/api/1.0/user/preference?id=${userId}`, { headers: { Authorization: `Bearer ${accessToken}` } })
      const exclusion = data.data.preference.filter(e => e.food_id == foodId)
      // console.log('exclusion', exclusion)
      if (exclusion.length === 0 || exclusion[0].exclusion === 0) {
        const setPreference = await axios.patch(`/api/1.0/food/detail?id=${foodId}`, { clickedBtn: btnVal }, { headers: { Authorization: `Bearer ${accessToken}` } })
        $('#add_exclusiion').replaceWith('<i class="click_icon fa-solid fa-circle-xmark" title="取消挑食"></i>')
        $('#thumb_up').replaceWith('<i class="click_icon fa-regular fa-thumbs-up" title="喜歡"></i>')
        Toast.fire({
          icon: 'success',
          title: `我不吃${foodName}😵`,
          footer: '<a href="/mine.html" class="text-secondary">前往喜好清單</a>'
        })
      } else if (exclusion[0].exclusion === 1) {
        const setPreference = await axios.patch(`/api/1.0/food/detail?id=${foodId}`, { clickedBtn: btnVal }, { headers: { Authorization: `Bearer ${accessToken}` } })
        $('#add_exclusiion').replaceWith('<i class="click_icon fa-regular fa-circle-xmark" title="挑食"></i>')
        Toast.fire({
          icon: 'success',
          title: `將${foodName}從挑食清單中移除`,
          footer: '<a href="/mine.html" class="text-secondary">前往喜好清單</a>'
        })
      }
      break
    }
  }
}

// function updateInfo(iconBtn){
// alert($(iconBtn).attr('id'))
// }

// $('#thumb_up').click(function() {
//   const btn = $('#thumb_up').attr('id')
//   alert('trigger worked!')
// })

/* 點選 + 時跳出的彈窗 */
$('#add_diary').click(function () {
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

$('#addMealRecord').click(async function () {
  let meal = $('#inputGroupSelectMeal').val()
  meal = parseInt(meal)
  let servingAmount = $('#serving_amount').val()
  servingAmount = parseInt(servingAmount)
  const date = $('#datepicker').val()
  // console.log(foodId, meal,servingAmount, date);
  if (meal === '選餐') {
    Swal.fire({
      icon: 'error',
      title: '請選擇要建立於哪一餐'
    })
  } else if (!date) {
    Swal.fire({
      icon: 'error',
      title: '請選擇要建立之日期'
    })
  } else if (!servingAmount || servingAmount < 1) {
    Swal.fire({
      icon: 'error',
      title: '請輸入有效數字'
    })
  } else if (servingAmount > 500) {
    Swal.fire(
      '真的要吃這麼多嗎？請注意營養均衡喔～',
      'question'
    )
  } else {
    try {
      await axios.post(`/api/1.0/food/mealrecord?id=${foodId}`, { userId, foodId, meal, servingAmount, date }, { headers: { Authorization: `Bearer ${accessToken}` } })
      Swal.fire({
        icon: 'success',
        title: '新增成功',
        footer: `<a href="/diary.html?date=${date}" class="text-secondary">前往${date}飲食紀錄</a>`
      })
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: '新增失敗，請再試一次'
      })
    }
  }
})
