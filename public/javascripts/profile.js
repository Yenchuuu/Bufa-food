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
  // console.log('data: ', data);
  const gender = { 1: '生理女', 2: '生理男' }
  const goal = { 1: '減脂', 2: '維持', 3: '增肌' }
  const activityLevel = { 1: '久坐', 2: '輕度', 3: '中度', 4: '高度', 5: '非常高度' }
  const userInfo = data.data.data
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
