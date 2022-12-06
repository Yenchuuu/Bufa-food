const Food = require('../model/food_model')
const User = require('../model/user_model')
const Euc = require('../utils/euclidean_distance')
const Cache = require('../utils/cache')
const moment = require('moment')
// FIXME: date是倫敦時間
const CACHE_TRENDFOOD_KEY = 'cacheTrendFood'

const addMealRecord = async (req, res) => {
  const { id: userId } = req.user
  let foodId = req.query.id
  let { meal, servingAmount, date } = req.body
  // FIXME: 應該擋資料型態而不是parseInt
  meal = parseInt(meal)
  foodId = parseInt(foodId)
  /* req.body接近來的serving amount單位是g，故應以food table之per_serving計算到底有幾份 */
  const data = await Food.getFoodDetail(foodId)
  const perServing = data[0].per_serving
  servingAmount = parseFloat((servingAmount / perServing).toFixed(1))
  // console.log('servingAmount', servingAmount, 'perServing', perServing)
  const mealRecords = await Food.getUserRecord(userId, date)
  // console.log('mealRecords: ', mealRecords);
  // console.log(userId, foodId, meal, servingAmount, date)
  try {
    /* 若當天飲食紀錄已有此餐點 -> 調整份數；若無則建立 */
    const findItem = mealRecords.mealRecords.filter(e => e.meal === meal).filter(e => e.food_id === foodId)
    console.log('findItem', findItem)
    if (findItem.length !== 0) {
      servingAmount += parseFloat((findItem[0].serving_amount))
      servingAmount.toFixed(1)
      // console.log('servingAmount', servingAmount, servingAmount.toFixed(1))
      await Food.updateMealRecord(userId, foodId, meal, servingAmount, date)
    } else {
      await Food.createMealRecord(userId, foodId, meal, servingAmount, date)
    }
    res.json({ message: 'Record updated successfully.' })
  } catch (err) {
    console.error(err)
    res.json({ errorMessage: 'Record cannot be updated.' })
  }
}

const updateMealRecord = async (req, res) => {
  const { id: userId } = req.user
  let date = req.query.id
  if (!date || date === 'undefined') {
    date = moment().format('YYYY-MM-DD')
  }

  /* 用修改克數乘上食物之原始營養素渲染至前端 */
  const data = req.body
  const foodId = data.foodId
  // console.log('data: ', data);
  const [foodDetail] = await Food.getFoodDetail(foodId)
  const perServing = foodDetail.per_serving
  const servingAmount = parseFloat(data.servingAmount / perServing).toFixed(2)
  data.calories = Math.round(foodDetail.calories * servingAmount)
  data.carbs = parseInt(foodDetail.carbs * servingAmount)
  data.protein = parseInt(foodDetail.protein * servingAmount)
  data.fat = parseInt(foodDetail.fat * servingAmount)
  // console.log('data: ', data);

  try {
    const meal = data.meal
    await Food.updateMealRecord(userId, foodId, meal, servingAmount, date)

    res.json(data)
  } catch (err) {
    console.error(err)
    res.json({ errorMessage: 'Record cannot be updated.' })
  }
}

const deleteMealRecord = async (req, res) => {
  let date = req.query.id
  if (!date || date === 'undefined') {
    date = moment().format('YYYY-MM-DD')
  }
  const data = req.body
  const recordId = data.record_id
  try {
    await Food.deleteMealRecord(recordId)
    res.json(data)
  } catch (err) {
    console.error(err)
    res.json({ errorMessage: 'Record cannot be updated.' })
  }
}

const getDiaryRecord = async (req, res) => {
  const { id: userId } = req.user
  const getDate = req.query.date
  let date
  const today = moment().format('YYYY-MM-DD')
  if (!getDate || typeof getDate === 'undefined') {
    date = today
  } else {
    date = getDate
  }
  // console.log('date', date)
  const mealRecords = await Food.getUserRecord(userId, date)

  const caloriesTotal = mealRecords.recordSummary.reduce((acc, item) => {
    return acc + parseInt(item.caloriesTotal)
  }, 0)
  const carbsTotal = mealRecords.recordSummary.reduce((acc, item) => {
    return acc + parseInt(item.carbsTotal)
  }, 0)
  const proteinTotal = mealRecords.recordSummary.reduce((acc, item) => {
    return acc + parseInt(item.proteinTotal)
  }, 0)
  const fatTotal = mealRecords.recordSummary.reduce((acc, item) => {
    return acc + parseInt(item.fatTotal)
  }, 0)
  res.json({ mealRecords, caloriesTotal, carbsTotal, proteinTotal, fatTotal })
}

