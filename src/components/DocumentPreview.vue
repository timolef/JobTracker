<script setup>
import { ref, onMounted, watch } from 'vue'
import Dialog from '@/components/ui/Dialog.vue'
import Button from '@/components/ui/Button.vue'
import { Download, X } from 'lucide-vue-next'
import { API_BASE_URL } from '@/config'

const props = defineProps({
  open: Boolean,
  docId: [String, Number],
  docName: String
})

const emit = defineEmits(['update:open'])

const pdfUrl = ref(null)
const loading = ref(false)
const error = ref(null)

const isOpen = ref(props.open)

watch(() => props.open, (newVal) => {
  isOpen.value = newVal
  if (newVal && props.docId) {
    loadDocument()
  }
})

watch(isOpen, (newVal) => {
  emit('update:open', newVal)
})

async function loadDocument() {
  loading.value = true
  error.value = null
  pdfUrl.value = null
  
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE_URL}/api/documents/${props.docId}/view`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    
    if (!response.ok) throw new Error('Failed to load document')
    
    const blob = await response.blob()
    pdfUrl.value = window.URL.createObjectURL(blob)
  } catch (err) {
    console.error(err)
    error.value = "Failed to load document content. It might not be a supported PDF/Image format."
  } finally {
    loading.value = false
  }
}

function handleClose() {
  isOpen.value = false
  // Revoke URL to free memory
  if (pdfUrl.value) {
    window.URL.revokeObjectURL(pdfUrl.value)
    pdfUrl.value = null
  }
}
</script>

<template>
  <Dialog :open="isOpen" @update:open="handleClose" class="sm:max-w-4xl max-h-[90vh]">
    <div class="flex flex-col h-[80vh]">
       <div class="flex items-center justify-between mb-4 border-b pb-2">
          <h3 class="font-semibold text-lg truncate pr-4">{{ docName }}</h3>
          <div class="flex gap-2">
              <Button v-if="pdfUrl" as="a" :href="pdfUrl" :download="docName" variant="outline" size="sm">
                  <Download class="h-4 w-4 mr-2" /> Download
              </Button>
              <Button variant="ghost" size="icon" @click="handleClose">
                  <X class="h-4 w-4" />
              </Button>
          </div>
       </div>
       
       <div class="flex-1 bg-muted/20 rounded-lg overflow-hidden relative">
          <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
             <div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
          
          <div v-else-if="error" class="absolute inset-0 flex flex-col items-center justify-center text-destructive p-4 text-center">
             <p>{{ error }}</p>
          </div>
          
          <iframe 
             v-else-if="pdfUrl" 
             :src="pdfUrl" 
             class="w-full h-full border-none"
             allowfullscreen
          ></iframe>
       </div>
    </div>
  </Dialog>
</template>
