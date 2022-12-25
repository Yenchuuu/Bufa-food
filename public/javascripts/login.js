const accessToken = window.localStorage.getItem('accessToken')
if (accessToken) {
  $('#nav-profile-change').children().hide()
  $('#nav-profile-change').append('<a class="nav-link active" href="#" id="logout-btn">登出</a>')
  Swal.fire({
    icon: 'warning',
    text: '您已登入～前往飲食紀錄'
  }).then(() => {
    window.location.href = '/diary.html'
  })
} else {
  /* 點選 register 時跳出的彈窗 */
  $('#signupHere').click(function () {
    $('.pop-background').fadeIn(100)
    $('.pop-window').fadeIn(100)
  })
  $('.pop-background').click(function () {
    $('.pop-background').fadeOut(200)
    $('.pop-window').fadeOut(200)
  })

  function checkUsername() {
    const reg = new RegExp('^[A-Za-z0-9\u4e00-\u9fa5]+$')
    const name = $('#name').val().trim()
    if (!reg.test(name)) {
      Swal.fire({
        icon: 'warning',
        text: '請重新輸入名稱',
        footer: '註：請檢查名稱是否為有效文字(不應空白或包含特殊符號，字數上限為20字元)'
      })
      $('#name').val('')
    }
  }

  $(document).ready(() => {
    $('#confirm_password').keyup((event) => {
      if (event.which === 13) {
        $('#signupBtn').click()
      }
    })
    $('#signupBtn').click(async function () {
      const name = $('#name').val()
      const email = $('#register_email').val()
      const password = $('#register_password').val()
      // console.log('info: ', name, email, password);
      const confirmPassword = $('#confirm_password').val()

      if (!name || !email || !password || !confirmPassword) {
        Swal.fire({
          icon: 'error',
          text: '請確認資訊皆填寫完整'
        })
      } else if (password !== confirmPassword) {
        Swal.fire({
          icon: 'error',
          text: '請再次確認密碼輸入正確'
        })
      }

      try {
        const data = await axios.post('/api/1.0/user/signup', { name, email, password })
        // console.log('data: ', data)
        const userInfo = data.data

        /* 註冊即登入 */
        const accessToken = userInfo.access_token
        window.localStorage.setItem('accessToken', accessToken)
        window.localStorage.setItem('userName', userInfo.name)
        window.localStorage.setItem('userId', userInfo.id)
        window.localStorage.setItem('userEmail', userInfo.email)
        Swal.fire({
          icon: 'success',
          title: '註冊成功',
          footer: '<a href="/target.html" class="text-secondary">前往填寫體態與設定目標💪🏼</a>'
        }).then((result) => {
          window.location.href = '/target.html'
        })
      } catch (err) {
        Swal.fire({
          icon: 'error',
          text: '帳號格式錯誤或已被註冊'
        })
      }
    })
  })

  $(document).ready(function () {
    $('#password').keyup((event) => {
      if (event.which === 13) {
        $('#signinBtn').click()
      }
    })

    $('#signinBtn').click(async function () {
      const email = $('#email').val()
      // console.log('email: ', email);
      const password = $('#password').val()
      // console.log('password: ', password);
      if (email == '' || password == '') {
        Swal.fire({
          icon: 'error',
          text: '請輸入完整帳號密碼'
        })
        return
      }
      try {
        const data = await axios.post('/api/1.0/user/nativesignin', { provider: 'native', email, password })
        // console.log('data: ', data);
        const userInfo = data.data.data
        const accessToken = userInfo.access_token
        // console.log('accessToken: ', accessToken);
        /* 輸入正確資訊時產生jwt token，進入user diary page */
        window.localStorage.setItem('accessToken', accessToken)
        window.localStorage.setItem('userName', userInfo.user.name)
        window.localStorage.setItem('userId', userInfo.user.id)
        window.localStorage.setItem('userEmail', userInfo.user.email)
        const bodyInfo = await axios.get('/api/1.0/user/profile', { headers: { Authorization: `Bearer ${accessToken}` } })
        // console.log('bodyInfo: ', bodyInfo);
        Swal.fire({
          icon: 'success',
          text: '登入成功'
        }).then((result) => {
          if (!bodyInfo.data.data.TDEE) {
            window.location.href = '/target.html'
          } else {
            window.location.href = '/diary.html'
          }
        })
      } catch (err) {
        Swal.fire({
          icon: 'error',
          text: '帳號或密碼錯誤，請重新輸入'
        })
      }
    })
  })

  $('#nav-profile-change').click(() => {
    localStorage.clear()
    window.location.href = '/'
  })
}
