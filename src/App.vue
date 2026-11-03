<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import SidebarMenu from './components/SidebarMenu.vue'

const route = useRoute()
const menuOpen = ref(false)
</script>

<template>
  <div class="layout">
    <header class="topbar">
      <button class="burger" @click="menuOpen = !menuOpen" aria-label="Ouvrir le menu">☰</button>
      <strong>ITN QR</strong>
      <span class="topbar-title">{{ route.meta.label }}</span>
    </header>
    <div v-if="menuOpen" class="overlay" @click="menuOpen = false"></div>
    <SidebarMenu :open="menuOpen" @navigate="menuOpen = false" />
    <main class="content"><router-view /></main>
  </div>
</template>
