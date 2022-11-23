const userName = window.localStorage.getItem('userName')
const userId = window.localStorage.getItem('userId')
const userEmail = window.localStorage.getItem('userEmail')

const accessToken = window.localStorage.getItem('accessToken')
// console.log('accessToken: ', accessToken);
if (!accessToken) {
  alert('請先登入')
  window.location.href = '/index.html'
}

$(document).ready(async function () {
  const data = await axios.get('/api/1.0/user/profile', { headers: { Authorization: `Bearer ${accessToken}` } })
  const gender = { 1: '生理女', 2: '生理男' }
  const goal = { 1: '減脂', 2: '維持', 3: '增肌' }
  const activityLevel = { 1: '久坐', 2: '輕度', 3: '中度', 4: '高度', 5: '非常高度' }
  const userInfo = data.data.data
  if (userInfo.TDEE === null) {
    alert('請先完成身體資訊之填寫')
    window.location.href = '/target.html'
  }
  $('#userName').append(userInfo.name)
  $('#userBirthday').append(userInfo.birthday)
  $('#userGender').append(Object.values(gender[userInfo.gender]))
  $('#userHeight').append(userInfo.height)
  $('#userWeight').append(userInfo.weight)
  $('#userActivity').append(Object.values(activityLevel[userInfo.activityLevel]))
  $('#userTDEE').append(userInfo.TDEE)
  $('#dietGoal').append(Object.values(goal[userInfo.dietGoal]))
  $('#goalCalories').append(userInfo.goalCalories)
  $('#goalCarbs').append(userInfo.goalCarbs)
  $('#goalProtein').append(userInfo.goalProtein)
  $('#goalFat').append(userInfo.goalFat)
  $('#self-photo').append(`<img src="${userInfo.picture}" class="self-photo" />`)
})

$('#edit-user-info').click(function () {
  $('.pop-background').fadeIn(100)
  $('.pop-window').fadeIn(100)
})
$('.pop-background').click(function () {
  $('.pop-background').fadeOut(200)
  $('.pop-window').fadeOut(200)
})

$('.datepicker').datepicker({
  dateFormat: 'yy-mm-dd',
  forceParse: false
})

$('#submit_userInfo').click(async function () {
  const name = $('#name').val()
  const birthday = $('#datepicker').val()
  let gender = $('#gender').val()
  gender = parseInt(gender)
  let height = $('#height').val()
  height = parseInt(height)
  let weight = $('#weight').val()
  weight = parseInt(weight)
  let activity_level = $('#activity_level').val()
  activity_level = parseInt(activity_level)
  let diet_goal = $('#diet_goal').val()
  diet_goal = parseInt(diet_goal)

  // console.log('data', name, birthday, height, weight, gender, activity_level, diet_goal)

  if (!name || !birthday || !height || !weight || !gender || !activity_level || !diet_goal) {
    Swal.fire({
      icon: 'warning',
      text: '資訊輸入不完全'
    })
    return
  }

  await axios.patch(`/api/1.0/user/profile/account/${userId}`, { name }, { headers: { Authorization: `Bearer ${accessToken}` } })

  const data = await axios.patch(`/api/1.0/user/profile/bodyinfo/${userId}`, { birthday, height, weight, gender, activity_level, diet_goal }, { headers: { Authorization: `Bearer ${accessToken}` } })
  // console.log('data: ', data)
  if (data.data.message) {
    alert('設定成功')
    window.location.href = '/profile.html'
  } else {
    alert('請再試一次')
  }
})

$('#edit-nutrition-goal').click(async function () {
  $('#nutririon-input').show()
})

$('#submit_nutritionInfo').click(async function () {
  const userInfo = await axios.get('/api/1.0/user/profile/', { headers: { Authorization: `Bearer ${accessToken}` } })
  const TDEE = userInfo.data.data.TDEE
  let goal_calories = $('#calories').val()
  goal_calories = parseInt(goal_calories)
  let goal_carbs_percantage = $('#carbs').val()
  goal_carbs_percantage = parseInt(goal_carbs_percantage)
  let goal_protein_percantage = $('#protein').val()
  goal_protein_percantage = parseInt(goal_protein_percantage)
  let goal_fat_percantage = $('#fat').val()
  goal_fat_percantage = parseInt(goal_fat_percantage)

  if (!goal_carbs_percantage || !goal_protein_percantage || !goal_fat_percantage) {
    Swal.fire({
      icon: 'warning',
      text: '碳水化合物、蛋白質與脂肪之比例應均衡分配'
    })
    return
  } else if ((goal_carbs_percantage + goal_protein_percantage + goal_fat_percantage) !== 100) {
    Swal.fire({
      icon: 'warning',
      text: '碳水化合物、蛋白質與脂肪之比例加總應為100(%)'
    })
    return
  } else if (goal_calories < 0.5 * TDEE) {
    Swal.fire({
      icon: 'warning',
      text: '一日熱量攝取量過低，請調整！'
    })
    return
  }

  const data = await axios.patch(`/api/1.0/user/profile/nutritiontarget/${userId}`, { goal_calories, goal_carbs_percantage, goal_protein_percantage, goal_fat_percantage }, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (data.data.message) {
    alert('設定成功')
    window.location.href = '/profile.html'
  } else {
    alert('請再試一次')
  }
})
