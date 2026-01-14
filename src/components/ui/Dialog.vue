<script setup>
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { X } from 'lucide-vue-next'

const props = defineProps({
  open: Boolean,
  title: String,
  description: String,
})

const emit = defineEmits(['update:open'])

function close() {
  emit('update:open', false)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" @click="close"></div>
      
      <!-- Content -->
      <div class="z-50 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg animate-in fade-in zoom-in-95 duration-200">
        <div class="flex flex-col space-y-1.5 text-center sm:text-left mb-4">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold leading-none tracking-tight">{{ title }}</h3>
            <button @click="close" class="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X class="h-4 w-4" />
              <span class="sr-only">Close</span>
            </button>
          </div>
          <p v-if="description" class="text-sm text-muted-foreground">
            {{ description }}
          </p>
        </div>
        
        <slot />
      </div>
    </div>
  </Teleport>
</template>
