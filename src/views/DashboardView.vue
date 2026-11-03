<script setup>
import { ref, onMounted } from 'vue'
import { getAll, getSetting } from '../db/db'
import { CATEGORIES } from '../lib/content'

const s = ref({ qr: 0, clients: 0, orders: 0, revenue: 0, pending: 0 })
const lastQr = ref([]), lastClients = ref([]), byCat = ref({})
const backupLate = ref(false)
const error = ref('')
const fcfa = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'

onMounted(async () => {
  try {
    const [qr, cl, od] = [await getAll('qrcodes'), await getAll('clients'), await getAll('orders')]
    s.value = {
      qr: qr.length, clients: cl.length, orders: od.length,
      revenue: od.filter((o) => o.paymentStatus === 'Payée').reduce((a, o) => a + (Number(o.total) || 0), 0),
      pending: od.filter((o) => o.productionStatus === 'En attente').length,
    }
    lastQr.value = qr.sort((a, b) => b.id - a.id).slice(0, 5)
    lastClients.value = cl.sort((a, b) => b.id - a.id).slice(0, 5)
    byCat.value = qr.reduce((m, r) => ((m[r.category] = (m[r.category] || 0) + 1), m), {})
    const lb = await getSetting('lastBackup')
    backupLate.value = !lb || Date.now() - new Date(lb) > 7 * 864e5
  } catch (e) { error.value = 'Impossible de lire la base locale : ' + e.message }
})
</script>

<template>
  <section>
    <h1 class="page-title">Tableau de bord</h1>
    <p v-if="error" class="error">{{ error }}</p>
    <div v-if="backupLate" class="card reminder">💾 Pense à faire une sauvegarde (aucune depuis plus de 7 jours). <router-link to="/sauvegardes">Sauvegarder</router-link></div>
    <div class="grid">
      <div class="card stat"><span class="stat-label">QR codes créés</span><span class="stat-value">{{ s.qr }}</span></div>
      <div class="card stat"><span class="stat-label">Clients</span><span class="stat-value">{{ s.clients }}</span></div>
      <div class="card stat"><span class="stat-label">Commandes</span><span class="stat-value">{{ s.orders }}</span></div>
      <div class="card stat"><span class="stat-label">Chiffre d'affaires (payé)</span><span class="stat-value">{{ fcfa(s.revenue) }}</span></div>
      <div class="card stat"><span class="stat-label">Commandes en attente</span><span class="stat-value">{{ s.pending }}</span></div>
    </div>
    <div class="grid two">
      <div class="card">
        <h2>Dernières créations</h2>
        <p v-if="!lastQr.length" class="muted">Aucun QR code.</p>
        <div class="actions"><img v-for="r in lastQr" :key="r.id" :src="r.preview" class="mini" :title="r.label" /></div>
      </div>
      <div class="card">
        <h2>Derniers clients</h2>
        <p v-if="!lastClients.length" class="muted">Aucun client.</p>
        <p v-for="c in lastClients" :key="c.id" class="small">{{ c.name }} <span class="muted">· {{ c.type }}</span></p>
      </div>
      <div class="card">
        <h2>QR par catégorie</h2>
        <p v-for="(c, k) in CATEGORIES" :key="k" class="small">{{ c.icon }} {{ c.label }} : <strong>{{ byCat[k] || 0 }}</strong></p>
      </div>
    </div>
  </section>
</template>
