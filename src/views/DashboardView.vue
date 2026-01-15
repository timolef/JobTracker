<script setup>
import { useApplicationStore } from '@/stores/applications'
import { useAuthStore } from '@/stores/auth'
import { computed, onMounted, ref } from 'vue'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Button from '@/components/ui/Button.vue'
import Dialog from '@/components/ui/Dialog.vue'
import Label from '@/components/ui/Label.vue'
import { Briefcase, CheckCircle2, MessageSquare, XCircle, Eye } from 'lucide-vue-next'


const authStore = useAuthStore()
const appStore = useApplicationStore()

onMounted(() => {
  if (authStore.isAuthenticated) {
    appStore.fetchApplications()
  }
})

const stats = computed(() => [
  {
    title: 'Total Applications',
    value: () => appStore.stats.total,
    icon: Briefcase,
    class: 'text-blue-500' 
  },
  {
    title: 'Interviews',
    value: () => appStore.stats.interview,
    icon: MessageSquare,
    class: 'text-purple-500'
  },
  {
    title: 'Response Rate',
    value: () => `${appStore.stats.responseRate}%`,
    icon: CheckCircle2,
    class: 'text-green-500'
  },
  {
    title: 'Active Processes',
    value: () => appStore.stats.active,
    icon: Briefcase, // reused
    class: 'text-orange-500'
  }
])

const statuses = ['To Apply', 'Applied', 'Interview', 'Refusal', 'Offer']

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
  <div class="space-y-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h2 class="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Dashboard</h2>
        <p class="text-muted-foreground mt-1">Welcome back! Here's an overview of your progress.</p>
      </div>
    </div>

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
