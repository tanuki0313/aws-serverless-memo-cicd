const region = "ap-northeast-1"

// Cognito Hosted UI 用の設定
// 実環境ではコンソールから取得した値に置き換える
const clientId = "YOUR_CLIENT_ID" // UserPoolClient の ID
const domainPrefix = "YOUR_DOMAIN_PREFIX" // cognito-stack.yaml の UserPoolDomain.Domain

// CloudFront の URL（frontend-stack の FrontendUrl と一致させる）
const redirectUri = window.location.origin + "/"  // ルートに戻す想定

// Hosted UI のベースURL
function getHostedUiBaseUrl() {
  return `https://${domainPrefix}.auth.${region}.amazoncognito.com`
}

// 画面表示の切り替え
function showLoggedIn() {
  document.getElementById("loginArea").style.display = "none"
  document.getElementById("memoArea").style.display = "block"
}

// 認証済みかチェックし、未認証ならログインエリアを表示
async function initAuth() {
  const storedToken = localStorage.getItem("token")

  // 既にトークン保持していればそのままメモ画面へ
  if (storedToken) {
    showLoggedIn()
    await loadMemos()
    return
  }

  // Hosted UI からのリダイレクトで ?code=... が付いている場合、トークンを交換
  const params = new URLSearchParams(window.location.search)
  const code = params.get("code")

  if (!code) {
    // 未ログイン状態
    document.getElementById("loginArea").style.display = "block"
    document.getElementById("memoArea").style.display = "none"
    return
  }

  // 認可コードをトークンに交換
  const tokenEndpoint = `${getHostedUiBaseUrl()}/oauth2/token`

  const body = new URLSearchParams()
  body.append("grant_type", "authorization_code")
  body.append("client_id", clientId)
  body.append("code", code)
  body.append("redirect_uri", redirectUri)

  const res = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  })

  const data = await res.json()

  const idToken = data.id_token

  if (!idToken) {
    // 取得に失敗した場合はログイン画面に戻す
    document.getElementById("loginArea").style.display = "block"
    document.getElementById("memoArea").style.display = "none"
    return
  }

  // トークン保存
  localStorage.setItem("token", idToken)

  // URL から ?code=... を消す（履歴だけ書き換え）
  window.history.replaceState({}, document.title, redirectUri)

  showLoggedIn()
  await loadMemos()
}

// ログインボタン押下時：Hosted UI にリダイレクト
function login() {
  const authorizeUrl = `${getHostedUiBaseUrl()}/oauth2/authorize` +
    `?response_type=code` +
    `&client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent("openid email")}`

  window.location.href = authorizeUrl
}

// ページ読み込み時に認証状態を初期化
window.addEventListener("load", () => {
  initAuth()
})