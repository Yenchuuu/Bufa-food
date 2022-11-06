function load_data (query) {
  fetch(`/getData?key=${query}`)
    .then(function (response) {
      return response.json()
    })
    .then(function (responseData) {
      let html = '<ul class="list-group">'
      const len = responseData.length
      if (len > 0) {
        for (let i = 0; i < len; i++) {
          // RegExp 物件被用來比對符合自訂規則的文字
          const regular_expression = new RegExp(`(${query})`)
          // span 中的$1表示搜尋的關鍵字
          html += `<a href="#" class="list-group-item list-group-item-action" onclick="get_text(this)">${responseData[
            i
          ].name.replace(
            regular_expression,
            '<span class="text-primary fw-bold">$1</span>'
          )}</a>`
        }
      } else {
        html +=
          '<a href="#" class="list-group-item list-group-item-action disabled">No Data Found</a>'
      }
      html += '</ul>'
      document.getElementById('search_result').innerHTML = html
    })
}

const search_element = document.getElementById('autocomplete_search')

// 追蹤使用者輸入的字元，並執行query
search_element.onkeyup = function () {
  const query = search_element.value
  load_data(query)
}

// 使用者初次點選input便產生推薦項
search_element.onfocus = function () {
  const query = search_element.value
  load_data(query)
}

function get_text (event) {
  // console.log('event', event);
  const food_name = event.textContent
  console.log(food_name)
  document.getElementById('autocomplete_search').value = food_name
  document.getElementById('search_result').innerHTML = ''
}
