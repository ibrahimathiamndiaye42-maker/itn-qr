<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { getAll, add, put, remove } from '../db/db'

const TYPES = ['Commerçant', 'Entreprise', 'École', 'Particulier', 'Voyageur', 'Autre']
const clients = ref([]), qrs = ref([]), orders = ref([])
const q = ref('')
const sel = ref(null)
const editId = ref(null)
const blank = () => ({ name: '', phone: '', whatsapp: '', address: '', type: 'Commerçant', notes: '', createdAt: new Date().toISOString().slice(0, 10) })
const form = reactive(blank())

async function load() {
  clients.value = (await getAll('clients')).sort((a, b) => b.id - a.id)
  qrs.value = await getAll('qrcodes'); orders.value = await getAll('orders')
}
onMounted(load)

const shown = computed(() => clients.value.filter((c) => !q.value || (c.name + c.phone).toLowerCase().includes(q.value.toLowerCase())))
const fcfa = (n) => new Intl.NumberFormat('fr-FR').format(n || 0) + ' FCFA'
const selQr = computed(() => qrs.value.filter((r) => r.clientId === sel.value?.id))
const selOrders = computed(() => orders.value.filter((o) => o.clientId === sel.value?.id))

async function save() {
  if (!form.name.trim()) return alert('Le nom du client est obligatoire.')
  const rec = { ...form }
  if (editId.value) await put('clients', { ...rec, id: editId.value }); else await add('clients', rec)
  reset(); load()
}
function reset() { Object.assign(form, blank()); editId.value = null }
function edit(c) { Object.assign(form, c); editId.value = c.id }
async function del(c) { if (confirm(`Supprimer « ${c.name} » ? Ses QR et commandes restent enregistrés.`)) { await remove('clients', c.id); if (sel.value?.id === c.id) sel.value = null; load() } }
</script>

<template>
  <section>
    <h1 class="page-title">Clients</h1>
    <div class="card">
      <h2>{{ editId ? 'Modifier le client' : 'Ajouter un client' }}</h2>
      <div class="row">
        <div class="field"><label>Nom *</label><input v-model="form.name" /></div>
        <div class="field"><label>Téléphone</label><input v-model="form.phone" type="tel" /></div>
        <div class="field"><label>WhatsApp</label><input v-model="form.whatsapp" type="tel" /></div>
      </div>
      <div class="row">
        <div class="field"><label>Adresse</label><input v-model="form.address" /></div>
        <div class="field"><label>Type de client</label><select v-model="form.type"><option v-for="t in TYPES" :key="t">{{ t }}</option></select></div>
        <div class="field"><label>Date d'inscription</label><input v-model="form.createdAt" type="date" /></div>
      </div>
      <div class="field"><label>Notes</label><textarea v-model="form.notes" rows="2"></textarea></div>
      <div class="actions"><button class="btn" @click="save">{{ editId ? 'Mettre à jour' : 'Ajouter' }}</button><button v-if="editId" class="btn secondary" @click="reset">Annuler</button></div>
    </div>

    <input v-model="q" placeholder="Rechercher un client…" />
    <div class="table-wrap">
      <table>
        <thead><tr><th>Nom</th><th>Type</th><th>Téléphone</th><th>QR</th><th>Commandes</th><th></th></tr></thead>
        <tbody>
          <tr v-for="c in shown" :key="c.id">
            <td><a href="#" @click.prevent="sel = c">{{ c.name }}</a></td><td>{{ c.type }}</td><td>{{ c.phone }}</td>
            <td>{{ qrs.filter((r) => r.clientId === c.id).length }}</td><td>{{ orders.filter((o) => o.clientId === c.id).length }}</td>
            <td class="nowrap"><button class="btn secondary small" @click="edit(c)">Modifier</button> <button class="btn danger small" @click="del(c)">✕</button></td>
          </tr>
          <tr v-if="!shown.length"><td colspan="6" class="muted">Aucun client.</td></tr>
        </tbody>
      </table>
    </div>

    <div v-if="sel" class="card">
      <h2>{{ sel.name }}</h2>
      <p class="muted">{{ sel.type }} · {{ sel.phone }} · {{ sel.address }}<br />{{ sel.notes }}</p>
      <h3>QR codes ({{ selQr.length }})</h3>
      <div class="actions"><img v-for="r in selQr" :key="r.id" :src="r.preview" class="mini" :title="r.label" /></div>
      <h3>Historique des commandes</h3>
      <p v-for="o in selOrders" :key="o.id" class="small">{{ o.date }} — {{ o.product }} × {{ o.qty }} — {{ fcfa(o.total) }} — {{ o.paymentStatus }} / {{ o.productionStatus }}</p>
      <p v-if="!selOrders.length" class="muted">Aucune commande.</p>
    </div>
  </section>
</template>
