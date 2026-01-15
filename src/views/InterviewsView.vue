<script setup>
import { ref, computed, onMounted } from 'vue'
import { useInterviewStore } from '@/stores/interviews'
import { useApplicationStore } from '@/stores/applications'
import { 
  Calendar, 
  Plus, 
  MapPin, 
  Video, 
  Phone, 
  User, 
  Search, 
  ExternalLink, 
  Trash2, 
  Edit2,
  CheckCircle2,
  Clock,
  BookOpen,
  HelpCircle,
  CalendarPlus
} from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import Dialog from '@/components/ui/Dialog.vue'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Badge from '@/components/ui/Badge.vue'

const interviewStore = useInterviewStore()
const appStore = useApplicationStore()

onMounted(() => {
  interviewStore.fetchInterviews()
  appStore.fetchApplications()
})

const isDialogOpen = ref(false)
const isEditing = ref(false)
const currentId = ref(null)

const form = ref({
  application_id: null,
  company: '',
  position: '',
  interview_date: '',
  type: 'Video',
  questions: '',
  research: '',
  notes: ''
})

const interviewTypes = ['Phone', 'Video', 'On-site', 'Technical']

const upcomingInterviews = computed(() => {
  return interviewStore.interviews.filter(i => new Date(i.interview_date) >= new Date())
})

const pastInterviews = computed(() => {
  return interviewStore.interviews.filter(i => new Date(i.interview_date) < new Date()).reverse()
})

function openAddModal() {
  isEditing.value = false
  currentId.value = null
  form.value = {
    application_id: null,
    company: '',
    position: '',
    interview_date: '',
    type: 'Video',
    questions: '',
    research: '',
    notes: ''
  }
  isDialogOpen.value = true
}

function openEditModal(interview) {
  isEditing.value = true
  currentId.value = interview.id
  // Format date for datetime-local input
  const date = new Date(interview.interview_date)
  const formattedDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  
  form.value = { ...interview, interview_date: formattedDate }
  isDialogOpen.value = true
}

async function saveInterview() {
  if (isEditing.value) {
    await interviewStore.updateInterview(currentId.value, form.value)
  } else {
    await interviewStore.addInterview(form.value)
  }
  isDialogOpen.value = false
}

async function deleteInterview(id) {
  if (confirm('Cancel this interview?')) {
    await interviewStore.deleteInterview(id)
  }
}

function getTypeIcon(type) {
  switch (type) {
    case 'Phone': return Phone
    case 'Video': return Video
    case 'On-site': return MapPin
    default: return User
  }
}

