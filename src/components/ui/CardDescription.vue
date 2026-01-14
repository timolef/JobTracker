<script setup>
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps({
  class: {
    type: String,
    default: ''
  }
})

const descClass = computed(() => {
  return cn(
    'text-sm text-muted-foreground',
    props.class
  )
})
</script>

<template>
  <p :class="descClass">
    <slot />
  </p>
</template>
