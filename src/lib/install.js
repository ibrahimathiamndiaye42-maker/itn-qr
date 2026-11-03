import { reactive } from 'vue'

// État d'installation partagé : l'événement du navigateur peut arriver avant l'affichage du bouton.
export const install = reactive({ prompt: null, installed: false })

export function initInstall() {
  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  install.installed = standalone
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); install.prompt = e })
  window.addEventListener('appinstalled', () => { install.installed = true; install.prompt = null })
}
