<script setup>
import { ref, computed, onMounted } from 'vue'
import { useApplicationStore } from '@/stores/applications'
import { useDocumentsStore } from '@/stores/documents'
import { Plus, Search, MapPin, Building2, Calendar, Trash2, FileText, File, Eye } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import Badge from '@/components/ui/Badge.vue'
import Dialog from '@/components/ui/Dialog.vue'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import ExportButton from '@/components/ExportButton.vue'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const appStore = useApplicationStore()
const docStore = useDocumentsStore()
const authStore = useAuthStore()

onMounted(() => {
  appStore.fetchApplications()
  docStore.fetchDocuments()
})

const searchQuery = ref('')
const statusFilter = ref('All')
const isDialogOpen = ref(false)
const isEditing = ref(false)
const currentId = ref(null)
const sortBy = ref('date-desc')

const form = ref({
  company: '',
  position: '',
  location: '',
  type: 'Full-time',
  status: 'To Apply',
  link: '',
  notes: '',
  cv_id: null,
  cover_letter_id: null,
  follow_up_date: null
})

const cvs = computed(() => docStore.documents.filter(d => d.type === 'CV'))
const coverLetters = computed(() => docStore.documents.filter(d => d.type === 'CoverLetter'))

const statuses = ['To Apply', 'Applied', 'Interview', 'Refusal', 'Offer']
const types = ['Full-time', 'Part-time', 'Internship', 'Freelance', 'Apprenticeship']

