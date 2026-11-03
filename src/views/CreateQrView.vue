<script setup>
import { reactive, ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { CATEGORIES, TYPES, buildContent, warnings } from '../lib/content'
import { PALETTES, DEFAULT_STYLE, DOT_TYPES, CORNER_TYPES, FRAME_LABELS, renderQr, styleWarnings, fileToDataUrl, thumb, toBlob, download, checkDecode } from '../lib/qr'
import { TEMPLATES } from '../lib/templates'
import { add, getAll } from '../db/db'

const route = useRoute()
const cat = ref('business')
const type = ref('vcard')
const form = reactive({})
const style = reactive({ ...DEFAULT_STYLE, message: CATEGORIES.business.defaultMessage })
const label = ref('')
const clientId = ref('')
const clients = ref([])
const host = ref(null)
const info = ref('')
const test = ref(null)
const saved = ref(false)
let lastCanvas = null
let timer

const C = computed(() => CATEGORIES[cat.value])
const built = computed(() => buildContent(cat.value, type.value, form))
const warns = computed(() => [...warnings(cat.value, form, built.value.data), ...styleWarnings(style)])

function selectCat(c) {
  cat.value = c
  Object.keys(form).forEach((k) => delete form[k])
  form.message = CATEGORIES[c].formMessage || ''
  type.value = CATEGORIES[c].types[0]
  style.message = CATEGORIES[c].defaultMessage
}
function applyTemplate(t) {
  selectCat(t.category)
  Object.assign(style, DEFAULT_STYLE, t.style, { message: t.message })
}

async function onFile(e, key) {
  const f = e.target.files?.[0]
  if (f) form[key] = await fileToDataUrl(f, 400)
}
async function onLogo(e) {
  const f = e.target.files?.[0]
  if (f) style.logo = await fileToDataUrl(f, 400)
}

async function draw() {
  info.value = ''; test.value = null; saved.value = false
  if (!built.value.data) { host.value?.replaceChildren(); lastCanvas = null; return }
  try {
    lastCanvas = await renderQr(built.value.data, style, 600)
    lastCanvas.style.cssText = 'width:100%;height:auto;display:block'
    host.value.replaceChildren(lastCanvas)
  } catch {
    lastCanvas = null
    host.value?.replaceChildren()
    info.value = 'Impossible de générer le QR : contenu trop long ou invalide.'
  }
}
watch(() => [built.value.data, JSON.stringify(style)], () => { clearTimeout(timer); timer = setTimeout(draw, 150) })

const fileName = () => (label.value || form.company || form.owner || form.firstName || 'qr').replace(/[^\w-]+/g, '_')
const full = () => renderQr(built.value.data, style, 1500)

async function dlPng() { download(await toBlob(await full()), fileName() + '.png') }
async function dlPdf() {
  const c = await full()
  const { jsPDF } = await import('jspdf')
  const w = 80, h = (w * c.height) / c.width
  const d = new jsPDF({ unit: 'mm', format: [w, h], orientation: h > w ? 'p' : 'l' })
  d.addImage(c.toDataURL('image/png'), 'PNG', 0, 0, w, h)
  d.save(fileName() + '.pdf')
}
async function runTest() { test.value = await checkDecode(await full(), built.value.data) }
async function save() {
  if (!lastCanvas) return
  await add('qrcodes', {
    category: cat.value, type: type.value, label: label.value || form.company || form.owner || form.firstName || C.value.label,
    form: { ...form }, style: { ...style }, data: built.value.data,
    clientId: clientId.value ? Number(clientId.value) : null, preview: thumb(lastCanvas, 320),
  })
  saved.value = true
}

onMounted(async () => {
  selectCat('business')
  clients.value = await getAll('clients')
  const t = TEMPLATES.find((x) => x.id === route.query.tpl)
  if (t) applyTemplate(t)
  await nextTick()
})
</script>

<template>
  <section>
    <h1 class="page-title">Créer un QR code</h1>
    <div class="tabs">
      <button v-for="(c, k) in CATEGORIES" :key="k" class="tab" :class="{ active: cat === k }" @click="selectCat(k)">{{ c.icon }} {{ c.label }}</button>
    </div>

    <div class="two-col">
      <div>
        <div class="card">
          <h2>1. Informations</h2>
          <p v-if="C.note" class="warn">{{ C.note }}</p>
          <div class="field"><label>Nom interne (pour retrouver ce QR)</label><input v-model="label" /></div>
          <div v-for="f in C.fields" :key="f.k" class="field">
            <label>{{ f.l }}<span v-if="f.req"> *</span></label>
            <textarea v-if="f.t === 'area'" v-model="form[f.k]" rows="3"></textarea>
            <input v-else-if="f.t === 'file'" type="file" accept="image/*" @change="onFile($event, f.k)" />
            <input v-else v-model="form[f.k]" :type="f.t === 'tel' ? 'tel' : f.t === 'email' ? 'email' : 'text'" />
          </div>
          <p class="muted small">Numéros : « 77 123 45 67 » devient automatiquement +221… Pour un autre pays, saisis l'indicatif (+33…).</p>
        </div>

        <div class="card">
          <h2>2. Type de contenu</h2>
          <select v-model="type"><option v-for="t in C.types" :key="t" :value="t">{{ TYPES[t] }}</option></select>
          <p class="muted small">Tout est encodé directement dans le QR : aucune redirection, aucun suivi.</p>
        </div>

        <div class="card">
          <h2>3. Apparence</h2>
          <div class="chips">
            <button v-for="(p, n) in PALETTES" :key="n" class="chip" @click="Object.assign(style, p)">
              <span class="dot" :style="{ background: p.dots }"></span>{{ n }}
            </button>
          </div>
          <div class="row">
            <div class="field"><label>Motifs</label><input type="color" v-model="style.dots" /></div>
            <div class="field"><label>Fond</label><input type="color" v-model="style.bg" /></div>
            <div class="field"><label>Cadre</label><input type="color" v-model="style.frameColor" /></div>
            <div class="field"><label>Texte</label><input type="color" v-model="style.textColor" /></div>
          </div>
          <div class="row">
            <div class="field"><label>Style des motifs</label><select v-model="style.dotType"><option v-for="(l, k) in DOT_TYPES" :key="k" :value="k">{{ l }}</option></select></div>
            <div class="field"><label>Marqueurs de position</label><select v-model="style.cornerType"><option v-for="(l, k) in CORNER_TYPES" :key="k" :value="k">{{ l }}</option></select></div>
            <div class="field"><label>Cadre</label><select v-model="style.frame"><option v-for="(l, k) in FRAME_LABELS" :key="k" :value="k">{{ l }}</option></select></div>
          </div>
          <div class="field"><label>Message autour du QR</label><input v-model="style.message" placeholder="Ex. Scannez pour nous contacter" /></div>
          <div class="row">
            <div class="field"><label>Taille du texte ({{ style.msgSize }} %)</label><input type="range" min="60" max="160" v-model.number="style.msgSize" /></div>
            <div class="field"><label>Position du texte</label><select v-model="style.msgPos"><option value="bottom">En bas</option><option value="top">En haut</option></select></div>
          </div>
          <div class="field">
            <label>Logo (facultatif)</label>
            <input type="file" accept="image/*" @change="onLogo" />
            <button v-if="style.logo" class="btn secondary small" @click="style.logo = ''">Retirer le logo</button>
          </div>
          <div v-if="style.logo" class="row">
            <div class="field"><label>Taille du logo ({{ Math.round(style.logoSize * 100) }} %)</label><input type="range" min="0.1" max="0.5" step="0.01" v-model.number="style.logoSize" /></div>
            <div class="field"><label>Position</label><select v-model="style.logoMode"><option value="center">Au centre</option><option value="top">Au-dessus du QR</option></select></div>
          </div>
        </div>

        <div class="card">
          <h2>4. Client (facultatif)</h2>
          <select v-model="clientId"><option value="">— Aucun —</option><option v-for="c in clients" :key="c.id" :value="c.id">{{ c.name }}</option></select>
        </div>
      </div>

      <aside class="sticky">
        <div class="card">
          <h2>Aperçu</h2>
          <div ref="host" class="preview"></div>
          <p v-if="!built.data" class="muted">{{ built.error }}</p>
          <p v-if="info" class="error">{{ info }}</p>
          <p v-for="w in warns" :key="w" class="warn">⚠️ {{ w }}</p>
          <details v-if="built.data"><summary>Contenu encodé</summary><pre>{{ built.data }}</pre></details>
          <p v-if="test" :class="test.ok === false ? 'error' : test.ok ? 'ok' : 'muted'">{{ test.msg }}</p>
          <p v-if="saved" class="ok">✅ Enregistré dans « Mes QR codes ».</p>
          <div class="actions">
            <button class="btn" :disabled="!built.data" @click="save">Enregistrer</button>
            <button class="btn secondary" :disabled="!built.data" @click="runTest">Tester</button>
            <button class="btn secondary" :disabled="!built.data" @click="dlPng">PNG</button>
            <button class="btn secondary" :disabled="!built.data" @click="dlPdf">PDF</button>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>
