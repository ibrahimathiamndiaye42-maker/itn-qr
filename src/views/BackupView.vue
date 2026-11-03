<script setup>
import { ref, onMounted } from 'vue'
import { exportAll, replaceAll, getAll, getSetting, setSetting } from '../db/db'
import { download } from '../lib/qr'

const last = ref(null)
const msg = ref('')
onMounted(async () => { last.value = await getSetting('lastBackup') })
const days = () => (last.value ? Math.floor((Date.now() - new Date(last.value)) / 864e5) : null)

async function backup() {
  const data = await exportAll()
  download(new Blob([JSON.stringify(data)], { type: 'application/json' }), `itn-qr-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`)
  last.value = new Date().toISOString(); await setSetting('lastBackup', last.value)
  msg.value = '✅ Sauvegarde téléchargée (logos, photos et aperçus inclus). Garde-la hors de cet appareil.'
}
async function restore(e) {
  const f = e.target.files?.[0]
  if (!f) return
  try {
    const d = JSON.parse(await f.text())
    if (d.app !== 'itn-qr') throw new Error('Ce fichier n\'est pas une sauvegarde ITN QR.')
    if (!confirm('Restaurer remplace TOUTES les données actuelles (QR, clients, commandes). Continuer ?')) return
    await replaceAll(d)
    msg.value = `✅ Restauré : ${d.qrcodes?.length || 0} QR, ${d.clients?.length || 0} clients, ${d.orders?.length || 0} commandes.`
  } catch (err) { msg.value = '❌ ' + err.message }
  e.target.value = ''
}
const csv = (rows, cols) => '\ufeff' + [cols.map((c) => c[1]), ...rows.map((r) => cols.map((c) => r[c[0]] ?? ''))].map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\r\n')
async function expClients() {
  download(new Blob([csv(await getAll('clients'), [['name', 'Nom'], ['phone', 'Téléphone'], ['whatsapp', 'WhatsApp'], ['address', 'Adresse'], ['type', 'Type'], ['createdAt', 'Inscription'], ['notes', 'Notes']])], { type: 'text/csv' }), 'clients.csv')
}
async function expOrders() {
  const cl = await getAll('clients')
  const rows = (await getAll('orders')).map((o) => ({ ...o, client: cl.find((c) => c.id === o.clientId)?.name || '' }))
  download(new Blob([csv(rows, [['date', 'Date'], ['client', 'Client'], ['product', 'Produit'], ['category', 'Catégorie'], ['qty', 'Quantité'], ['unitPrice', 'Prix unitaire'], ['printFee', "Frais d'impression"], ['total', 'Total FCFA'], ['paymentStatus', 'Paiement'], ['productionStatus', 'Fabrication']])], { type: 'text/csv' }), 'commandes.csv')
}
</script>

<template>
  <section>
    <h1 class="page-title">Sauvegardes</h1>
    <div class="card reminder">
      💾 Les données sont dans ce navigateur uniquement. Si tu vides les données du navigateur ou désinstalles l'application, elles sont perdues : rien n'est conservé automatiquement.
      <br /><strong>{{ last ? `Dernière sauvegarde : il y a ${days()} jour(s).` : 'Aucune sauvegarde effectuée.' }}</strong>
    </div>
    <div class="card">
      <h2>Sauvegarde complète (JSON)</h2>
      <p class="muted">Inclut QR codes, clients, commandes, logos et photos.</p>
      <button class="btn" @click="backup">Télécharger la sauvegarde</button>
    </div>
    <div class="card">
      <h2>Restaurer</h2>
      <input type="file" accept=".json,application/json" @change="restore" />
    </div>
    <div class="card">
      <h2>Exports</h2>
      <div class="actions"><button class="btn secondary" @click="expClients">Clients (CSV)</button><button class="btn secondary" @click="expOrders">Historique des commandes (CSV)</button></div>
    </div>
    <p v-if="msg">{{ msg }}</p>
  </section>
</template>
