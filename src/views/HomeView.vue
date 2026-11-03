<script setup>
import { ref, onMounted } from 'vue'
import { countAll } from '../db/db'
import InstallButton from '../components/InstallButton.vue'
const n = ref(0)
onMounted(async () => { try { n.value = await countAll('qrcodes') } catch { /* ignoré */ } })
</script>

<template>
  <section>
    <div class="card hero">
      <h1>Ton QR code, avec tes informations dedans.</h1>
      <p>Un formulaire, un bouton, un QR code autonome. Tes informations sont encodées directement dans le QR : il fonctionne sans Internet et sans ITN QR.</p>
      <router-link to="/creer" class="btn big">Créer mon QR code</router-link>
      <InstallButton />
    </div>
    <div class="grid">
      <div class="card"><h2>🏪 Entreprise</h2><p class="muted">Contact, WhatsApp, réseaux sociaux sur tes produits et emballages.</p></div>
      <div class="card"><h2>🧳 Bagage ou sac</h2><p class="muted">Nom et numéro pour retrouver le propriétaire.</p></div>
      <div class="card"><h2>🎓 Sac scolaire, maillot</h2><p class="muted">Identification simple d'un objet ou d'un équipement.</p></div>
      <div class="card"><h2>💼 Carte professionnelle</h2><p class="muted">Ta fiche contact, ajoutée au téléphone en un scan.</p></div>
    </div>
    <div class="card">
      <h2>À savoir</h2>
      <p class="muted small">Un QR code ne peut plus être modifié une fois imprimé : si une information change, génère un nouveau QR. Évite d'y mettre des données sensibles : toute personne qui le scanne peut les lire. {{ n ? `Tu as déjà ${n} QR dans l'historique de cet appareil.` : '' }}</p>
    </div>
  </section>
</template>
