<script setup>
import { onMounted } from 'vue'
import { useUIStore } from '@/stores/ui'

const ui = useUIStore()

onMounted(() => {
  ui.initTheme()
})
</script>

<template>
  <div class="min-h-screen bg-background text-foreground font-sans antialiased">
    <router-view v-slot="{ Component }">
      <transition name="page" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>
