<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { getAll, add } from '../db/db'
import { CATEGORIES, buildContent, identityLines } from '../lib/content'
import { DEFAULT_STYLE, renderQr, thumb } from '../lib/qr'
import { TEMPLATES } from '../lib/templates'
import { FORMATS, buildPdf } from '../lib/pdf'

const tab = ref('mine')
const list = ref([])
const picked = ref([])
const fmtId = ref('8')
const custom = reactive({ w: 60, h: 60 })
const margin = ref(3)
const sheet = ref(true)
const duplex = ref(false)
const caption = ref(true)
const busy = ref('')
const err = ref('')

const dims = computed(() => {
  const f = FORMATS.find((x) => x.id === fmtId.value)
  return fmtId.value === 'custom' ? { w: custom.w, h: custom.h } : { w: f.w, h: f.h }
})
const opts = () => ({ ...dims.value, margin: margin.value, sheet: sheet.value, duplex: duplex.value && !sheet.value, guides: true })

onMounted(async () => { list.value = (await getAll('qrcodes')).sort((a, b) => b.id - a.id) })

async function genMine() {
  err.value = ''
  try {
    const items = []
    for (const [i, id] of picked.value.entries()) {
      busy.value = `Création ${i + 1}/${picked.value.length}…`
      const r = list.value.find((x) => x.id === id)
      const full = identityLines(r.category, r.form)
      items.push({ qr: await renderQr(r.data, r.style, 900), lines: caption.value ? full.slice(0, 3) : [], fullLines: full, photo: r.form.photo })
    }
    const doc = await buildPdf(items, opts())
    doc.save('itn-qr-supports.pdf')
  } catch (e) { err.value = e.message } finally { busy.value = '' }
}

// ---- Génération en série (Excel / CSV)
const bcat = ref('school')
const tplId = ref('sch-colore')
const rows = ref([])
const problems = ref([])
const saveAll = ref(false)
const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
const bfields = computed(() => CATEGORIES[bcat.value].fields.filter((f) => f.t !== 'file'))
const tpls = computed(() => TEMPLATES.filter((t) => t.category === bcat.value))
function onCat() { tplId.value = tpls.value[0]?.id; rows.value = []; problems.value = [] }

function rowToForm(row) {
  const map = {}
  for (const f of bfields.value) { map[norm(f.l)] = f.k; map[norm(f.k)] = f.k }
  const out = {}
  for (const [h, v] of Object.entries(row)) { const k = map[norm(h)]; if (k) out[k] = String(v).trim() }
  if (!out.message && CATEGORIES[bcat.value].formMessage) out.message = CATEGORIES[bcat.value].formMessage
  return out
}
async function onSheet(e) {
  rows.value = []; problems.value = []
  const file = e.target.files?.[0]
  if (!file) return
  const XLSX = await import('xlsx')
  const wb = XLSX.read(await file.arrayBuffer())
  const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' })
  const seen = new Map()
  data.forEach((r, i) => {
    const f = rowToForm(r)
    const b = buildContent(bcat.value, 'text', f)
    if (b.error) problems.value.push(`Ligne ${i + 2} : ${b.error}`)
    else {
      const key = (f.studentId || f.phone || f.firstName || f.owner || '').toLowerCase()
      if (key && seen.has(key)) problems.value.push(`Ligne ${i + 2} : doublon possible avec la ligne ${seen.get(key)} (« ${key} »). Ligne ignorée.`)
      else { if (key) seen.set(key, i + 2); rows.value.push({ form: f, data: b.data }) }
    }
  })
  if (!data.length) problems.value.push('Le fichier est vide ou illisible.')
}
async function template() {
  const XLSX = await import('xlsx')
  const ws = XLSX.utils.aoa_to_sheet([bfields.value.map((f) => f.l)])
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Modele')
  XLSX.writeFile(wb, `modele-${bcat.value}.xlsx`)
}
async function genBulk() {
  err.value = ''
  try {
    const t = TEMPLATES.find((x) => x.id === tplId.value)
    const style = { ...DEFAULT_STYLE, ...t.style, message: t.message }
    const items = []
    for (const [i, r] of rows.value.entries()) {
      busy.value = `Création ${i + 1}/${rows.value.length}…`
      const qr = await renderQr(r.data, style, 900) // un QR rendu séparément par ligne : aucune donnée partagée
      const full = identityLines(bcat.value, r.form)
      items.push({ qr, lines: full.slice(0, 3), fullLines: full })
      if (saveAll.value) await add('qrcodes', { category: bcat.value, type: 'text', label: full[bcat.value === 'school' ? 1 : 0] || 'QR', form: { ...r.form }, style: { ...style }, data: r.data, clientId: null, preview: thumb(qr, 320) })
    }
    const doc = await buildPdf(items, opts())
    doc.save(`itn-qr-serie-${bcat.value}.pdf`)
  } catch (e) { err.value = e.message } finally { busy.value = '' }
}
</script>

