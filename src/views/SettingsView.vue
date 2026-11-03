<script setup>
import { ref, onMounted } from 'vue'
import { getSetting, setSetting, getDb } from '../db/db'
import { hashPin } from '../lib/pin'

const name = ref('')
const pin = ref('')
const hasPin = ref(false)
const msg = ref('')
onMounted(async () => { name.value = (await getSetting('businessName')) || 'ITN Digital Solutions'; hasPin.value = !!(await getSetting('pinHash')) })

async function saveName() { await setSetting('businessName', name.value); msg.value = '✅ Enregistré.' }
async function savePin() {
  if (!/^\d{4,8}$/.test(pin.value)) return (msg.value = 'Le code doit contenir 4 à 8 chiffres.')
  await setSetting('pinHash', await hashPin(pin.value)); hasPin.value = true; pin.value = ''; msg.value = '✅ Code défini.'
}
async function removePin() { await (await getDb()).delete('settings', 'pinHash'); hasPin.value = false; msg.value = 'Code supprimé.' }
</script>

<template>
  <section>
    <h1 class="page-title">Paramètres</h1>
    <div class="card">
      <h2>Entreprise</h2>
      <div class="field"><label>Nom</label><input v-model="name" /></div>
      <p class="muted">Devise : FCFA</p>
      <button class="btn" @click="saveName">Enregistrer</button>
    </div>
    <div class="card">
      <h2>Verrouillage simple</h2>
      <p class="warn">⚠️ Ce code masque seulement l'écran. Les données restent lisibles dans le navigateur : ce n'est pas une sécurité forte.</p>
      <div class="field"><label>Nouveau code ({{ hasPin ? 'actif' : 'inactif' }})</label><input v-model="pin" type="password" inputmode="numeric" maxlength="8" /></div>
      <div class="actions"><button class="btn" @click="savePin">Définir</button><button v-if="hasPin" class="btn secondary" @click="removePin">Supprimer</button></div>
    </div>
    <p v-if="msg">{{ msg }}</p>
  </section>
</template>
