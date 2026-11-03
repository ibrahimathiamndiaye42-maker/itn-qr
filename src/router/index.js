import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CreateView from '../views/CreateView.vue'
import HistoryView from '../views/HistoryView.vue'

export const routes = [
  { path: '/', name: 'home', component: HomeView, meta: { label: 'Accueil', icon: '🏠' } },
  { path: '/creer', name: 'create', component: CreateView, meta: { label: 'Créer mon QR code', icon: '➕' } },
  { path: '/historique', name: 'history', component: HistoryView, meta: { label: 'Historique', icon: '🕘' } },
]

export default createRouter({ history: createWebHashHistory(), routes })
