<script setup>
import { ref, onMounted, watch } from 'vue'
import { useContactStore } from '@/stores/contacts'
import Button from '@/components/ui/Button.vue'
import Label from '@/components/ui/Label.vue'
import { MessageSquare, Phone, Users, Linkedin, Mail, Plus, Clock } from 'lucide-vue-next'

const props = defineProps({
  contactId: {
    type: Number,
    required: true
  }
})

const store = useContactStore()
const interactions = ref([])
const loading = ref(false)
const isAddingKey = ref(false) // Toggle form

const newInteraction = ref({
  type: 'Email',
  date: new Date().toISOString().slice(0, 16), // datetime-local format
  notes: ''
})

const typeIcons = {
  Email: Mail,
  Call: Phone,
  Meeting: Users,
  Linkedin: Linkedin,
  Other: MessageSquare
}

const typeColors = {
  Email: 'text-blue-500 bg-blue-500/10',
  Call: 'text-green-500 bg-green-500/10',
  Meeting: 'text-purple-500 bg-purple-500/10',
  Linkedin: 'text-blue-600 bg-blue-600/10',
  Other: 'text-gray-500 bg-gray-500/10'
}

async function loadInteractions() {
  if (!props.contactId) return
  loading.value = true
  interactions.value = await store.fetchInteractions(props.contactId)
  loading.value = false
}

async function addInteraction() {
  if (!newInteraction.value.notes) return
  
  await store.logInteraction(props.contactId, {
    type: newInteraction.value.type,
    date: newInteraction.value.date,
    notes: newInteraction.value.notes
  })
  
  // Reset and reload
  newInteraction.value.notes = ''
  newInteraction.value.date = new Date().toISOString().slice(0, 16)
  isAddingKey.value = false
  await loadInteractions()
}

onMounted(loadInteractions)
watch(() => props.contactId, loadInteractions)

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString()
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Recent Interactions</h3>
      <Button v-if="!isAddingKey" variant="ghost" size="sm" @click="isAddingKey = true">
        <Plus class="h-3 w-3 mr-1" /> Log Activity
      </Button>
    </div>

    <!-- Add Form -->
    <div v-if="isAddingKey" class="bg-muted/30 p-3 rounded-lg border border-border space-y-3">
       <div class="grid grid-cols-2 gap-2">
          <div>
             <Label class="text-xs">Type</Label>
             <select v-model="newInteraction.type" class="w-full text-sm rounded-md border bg-background px-2 py-1">
                <option v-for="(icon, type) in typeIcons" :key="type" :value="type">{{ type }}</option>
             </select>
          </div>
          <div>
             <Label class="text-xs">Date</Label>
             <input type="datetime-local" v-model="newInteraction.date" class="w-full text-sm rounded-md border bg-background px-2 py-1" />
          </div>
       </div>
       <div>
          <Label class="text-xs">Notes</Label>
          <textarea v-model="newInteraction.notes" class="w-full text-sm rounded-md border bg-background px-2 py-1 min-h-[60px]" placeholder="What did you discuss?"></textarea>
       </div>
       <div class="flex justify-end gap-2">
          <Button variant="ghost" size="sm" @click="isAddingKey = false">Cancel</Button>
          <Button size="sm" @click="addInteraction">Save</Button>
       </div>
    </div>

    <!-- List -->
    <div class="space-y-3 max-h-[300px] overflow-y-auto pr-2">
       <div v-if="loading" class="flex justify-center p-4">
          <Clock class="h-5 w-5 animate-spin text-muted-foreground" />
       </div>
       
       <div v-else-if="interactions.length === 0" class="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
          No interactions logged yet.
       </div>

       <div v-else v-for="interaction in interactions" :key="interaction.id" class="flex gap-3 relative pb-4 border-l border-border pl-4 last:border-0 last:pb-0">
          <div :class="['absolute -left-[9px] top-0 h-4 w-4 rounded-full flex items-center justify-center border border-background', typeColors[interaction.type] || typeColors.Other]">
             <component :is="typeIcons[interaction.type] || typeIcons.Other" class="h-2.5 w-2.5" />
          </div>
          <div class="space-y-1">
             <div class="flex items-center gap-2">
                <span class="text-xs font-bold">{{ interaction.type }}</span>
                <span class="text-[10px] text-muted-foreground">{{ formatDate(interaction.date) }}</span>
             </div>
             <p class="text-sm text-foreground/90 whitespace-pre-line">{{ interaction.notes }}</p>
          </div>
       </div>
    </div>
  </div>
</template>
