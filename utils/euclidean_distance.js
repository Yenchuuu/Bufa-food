require('dotenv').config()
const Food = require('../model/food_model')

let euc
const getUserPreference = async (currentUserId) => {
  // console.log('currentUserId', currentUserId)
  const currentUser = await Food.getCurrentUserPreference(currentUserId)
  // console.log('currentUser', currentUser)
  const otherUsers = await Food.getOtherUsersList(currentUserId)
  // console.log('otherUsers', otherUsers)

  /* 撈出資料並排除currentUser以外使用者的所有食物紀錄 */
  const allRecords = await Food.getAllUserRecords(currentUserId)
  const allRecordsLen = allRecords.length
  // // console.log('allRecords', allRecords)

  /* 為了不要推薦重複項目，故先將DB之食物紀錄整理成distinct array並以亂數排列，讓每次出現的推薦都不盡相同 */
  const distinctFood = await Food.getDistinctFoodList(currentUserId)
  const shuffleArray = (arr) => arr.sort(() => 0.5 - Math.random())
  const shuffleFood = shuffleArray(distinctFood)
  
  /* 尚未有喜好紀錄之使用者將由系統隨機推薦 */
  if (currentUser.length === 0) {
    const ran = shuffleFood.slice(0, 3)
    const recommendFood = ran.map(e => e.food_id)
    return recommendFood
  } else {
    /* 把currentUser的食物紀錄&偏好分數變成一個array */
    const currentUserScore = currentUser.map((e) => e.preference)
    const currentUserFood = currentUser.map((e) => e.food_id)
    // console.log('currentUserFood', currentUserFood)

    let usersScore
    let usersFood
    const allUsersCompare = []
    /* map出各個user的食物紀錄 => recordsByUser */
    const allusersFoodScore = otherUsers.map((otherUsers) => {
      /* 找出所有使用者的食物紀錄&偏好分數array，otherUsers.map遍歷所有使用者 */
      usersScore = allRecords
        .filter((e) => e.user_id === otherUsers.user_id)
        .map((e) => e.preference)
      usersFood = allRecords
        .filter((e) => e.user_id === otherUsers.user_id)
        .map((e) => e.food_id)
      // // console.log('recordsByUser', recordsByUser)
      // // console.log('usersScore', usersScore, 'usersFood', usersFood)

      /* 將各使用者之食物紀錄&偏好分數組成一個object */
      const objectOfUsers = combineArrays(usersFood, usersScore)
      return objectOfUsers
    })
    // // console.log('allusersFoodScore', allusersFoodScore)
    // // console.log('objectOfUsers', objectOfUsers)

    /* 每個使用者的食物評分 */
    for (const userFoodScores of allusersFoodScore) {
      const usersCompare = []
      /* currentUser的每項食物id */
      for (const foodId of currentUserFood) {
        // // console.log('foodId', foodId)

        const itemScore = userFoodScores[foodId.toString()]
        // // console.log('itemScore', itemScore)
        if (itemScore === undefined) {
          usersCompare.push(0)
        } else {
          usersCompare.push(itemScore)
        }
      }
      // // console.log('usersCompare', usersCompare)
      allUsersCompare.push(usersCompare)
    }
    // console.log('currentUserScore', currentUserScore)
    // console.log('allUsersCompare', allUsersCompare)

    const allUsersEuc = []
    for (let i = 0; i < allUsersCompare.length; i++) {
      euc = await getEucDistance(currentUserScore, allUsersCompare[i])
      allUsersEuc.push(euc)
    }
    // console.log('allUsersEuc', allUsersEuc)
    /* 找出allUserEuc 的index再回頭與 otherUsers array 比對 user_id */
    const mostRelatedUserId =
      otherUsers[allUsersEuc.indexOf(Math.min(...allUsersEuc))].user_id
    // console.log('mostRelatedUserId', mostRelatedUserId)

    let usersRecord = allRecords.filter((e) => e.user_id === mostRelatedUserId)
    let recommendFood = usersRecord.map((e) => e.food_id)

    /* 依mostRelatedUserScore由大到小排序，並取前三名，若不足3則random補數 */
    const usersRecordLen = usersRecord.length
    if (usersRecordLen >= 3) {
      usersRecord = usersRecord.sort(function (a, b) {
        return a.preference < b.preference ? 1 : -1
      })
      // console.log('usersRecord', usersRecord)
      recommendFood = recommendFood.splice(0, 3)
    } else if (usersRecordLen < 3) {
      for (let i = 0; i < 3 - usersRecordLen; i++) {
        const ran = Math.floor(Math.random() * allRecordsLen)
        recommendFood.push(allRecords[ran].food_id)
      }
      return recommendFood
    }

    // console.log('recommendFood', recommendFood)
    return recommendFood
  }
}

const getEucDistance = async function (a, b) {
  return (
    a.map((x, i) => Math.abs(x - b[i]) ** 2).reduce((sum, now) => sum + now) **
    (1 / 2)
  )
}

const combineArrays = (first, second) => {
  return first.reduce((acc, val, ind) => {
    acc[val] = second[ind]
    return acc
  }, {})
}

module.exports = { getUserPreference }
