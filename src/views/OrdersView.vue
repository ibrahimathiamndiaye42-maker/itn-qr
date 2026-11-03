<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { getAll, add, put, remove } from '../db/db'
import { CATEGORIES } from '../lib/content'

const PAY = ['En attente', 'Payée']
const PROD = ['En attente', 'En fabrication', 'Prête', 'Livrée']
const orders = ref([]), clients = ref([])
const filter = ref('')
const blank = () => ({ clientId: '', product: '', category: 'business', qty: 1, unitPrice: 0, printFee: 0, date: new Date().toISOString().slice(0, 10), paymentStatus: 'En attente', productionStatus: 'En attente' })
const form = reactive(blank())
const total = computed(() => (Number(form.qty) || 0) * (Number(form.unitPrice) || 0) + (Number(form.printFee) || 0))
const fcfa = (n) => new Intl.NumberFormat('fr-FR').format(n || 0) + ' FCFA'

async function load() { orders.value = (await getAll('orders')).sort((a, b) => b.id - a.id); clients.value = await getAll('clients') }
onMounted(load)
const shown = computed(() => orders.value.filter((o) => !filter.value || o.productionStatus === filter.value))
const cname = (id) => clients.value.find((c) => c.id === id)?.name || '—'

async function save() {
  if (!form.clientId || !form.product.trim()) return alert('Choisis un client et indique le produit.')
  await add('orders', { ...form, clientId: Number(form.clientId), qty: Number(form.qty), unitPrice: Number(form.unitPrice), printFee: Number(form.printFee), total: total.value })
  Object.assign(form, blank()); load()
}
async function setStatus(o, k, v) { await put('orders', { ...o, [k]: v }); load() }
async function del(o) { if (confirm('Supprimer cette commande ?')) { await remove('orders', o.id); load() } }
</script>

<template>
  <section>
    <h1 class="page-title">Commandes</h1>
    <div class="card">
      <h2>Nouvelle commande</h2>
      <p v-if="!clients.length" class="warn">Ajoute d'abord un client dans « Clients ».</p>
      <div class="row">
        <div class="field"><label>Client *</label><select v-model="form.clientId"><option value="">—</option><option v-for="c in clients" :key="c.id" :value="c.id">{{ c.name }}</option></select></div>
        <div class="field"><label>Produit commandé *</label><input v-model="form.product" placeholder="Ex. Autocollants 5×5" /></div>
        <div class="field"><label>Catégorie</label><select v-model="form.category"><option v-for="(c, k) in CATEGORIES" :key="k" :value="k">{{ c.label }}</option></select></div>
      </div>
      <div class="row">
        <div class="field"><label>Quantité</label><input type="number" min="1" v-model="form.qty" /></div>
        <div class="field"><label>Prix unitaire (FCFA)</label><input type="number" min="0" v-model="form.unitPrice" /></div>
        <div class="field"><label>Frais d'impression (FCFA)</label><input type="number" min="0" v-model="form.printFee" /></div>
        <div class="field"><label>Date</label><input type="date" v-model="form.date" /></div>
      </div>
      <div class="row">
        <div class="field"><label>Paiement</label><select v-model="form.paymentStatus"><option v-for="s in PAY" :key="s">{{ s }}</option></select></div>
        <div class="field"><label>Fabrication</label><select v-model="form.productionStatus"><option v-for="s in PROD" :key="s">{{ s }}</option></select></div>
      </div>
      <p><strong>Total : {{ fcfa(total) }}</strong></p>
      <button class="btn" @click="save">Enregistrer la commande</button>
    </div>

    <select v-model="filter"><option value="">Toutes les commandes</option><option v-for="s in PROD" :key="s">{{ s }}</option></select>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Date</th><th>Client</th><th>Produit</th><th>Qté</th><th>Total</th><th>Paiement</th><th>Fabrication</th><th></th></tr></thead>
        <tbody>
          <tr v-for="o in shown" :key="o.id">
            <td>{{ o.date }}</td><td>{{ cname(o.clientId) }}</td><td>{{ o.product }}</td><td>{{ o.qty }}</td><td class="nowrap">{{ fcfa(o.total) }}</td>
            <td><select :value="o.paymentStatus" @change="setStatus(o, 'paymentStatus', $event.target.value)"><option v-for="s in PAY" :key="s">{{ s }}</option></select></td>
            <td><select :value="o.productionStatus" @change="setStatus(o, 'productionStatus', $event.target.value)"><option v-for="s in PROD" :key="s">{{ s }}</option></select></td>
            <td><button class="btn danger small" @click="del(o)">✕</button></td>
          </tr>
          <tr v-if="!shown.length"><td colspan="8" class="muted">Aucune commande.</td></tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
