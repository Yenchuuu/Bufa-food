const userId = window.localStorage.getItem('userId')
const accessToken = window.localStorage.getItem('accessToken')
if (!accessToken) {
  alert('請先登入')
  window.location.href = '/index.html'
}

(async function () {
  const userInfo = await axios.get('/api/1.0/user/profile', { headers: { Authorization: `Bearer ${accessToken}` } })
  if (userInfo.data.data.TDEE) {
    alert('您已填寫過目標資訊囉😀')
    window.location.href = '/profile.html'
  }
})()

$('.datepicker').datepicker({
  dateFormat: 'yy-mm-dd',
  forceParse: false
})

// const height = $('#height').val()
// const weight = $('#weight').val()
const height = 165
const weight = 46

// FIXME: 抓不到 value
console.log('height: ', height)
console.log('weight: ', weight)

let gender
function genderVal(genderBtn) {
  gender = ($(genderBtn).attr('value'))
  gender = parseInt(gender)
}

// FIXME: 抓不到birthday value
// const birthday = $('#datepicker').attr('value')
const birthday = '1996-08-08'
// console.log('birthday: ', birthday)

// FIXME: 抓不到activityLevel value
// const activityLevel = $('#dropdownMenuButton2').val()
const activity_level = 1

// function activity(dropdownBtn) {
//   activityLevel = ($(dropdownBtn).attr('value'))
//   activityLevel = parseInt(activityLevel)
//   alert(activityLevel)
// }

let BMR, goal_carbs, goal_protein, goal_fat, goal_calories, TDEE
$('#btn_calculateTDEE').click(() => {
  const date = new Date()
  const today = date.toISOString().split('T')[0]
  const age = parseInt(today) - parseInt(birthday)
  console.log('today: ', today)
  console.log('birthday: ', birthday)
  console.log('age: ', age)
  console.log('gender: ', gender)

  if (!birthday || !height || !weight || !gender || !activity_level) {
    Swal.fire({
      icon: 'warning',
      text: '資訊輸入不完全'
    })
  } else {
    switch (gender) {
      case 1: {
        BMR = Math.round(10 * weight + 6.25 * height - 5 * age - 161)
        break
      }
      case 2: {
        BMR = Math.round(10 * weight + 6.25 * height - 5 * age + 5)
      }
    }
    console.log('activity_level: ', activity_level)
    switch (activity_level) {
      case 1: {
        TDEE = Math.round(1.2 * BMR)
        break
      }
      case 2: {
        TDEE = Math.round(1.375 * BMR)
        break
      }
      case 3: {
        TDEE = Math.round(1.55 * BMR)
        break
      }
      case 4: {
        TDEE = Math.round(1.725 * BMR)
        break
      }
      case 5: {
        TDEE = Math.round(1.9 * BMR)
        break
      }
    }
    $('#TDEE').attr('value', TDEE)
  }
})

let diet_goal
function gietGoal(goalBtn) {
  /* 由系統依照diet goal計算default營養素 */
  diet_goal = ($(goalBtn).attr('value'))
  diet_goal = parseInt(diet_goal)
  switch (diet_goal) {
    case 1: {
      goal_calories = Math.round(0.85 * TDEE)
      goal_carbs = Math.round((goal_calories * 0.35) / 4)
      goal_protein = Math.round((goal_calories * 0.4) / 4)
      goal_fat = Math.round((goal_calories * 0.25) / 9)
      break
    }
    case 2: {
      goal_calories = TDEE
      goal_carbs = Math.round((goal_calories * 0.35) / 4)
      goal_protein = Math.round((goal_calories * 0.4) / 4)
      goal_fat = Math.round((goal_calories * 0.25) / 9)
      break
    }
    case 3: {
      goal_calories = Math.round(1.15 * TDEE)
      goal_carbs = Math.round((goal_calories * 0.45) / 4)
      goal_protein = Math.round((goal_calories * 0.3) / 4)
      goal_fat = Math.round((goal_calories * 0.25) / 9)
      break
    }
  }
  $('#goal_calories').attr('value', goal_calories)
  $('#goal_carbs').attr('value', goal_carbs)
  $('#goal_protein').attr('value', goal_protein)
  $('#goal_fat').attr('value', goal_fat)
}

$('#btn_submit').click(async function () {
  if (!birthday || !height || !weight || !gender || !diet_goal || !activity_level) {
    Swal.fire({
      icon: 'warning',
      text: '資訊輸入不完全'
    })
  } else {
    const data = await axios.post('/api/1.0/user/target', { birthday, height, weight, gender, activity_level, TDEE, diet_goal, goal_carbs, goal_protein, goal_fat, goal_calories }, { headers: { Authorization: `Bearer ${accessToken}` } })
    // console.log('data: ', data)
    if (data.data.error) {
      Swal.fire({
        icon: 'warning',
        text: '資訊格式有誤'
      })
    } else if (data.data.message) {
      Swal.fire({
        icon: 'success',
        title: '設定成功',
        footer: '<a href="/profile.html" class="text-secondary">前往個人頁面</a>'
      })
    }
  }
})
