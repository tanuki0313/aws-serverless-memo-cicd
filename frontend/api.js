// CloudFront 配下で同一オリジンとして呼び出す想定
// CloudFront の CacheBehavior で `/memos*` を API Gateway にルーティングする
const API_URL = "/memos"

function getToken(){
  return localStorage.getItem("token")
}

async function apiGet(){
  const res = await fetch(API_URL, {
    headers: {
      Authorization: getToken()
    }
  })
  return await res.json()
}

async function apiPost(text){
  await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getToken()
    },
    body: JSON.stringify({
      content: text
    })
  })
}

async function apiPut(memoId, text){
  await fetch(API_URL, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: getToken()
    },
    body: JSON.stringify({
      memoId: memoId,
      content: text
    })
  })
}

async function apiDelete(memoId){
  await fetch(API_URL, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: getToken()
    },
    body: JSON.stringify({
      memoId: memoId
    })
  })
}
