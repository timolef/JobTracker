<script setup>
import { ref, computed, onMounted } from 'vue'
import { useApplicationStore } from '@/stores/applications'
import { Plus, MoreVertical, Building2, MapPin, ExternalLink, Eye } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Dialog from '@/components/ui/Dialog.vue'
import Label from '@/components/ui/Label.vue'

const appStore = useApplicationStore()

onMounted(() => {
  appStore.fetchApplications()
})

const columns = [
  { id: 'To Apply', title: 'To Apply', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
  { id: 'Applied', title: 'Applied', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { id: 'Interview', title: 'Interview', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  { id: 'Offer', title: 'Offer', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  { id: 'Refusal', title: 'Refusal', color: 'bg-red-500/10 text-red-500 border-red-500/20' }
]

const applicationsByStatus = computed(() => {
  const groups = {}
  columns.forEach(col => groups[col.id] = [])
  appStore.applications.forEach(app => {
    if (groups[app.status]) {
      groups[app.status].push(app)
    }
  })
  return groups
})

// Drag and Drop State
const draggedApp = ref(null)
const isDragging = ref(false)

function onDragStart(event, app) {
  draggedApp.value = app
  isDragging.value = true
  event.dataTransfer.effectAllowed = 'move'
  // Visual ghosting effect is handled by browser
}

function onDragEnd() {
  isDragging.value = false
  draggedApp.value = null
}

async function onDrop(event, newStatus) {
  if (!draggedApp.value) return
  if (draggedApp.value.status === newStatus) return

  const appId = draggedApp.value.id
  await appStore.updateStatus(appId, newStatus)
  draggedApp.value = null
}

// Details Modal Integration
const isDetailsOpen = ref(false)
const selectedApp = ref(null)

function openDetails(app) {
  selectedApp.value = app
  isDetailsOpen.value = true
}

function formatDate(isoString) {
  if (!isoString) return '-'
  return new Date(isoString).toLocaleDateString()
}
</script>

<template>
  <div class="h-full flex flex-col space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">Kanban Board</h2>
        <p class="text-muted-foreground">Visualize and manage your application stages.</p>
      </div>
      <div class="flex items-center gap-2">
         <Badge variant="outline" class="h-6">{{ appStore.applications.length }} Applications</Badge>
      </div>
    </div>

    <!-- Kanban Board Container -->
    <div class="flex-1 flex gap-6 overflow-x-auto pb-6 min-h-0">
      <div 
        v-for="column in columns" 
        :key="column.id"
        class="flex-shrink-0 w-80 flex flex-col bg-muted/30 rounded-xl border border-border/50"
        @dragover.prevent
        @drop="onDrop($event, column.id)"
      >
        <!-- Column Header -->
        <div class="p-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div :class="['w-2 h-2 rounded-full', column.color.split(' ')[1].replace('text-', 'bg-')]"></div>
            <h3 class="font-semibold text-sm">{{ column.title }}</h3>
            <span class="text-xs text-muted-foreground font-normal ml-1">
                {{ applicationsByStatus[column.id]?.length || 0 }}
            </span>
          </div>
          <Button variant="ghost" size="icon" class="h-8 w-8">
            <Plus class="h-4 w-4" />
          </Button>
        </div>

        <!-- Cards Container -->
        <div class="flex-1 overflow-y-auto p-3 space-y-3 min-h-[100px]">
          <Card 
            v-for="app in applicationsByStatus[column.id]" 
            :key="app.id"
            draggable="true"
            @dragstart="onDragStart($event, app)"
            @dragend="onDragEnd"
            class="group hover:border-primary/50 cursor-grab active:cursor-grabbing transition-all hover:shadow-sm bg-card"
          >
            <CardContent class="p-4 space-y-3">
              <div class="flex justify-between items-start">
                <div class="bg-primary/5 p-2 rounded-lg">
                  <Building2 class="h-4 w-4 text-primary" />
                </div>
                <Button variant="ghost" size="icon" class="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" @click="openDetails(app)">
                  <Eye class="h-3.5 w-3.5" />
                </Button>
              </div>

              <div>
                <h4 class="font-semibold text-sm leading-tight line-clamp-2">{{ app.position }}</h4>
                <p class="text-xs text-muted-foreground mt-1">{{ app.company }}</p>
              </div>

              <div class="flex items-center justify-between pt-2">
                <div class="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <MapPin class="h-3 w-3" />
                  <span>{{ app.location || 'Remote' }}</span>
                </div>
                <!-- Optional Link -->
                <a v-if="app.link" :href="app.link" target="_blank" @click.stop class="text-primary hover:underline">
                  <ExternalLink class="h-3 w-3" />
                </a>
              </div>
            </CardContent>
          </Card>

          <!-- Empty placeholder for drag area -->
          <div v-if="applicationsByStatus[column.id]?.length === 0" class="h-24 rounded-lg border-2 border-dashed border-border/50 flex flex-col items-center justify-center text-muted-foreground/50">
             <p class="text-[10px]">No items here</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Details Dialog (Copied from Dashboard for consistency) -->
    <Dialog v-model:open="isDetailsOpen" title="Application Details">
      <div v-if="selectedApp" class="space-y-4 mt-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <Label class="text-xs text-muted-foreground">Company</Label>
            <p class="font-medium">{{ selectedApp.company }}</p>
          </div>
          <div>
            <Label class="text-xs text-muted-foreground">Position</Label>
            <p class="font-medium">{{ selectedApp.position }}</p>
          </div>
          <div>
            <Label class="text-xs text-muted-foreground">Location</Label>
            <p class="text-sm">{{ selectedApp.location || '-' }}</p>
          </div>
           <div>
            <Label class="text-xs text-muted-foreground">Type</Label>
            <p class="text-sm">{{ selectedApp.type || '-' }}</p>
          </div>
        </div>

        <div v-if="selectedApp.link">
           <Label class="text-xs text-muted-foreground">Link</Label>
           <a :href="selectedApp.link" target="_blank" class="block text-sm text-blue-500 hover:underline truncate">{{ selectedApp.link }}</a>
        </div>

        <div v-if="selectedApp.notes">
           <Label class="text-xs text-muted-foreground">Notes</Label>
           <p class="text-sm bg-muted/50 p-3 rounded-md whitespace-pre-wrap">{{ selectedApp.notes }}</p>
        </div>

        <div class="flex justify-end">
           <Button variant="outline" @click="isDetailsOpen = false">Close</Button>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
/* Scoped styles for horizontal scrollbar styling if needed */
.overflow-x-auto::-webkit-scrollbar {
  height: 8px;
}
.overflow-x-auto::-webkit-scrollbar-track {
  background: transparent;
}
.overflow-x-auto::-webkit-scrollbar-thumb {
  background: hsl(var(--muted));
  border-radius: 4px;
}
</style>
