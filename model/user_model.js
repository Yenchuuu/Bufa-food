const db = require('../utils/mysqlconf')

const getUserInfo = async (currentUserId) => {
  const [userInfo] = await db.execute(
    'SELECT diet_goal, goal_calories, goal_carbs, goal_protein, goal_fat FROM `user` WHERE id = ?',
    [currentUserId]
  )
  return userInfo
}

module.exports = { getUserInfo }
