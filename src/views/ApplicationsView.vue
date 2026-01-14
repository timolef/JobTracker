<script setup>
import { ref, computed, onMounted } from 'vue'
import { useApplicationStore } from '@/stores/applications'
import { Plus, Search, MapPin, Building2, Calendar, Trash2 } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import Badge from '@/components/ui/Badge.vue'
import Dialog from '@/components/ui/Dialog.vue'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'

const appStore = useApplicationStore()

onMounted(() => {
  appStore.fetchApplications()
})

const searchQuery = ref('')
const statusFilter = ref('All')
const isDialogOpen = ref(false)
const isEditing = ref(false)
const currentId = ref(null)

const form = ref({
  company: '',
  position: '',
  location: '',
  type: 'Full-time',
  status: 'To Apply',
  link: '',
  notes: ''
})

const statuses = ['To Apply', 'Applied', 'Interview', 'Refusal', 'Offer']
const types = ['Full-time', 'Part-time', 'Internship', 'Freelance', 'Apprenticeship']

const filteredApplications = computed(() => {
  return appStore.applications.filter(app => {
    const matchesSearch = app.company.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                          app.position.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesStatus = statusFilter.value === 'All' || app.status === statusFilter.value
    return matchesSearch && matchesStatus
  })
})

function openAddModal() {
  isEditing.value = false
  currentId.value = null
  form.value = {
    company: '',
    position: '',
    location: '',
    type: 'Full-time',
    status: 'To Apply',
    link: '',
    notes: ''
  }
  isDialogOpen.value = true
}

function openEditModal(app) {
  isEditing.value = true
  currentId.value = app.id
  form.value = { ...app }
  isDialogOpen.value = true
}

function deleteApplication(e, id) {
  e.stopPropagation() // Prevent opening edit modal
  if (confirm('Are you sure you want to delete this application?')) {
    appStore.deleteApplication(id)
  }
}

function saveApplication() {
  if (isEditing.value) {
    appStore.updateStatus(currentId.value, form.value.status)
    // Update other fields manual update logic if store supports it, 
    // for MVP simplified store only had updateStatus, so I'll quick-fix store or overwrite here
    // Let's manually update the object in store directly since store handles it by ref
    const index = appStore.applications.findIndex(a => a.id === currentId.value)
    if (index !== -1) {
       appStore.applications[index] = { ...appStore.applications[index], ...form.value, dateChanged: new Date().toISOString() }
    }
  } else {
    appStore.addApplication({ ...form.value })
  }
  isDialogOpen.value = false
}

function getBadgeVariant(status) {
  switch (status) {
    case 'Offer': return 'success'
    case 'Interview': return 'secondary' // purple-ish usually
    case 'Refusal': return 'destructive'
    case 'Applied': return 'default' // blue
    default: return 'outline'
  }
}

function formatDate(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleDateString()
}

function needsFollowUp(app) {
  if (app.status !== 'Applied' && app.status !== 'Interview') return false
  const date = new Date(app.dateChanged)
  const daysDiff = (new Date() - date) / (1000 * 60 * 60 * 24)
  return daysDiff > 7 // 7 days threshold
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">Applications</h2>
        <p class="text-muted-foreground">Manage and track your job applications.</p>
      </div>
      <Button @click="openAddModal">
        <Plus class="mr-2 h-4 w-4" /> Add Application
      </Button>
    </div>

    <!-- Filters -->
    <div class="flex items-center gap-4">
      <div class="relative w-full max-w-sm">
        <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input type="search" placeholder="Search companies or roles..." class="pl-8" v-model="searchQuery" />
      </div>
      <select v-model="statusFilter" class="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <option value="All">All Statuses</option>
        <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
      </select>
    </div>

    <!-- Grid -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card v-for="app in filteredApplications" :key="app.id" class="cursor-pointer hover:shadow-md transition-shadow" @click="openEditModal(app)">
        <CardContent class="p-6">
          <div class="flex justify-between items-start mb-4">
            <div class="flex items-center gap-2">
               <div class="bg-primary/10 p-3 rounded-lg">
                  <Building2 class="h-6 w-6 text-primary" />
               </div>
               <Button 
                  variant="ghost" 
                  size="icon" 
                  class="h-8 w-8 text-muted-foreground hover:text-destructive" 
                  @click="(e) => deleteApplication(e, app.id)"
               >
                  <Trash2 class="h-4 w-4" />
               </Button>
            </div>
            <div class="flex flex-col items-end gap-2">
               <Badge :variant="getBadgeVariant(app.status)">{{ app.status }}</Badge>
               <Badge v-if="needsFollowUp(app)" variant="warning" class="text-[10px] h-5">Follow Up</Badge>
            </div>
          </div>
          
          <h3 class="font-semibold text-lg truncate">{{ app.position }}</h3>
          <p class="text-muted-foreground text-sm mb-4">{{ app.company }}</p>
          
          <div class="space-y-2 text-sm text-muted-foreground">
             <div class="flex items-center gap-2">
                <MapPin class="h-4 w-4" />
                <span>{{ app.location || 'Remote' }}</span>
             </div>
             <div class="flex items-center gap-2">
                <Calendar class="h-4 w-4" />
                <span>{{ formatDate(app.dateChanged) }}</span>
             </div>
          </div>
        </CardContent>
      </Card>
      
      <div v-if="filteredApplications.length === 0" class="col-span-full text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
         No applications found matching your criteria.
      </div>
    </div>

    <!-- Add/Edit Dialog -->
    <Dialog v-model:open="isDialogOpen" :title="isEditing ? 'Edit Application' : 'New Application'">
       <form @submit.prevent="saveApplication" class="space-y-4 mt-4">
          <div class="grid grid-cols-2 gap-4">
             <div class="space-y-2">
                <Label for="company">Company</Label>
                <Input id="company" v-model="form.company" required placeholder="e.g. Google" />
             </div>
             <div class="space-y-2">
                <Label for="position">Position</Label>
                <Input id="position" v-model="form.position" required placeholder="e.g. Frontend Dev" />
             </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
             <div class="space-y-2">
                <Label for="location">Location</Label>
                <Input id="location" v-model="form.location" placeholder="e.g. Paris" />
             </div>
             <div class="space-y-2">
                <Label for="type">Type</Label>
                <select id="type" v-model="form.type" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                   <option v-for="t in types" :key="t" :value="t">{{ t }}</option>
                </select>
             </div>
          </div>

          <div class="space-y-2">
             <Label for="status">Status</Label>
             <select id="status" v-model="form.status" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
             </select>
          </div>

          <div class="space-y-2">
             <Label for="link">Link</Label>
             <Input id="link" v-model="form.link" placeholder="https://..." />
          </div>

          <div class="space-y-2">
             <Label for="notes">Notes</Label>
             <textarea 
               id="notes" 
               v-model="form.notes" 
               class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
               placeholder="Personal notes about this application..."
             ></textarea>
          </div>
          
          <div class="flex justify-end gap-2 pt-4">
             <Button type="button" variant="ghost" @click="isDialogOpen = false">Cancel</Button>
             <Button type="submit">{{ isEditing ? 'Save Changes' : 'Create Application' }}</Button>
          </div>
       </form>
    </Dialog>
  </div>
</template>
