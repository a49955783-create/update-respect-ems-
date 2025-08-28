export async function ocrExtract(imageUrl){
  const res = await window.Tesseract.recognize(imageUrl, 'ara+eng')
  const lines = (res?.data?.lines || []).map(l => ({ text: (l.text||'').trim(), bbox: l.bbox }))
  return lines
}
export function cleanLineText(t){
  if(!t) return ''
  t = t.replace(/[|،]/g,' ').replace(/\s+/g,' ').trim()
  t = t.replace(/[©#@*+=|~^`"“”'’\[\]\(\)<>\{\}]/g,' ')
  const codeMatch = t.match(/([A-Za-z]{1,4}-?\d{1,4})$/)
  const code = codeMatch ? codeMatch[1] : ''
  t = t.replace(/[A-Za-z]+/g,' ').replace(/\s+/g,' ').trim()
  t = t.replace(/[^\u0600-\u06FF0-9\s-]/g,' ').replace(/\s+/g,' ').trim()
  if(code && !t.endsWith(code)) t = (t + ' ' + code).trim()
  return t
}