const getFoodDetail = async (req, res) => {
  const foodId = req.query.id
  const foodDetail = await Food.getFoodDetail(foodId)
  res.json({ foodDetail })
}

const createFoodDetail = async (req, res) => {
  const { id: userId } = req.user
  let { name, calories, carbs, protein, fat, perServing } = req.body

  // FIXME: 應該擋資料型態而不是parseInt
  calories = parseInt(calories)
  carbs = parseInt(carbs)
  protein = parseInt(protein)
  fat = parseInt(fat)
  perServing = parseInt(perServing)

  try {
    const data = await Food.createFoodDetail(name, calories, carbs, protein, fat, perServing, userId)
    res.json({ message: 'Food created successfully.' })
  } catch (err) {
    console.error(err)
    // FIXME: error or errorMessage統一用法
    res.json({ error: 'Food cannot be created.' })
  }
}

const generateSingleMeal = async (req, res) => {
  const { target, meal, value, date } = req.body
  const { email } = req.user
  const userDetail = await User.getUserDetail(email)
  const [{ id: userId, goal_calories: goalCalories, goal_carbs: goalCarbs, goal_protein: goalProtein, goal_fat: goalFat }] = userDetail

  try {
    /* 一餐熱量不應低於TDEE 10% */
    if (target === 'calories' && value < (goalCalories * 0.1)) return res.json({ errorMessage: 'lowCalories' })
    /* 輸入過高之熱量 */
    if (target === 'calories' && value > (goalCalories * 0.7)) return res.json({ errorMessage: 'highCalories' })
    /* 不建議營養素過度集中在某一餐攝取 */
    if ((target === 'carbs' && value > goalCarbs * 0.7) || (target === 'protein' && value > goalProtein * 0.7) || (target === 'fat' && value > goalFat * 0.7)) return res.json({ errorMessage: 'outOfRange' })
    /* 計算使用者C P F的目標營養素分別對總熱量佔比為多少 */
    const userCarbsPercentage = Math.round((goalCarbs * 4) / goalCalories * 100) / 100
    const userProteinPercentage = Math.round((goalProtein * 4) / goalCalories * 100) / 100
    const userFatPercentage = Math.round((goalFat * 9) / goalCalories * 100) / 100

    const recommendMealList = await Food.getRecommendSingleMeal(userId)
    const len = recommendMealList.length
    const recommendMeal = []
    switch (target) {
      // FIXME: 計算份數拆成fn
      case 'calories': {
        /* 若目標為calories，先將C P F分別變成三個array再從中抓取random index作為推薦項目 */
        const carbsList = recommendMealList.filter(
          (e) => e.recommend_categories_id === 1
        )
        const carbs = carbsList[Math.floor(Math.random() * carbsList.length)]
        /* 依目標碳水比例乘以總熱量，計算碳水應攝取幾份 */
        const carbsCalories = Math.round(value * userCarbsPercentage * 0.9) // 留 10% buffer
        const servingAmountCarbs = Math.round(carbsCalories / carbs.calories * 100)
        // console.log('carbsCalories', carbsCalories, 'servingAmountCarbs', servingAmountCarbs)
        carbs.per_serving = servingAmountCarbs
        carbs.calories = carbsCalories
        carbs.carbs = Math.round(carbs.carbs * (servingAmountCarbs / 100))
        carbs.protein = Math.round(carbs.protein * (servingAmountCarbs / 100))
        carbs.fat = Math.round(carbs.fat * (servingAmountCarbs / 100))
        recommendMeal.push(carbs)

        const ProteinList = recommendMealList.filter(
          (e) => e.recommend_categories_id === 2
        )
        const protein = ProteinList[Math.floor(Math.random() * ProteinList.length)]
        const proteinCalories = Math.round(value * userProteinPercentage * 0.9) // 留 10% buffer
        const servingAmountProtein = Math.round(proteinCalories / protein.calories * 100)
        protein.per_serving = servingAmountProtein
        protein.calories = proteinCalories
        protein.carbs = Math.round(protein.carbs * servingAmountProtein / 100)
        protein.protein = Math.round(protein.protein * servingAmountProtein / 100)
        protein.fat = Math.round(protein.fat * servingAmountProtein / 100)
        recommendMeal.push(protein)

        const vegList = recommendMealList.filter(
          (e) => e.recommend_categories_id === 4
        )
        const veg = vegList[Math.floor(Math.random() * vegList.length)]
        recommendMeal.push(veg)

        /* 計算剩餘的熱量，將脂肪成算份量以符合需求 */
        const caloriesSubtotal = recommendMeal.reduce((acc, item) => {
          return acc + item.calories
        }, 0)
        const carbsSubtotal = recommendMeal.reduce((acc, item) => {
          return acc + item.carbs
        }, 0)
        const proteinSubtotal = recommendMeal.reduce((acc, item) => {
          return acc + item.protein
        }, 0)
        const fatSubtotal = recommendMeal.reduce((acc, item) => {
          return acc + item.fat
        }, 0)

        const remainCaloriesV1 = value - caloriesSubtotal
        const remainCarbsV1 = value * userCarbsPercentage - carbsSubtotal
        const remainProteinV1 = value * userProteinPercentage - proteinSubtotal
        const remainFatV1 = value * userFatPercentage - fatSubtotal
        // console.log('remaining:', remainCaloriesV1, remainCarbsV1, remainProteinV1, remainFatV1)

        const fatList = recommendMealList.filter(
          (e) => e.recommend_categories_id === 3
        )
        const fat = fatList[Math.floor(Math.random() * fatList.length)]
        // console.log('nutrition', recommendMeal)

        const servingOfFat = Math.round((remainCaloriesV1 / fat.calories) * 100)
        fat.per_serving = servingOfFat
        fat.calories = remainCaloriesV1
        fat.carbs = Math.round(fat.carbs * (servingOfFat / 100))
        fat.protein = Math.round(fat.protein * (servingOfFat / 100))
        fat.fat = Math.round(fat.fat * (servingOfFat / 100))
        recommendMeal.push(fat)
        break
      }
      case 'protein': {
        const ProteinList = recommendMealList.filter(
          (e) => e.recommend_categories_id === 2
        )
        // console.log('ProteinList: ', ProteinList)
        const protein = ProteinList[Math.floor(Math.random() * ProteinList.length)]
        const servingAmountProtein = Math.round(value / protein.protein * 100)
        protein.per_serving = servingAmountProtein
        protein.calories = Math.round(protein.calories * (servingAmountProtein / 100))
        protein.carbs = Math.round(protein.carbs * servingAmountProtein / 100)
        protein.protein = value
        protein.fat = Math.round(protein.fat * servingAmountProtein / 100)
        recommendMeal.push(protein)
        break
      }
      case 'carbs': {
        const carbsList = recommendMealList.filter(
          (e) => e.recommend_categories_id === 1
        )
        const carbs = carbsList[Math.floor(Math.random() * carbsList.length)]
        /* 依目標碳水克數計算應攝取幾份 */
        const servingAmountCarbs = Math.round(value / carbs.carbs * 100)
        // console.log('servingAmountCarbs', servingAmountCarbs)
        carbs.per_serving = servingAmountCarbs
        carbs.calories = Math.round(carbs.calories * (servingAmountCarbs / 100))
        carbs.carbs = value
        carbs.protein = Math.round(carbs.protein * (servingAmountCarbs / 100))
        carbs.fat = Math.round(carbs.fat * (servingAmountCarbs / 100))
        recommendMeal.push(carbs)
        break
      }
      case 'fat': {
        const fatList = recommendMealList.filter(
          (e) => e.recommend_categories_id === 3
        )
        const fat = fatList[Math.floor(Math.random() * fatList.length)]
        // console.log('nutrition', recommendMeal)

        const servingAmountFat = Math.round(value / fat.fat * 100)
        fat.per_serving = servingAmountFat
        fat.calories = Math.round(fat.calories * (servingAmountFat / 100))
        fat.carbs = Math.round(fat.carbs * (servingAmountFat / 100))
        fat.protein = Math.round(fat.protein * (servingAmountFat / 100))
        fat.fat = value
        recommendMeal.push(fat)
        break
      }
    }
    const setMealRecord = await Food.setRecommendSingleMeal(userId, meal, recommendMeal, date)
    // console.log('InfoC', userId, recommendMeal, date)
    return res.json({ meal, recommendMeal })
  } catch (err) {
    console.error(err)
    throw err
  }
}