function formatFullDate(date) {
  return new Date(date).toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getGoogleCalendarUrl(interview) {
  const start = new Date(interview.interview_date).toISOString().replace(/-|:|\.\d\d\d/g, "")
  const end = new Date(new Date(interview.interview_date).getTime() + 60 * 60000).toISOString().replace(/-|:|\.\d\d\d/g, "")
  const title = encodeURIComponent(`Interview: ${interview.position} @ ${interview.company}`)
  const details = encodeURIComponent(`Type: ${interview.type}\nNotes: ${interview.notes || ''}`)
  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`
}
</script>

<template>
  <div class="space-y-8">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">Interviews Manager</h2>
        <p class="text-muted-foreground">Schedule and prepare for your upcoming job interviews.</p>
      </div>
      <Button @click="openAddModal">
        <Plus class="mr-2 h-4 w-4" /> Schedule Interview
      </Button>
    </div>

    <!-- Upcoming Interviews -->
    <div class="space-y-4">
      <h3 class="text-xl font-semibold flex items-center gap-2">
        <Clock class="h-5 w-5 text-primary" /> Upcoming
      </h3>
      
      <div v-if="upcomingInterviews.length === 0" class="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
         <p class="text-muted-foreground">No interviews scheduled. Good luck with your applications!</p>
      </div>

      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card v-for="interview in upcomingInterviews" :key="interview.id" class="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
          <CardContent class="p-6">
            <div class="flex justify-between items-start mb-4">
               <Badge variant="secondary" class="flex items-center gap-1 px-2 py-0.5">
                  <component :is="getTypeIcon(interview.type)" class="h-3 w-3" />
                  {{ interview.type }}
               </Badge>
               <div class="flex gap-1">
                  <Button variant="ghost" size="icon" class="h-8 w-8" @click="openEditModal(interview)">
                    <Edit2 class="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" class="h-8 w-8 text-destructive" @click="deleteInterview(interview.id)">
                    <Trash2 class="h-3.5 w-3.5" />
                  </Button>
               </div>
            </div>

            <div class="mb-4">
               <h4 class="font-bold text-lg leading-snug">{{ interview.position }}</h4>
               <p class="text-muted-foreground">{{ interview.company }}</p>
            </div>

            <div class="flex items-center gap-2 text-sm text-primary font-medium mb-6">
               <Calendar class="h-4 w-4" />
               <span class="capitalize">{{ formatFullDate(interview.interview_date) }}</span>
            </div>

            <div class="grid grid-cols-2 gap-2 mt-auto">
               <Button variant="outline" size="sm" class="w-full text-xs" @click="openEditModal(interview)">
                  <BookOpen class="mr-1.5 h-3.5 w-3.5" /> Prepare
               </Button>
               <a :href="getGoogleCalendarUrl(interview)" target="_blank" class="w-full">
                 <Button variant="outline" size="sm" class="w-full text-xs">
                    <CalendarPlus class="mr-1.5 h-3.5 w-3.5" /> Calendar
                 </Button>
               </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Past Interviews -->
    <div class="space-y-4" v-if="pastInterviews.length > 0">
      <h3 class="text-lg font-semibold text-muted-foreground flex items-center gap-2">
        <CheckCircle2 class="h-5 w-5" /> Completed
      </h3>
      <div class="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
         <Card v-for="interview in pastInterviews" :key="interview.id" class="bg-muted/30 grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all">
            <CardContent class="p-4">
               <h5 class="font-semibold text-sm truncate">{{ interview.position }}</h5>
               <p class="text-[10px] text-muted-foreground mb-2">{{ interview.company }}</p>
               <p class="text-[10px] font-medium">{{ new Date(interview.interview_date).toLocaleDateString() }}</p>
            </CardContent>
         </Card>
      </div>
    </div>

    <!-- Add/Edit/Prepare Dialog -->
    <Dialog v-model:open="isDialogOpen" :title="isEditing ? 'Interview Preparation' : 'Schedule Interview'">
       <form @submit.prevent="saveInterview" class="space-y-6 mt-4">
          <!-- Basic Info -->
          <div class="grid grid-cols-2 gap-4">
             <div class="space-y-2">
                <Label for="company">Company</Label>
                <Input id="company" v-model="form.company" required />
             </div>
             <div class="space-y-2">
                <Label for="position">Position</Label>
                <Input id="position" v-model="form.position" required />
             </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
             <div class="space-y-2">
                <Label for="date">Date & Time</Label>
                <Input id="date" type="datetime-local" v-model="form.interview_date" required />
             </div>
             <div class="space-y-2">
                <Label for="type">Format</Label>
                <select id="type" v-model="form.type" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                   <option v-for="t in interviewTypes" :key="t" :value="t">{{ t }}</option>
                </select>
             </div>
          </div>

          <!-- Preparation Sections -->
          <div class="space-y-4 border-t pt-4">
             <div class="space-y-2">
                <Label class="flex items-center gap-2">
                   <Search class="h-4 w-4 text-primary" /> Company Research
                </Label>
                <textarea 
                  v-model="form.research" 
                  class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
                  placeholder="Key products, values, recent news..."
                ></textarea>
             </div>

             <div class="space-y-2">
                <Label class="flex items-center gap-2">
                   <HelpCircle class="h-4 w-4 text-primary" /> Questions to Prepare
                </Label>
                <textarea 
                  v-model="form.questions" 
                  class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
                  placeholder="- Tell me about a time...
- Why this role?
- My questions for them..."
                ></textarea>
             </div>
          </div>
          
          <div class="flex justify-end gap-2 pt-4">
             <Button type="button" variant="ghost" @click="isDialogOpen = false">Cancel</Button>
             <Button type="submit">{{ isEditing ? 'Save Preparation' : 'Schedule' }}</Button>
          </div>
       </form>
    </Dialog>
  </div>
</template>
