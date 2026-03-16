async function loadMemos(){
  const memos = await apiGet()
  const list = document.getElementById("memoList")
  list.innerHTML = ""

  memos.forEach(m => {
    const li = document.createElement("li")
    li.style.marginBottom = "8px"

    // メモ本文
    const span = document.createElement("span")
    span.innerText = m.content ?? m.text ?? ""
    span.style.marginRight = "10px"

    // 編集ボタン
    const editBtn = document.createElement("button")
    editBtn.innerText = "編集"
    editBtn.style.marginRight = "4px"
    editBtn.onclick = () => editMemo(m.memoId, span)

    // 削除ボタン
    const deleteBtn = document.createElement("button")
    deleteBtn.innerText = "削除"
    deleteBtn.onclick = () => deleteMemo(m.memoId)

    li.appendChild(span)
    li.appendChild(editBtn)
    li.appendChild(deleteBtn)
    list.appendChild(li)
  })
}

async function createMemo(){
  const text = document.getElementById("memoText").value
  if (!text) return
  await apiPost(text)
  document.getElementById("memoText").value = ""
  loadMemos()
}

async function editMemo(memoId, span){
  // 現在のテキストを入力欄に変換
  const input = document.createElement("input")
  input.value = span.innerText
  input.style.marginRight = "6px"

  const saveBtn = document.createElement("button")
  saveBtn.innerText = "保存"
  saveBtn.onclick = async () => {
    const newText = input.value
    if (!newText) return
    await apiPut(memoId, newText)
    loadMemos()
  }

  const cancelBtn = document.createElement("button")
  cancelBtn.innerText = "キャンセル"
  cancelBtn.style.marginLeft = "4px"
  cancelBtn.onclick = () => loadMemos()

  // spanを入力欄に置き換え
  const li = span.parentElement
  li.innerHTML = ""
  li.appendChild(input)
  li.appendChild(saveBtn)
  li.appendChild(cancelBtn)
}

async function deleteMemo(memoId){
  if (!confirm("削除しますか？")) return
  await apiDelete(memoId)
  loadMemos()
}