const generateMultipleMeals = async (req, res) => {
  const { email } = req.user
  const { date } = req.body
  const userDetail = await User.getUserDetail(email)
  const [{ id: userId, goal_calories: goalCalories, goal_carbs: goalCarbs, goal_protein: goalProtein, goal_fat: goalFat }] = userDetail
  // console.log('userInfo', userId, goalCalories, goalCarbs, goalProtein, goalFat)

  const mealRecords = await Food.getUserRecord(userId, date)
  if (mealRecords.mealRecords.length !== 0) {
    return res.json({ errorMessage: '當日已有飲食紀錄，請使用上方列表選擇推薦單餐喔！' })
  } else {
    const multipleMealsList = await Food.getRecommendMultipleMeals(userId)

    /* recommendmeal 1~3 分別為早中晚三餐，點心則不在推薦範圍內 */
    const recommendBreakfast = []
    const recommendLunch = []
    const recommendDinner = []

    /* 將每種營養素的array都隨機排序，隨後取出前兩樣 -> 達到不重複且不會每次都取到一樣的前兩項 */
    const shuffleArray = (arr) => arr.sort(() => 0.5 - Math.random())

    /* 早餐推薦水果，並排除熱量過高的水果種類 */
    const suffleFruitArray = shuffleArray(multipleMealsList.filter(
      (e) => e.food_categories_id === 2
    ))
    let breakfast = suffleFruitArray.pop()
    // console.log('breakfast', breakfast)
    while (breakfast.calories > 100) {
      breakfast = suffleFruitArray.pop()
    }
    recommendBreakfast.push(breakfast)

    /* 計算使用者C P F的營養素分別對總熱量佔比為多少 => 目前沒用到 */
    const userCarbsPercentage = Math.round((goalCarbs * 4) / goalCalories * 100) / 100
    const userProteinPercentage = Math.round((goalProtein * 4) / goalCalories * 100) / 100
    const userFatPercentage = Math.round((goalFat * 9) / goalCalories * 100) / 100
    // console.log('user goal nutrion percentage, C:P:F', userCarbsPercentage, userProteinPercentage, userFatPercentage)

    const carbsCalories = goalCarbs * 4
    const suffleCarbsArray = shuffleArray(multipleMealsList.filter(
      (e) => e.recommend_categories_id === 1))
    // console.log('suffleCarbsArray', suffleCarbsArray)

    /* 隨機取出兩項澱粉，計算其熱量與分配之熱量比例，推算應攝取幾份 */
    /* 因早餐吃水果(熱量僅佔整體2~7%)以及蛋白質，故主要將碳水分配於午晚餐，午餐抓整天熱量之45%作為計算 */
    const carbsCaloriesLunch = Math.round(carbsCalories * 0.45)
    const carbsLunch = suffleCarbsArray.pop()
    const carbsDinner = suffleCarbsArray.pop()
    const servingAmountCarbsLunch = Math.round(carbsCaloriesLunch / carbsLunch.calories * 100)
    carbsLunch.per_serving = servingAmountCarbsLunch
    carbsLunch.calories = carbsCaloriesLunch
    carbsLunch.carbs = Math.round(carbsLunch.carbs * (servingAmountCarbsLunch / 100))
    carbsLunch.protein = Math.round(carbsLunch.protein * (servingAmountCarbsLunch / 100))
    carbsLunch.fat = Math.round(carbsLunch.fat * (servingAmountCarbsLunch / 100))
    /* 把第一個碳水塞進午餐 */
    recommendLunch.push(carbsLunch)

    const proteinCalories = goalProtein * 4
    const suffleProteinArray = shuffleArray(multipleMealsList.filter(
      (e) => e.recommend_categories_id === 2))
    // console.log('suffleProteinArray', suffleProteinArray)

    /* 隨機取出三項蛋白質，計算其熱量與分配之熱量比例，推算應攝取幾份 */
    const proteinBreakfast = suffleProteinArray.pop()
    const proteinLunch = suffleProteinArray.pop()
    const proteinDinner = suffleProteinArray.pop()

    /* 若將蛋白質集中於午晚餐攝取將造成蛋白質來源過於單一，故分散於三餐中 */
    const proteinCaloriesBreakfast = Math.round(proteinCalories * 0.15)
    const servingAmountProteinBreakfast = Math.round(proteinCaloriesBreakfast / proteinBreakfast.calories * 100)
    proteinBreakfast.per_serving = servingAmountProteinBreakfast
    proteinBreakfast.calories = proteinCaloriesBreakfast
    proteinBreakfast.carbs = Math.round(proteinBreakfast.carbs * servingAmountProteinBreakfast / 100)
    proteinBreakfast.protein = Math.round(proteinBreakfast.protein * servingAmountProteinBreakfast / 100)
    proteinBreakfast.fat = Math.round(proteinBreakfast.fat * servingAmountProteinBreakfast / 100)
    /* 把蛋白質塞進早餐 */
    recommendBreakfast.push(proteinBreakfast)

    const proteinCaloriesLunch = Math.round(proteinCalories * 0.40)
    const servingAmountProteinLunch = Math.round(proteinCaloriesLunch / proteinLunch.calories * 100)
    proteinLunch.per_serving = servingAmountProteinLunch
    proteinLunch.calories = proteinCaloriesLunch
    proteinLunch.carbs = Math.round(proteinLunch.carbs * servingAmountProteinLunch / 100)
    proteinLunch.protein = Math.round(proteinLunch.protein * servingAmountProteinLunch / 100)
    proteinLunch.fat = Math.round(proteinLunch.fat * servingAmountProteinLunch / 100)
    /* 把蛋白質塞進午餐 */
    recommendLunch.push(proteinLunch)

    const fatCalories = goalFat * 9

    const suffleFatArray = shuffleArray(multipleMealsList.filter(
      (e) => e.recommend_categories_id === 3))
    /* 隨機取出兩項脂肪，計算其熱量與分配之熱量比例，推算應攝取幾份 */
    const fatCaloriesLunch = Math.round(fatCalories * 0.5)
    const fatLunch = suffleFatArray.pop()
    const fatDinner = suffleFatArray.pop()
    const servingAmountFatLunch = Math.round(fatCaloriesLunch / fatLunch.calories * 100)
    fatLunch.per_serving = servingAmountFatLunch
    fatLunch.calories = fatCaloriesLunch
    fatLunch.carbs = Math.round(fatLunch.carbs * (servingAmountFatLunch / 100))
    fatLunch.protein = Math.round(fatLunch.protein * (servingAmountFatLunch / 100))
    fatLunch.fat = Math.round(fatLunch.fat * (servingAmountFatLunch / 100))
    /* 把第一個脂肪塞進午餐 */
    recommendLunch.push(fatLunch)

    const suffleVegArray = shuffleArray(multipleMealsList.filter(
      (e) => e.recommend_categories_id === 4
    ))
    const vegLunch = suffleVegArray.slice(0, 2)
    const vegDinner = suffleVegArray.slice(2, 4)
    // console.log(vegLunch, vegDinner)
    recommendLunch.push(...vegLunch)
    recommendDinner.push(...vegDinner)

    /* 合計當天早餐&午餐(含晚餐的蔬果)菜單總熱量與營養素 */
    const BreakfastPlusLunch = [].concat(...recommendBreakfast, ...recommendLunch, ...recommendDinner)
    const caloriesSubtotal = BreakfastPlusLunch.reduce((acc, item) => {
      return acc + item.calories
    }, 0)
    const carbsSubtotal = BreakfastPlusLunch.reduce((acc, item) => {
      return acc + item.carbs
    }, 0)
    const proteinSubtotal = BreakfastPlusLunch.reduce((acc, item) => {
      return acc + item.protein
    }, 0)
    const fatSubtotal = BreakfastPlusLunch.reduce((acc, item) => {
      return acc + item.fat
    }, 0)

    // console.log('早餐&午餐(含晚餐的蔬果)', goalCalories, caloriesSubtotal, goalCarbs, carbsSubtotal, goalProtein, proteinSubtotal, goalFat, fatSubtotal)

    /* 因推薦食物類別中的脂肪食品營養素較多元，故設定先將脂肪克數逼近達標之後再看其餘營養素剩下多少 */
    const fatGramDinner = Math.round((goalFat - fatSubtotal) * 0.9) // 暫時抓90%，留一些buffer
    const servingAmountFatDinner = Math.round(fatGramDinner / fatDinner.fat * 100)
    fatDinner.per_serving = servingAmountFatDinner
    fatDinner.calories = Math.round(fatDinner.calories * (servingAmountFatDinner / 100))
    fatDinner.carbs = Math.round(fatDinner.carbs * (servingAmountFatDinner / 100))
    fatDinner.protein = Math.round(fatDinner.protein * (servingAmountFatDinner / 100))
    fatDinner.fat = fatGramDinner
    recommendDinner.push(fatDinner)

    // => check 扣掉脂肪之後剩餘的熱量與營養素
    const remainCaloriesV1 = goalCalories - (caloriesSubtotal + fatDinner.calories)
    const remainCarbsV1 = goalCarbs - (carbsSubtotal + fatDinner.carbs)
    const remainProteinV1 = goalProtein - (proteinSubtotal + fatDinner.protein)
    const remainFatV1 = goalFat - (fatSubtotal + fatDinner.fat)
    // console.log('remaining:', remainCaloriesV1, remainCarbsV1, remainProteinV1, remainFatV1)

    const proteinGramDinner = Math.round(remainProteinV1 * 0.9) // 暫時抓90%，留一些buffer
    const servingAmountProteinDinner = Math.round(proteinGramDinner / proteinDinner.protein * 100)
    proteinDinner.per_serving = servingAmountProteinDinner
    proteinDinner.calories = Math.round(proteinDinner.calories * (servingAmountProteinDinner / 100))
    proteinDinner.carbs = Math.round(proteinDinner.carbs * (servingAmountProteinDinner / 100))
    proteinDinner.protein = proteinGramDinner
    proteinDinner.fat = Math.round(proteinDinner.fat * (servingAmountProteinDinner / 100))

    /* 把第三個蛋白質塞進晚餐 */
    recommendDinner.push(proteinDinner)

    // => check 扣掉蛋白質之後剩餘的熱量與營養素
    const remainCaloriesV2 = remainCaloriesV1 - proteinDinner.calories
    const remainCarbsV2 = remainCarbsV1 - proteinDinner.carbs
    const remainProteinV2 = remainProteinV1 - proteinDinner.protein
    const remainFatV2 = remainFatV1 - proteinDinner.fat
    // console.log('remaining:', remainCaloriesV2, remainCarbsV2, remainProteinV2, remainFatV2)

    if (remainCarbsV2 > 0) {
      const carbsGramDinner = Math.round(remainCarbsV2 * 0.9) // 暫時抓90%，留一些buffer
      const servingAmountCarbsDinner = Math.round(carbsGramDinner / carbsDinner.carbs * 100)
      carbsDinner.per_serving = servingAmountCarbsDinner
      carbsDinner.calories = Math.round(carbsDinner.calories * servingAmountCarbsDinner / 100)
      carbsDinner.carbs = carbsGramDinner
      carbsDinner.protein = Math.round(carbsDinner.protein * servingAmountCarbsDinner / 100)
      carbsDinner.fat = Math.round(carbsDinner.fat * servingAmountCarbsDinner / 100)
      /* 把第二個碳水塞進晚餐 */
      recommendDinner.push(carbsDinner)
      // console.log('carbsDinner', carbsDinner.calories, carbsDinner.carbs, carbsDinner.protein, carbsDinner.fat)
    }
    /* 合計當天菜單總熱量與營養素 */
    const allMeals = [].concat(...recommendBreakfast, ...recommendLunch, ...recommendDinner)
    const caloriesTotal = allMeals.reduce((acc, item) => {
      return acc + item.calories
    }, 0)
    const carbsTotal = allMeals.reduce((acc, item) => {
      return acc + item.carbs
    }, 0)
    const proteinTotal = allMeals.reduce((acc, item) => {
      return acc + item.protein
    }, 0)
    const fatTotal = allMeals.reduce((acc, item) => {
      return acc + item.fat
    }, 0)

    console.log('當日菜單與目標差距: 熱量', goalCalories - caloriesTotal, 'kcal 碳水', goalCarbs - carbsTotal, 'g 蛋白質', goalProtein - proteinTotal, 'g 脂肪', goalFat - fatTotal, 'g')
    try {
      const setMealsRecords = await Food.setRecommendMultipleMeals(userId, recommendBreakfast, recommendLunch, recommendDinner, date)
      console.log('Meals write into DB successfully.')
      return res.json({ recommendBreakfast, recommendLunch, recommendDinner })
    } catch (err) {
      console.error(err)
      return res.json({ errorMessage: 'Failed to write the meals records.' })
    }
  }
}

