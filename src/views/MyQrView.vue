<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAll, remove } from '../db/db'
import { CATEGORIES } from '../lib/content'
import { renderQr, toBlob, download } from '../lib/qr'

const list = ref([])
const clients = ref([])
const cat = ref('')
const q = ref('')

async function load() {
  list.value = (await getAll('qrcodes')).sort((a, b) => b.id - a.id)
  clients.value = await getAll('clients')
}
onMounted(load)

const shown = computed(() =>
  list.value.filter((r) => (!cat.value || r.category === cat.value) && (!q.value || r.label.toLowerCase().includes(q.value.toLowerCase()))),
)
const clientName = (id) => clients.value.find((c) => c.id === id)?.name || ''
async function dl(r) { download(await toBlob(await renderQr(r.data, r.style, 1500)), r.label.replace(/[^\w-]+/g, '_') + '.png') }
async function del(r) { if (confirm(`Supprimer « ${r.label} » ?`)) { await remove('qrcodes', r.id); load() } }
</script>

<template>
  <section>
    <h1 class="page-title">Mes QR codes</h1>
    <div class="row">
      <input v-model="q" placeholder="Rechercher…" />
      <select v-model="cat"><option value="">Toutes les catégories</option><option v-for="(c, k) in CATEGORIES" :key="k" :value="k">{{ c.label }}</option></select>
    </div>
    <p v-if="!shown.length" class="muted">Aucun QR code.</p>
    <div class="grid">
      <div v-for="r in shown" :key="r.id" class="card">
        <img :src="r.preview" class="qr-thumb" />
        <strong>{{ r.label }}</strong>
        <span class="muted small">{{ CATEGORIES[r.category]?.label }} · {{ new Date(r.createdAt).toLocaleDateString('fr-FR') }}</span>
        <span v-if="clientName(r.clientId)" class="muted small">👤 {{ clientName(r.clientId) }}</span>
        <div class="actions">
          <button class="btn secondary small" @click="dl(r)">PNG</button>
          <button class="btn danger small" @click="del(r)">Supprimer</button>
        </div>
      </div>
    </div>
  </section>
</template>
