import React, { useState } from 'react'
import Tesseract from 'tesseract.js'

function App() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    setLoading(true)
    const { data: { text } } = await Tesseract.recognize(file, 'ara')
    setText(text)
    setLoading(false)
  }

  return (
    <div className="app">
      <header>
        <h1>تحديث مركز العمليات للصحة</h1>
        <img src="/logo-right.png" alt="شعار يمين" className="logo-right" />
        <img src="/logo-left.png" alt="شعار يسار" className="logo-left" />
      </header>

      <main>
        <form>
          <label className="label">📌 استلام العمليات 📌</label>

          <label className="label">المستلم :</label>
          <input type="text" placeholder="الاسم + الكود" />

          <label className="label">النائب :</label>
          <input type="text" placeholder="الاسم + الكود" />

          <label className="label">عدد و أسماء الوحدات الإسعافية :</label>
          <textarea rows="5" placeholder="اسم + كود"></textarea>

          <label className="label">تحميل صورة (لاستخراج النص):</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          {loading && <p>جاري المعالجة...</p>}
          {text && (
            <div>
              <h3>النص المستخرج:</h3>
              <pre>{text}</pre>
            </div>
          )}

          <label className="label">🎙️ تم استلام العمليات و جاهزون للتعامل مع البلاغات</label>
          <label className="label">الملاحظات :</label>
          <input type="text" placeholder="تحديث" />
        </form>
      </main>
    </div>
  )
}

export default App
