<script setup>
import { useApplicationStore } from '@/stores/applications'
import { useAuthStore } from '@/stores/auth'
import { useContactStore } from '@/stores/contacts'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdBanner from '@/components/AdBanner.vue'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Button from '@/components/ui/Button.vue'
import Dialog from '@/components/ui/Dialog.vue'
import Label from '@/components/ui/Label.vue'
import { Briefcase, CheckCircle2, MessageSquare, XCircle, Eye, TrendingUp, PieChart as PieChartIcon, Bell, User, Mail, Phone, Linkedin, ExternalLink } from 'lucide-vue-next'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler
} from 'chart.js'
import { Doughnut, Line } from 'vue-chartjs'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler
)


const authStore = useAuthStore()
const appStore = useApplicationStore()
const contactStore = useContactStore()
const { t } = useI18n()

onMounted(() => {
  if (authStore.isAuthenticated) {
    appStore.fetchApplications()
    contactStore.fetchContacts()
  }
})

const stats = computed(() => [
  {
    title: t('dashboard.stats.total_apps'),
    value: () => appStore.stats.total,
    icon: Briefcase,
    class: 'text-blue-500' 
  },
  {
    title: t('dashboard.stats.interviews'),
    value: () => appStore.stats.interview,
    icon: MessageSquare,
    class: 'text-purple-500'
  },
  {
    title: t('dashboard.stats.response_rate'),
    value: () => `${appStore.stats.responseRate}%`,
    icon: CheckCircle2,
    class: 'text-green-500'
  },
  {
    title: t('dashboard.stats.offers'),
    value: () => appStore.stats.offers,
    icon: Briefcase,
    class: 'text-orange-500'
  }
])

const statuses = ['To Apply', 'Applied', 'Interview', 'Refusal', 'Offer']

const isDetailsOpen = ref(false)
const selectedApp = ref(null)
const isContactDetailsOpen = ref(false)
const selectedContact = ref(null)

function openDetails(app) {
  selectedApp.value = app
  isDetailsOpen.value = true
}

function openContactDetails(contact) {
  selectedContact.value = contact
  isContactDetailsOpen.value = true
}

function formatDate(isoString) {
  if (!isoString) return '-'
  return new Date(isoString).toLocaleDateString()
}

// Chart Data Logic
const doughnutData = computed(() => {
  const counts = {}
  statuses.forEach(s => counts[s] = 0)
  appStore.applications.forEach(app => {
    if (counts[app.status] !== undefined) counts[app.status]++
  })

  return {
    labels: statuses,
    datasets: [{
      data: statuses.map(s => counts[s]),
      backgroundColor: [
        'rgba(148, 163, 184, 0.7)', // To Apply
        'rgba(59, 130, 246, 0.7)',   // Applied
        'rgba(168, 85, 247, 0.7)',   // Interview
        'rgba(239, 68, 68, 0.7)',    // Refusal
        'rgba(34, 197, 94, 0.7)',    // Offer
      ],
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1
    }]
  }
})

const urgentReminders = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  const reminders = []

  // From Applications
  appStore.applications.forEach(app => {
    if (app.follow_up_date) {
      const followUp = new Date(app.follow_up_date).toISOString().split('T')[0]
      if (followUp <= today) {
        reminders.push({
          id: `app-${app.id}`,
          type: 'application',
          title: `${app.position} @ ${app.company}`,
          date: app.follow_up_date,
          original: app
        })
      }
    }
  })

  // From Contacts
  contactStore.contacts.forEach(contact => {
    if (contact.follow_up_date) {
      const followUp = new Date(contact.follow_up_date).toISOString().split('T')[0]
      if (followUp <= today) {
        reminders.push({
          id: `contact-${contact.id}`,
          type: 'contact',
          title: `${contact.name} (${contact.company || 'Recruiter'})`,
          date: contact.follow_up_date,
          original: contact
        })
      }
    }
  })

  return reminders.sort((a, b) => new Date(a.date) - new Date(b.date))
})

