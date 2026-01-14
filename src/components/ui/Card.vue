<script setup>
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps({
  class: {
    type: String,
    default: ''
  }
})

const cardClass = computed(() => {
  return cn(
    'rounded-lg border bg-card text-card-foreground shadow-sm',
    props.class
  )
})
</script>

<template>
  <div :class="cardClass">
    <slot />
  </div>
</template>
