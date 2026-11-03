<script setup>
import { ref } from 'vue'
import { install } from '../lib/install'

const help = ref(false)
const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
const secure = window.isSecureContext

async function go() {
  if (install.prompt) {
    install.prompt.prompt()
    await install.prompt.userChoice
    install.prompt = null
  } else {
    help.value = !help.value
  }
}
</script>

<template>
  <div v-if="!install.installed" class="install">
    <button class="btn install-btn" @click="go">📲 Installer l'application sur mon téléphone</button>
    <div v-if="help" class="card install-help">
      <p v-if="!secure" class="warn">⚠️ L'installation sur téléphone exige une adresse en https (ou localhost). Ouvre l'application depuis son adresse en ligne.</p>
      <p v-if="isIos"><strong>iPhone / iPad (Safari) :</strong> touche <strong>Partager</strong> (carré avec une flèche), puis <strong>« Sur l'écran d'accueil »</strong>, puis <strong>Ajouter</strong>.</p>
      <p v-else><strong>Android (Chrome) :</strong> touche le menu <strong>⋮</strong>, puis <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong>.</p>
      <p class="muted small">Une fois installée, l'application s'ouvre comme une application normale et fonctionne hors connexion.</p>
    </div>
  </div>
</template>