const getFoodFromKeyword = async (req, res) => {
  const key = req.query.key
  const searchFood = await Food.getFoodFromSearchbox(key)
  // console.log('searchFoodC', searchFood)
  res.json(searchFood)
}

const getFoodTrend = async (req, res) => {
  /* 設定撈取熱門食物之區間 */
  const periodStart = moment().add(-6, 'days').format('YYYY-MM-DD')
  const periodEnd = moment().format('YYYY-MM-DD')
  let trendFood
  try {
    if (Cache.ready) {
      trendFood = await Cache.get(CACHE_TRENDFOOD_KEY)
    }
  } catch (err) {
    console.error(`Get trend food cache error: ${err}`)
  }
  if (trendFood) {
    console.log('Get trend food from cache')
    res.json(JSON.parse(trendFood))
    return
  }

  trendFood = await Food.getFoodTrend(periodStart, periodEnd)
  // console.log('trendFood: ', trendFood)

  try {
    if (Cache.ready) {
      await Cache.set(CACHE_TRENDFOOD_KEY, JSON.stringify(trendFood))
      const todayEnd = new Date().setHours(23, 59, 59, 999)
      /* 熱搜食物快取於每日11:59pm清除 */
      await Cache.expireAt(CACHE_TRENDFOOD_KEY, parseInt(todayEnd / 1000))
    }
  } catch (err) {
    console.error(`Set trend food cache error: ${err}`)
  }
  res.json(trendFood)
}

const getUserRecommendation = async (req, res) => {
  const { id: currentUserId } = req.user
  const recommendFood = await Euc.getUserPreference(currentUserId)
  const foodNutritionInfo = await Food.getFoodNutritionInfo(recommendFood)
  res.json({ foodNutritionInfo })
}

const updateFoodPreference = async (req, res) => {
  // TODO: 不用try catch>> wrapasync
  try {
    const { id: userId } = req.user
    const foodId = req.query.id
    const { clickedBtn } = req.body
    // console.log(userId, foodId, clickedBtn)
    const preferenceScore = await Food.updateFoodPreference(userId, foodId, clickedBtn)
    res.json({ message: 'Preference score updated successfully.' })
  } catch (err) {
    console.error(err)
  }
}

module.exports = {
  addMealRecord,
  updateMealRecord,
  deleteMealRecord,
  getDiaryRecord,
  getFoodDetail,
  createFoodDetail,
  generateSingleMeal,
  getFoodFromKeyword,
  getFoodTrend,
  getUserRecommendation,
  generateMultipleMeals,
  updateFoodPreference
}
