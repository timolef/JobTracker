<script setup>
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps({
  class: {
    type: String,
    default: ''
  }
})

const contentClass = computed(() => {
  return cn(
    'p-6 pt-0',
    props.class
  )
})
</script>

<template>
  <div :class="contentClass">
    <slot />
  </div>
</template>
