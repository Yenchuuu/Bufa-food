const accessToken = window.localStorage.getItem('accessToken')
if (!accessToken) {
  alert('請先登入')
  window.location.href = '/index.html'
  //  return
} else {
  const userId = window.localStorage.getItem('userId')
  async function getUserPreference(userId) {
    const collection = $('#my_collection')
    const createdFood = $('#created_by_me')
    const exclusion = $('#my_exclusion')
    const record = await axios.get(`/api/1.0/user/preference?id=${userId}`, { headers: { Authorization: `Bearer ${accessToken}` } })
    // console.log('record', record);
    const collectionRecord = record.data.preference.filter(e => e.collection === 1)
    const createdFoodRecord = record.data.preference.filter(e => e.createdIt === 1)
    const exclusionRecord = record.data.preference.filter(e => e.exclusion === 1)
    // console.log('collectionRecord', collectionRecord)

    /* 用for of 遍歷array */
    for (const foodObject of collectionRecord) {
      const newDom = $('.collection-card').first().clone()
      newDom.children('.mine-card-body')
      // newDom.children('.card-body').append(`<a href="/detail.html?id=${foodObject.food_id}>`)
      newDom.children('.mine-card-body').children('.card-title').append(`${foodObject.name}`)
      // newDom.children('.card-body').append(`</a>`)
      newDom.show()
      $('.display-collection').append(newDom)
    }

    for (const foodObject of createdFoodRecord) {
      const newDom = $('.collection-card').first().clone()
      newDom.children('.mine-card-body')
      newDom.children('.mine-card-body').children('.card-title').append(`${foodObject.name}`)
      newDom.show()
      $('.display-createdFood').append(newDom)
    }

    for (const foodObject of exclusionRecord) {
      const newDom = $('.collection-card').first().clone()
      newDom.children('.mine-card-body')
      newDom.children('.mine-card-body').children('.card-title').append(`${foodObject.name}`)
      newDom.show()
      $('.display-exclusion').append(newDom)
    }
  }
  getUserPreference(userId)
}