<template>
  <section>
    <h1 class="page-title">Cartes et étiquettes</h1>
    <div class="tabs">
      <button class="tab" :class="{ active: tab === 'mine' }" @click="tab = 'mine'">Depuis mes QR codes</button>
      <button class="tab" :class="{ active: tab === 'bulk' }" @click="tab = 'bulk'">En série (Excel / CSV)</button>
    </div>

    <div class="card">
      <h2>Format d'impression</h2>
      <div class="row">
        <div class="field"><label>Dimensions</label><select v-model="fmtId"><option v-for="f in FORMATS" :key="f.id" :value="f.id">{{ f.l }}</option></select></div>
        <template v-if="fmtId === 'custom'">
          <div class="field"><label>Largeur (mm)</label><input type="number" min="20" v-model.number="custom.w" /></div>
          <div class="field"><label>Hauteur (mm)</label><input type="number" min="20" v-model.number="custom.h" /></div>
        </template>
        <div class="field"><label>Marge de sécurité (mm)</label><input type="number" min="0" max="15" step="0.5" v-model.number="margin" /></div>
      </div>
      <label class="check"><input type="checkbox" v-model="sheet" /> Planche A4 (plusieurs étiquettes par page, avec repères de découpe)</label>
      <label v-if="!sheet" class="check"><input type="checkbox" v-model="duplex" /> Recto-verso (recto : photo + infos, verso : QR) — cartes scolaires et badges</label>
    </div>

    <div v-if="tab === 'mine'" class="card">
      <h2>Choisis les QR codes</h2>
      <p v-if="!list.length" class="muted">Aucun QR enregistré. Crée d'abord un QR dans « Créer un QR code ».</p>
      <label v-for="r in list" :key="r.id" class="check pick">
        <input type="checkbox" :value="r.id" v-model="picked" />
        <img :src="r.preview" class="mini" /> {{ r.label }} <span class="muted small">({{ CATEGORIES[r.category]?.label }})</span>
      </label>
      <label class="check"><input type="checkbox" v-model="caption" /> Afficher les informations sous le QR</label>
      <button class="btn" :disabled="!picked.length || !!busy" @click="genMine">{{ busy || 'Générer le PDF' }}</button>
    </div>

    <div v-else class="card">
      <h2>Import Excel / CSV</h2>
      <div class="row">
        <div class="field"><label>Catégorie</label><select v-model="bcat" @change="onCat"><option v-for="k in ['school', 'business', 'personal', 'travel', 'safety']" :key="k" :value="k">{{ CATEGORIES[k].label }}</option></select></div>
        <div class="field"><label>Modèle graphique</label><select v-model="tplId"><option v-for="t in tpls" :key="t.id" :value="t.id">{{ t.name }}</option></select></div>
      </div>
      <p class="muted small">Colonnes attendues : {{ bfields.map((f) => f.l).join(' · ') }}</p>
      <div class="actions"><button class="btn secondary" @click="template">Télécharger le modèle Excel</button></div>
      <div class="field"><label>Fichier (.xlsx, .xls, .csv)</label><input type="file" accept=".xlsx,.xls,.csv" @change="onSheet" /></div>
      <p v-if="rows.length" class="ok">✅ {{ rows.length }} ligne(s) valide(s).</p>
      <p v-for="p in problems" :key="p" class="warn">⚠️ {{ p }}</p>
      <label class="check"><input type="checkbox" v-model="saveAll" /> Enregistrer aussi chaque QR dans « Mes QR codes »</label>
      <button class="btn" :disabled="!rows.length || !!busy" @click="genBulk">{{ busy || 'Générer le PDF' }}</button>
    </div>
    <p v-if="err" class="error">{{ err }}</p>
  </section>
</template>