const activityData = computed(() => {
  // Last 7 days activity
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })

  const counts = {}
  last7Days.forEach(date => counts[date] = 0)

  appStore.applications.forEach(app => {
    const date = new Date(app.date_applied).toISOString().split('T')[0]
    if (counts[date] !== undefined) counts[date]++
  })

  return {
    labels: last7Days.map(d => new Date(d).toLocaleDateString(undefined, { weekday: 'short' })),
    datasets: [{
      label: 'Applications',
      data: last7Days.map(d => counts[d]),
      fill: true,
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderColor: 'rgba(59, 130, 246, 1)',
      tension: 0.4,
      pointBackgroundColor: 'rgba(59, 130, 246, 1)',
      pointBorderColor: '#fff',
      pointHoverRadius: 6
    }]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      cornerRadius: 8
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { display: false },
      ticks: { color: 'rgba(255, 255, 255, 0.5)', stepSize: 1 }
    },
    x: {
      grid: { display: false },
      ticks: { color: 'rgba(255, 255, 255, 0.5)' }
    }
  }
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '70%',
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: 'rgba(255, 255, 255, 0.7)',
        usePointStyle: true,
        padding: 20,
        font: { size: 10 }
      }
    }
  }
}
</script>

<template>
  <div class="space-y-8">
    <div class="flex items-center justify-between mb-8">
      <div>
      <div class="flex items-center gap-3">
        <h2 class="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{{ t('dashboard.title') }}</h2>
        <span v-if="authStore.isPremium" class="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded border border-primary/20 shadow-sm animate-pulse">{{ t('dashboard.pro_member') }}</span>
      </div>
        <p class="text-muted-foreground mt-1">{{ t('dashboard.welcome') }}</p>
      </div>
    </div>

    <!-- Ad Banner for Free Users -->
    <AdBanner v-if="!authStore.isPremium" type="horizontal" class="mb-8" />

    <!-- Stats Grid -->
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card v-for="stat in stats" :key="stat.title" class="glass hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 border-none">
        <CardContent class="p-6">
          <div class="flex items-center justify-between space-y-0 pb-2">
            <p class="text-sm font-medium text-muted-foreground">{{ stat.title }}</p>
            <component :is="stat.icon" class="h-4 w-4 text-primary opacity-70" />
          </div>
          <div class="flex items-baseline gap-2">
            <div class="text-3xl font-bold">{{ stat.value() }}</div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Charts and Reminders -->
    <div class="grid gap-6 md:grid-cols-3">
      <Card class="glass border-none md:col-span-1">
        <CardHeader class="flex flex-row items-center justify-between space-y-0">
          <CardTitle class="text-lg font-semibold flex items-center gap-2">
            <PieChartIcon class="h-4 w-4 text-primary" /> {{ t('dashboard.charts.status') }}
          </CardTitle>
        </CardHeader>
        <CardContent class="h-[250px] pt-4">
          <Doughnut :data="doughnutData" :options="doughnutOptions" />
        </CardContent>
      </Card>

      <Card class="glass border-none md:col-span-1">
        <CardHeader class="flex flex-row items-center justify-between space-y-0">
          <CardTitle class="text-lg font-semibold flex items-center gap-2">
            <TrendingUp class="h-4 w-4 text-primary" /> {{ t('dashboard.charts.activity') }}
          </CardTitle>
        </CardHeader>
        <CardContent class="h-[250px] pt-4">
          <Line :data="activityData" :options="chartOptions" />
        </CardContent>
      </Card>

      <Card class="glass border-none md:col-span-1">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-lg font-semibold flex items-center gap-2">
            <Bell class="h-4 w-4 text-orange-500" /> {{ t('dashboard.reminders.title') }}
          </CardTitle>
          <div v-if="urgentReminders.length > 0" class="h-2 w-2 rounded-full bg-orange-500 animate-pulse"></div>
        </CardHeader>
        <CardContent class="pt-4 h-[250px] overflow-y-auto">
          <div v-if="urgentReminders.length === 0" class="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-50">
             <CheckCircle2 class="h-8 w-8 text-green-500" />
             <p class="text-sm">All caught up!</p>
          </div>
          <div v-else class="space-y-3">
             <div 
                v-for="reminder in urgentReminders" 
                :key="reminder.id" 
                class="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 flex flex-col gap-1 transition-all cursor-pointer hover:bg-orange-500/20 active:scale-[0.98]"
                @click="reminder.type === 'application' ? openDetails(reminder.original) : openContactDetails(reminder.original)"
             >
                <div class="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-orange-500">
                   <div class="flex items-center gap-1">
                      <component :is="reminder.type === 'application' ? Briefcase : User" class="h-2.5 w-2.5" />
                      <span>{{ reminder.type }} (View)</span>
                   </div>
                   <span>{{ formatDate(reminder.date) }}</span>
                </div>
                <p class="text-sm font-medium line-clamp-1">{{ reminder.title }}</p>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Recent Activity Placeholder -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card class="col-span-4">
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="appStore.applications.length === 0" class="text-center py-8 text-muted-foreground">
            No applications yet. Start tracking!
          </div>
          <div v-else class="space-y-4">
             <div v-for="app in appStore.applications.slice(0, 5)" :key="app.id" class="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                <div>
                   <p class="font-medium">{{ app.position }}</p>
                   <p class="text-sm text-muted-foreground">{{ app.company }}</p>
                </div>
                <div class="flex items-center gap-3">
                  <Button variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground" @click="openDetails(app)">
                    <Eye class="h-4 w-4" />
                  </Button>
                  <div class="relative">
                    <select 
                      :value="app.status" 
                      @change="(e) => appStore.updateStatus(app.id, e.target.value)"
                      class="h-8 w-[110px] rounded-md border border-input bg-background/50 px-2 text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                      :class="{
                        'text-green-600 border-green-200 bg-green-50 dark:text-green-400 dark:border-green-800 dark:bg-green-900/20': app.status === 'Offer',
                        'text-blue-600 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-900/20': app.status === 'Interview',
                        'text-red-600 border-red-200 bg-red-50 dark:text-red-400 dark:border-red-800 dark:bg-red-900/20': app.status === 'Refusal',
                        'text-foreground': !['Offer', 'Interview', 'Refusal'].includes(app.status)
                      }"
                    >
                      <option v-for="s in statuses" :key="s" :value="s" class="text-foreground bg-background">
                        {{ s }}
                      </option>
                    </select>
                  </div>
                </div>
             </div>
          </div>
        </CardContent>
      </Card>
      
      <Card class="col-span-3">
         <CardHeader>
            <CardTitle>Motivation</CardTitle>
         </CardHeader>
         <CardContent>
            <p class="text-sm text-muted-foreground">
               "Success consists of going from failure to failure without loss of enthusiasm."
            </p>
            <p class="text-xs text-muted-foreground mt-2">- Winston Churchill</p>
         </CardContent>
      </Card>
    </div>
    <!-- Details Dialog -->
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
           <div>
            <Label class="text-xs text-muted-foreground">Status</Label>
             <div class="mt-1">
                <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      :class="{
                        'border-transparent bg-green-500 text-white shadow hover:bg-green-500/80': selectedApp.status === 'Offer',
                        'border-transparent bg-blue-500 text-white shadow hover:bg-blue-500/80': selectedApp.status === 'Interview',
                        'border-transparent bg-red-500 text-white shadow hover:bg-red-500/80': selectedApp.status === 'Refusal',
                        'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80': selectedApp.status === 'Applied' || selectedApp.status === 'To Apply'
                      }"
                >
                    {{ selectedApp.status }}
                </span>
             </div>
          </div>
           <div>
            <Label class="text-xs text-muted-foreground">Date Applied</Label>
            <p class="text-sm">{{ formatDate(selectedApp.date_applied) }}</p>
          </div>
        </div>

        <div v-if="selectedApp.link">
           <Label class="text-xs text-muted-foreground">Link</Label>
           <a :href="selectedApp.link" target="_blank" class="block text-sm text-blue-500 hover:underline truncate">{{ selectedApp.link }}</a>
        </div>

        <div v-if="selectedApp.cv_name || selectedApp.cover_letter_name" class="grid grid-cols-2 gap-4 border-t border-border/50 pt-4">
           <div v-if="selectedApp.cv_name">
              <Label class="text-xs text-muted-foreground">CV Linked</Label>
              <p class="text-sm flex items-center gap-2">
                 <Briefcase class="h-3 w-3 text-blue-500" /> {{ selectedApp.cv_name }}
              </p>
           </div>
           <div v-if="selectedApp.cover_letter_name">
              <Label class="text-xs text-muted-foreground">Cover Letter Linked</Label>
              <p class="text-sm flex items-center gap-2">
                 <MessageSquare class="h-3 w-3 text-green-500" /> {{ selectedApp.cover_letter_name }}
              </p>
           </div>
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

    <!-- Contact Details Dialog -->
    <Dialog v-model:open="isContactDetailsOpen" title="Contact Details">
      <div v-if="selectedContact" class="space-y-4 py-4">
        <div class="flex items-center gap-4">
          <div class="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
            {{ selectedContact.name.charAt(0) }}
          </div>
          <div>
            <h3 class="text-xl font-bold">{{ selectedContact.name }}</h3>
            <p class="text-primary font-medium">{{ selectedContact.role }} @ {{ selectedContact.company }}</p>
          </div>
        </div>

        <div class="grid gap-3 text-sm">
          <div v-if="selectedContact.email" class="flex items-center gap-2 text-muted-foreground">
            <Mail class="h-4 w-4" />
            <a :href="'mailto:' + selectedContact.email" class="hover:underline text-foreground">{{ selectedContact.email }}</a>
          </div>
          <div v-if="selectedContact.phone" class="flex items-center gap-2 text-muted-foreground">
            <Phone class="h-4 w-4" />
            <span class="text-foreground">{{ selectedContact.phone }}</span>
          </div>
          <div v-if="selectedContact.linkedin_url" class="flex items-center gap-2 text-muted-foreground">
            <Linkedin class="h-4 w-4" />
            <a :href="selectedContact.linkedin_url" target="_blank" class="hover:underline text-blue-500">LinkedIn Profile</a>
          </div>
        </div>

        <div v-if="selectedContact.notes" class="space-y-1">
          <Label class="text-[10px] uppercase text-muted-foreground font-bold">Notes</Label>
          <p class="text-sm bg-muted/30 p-3 rounded-lg border border-border/50">{{ selectedContact.notes }}</p>
        </div>

        <div class="pt-4 border-t flex justify-between items-center text-[10px] text-muted-foreground uppercase font-bold">
          <div class="flex flex-col gap-1">
             <span>Last Contact: {{ formatDate(selectedContact.last_contact_date) }}</span>
             <span class="text-orange-500">Follow-up: {{ formatDate(selectedContact.follow_up_date) }}</span>
          </div>
          <router-link to="/contacts" class="flex items-center gap-1 text-primary hover:underline lowercase bg-primary/5 px-2 py-1 rounded">
             manage in CRM <ExternalLink class="h-2.5 w-2.5" />
          </router-link>
        </div>

        <div class="flex justify-end pt-2">
           <Button variant="outline" @click="isContactDetailsOpen = false">Close</Button>
        </div>
      </div>
    </Dialog>
  </div>
</template>
