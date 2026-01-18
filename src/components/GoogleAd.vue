<script setup>
import { onMounted, ref } from 'vue'

const props = defineProps({
  slotId: {
    type: String,
    default: '1234567890' // Placeholder slot ID
  },
  format: {
    type: String,
    default: 'auto'
  },
  layoutKey: {
    type: String,
    default: ''
  },
  style: {
    type: Object,
    default: () => ({ display: 'block' })
  }
})

const adContainer = ref(null)
const isDev = import.meta.env.DEV

onMounted(() => {
  if (!isDev) {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (e) {
      console.error('AdSense error:', e)
    }
  }
})
</script>

<template>
  <div class="ad-container overflow-hidden rounded-lg my-4 bg-muted/20 border border-dashed border-border flex items-center justify-center min-h-[100px]">
    <!-- Dev Placeholder -->
    <div v-if="isDev" class="text-center p-4 text-muted-foreground w-full h-full flex flex-col items-center justify-center">
       <span class="font-bold text-xs uppercase tracking-widest mb-1">Advertisement</span>
       <span class="text-xs opacity-70">Google AdSense (Slot: {{ slotId }})</span>
    </div>

    <!-- Actual Ad -->
    <ins v-else
       ref="adContainer"
       class="adsbygoogle w-full"
       :style="style"
       :data-ad-client="'ca-pub-XXXXXXXXXXXXXXXX'"
       :data-ad-slot="slotId"
       :data-ad-format="format"
       :data-full-width-responsive="true"
       :data-ad-layout-key="layoutKey || undefined"
    ></ins>
  </div>
</template>

<style scoped>
.ad-container {
  min-height: 90px;
}
</style>
