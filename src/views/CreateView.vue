<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { FIELDS, buildContent, labelOf } from '../lib/content'
import { DEFAULT_STYLE, renderPng, renderSvg, pdfBlob, styleWarnings, fileToDataUrl, thumb, download, checkDecode } from '../lib/qr'
import { add, getAll } from '../db/db'

const route = useRoute()
const form = reactive({})
const style = reactive({ ...DEFAULT_STYLE })
const host = ref(null)
const error = ref('')
const result = ref(null) // { data, style, label }
const test = ref(null)
const stale = ref(false)
const busy = ref(false)

onMounted(async () => {
  const id = Number(route.query.from)
  if (!id) return
  const rec = (await getAll('qrcodes')).find((r) => r.id === id)
  if (rec) { Object.assign(form, rec.form); Object.assign(style, DEFAULT_STYLE, rec.style) }
})

async function onLogo(e) {
  const f = e.target.files?.[0]
  if (f) { style.logo = await fileToDataUrl(f); touched() }
}
const touched = () => { if (result.value) stale.value = true }

async function generate() {
  error.value = ''; test.value = null; stale.value = false
  const built = buildContent(form)
  if (built.error) { error.value = built.error; return }
  busy.value = true
  try {
    const snap = { ...style }
    const { canvas } = await renderPng(built.data, snap, 700)
    canvas.style.cssText = 'width:100%;height:auto;display:block'
    host.value.replaceChildren(canvas)
    result.value = { data: built.data, style: snap, label: labelOf(form) }
    await add('qrcodes', { label: result.value.label, form: { ...form }, style: snap, data: built.data, preview: thumb(canvas) })
    test.value = await checkDecode(canvas, built.data)
  } catch {
    result.value = null; host.value.replaceChildren()
    error.value = 'Impossible de générer ce QR : le contenu est trop long. Raccourcis les textes ou retire le logo.'
  } finally { busy.value = false }
}

const fname = () => result.value.label.replace(/[^\w-]+/g, '_') || 'qr'
async function dlPng() { download((await renderPng(result.value.data, result.value.style, 1500)).blob, fname() + '.png') }
async function dlSvg() { download(await renderSvg(result.value.data, result.value.style, 1500), fname() + '.svg') }
async function dlPdf() { download(await pdfBlob(result.value.data, result.value.style, result.value.label), fname() + '.pdf') }
</script>

<template>
  <section>
    <h1 class="page-title">Créer mon QR code</h1>
    <div class="two-col">
      <div class="card">
        <h2>Tes informations <span class="muted small">(tous les champs sont facultatifs)</span></h2>
        <div class="field">
          <label>Logo ou photo (affiché au centre du QR)</label>
          <input type="file" accept="image/*" @change="onLogo" />
          <button v-if="style.logo" class="btn secondary small" @click="style.logo = ''; touched()">Retirer le logo</button>
        </div>
        <div v-for="f in FIELDS" :key="f.k" class="field">
          <label>{{ f.l }}</label>
          <textarea v-if="f.area" v-model="form[f.k]" rows="3"></textarea>
          <input v-else v-model="form[f.k]" :type="f.type || 'text'" />
        </div>
        <p class="muted small">Numéros : « 77 123 45 67 » devient automatiquement +221… Pour un autre pays, saisis l'indicatif (+33…).</p>

        <h2>Apparence</h2>
        <div class="row">
          <div class="field"><label>Couleur du QR</label><input type="color" v-model="style.dots" @input="touched" /></div>
          <div class="field"><label>Couleur du fond</label><input type="color" v-model="style.bg" @input="touched" /></div>
          <div class="field"><label>Taille d'impression ({{ style.sizeCm }} cm)</label><input type="range" min="3" max="15" step="0.5" v-model.number="style.sizeCm" @input="touched" /></div>
        </div>
        <p v-for="w in styleWarnings(style)" :key="w" class="warn">⚠️ {{ w }}</p>

        <p v-if="error" class="error">{{ error }}</p>
        <button class="btn big" :disabled="busy" @click="generate">{{ busy ? 'Génération…' : 'Générer mon QR code' }}</button>
      </div>

      <aside class="sticky">
        <div class="card">
          <h2>Aperçu</h2>
          <div ref="host" class="preview"></div>
          <p v-if="!result" class="muted">Ton QR code apparaîtra ici.</p>
          <p v-if="stale" class="warn">Réglages modifiés : clique sur « Générer mon QR code » pour les appliquer.</p>
          <p v-if="test" :class="test.ok === false ? 'error' : test.ok ? 'ok' : 'muted'">{{ test.msg }}</p>
          <details v-if="result"><summary>Texte qui s'affichera au scan</summary><pre>{{ result.data }}</pre></details>
          <div v-if="result" class="actions">
            <button class="btn" @click="dlPng">PNG</button>
            <button class="btn" @click="dlSvg">SVG</button>
            <button class="btn" @click="dlPdf">PDF (impression)</button>
          </div>
          <p v-if="result" class="muted small">Enregistré dans l'historique de cet appareil.</p>
        </div>
      </aside>
    </div>
  </section>
</template>
