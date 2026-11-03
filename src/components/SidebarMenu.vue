<script setup>
import { ref } from 'vue'
import { routes } from '../router'
import InstallButton from './InstallButton.vue'

defineProps({ open: Boolean })
defineEmits(['navigate'])
// Le logo ITN est lu dans public/logo-itn.png ; sans fichier, un badge « QR » s'affiche.
const logoOk = ref(false)
const logoUrl = "/logo-itn.png" // chemin dynamique : le build ne plante pas si le fichier est absent
</script>

<template>
  <aside class="sidebar" :class="{ open }">
    <div class="brand">
      <img v-show="logoOk" :src="logoUrl" class="brand-img" alt="ITN" @load="logoOk = true" @error="logoOk = false" />
      <div v-if="!logoOk" class="brand-logo">QR</div>
      <div>
        <div class="brand-name">ITN QR</div>
        <div class="brand-sub">ITN Digital Solutions</div>
      </div>
    </div>
    <nav>
      <router-link v-for="r in routes" :key="r.name" :to="r.path" class="nav-link" @click="$emit('navigate')">
        <span class="nav-icon">{{ r.meta.icon }}</span><span>{{ r.meta.label }}</span>
      </router-link>
    </nav>
    <InstallButton class="side-install" />
  </aside>
</template>
