import QRCodeStyling from 'qr-code-styling'

export const DEFAULT_STYLE = { dots: '#000000', bg: '#ffffff', sizeCm: 6, logo: '' }

const lum = (hex) => {
  const c = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export function styleWarnings(s) {
  const a = lum(s.dots), b = lum(s.bg)
  const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
  if (ratio < 4) return ['Contraste insuffisant entre le QR et le fond : il risque de ne pas se scanner.']
  if (a > b) return ['QR plus clair que le fond (inversé) : certains lecteurs ne le lisent pas. Préfère un QR foncé sur fond clair.']
  return []
}

const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src })

function make(data, s, size) {
  return new QRCodeStyling({
    width: size, height: size, type: 'canvas', data, margin: Math.round(size * 0.05),
    qrOptions: { errorCorrectionLevel: s.logo ? 'H' : 'Q' },
    dotsOptions: { color: s.dots, type: 'square' },
    cornersSquareOptions: { color: s.dots, type: 'square' },
    cornersDotOptions: { color: s.dots, type: 'square' },
    backgroundOptions: { color: s.bg },
    image: s.logo || undefined,
    imageOptions: { hideBackgroundDots: true, imageSize: 0.22, margin: Math.round(size * 0.01), crossOrigin: 'anonymous' },
  })
}

export async function renderPng(data, s, size = 1200) {
  const blob = await make(data, s, size).getRawData('png')
  const url = URL.createObjectURL(blob)
  const img = await loadImg(url)
  URL.revokeObjectURL(url)
  const c = document.createElement('canvas')
  c.width = img.width; c.height = img.height
  c.getContext('2d').drawImage(img, 0, 0)
  return { canvas: c, blob }
}

export async function renderSvg(data, s, size = 1200) {
  const q = new QRCodeStyling({ ...make(data, s, size)._options, type: 'svg' })
  return q.getRawData('svg')
}

export async function pdfBlob(data, s, title) {
  const { jsPDF } = await import('jspdf')
  const { canvas } = await renderPng(data, s, 1500)
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const size = Math.min(Math.max(s.sizeCm, 2), 18) * 10
  const x = (210 - size) / 2, y = 40
  doc.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, size, size)
  doc.setFontSize(14)
  if (title) doc.text(title, 105, y + size + 10, { align: 'center' })
  doc.setFontSize(8); doc.setTextColor(120)
  doc.text(`Taille d'impression : ${s.sizeCm} cm × ${s.sizeCm} cm`, 105, 285, { align: 'center' })
  return doc.output('blob')
}

export function thumb(canvas, max = 240) {
  const sc = Math.min(1, max / Math.max(canvas.width, canvas.height))
  const t = document.createElement('canvas')
  t.width = Math.round(canvas.width * sc); t.height = Math.round(canvas.height * sc)
  t.getContext('2d').drawImage(canvas, 0, 0, t.width, t.height)
  return t.toDataURL('image/png')
}

export function download(blob, name) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob); a.download = name; a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}

export function fileToDataUrl(file, max = 400) {
  return new Promise((res, rej) => {
    const fr = new FileReader()
    fr.onerror = rej
    fr.onload = async () => {
      const img = await loadImg(fr.result)
      const sc = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      res(c.toDataURL('image/png'))
    }
    fr.readAsDataURL(file)
  })
}

// Relit le QR généré et le compare au contenu (si le navigateur le permet).
export async function checkDecode(canvas, expected) {
  if (!('BarcodeDetector' in window))
    return { ok: null, msg: "Relecture automatique indisponible sur ce navigateur : scanne l'aperçu avec ton téléphone." }
  try {
    const r = await new window.BarcodeDetector({ formats: ['qr_code'] }).detect(canvas)
    if (!r.length) return { ok: false, msg: '❌ Aucun QR détecté : retire le logo, augmente le contraste ou raccourcis le texte.' }
    const n = (v) => v.replace(/\r\n/g, '\n')
    return n(r[0].rawValue) === n(expected)
      ? { ok: true, msg: '✅ Relecture réussie : le QR contient exactement tes informations.' }
      : { ok: false, msg: '❌ Le contenu relu diffère de ce que tu as saisi.' }
  } catch {
    return { ok: null, msg: 'Relecture automatique impossible : scanne avec ton téléphone.' }
  }
}
