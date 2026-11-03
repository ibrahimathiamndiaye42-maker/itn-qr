<script setup>
import { onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { TEMPLATES } from '../lib/templates'
import { CATEGORIES } from '../lib/content'
import { DEFAULT_STYLE, renderQr } from '../lib/qr'

const router = useRouter()
const hosts = {}
onMounted(async () => {
  await nextTick()
  for (const t of TEMPLATES) {
    try {
      const c = await renderQr('ITN QR — exemple', { ...DEFAULT_STYLE, ...t.style, message: t.message }, 360)
      c.style.cssText = 'width:100%;height:auto;display:block'
      hosts[t.id]?.replaceChildren(c)
    } catch { /* aperçu ignoré */ }
  }
})
</script>

<template>
  <section>
    <h1 class="page-title">Modèles graphiques</h1>
    <p class="muted">Choisis un modèle, puis remplace les textes, couleurs, logo et informations dans le générateur.</p>
    <div class="grid">
      <div v-for="t in TEMPLATES" :key="t.id" class="card">
        <div :ref="(el) => (hosts[t.id] = el)" class="preview small-preview"></div>
        <strong>{{ t.name }}</strong>
        <span class="muted small">{{ CATEGORIES[t.category].label }}</span>
        <button class="btn" @click="router.push({ path: '/creer', query: { tpl: t.id } })">Utiliser ce modèle</button>
      </div>
    </div>
  </section>
</template>
