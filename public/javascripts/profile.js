const userName = window.localStorage.getItem('userName')
const userId = window.localStorage.getItem('userId')
const userEmail = window.localStorage.getItem('userEmail')

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
    const data = await axios.get('/api/1.0/user/profile', { headers: { Authorization: `Bearer ${accessToken}` } })
    const gender = { 1: '生理女', 2: '生理男' }
    const goal = { 1: '減脂', 2: '維持', 3: '增肌' }
    const activityLevel = { 1: '久坐', 2: '輕度', 3: '中度', 4: '高度', 5: '非常高度' }
    const userInfo = data.data.data
    // console.log('userInfo: ', userInfo)
    if (userInfo.TDEE === null) {
      Swal.fire({
        icon: 'warning',
        text: '請先完成身體資訊之填寫'
      }).then(() => {
        window.location.href = '/target.html'
      })
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
    if (userInfo.imagePath === '') {
      $('#self-photo').append('<img src=\'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/User-avatar.svg/1200px-User-avatar.svg.png\' class="self-photo" />')
      $('#delete_photo').hide()
    } else {
      $('#self-photo').append(`<img src="${userInfo.imagePath}" class="self-photo" />`)
    }
    $('#name').attr('value', userInfo.name)
    $('#birthday').attr('value', userInfo.birthday)
    // $('#gender').attr('value', Object.values(gender[userInfo.gender]))
    $('#height').attr('value', userInfo.height)
    $('#weight').attr('value', userInfo.weight)
    // $('#diet_goal').attr('value', Object.values(activityLevel[userInfo.activityLevel]))
    // $('#activity_level').attr('value', Object.values(goal[userInfo.dietGoal]))
  })

  $('#edit-user-info').click(function () {
    $('.pop-background').fadeIn(100)
    $('.pop-window').fadeIn(100)
  })
  $('.pop-background').click(function () {
    $('.pop-background').fadeOut(200)
    $('.pop-window').fadeOut(200)
  })

  // $('.datepicker').datepicker({
  //   dateFormat: 'yy-mm-dd',
  //   forceParse: false
  // })

  $('#edit_photo').click(function () {
    $('#upload_photo').show()
  })

  $('#delete_photo').click(function () {
    Swal.fire({
      title: '確定刪除相片嗎？',
      showDenyButton: false,
      showCancelButton: true,
      confirmButtonText: '刪除',
      cancelButtonText: '取消'
    }).then((result) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        const data = axios.delete(`/api/1.0/user/profile/image/${userId}`, { headers: { Authorization: `Bearer ${accessToken}` } })
        window.location.href = 'profile.html'
      }
    })
  })

  function checkUsername() {
    const reg = new RegExp('^[A-Za-z0-9\u4e00-\u9fa5]+$')
    const name = $('#name').val().trim()
    if (!reg.test(name) || validator.isNumeric(name)) {
      Swal.fire({
        icon: 'warning',
        text: '請重新輸入名稱',
        footer: '註：請檢查名稱是否為有效文字(不應空白、輸入純數字或包含特殊符號，字數上限為20字元)'
      })
      $('#name').val('')
    }
  }

  $('#submit_userInfo').click(async function () {
    const name = $('#name').val()
    const birthday = $('#birthday').val()
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
    const date = new Date()
    const today = date.toISOString().split('T')[0]
    const age = parseInt(today) - parseInt(birthday)

    // console.log('data', name, birthday, height, weight, gender, activity_level, diet_goal)

    if (!name || !birthday || !height || !weight || !gender || !activity_level || !diet_goal) {
      Swal.fire({
        icon: 'warning',
        text: '資訊輸入不完全'
      })
      return
    } else if (age <= 0 || age > 100) {
      Swal.fire({
        icon: 'warning',
        text: '請確認年紀輸入是否正確'
      })
      return
    } else if (height > 220 || height < 120 || weight < 30 || weight > 200) {
      Swal.fire({
        icon: 'warning',
        text: '請確認身高體重輸入是否正確'
      })
      return
    }

    await axios.patch(`/api/1.0/user/profile/account/${userId}`, { name }, { headers: { Authorization: `Bearer ${accessToken}` } })

    const data = await axios.patch(`/api/1.0/user/profile/bodyinfo/${userId}`, { birthday, height, weight, gender, activity_level, diet_goal }, { headers: { Authorization: `Bearer ${accessToken}` } })
    // console.log('data: ', data)
    if (data.data.message) {
      Swal.fire({
        icon: 'success',
        text: '設定成功'
      }).then(() => {
        window.location.href = '/profile.html'
      })
    } else {
      Swal.fire({
        icon: 'warning',
        text: '請再試一次'
      })
    }
  })

  $('#edit-nutrition-goal').click(async function () {
    $('#nutririon-input').show()
  })

  $(document).ready(function () {
    $('#fat').keyup((event) => {
      if (event.which === 13) {
        $('#submit_nutritionInfo').click()
      }
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
          text: '碳水化合物、蛋白質與脂肪之資訊不完整或不正確'
        })
        return
      } else if (goal_carbs_percantage < 0 || goal_protein_percantage < 0 || goal_fat_percantage < 0 || goal_carbs_percantage > 100 || goal_protein_percantage > 100 || goal_fat_percantage > 100) {
        Swal.fire({
          icon: 'warning',
          text: '碳水化合物、蛋白質與脂肪之比例應為正整數'
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
      } else if (goal_calories > 2 * TDEE) {
        Swal.fire({
          icon: 'warning',
          text: '一日熱量攝取量過高，請調整！'
        })
        return
      }
      try {
        const data = await axios.patch(`/api/1.0/user/profile/nutritiontarget/${userId}`, { goal_calories, goal_carbs_percantage, goal_protein_percantage, goal_fat_percantage }, { headers: { Authorization: `Bearer ${accessToken}` } })

        Swal.fire({
          icon: 'success',
          text: '設定成功'
        }).then(() => {
          window.location.href = '/profile.html'
        })
      } catch (err) {
        Swal.fire({
          icon: 'warning',
          text: '請再試一次'
        })
      }
    })
  })
}
