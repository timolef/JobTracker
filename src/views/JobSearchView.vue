<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useApplicationStore } from '@/stores/applications'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardDescription from '@/components/ui/CardDescription.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Badge from '@/components/ui/Badge.vue'
import { Search, Globe, MapPin, Building2, Download, ExternalLink, Loader2 } from 'lucide-vue-next'

const router = useRouter()
const appStore = useApplicationStore()

const keyword = ref('')
const location = ref('')
const platform = ref('LinkedIn')
const limit = ref(15)
const isLoading = ref(false)
const hasSearched = ref(false)
const results = ref([])

const platforms = ['LinkedIn', 'Indeed', 'Welcome to the Jungle', 'Glassdoor', 'Hellowork']

// Real Backend Integration
async function handleSearch() {
  if (!keyword.value) return
  
  isLoading.value = true
  hasSearched.value = false
  results.value = []

  try {
    const response = await fetch('http://localhost:3000/api/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        platform: platform.value,
        keyword: keyword.value,
        location: location.value,
        limit: Number(limit.value)
      })
    })

    if (!response.ok) throw new Error('Search failed')
    
    const data = await response.json()
    // Add isImported flag local state
    results.value = data.map(job => ({ ...job, isImported: false }))
    
  } catch (error) {
    console.error(error)
    alert("Failed to fetch jobs. Make sure the backend server is running (node server/index.js).")
  } finally {
    isLoading.value = false
    hasSearched.value = true
  }
}

function importJob(job) {
  appStore.addApplication({
    company: job.company,
    position: job.title,
    location: job.location,
    type: job.type,
    status: 'To Apply',
    link: job.link,
    notes: `Imported from ${job.platform} search on ${new Date().toLocaleDateString()}`
  })
  
  // Mark as imported visually
  const index = results.value.findIndex(j => j.id === job.id)
  if (index !== -1) {
    results.value[index].isImported = true
  }
}

function goToApplications() {
  router.push('/applications')
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-2">
      <h2 class="text-3xl font-bold tracking-tight">Find Jobs</h2>
      <p class="text-muted-foreground">Search and import job listings from major platforms.</p>
    </div>

    <!-- Search Form -->
    <Card>
      <CardContent class="p-6">
        <form @submit.prevent="handleSearch" class="grid gap-4 md:grid-cols-5 items-end">
          <div class="space-y-2 md:col-span-1">
            <Label for="platform">Platform</Label>
            <div class="relative">
              <Globe class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <select id="platform" v-model="platform" class="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <option v-for="p in platforms" :key="p" :value="p">{{ p }}</option>
              </select>
            </div>
          </div>
          
          <div class="space-y-2 md:col-span-1">
            <Label for="keyword">Keywords</Label>
            <div class="relative">
              <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input id="keyword" v-model="keyword" placeholder="e.g. Frontend Vue" class="pl-9" required />
            </div>
          </div>
          
          <div class="space-y-2 md:col-span-1">
            <Label for="location">Location</Label>
            <div class="relative">
              <MapPin class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input id="location" v-model="location" placeholder="e.g. Remote" class="pl-9" />
            </div>
          </div>

          <div class="space-y-2 md:col-span-1">
            <Label for="limit">Max Jobs</Label>
            <Input id="limit" type="number" v-model="limit" min="1" max="50" placeholder="15" />
          </div>

          <Button type="submit" :disabled="isLoading">
            <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
            {{ isLoading ? 'Scraping...' : 'Search Jobs' }}
          </Button>
        </form>
      </CardContent>
    </Card>

    <!-- Results -->
    <div v-if="hasSearched && results.length > 0" class="space-y-4">
      <h3 class="text-xl font-semibold">Found {{ results.length }} positions on {{ platform }}</h3>
      
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
        <Card v-for="job in results" :key="job.id" class="hover:border-primary/50 transition-colors">
          <CardContent class="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <h4 class="font-semibold text-lg">{{ job.title }}</h4>
                <Badge variant="outline">{{ job.type }}</Badge>
              </div>
              <div class="flex items-center gap-2 text-muted-foreground">
                <Building2 class="h-4 w-4" />
                <span>{{ job.company }}</span>
                <span class="text-xs">&bull;</span>
                <MapPin class="h-4 w-4" />
                <span class="text-sm">{{ job.location }}</span>
              </div>
              <p class="text-xs text-muted-foreground mt-1">Posted {{ job.posted }}</p>
            </div>

            <div class="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" as="a" :href="job.link" target="_blank">
                <ExternalLink class="h-4 w-4 mr-2" /> View
              </Button>
              <Button 
                :variant="job.isImported ? 'secondary' : 'default'" 
                size="sm" 
                @click="importJob(job)"
                :disabled="job.isImported"
              >
                <Download v-if="!job.isImported" class="h-4 w-4 mr-2" />
                <span v-if="job.isImported">Imported</span>
                <span v-else>Import</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div class="flex justify-center pt-4">
         <Button variant="link" @click="goToApplications">View all my applications</Button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="hasSearched && results.length === 0" class="text-center py-12 text-muted-foreground">
      No jobs found matching your criteria. Try different keywords.
    </div>

    <!-- Info Box -->
    <div v-if="!hasSearched && !isLoading" class="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-900 text-sm text-blue-800 dark:text-blue-300">
      <p class="flex items-center gap-2">
        <Loader2 class="h-4 w-4" />
        <strong>Backend Ready:</strong> This search now connects to your local Node.js server to scrape real jobs from {{ platform }}.
      </p>
    </div>
  </div>
</template>
