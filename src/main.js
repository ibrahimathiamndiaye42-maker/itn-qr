import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { initInstall } from './lib/install'

initInstall()

createApp(App).use(router).mount('#app')
