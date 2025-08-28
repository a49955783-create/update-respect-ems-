import React, { useEffect, useRef, useState } from 'react'
import { ocrExtract, cleanLineText } from './ocr.js'

export default function App(){
  const [recipient, setRecipient] = useState('')
  const [deputy, setDeputy] = useState('')
  const [recipientErr, setRecipientErr] = useState(false)
  const [deputyErr, setDeputyErr] = useState(false)
  const [notes, setNotes] = useState('تحديث')
  const [people, setPeople] = useState([]) // {name, code, status}
  const [imageUrl, setImageUrl] = useState(null)
  const [finalText, setFinalText] = useState('')
  const [busy, setBusy] = useState(false)
  const imgRef = useRef(null)
  const canvasRef = useRef(null)
  const dropRef = useRef(null)

  useEffect(()=>{
    const saved = localStorage.getItem('theme') || 'light'
    document.documentElement.classList.toggle('dark', saved==='dark')
  },[])

  function toggleTheme(){
    const isDark = document.documentElement.classList.toggle('dark')
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }

  useEffect(()=>{
    if(!imageUrl) return
    const img = imgRef.current
    if(!img) return
    const onload = ()=>{
      const c = canvasRef.current; const ctx = c.getContext('2d',{willReadFrequently:true})
      c.width = img.naturalWidth; c.height = img.naturalHeight; ctx.drawImage(img,0,0)
    }
    img.addEventListener('load', onload)
    return ()=> img.removeEventListener('load', onload)
  },[imageUrl])

  useEffect(()=>{
    function onPaste(e){
      const items = e.clipboardData?.items || []
      for(const it of items){
        if(it.type?.startsWith('image/')){
          const f = it.getAsFile(); const url = URL.createObjectURL(f); setImageUrl(url); e.preventDefault(); break
        }
      }
    }
    window.addEventListener('paste', onPaste); return ()=> window.removeEventListener('paste', onPaste)
  },[])

  useEffect(()=>{
    const el = dropRef.current; if(!el) return
    const prevent=e=>{e.preventDefault(); e.stopPropagation()}
    const drop=e=>{ prevent(e); const f = e.dataTransfer?.files?.[0]; if(f) setImageUrl(URL.createObjectURL(f)) }
    el.addEventListener('dragover', prevent); el.addEventListener('dragenter', prevent); el.addEventListener('drop', drop)
    return ()=>{ el.removeEventListener('dragover', prevent); el.removeEventListener('dragenter', prevent); el.removeEventListener('drop', drop) }
  },[])

  function onFile(e){ const f = e.target.files?.[0]; if(f) setImageUrl(URL.createObjectURL(f)) }

  function parseNameCode(text){
    text = cleanLineText(text)
    let m = text.match(/^(.+?)\s+([A-Za-z]{1,4}-?\d{1,4})$/)
    if(m) return { name: m[1].trim(), code: m[2].trim() }
    m = text.match(/^([A-Za-z]{1,4}-?\d{1,4})\s+(.+)$/)
    if(m) return { name: m[2].trim(), code: m[1].trim() }
    return { name: text.trim(), code: '' }
  }

  async function extract(){
    if(!imageUrl){ alert('أضف صورة أولاً'); return }
    setBusy(true); try{
      const lines = await ocrExtract(imageUrl)
      const arr = []
      for(const line of lines){
        let txt = (line.text||'').trim(); if(!txt) continue
        txt = cleanLineText(txt); if(!/[؀-ۿ]/.test(txt)) continue
        const { name, code } = parseNameCode(txt); if(!name) continue
        arr.push({ name, code, status: 'field' })
      }
      // dedupe
      const map = new Map(); for(const p of arr){ const key=(p.name+'|'+p.code).trim(); if(!map.has(key)) map.set(key,p) }
      setPeople(Array.from(map.values()))
    }catch(e){ console.error(e); alert('خطأ أثناء الاستخراج') } finally { setBusy(false) }
  }

  function generate(){
    const rEmpty = !recipient.trim(); const dEmpty = !deputy.trim()
    setRecipientErr(rEmpty); setDeputyErr(dEmpty); if(rEmpty||dEmpty) return
    const inField = people.filter(p=>p.status!=='oos')
    const oos = people.filter(p=>p.status==='oos')
    const totalField = inField.length + 1
    const listField = inField.map(p=>`${p.name}${p.code? ' ' + p.code : ''}${p.status==='busy' ? ' (مشغول)' : ''}`).join('\n')
    const listOOS = oos.map(p=>`${p.name}${p.code? ' ' + p.code : ''}`).join('\n')
    const text = `📌 استلام العمليات 📌

 المستلم : ${recipient}

 النائب : ${deputy}

عدد و اسماء الوحدات الاسعافيه في الميدان : {${totalField}}
${listField ? listField + '\n' : ''}
خارج الخدمة : (${oos.length})
${listOOS ? listOOS + '\n' : ''}
🎙️ تم استلام العمليات و جاهزون للتعامل مع البلاغات

الملاحظات : ${notes}`
    setFinalText(text)
  }

  async function copyFinal(){ if(!finalText) return; try{ await navigator.clipboard.writeText(finalText); alert('تم النسخ ✅') }catch{ alert('انسخ يدويًا') } }

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="card">
          <div className="header-wrap">
            <img src="/logo-right.png" className="header-logo" alt="logo right" />
            <h1 className="title">تحديث مركز العمليات للصحة</h1>
            <img src="/logo-left.png" className="header-logo" alt="logo left" />
          </div>
          <div className="flex items-center justify-center mt-3">
            <button onClick={toggleTheme} className="btn btn-ghost">الوضع الداكن/الفاتح</button>
          </div>
        </div>

        <div className="card space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="label">المستلم</label>
              <input className="input" value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="الاسم + الكود" />
              {recipientErr && <div className="text-red-500 text-xs mt-1">يجب عليك كتابة الاسم مع كود</div>}
            </div>
            <div>
              <label className="label">النائب</label>
              <input className="input" value={deputy} onChange={e=>setDeputy(e.target.value)} placeholder="الاسم + الكود" />
              {deputyErr && <div className="text-red-500 text-xs mt-1">يجب عليك كتابة الاسم مع كود</div>}
            </div>
          </div>

  <div className="grid md:grid-cols-2 gap-3">
    <div>
      <label className="label">📷 ارفع صورة</label>
      <input type="file" accept="image/*" onChange={onFile} className="input" />
    </div>
    <div>
      <label className="label">أو ألصق/اسحب الصورة هنا</label>
      <div ref={dropRef} className="drop">Ctrl+V للصق أو اسحب الصورة وأفلِتها هنا</div>
    </div>
  </div>

  {imageUrl && (
    <div className="mt-2">
      <img ref={imgRef} src={imageUrl} className="max-w-full rounded-xl mx-auto" alt="preview" />
      <canvas ref={canvasRef} style={{display:'none'}} />
    </div>
  )}

  <div className="flex flex-wrap gap-2">
    <button onClick={extract} disabled={busy} className="btn btn-primary">{busy? 'جاري الاستخراج…' : 'استخراج من الصورة (OCR)'}</button>
    <button className="btn btn-ghost" onClick={()=>{ setPeople([]); setImageUrl(null); setFinalText(''); }}>إعادة تعيين</button>
  </div>

{people.length>0 && (
  <div className="card">
    <div className="small mb-2">القائمة المستخرجة (يمكن تعديل الحالة يدويًا):</div>
    <div className="list">
      {people.map((p,idx)=>(
        <div className="item" key={idx}>
          <input className="input" value={p.name} onChange={e=>{ const copy=[...people]; copy[idx].name=e.target.value; setPeople(copy) }} placeholder="الاسم" />
          <input className="input" value={p.code} onChange={e=>{ const copy=[...people]; copy[idx].code=e.target.value; setPeople(copy) }} placeholder="الكود" />
          <select className="input" value={p.status} onChange={e=>{ const copy=[...people]; copy[idx].status=e.target.value; setPeople(copy) }}>
            <option value="field">في الميدان</option>
            <option value="busy">مشغول (في الميدان)</option>
            <option value="oos">خارج الخدمة</option>
          </select>
        </div>
      ))}
    </div>
  </div>
)}

<div className="card space-y-2">
  <div className="flex flex-wrap gap-2">
    <button onClick={generate} className="btn btn-primary">توليد النص النهائي</button>
    <button onClick={copyFinal} className="btn btn-ghost" disabled={!finalText}>نسخ النتيجة</button>
  </div>
  <textarea value={finalText} onChange={e=>setFinalText(e.target.value)} placeholder="النتيجة النهائية ستظهر هنا بنفس النموذج…" />
</div>

      </div>
    </div>
  )
}
