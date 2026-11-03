<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAll, remove } from '../db/db'
import { DEFAULT_STYLE, renderPng, download } from '../lib/qr'

const router = useRouter()
const list = ref([])
async function load() { list.value = (await getAll('qrcodes')).sort((a, b) => b.id - a.id) }
onMounted(load)

async function dl(r) {
  download((await renderPng(r.data, { ...DEFAULT_STYLE, ...r.style }, 1500)).blob, r.label.replace(/[^\w-]+/g, '_') + '.png')
}
async function del(r) { if (confirm(`Supprimer « ${r.label} » de l'historique ?`)) { await remove('qrcodes', r.id); load() } }
</script>

<template>
  <section>
    <h1 class="page-title">Historique</h1>
    <p class="muted small">Stocké uniquement dans ce navigateur : si tu effaces les données du navigateur, l'historique disparaît. Les QR déjà téléchargés ou imprimés restent valables.</p>
    <p v-if="!list.length" class="muted">Aucune création pour le moment.</p>
    <div class="grid">
      <div v-for="r in list" :key="r.id" class="card">
        <img :src="r.preview" class="qr-thumb" />
        <strong>{{ r.label }}</strong>
        <span class="muted small">{{ new Date(r.createdAt).toLocaleString('fr-FR') }}</span>
        <div class="actions">
          <button class="btn secondary small" @click="router.push({ path: '/creer', query: { from: r.id } })">Rouvrir</button>
          <button class="btn secondary small" @click="dl(r)">PNG</button>
          <button class="btn danger small" @click="del(r)">Supprimer</button>
        </div>
      </div>
    </div>
  </section>
</template>