const stats = computed(() => {
  return [
    { label: t('applications.allStatuses'), value: appStore.applications.length, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Applied', value: appStore.applications.filter(a => a.status === 'Applied').length, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Interviews', value: appStore.applications.filter(a => a.status === 'Interview').length, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Offers', value: appStore.applications.filter(a => a.status === 'Offer').length, color: 'text-green-500', bg: 'bg-green-500/10' },
  ]
})

const filteredApplications = computed(() => {
  let apps = appStore.applications.filter(app => {
    const matchesSearch = app.company.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                          app.position.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesStatus = statusFilter.value === 'All' || app.status === statusFilter.value
    return matchesSearch && matchesStatus
  })

  // Sort logic
  return apps.sort((a, b) => {
    if (sortBy.value === 'date-desc') return new Date(b.date_applied || b.created_at) - new Date(a.date_applied || a.created_at)
    if (sortBy.value === 'date-asc') return new Date(a.date_applied || a.created_at) - new Date(b.date_applied || b.created_at)
    if (sortBy.value === 'company') return a.company.localeCompare(b.company)
    if (sortBy.value === 'position') return a.position.localeCompare(b.position)
    return 0
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
    notes: '',
    cv_id: null,
    cover_letter_id: null,
    follow_up_date: null
  }
  isDialogOpen.value = true
}

function openEditModal(app) {
  isEditing.value = true
  currentId.value = app.id
  form.value = { 
    ...app,
    follow_up_date: app.follow_up_date ? new Date(app.follow_up_date).toISOString().split('T')[0] : null
  }
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
    appStore.updateApplication(currentId.value, form.value)
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
  const date = new Date(app.updated_at || app.date_applied)
  const daysDiff = (new Date() - date) / (1000 * 60 * 60 * 24)
  return daysDiff > 7 // 7 days threshold
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">{{ t('applications.title') }}</h2>
        <p class="text-muted-foreground mt-1">{{ t('applications.subtitle') }}</p>
      </div>
      <div class="flex gap-2">
         <ExportButton 
            :data="appStore.applications" 
            :stats="{
               total: appStore.applications.length,
               pending: appStore.applications.filter(a => a.status === 'Applied').length,
               interviews: appStore.applications.filter(a => a.status === 'Interview').length,
               offers: appStore.applications.filter(a => a.status === 'Offer').length,
               rejected: appStore.applications.filter(a => a.status === 'Refusal').length
            }"
            type="applications"
         />
         <Button class="rounded-xl shadow-lg shadow-primary/20" @click="openAddModal">
            <Plus class="h-4 w-4 mr-2" /> {{ t('applications.add_app') }}
         </Button>
      </div>
    </div>

    <!-- Quick Stats Bar -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="stat in stats" :key="stat.label" class="glass border-none p-4 rounded-2xl flex flex-col gap-1 transition-transform hover:scale-[1.02]">
        <span class="text-xs font-medium text-muted-foreground uppercase tracking-wider">{{ stat.label }}</span>
        <div class="flex items-end justify-between">
           <span class="text-2xl font-bold">{{ stat.value }}</span>
           <div :class="[stat.bg, stat.color, 'p-1.5 rounded-lg']">
              <Building2 v-if="stat.label.includes('All')" class="h-4 w-4" />
              <Calendar v-else class="h-4 w-4" />
           </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row sm:items-center gap-4">
      <div class="relative w-full max-w-sm">
        <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input type="search" :placeholder="t('applications.searchPlaceholder')" class="pl-8 w-full" v-model="searchQuery" />
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <select v-model="statusFilter" class="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <option value="All">{{ t('applications.allStatuses') }}</option>
          <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
        </select>
        <select v-model="sortBy" class="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="company">Company (A-Z)</option>
          <option value="position">Position (A-Z)</option>
        </select>
      </div>
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
                <span>{{ formatDate(app.date_applied) }}</span>
             </div>
             <div v-if="app.follow_up_date" class="flex items-center gap-2 text-orange-500 font-medium">
                <Calendar class="h-4 w-4" />
                <span>Follow-up: {{ formatDate(app.follow_up_date) }}</span>
             </div>
             <div v-if="app.cv_name || app.cover_letter_name" class="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/50">
                <div v-if="app.cv_name" class="flex items-center gap-1">
                   <Badge variant="outline" class="text-[10px] py-0 h-5 bg-blue-50/50">
                      <File class="h-2.5 w-2.5 mr-1" /> {{ app.cv_name }}
                   </Badge>
                   <Button variant="ghost" size="icon" class="h-5 w-5 hover:bg-blue-100/50" @click.stop="docStore.viewDocument(app.cv_id)">
                      <Eye class="h-3 w-3" />
                   </Button>
                </div>
                <div v-if="app.cover_letter_name" class="flex items-center gap-1">
                   <Badge variant="outline" class="text-[10px] py-0 h-5 bg-green-50/50">
                      <FileText class="h-2.5 w-2.5 mr-1" /> {{ app.cover_letter_name }}
                   </Badge>
                   <Button variant="ghost" size="icon" class="h-5 w-5 hover:bg-green-100/50" @click.stop="docStore.viewDocument(app.cover_letter_id)">
                      <Eye class="h-3 w-3" />
                   </Button>
                </div>
             </div>
          </div>
        </CardContent>
      </Card>
      
      <div v-if="filteredApplications.length === 0" class="col-span-full flex flex-col items-center justify-center py-20 text-center glass rounded-3xl border-dashed border-2">
         <div class="bg-primary/10 p-4 rounded-full mb-4">
            <Building2 class="h-8 w-8 text-primary" />
         </div>
         <h3 class="text-xl font-bold mb-2">No applications found</h3>
         <p class="text-muted-foreground mb-6 max-w-xs">Start your journey by searching for jobs or adding one manually.</p>
         <div class="flex gap-3">
            <Button variant="outline" @click="openAddModal">Add Manually</Button>
            <Button @click="router.push('/search')">Search Jobs</Button>
         </div>
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
             <Label for="follow_up_date">Follow-up Reminder Date</Label>
             <Input id="follow_up_date" type="date" v-model="form.follow_up_date" />
             <p class="text-[10px] text-muted-foreground">Pick a date to be reminded on the dashboard.</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
             <div class="space-y-2">
                <Label>CV Linked</Label>
                <select v-model="form.cv_id" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                   <option :value="null">None</option>
                   <option v-for="cv in cvs" :key="cv.id" :value="cv.id">{{ cv.name }}</option>
                </select>
             </div>
             <div class="space-y-2">
                <Label>Cover Letter Linked</Label>
                <select v-model="form.cover_letter_id" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                   <option :value="null">None</option>
                   <option v-for="cl in coverLetters" :key="cl.id" :value="cl.id">{{ cl.name }}</option>
                </select>
             </div>
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
