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

  async function checkUserInfo() {
    const userInfo = await axios.get('/api/1.0/user/profile', { headers: { Authorization: `Bearer ${accessToken}` } })
    if (userInfo.data.data.TDEE) {
      Swal.fire({
        icon: 'warning',
        text: '您已填寫過目標資訊囉😀'
      }).then((result) => { window.location.href = '/profile.html' })
    }
  }
  checkUserInfo()

  // $('.datepicker').datepicker({
  //   dateFormat: 'yy-mm-dd',
  //   forceParse: false
  // })

  let gender
  function genderVal(genderBtn) {
    gender = ($(genderBtn).attr('value'))
    gender = parseInt(gender)
  }

  let height, weight, birthday, activity_level, BMR, goal_carbs, goal_protein, goal_fat, goal_calories, TDEE
  $('#btn_calculateTDEE').click(() => {
    activity_level = $('#dropdownMenuButton2').val()
    activity_level = parseInt(activity_level)
    height = $('#height').val()
    weight = $('#weight').val()
    birthday = $('#datepicker').val()
    const date = new Date()
    const today = date.toISOString().split('T')[0]
    const age = parseInt(today) - parseInt(birthday)

    if (!birthday || !height || !weight || !gender || !activity_level) {
      Swal.fire({
        icon: 'warning',
        text: '資訊輸入不完全'
      })
    } else if (age <= 0 || age > 100) {
      Swal.fire({
        icon: 'warning',
        text: '請確認年紀輸入是否正確'
      })
    } else if (height > 220 || height < 120 || weight < 30 || weight > 200) {
      Swal.fire({
        icon: 'warning',
        text: '請確認身高體重輸入是否正確'
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
    if (!TDEE) {
      Swal.fire({
        icon: 'warning',
        text: '請先輸入基本資訊並計算TDEE!'
      })
    } else {
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
            footer: '<a href="/diary.html" class="text-secondary">前往紀錄飲食</a>'
          }).then(()=>{
            window.location.href = '/diary.html'
          })
        }
      }
    })
  }
}
