<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { Check, Sparkles, X, ShieldCheck, Zap, Rocket } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'

const authStore = useAuthStore()
const router = useRouter()

async function handleUpgrade() {
  try {
    const success = await authStore.upgrade()
    if (success) {
      alert('Félicitations ! Vous êtes maintenant un utilisateur Premium. 🚀')
      router.push('/')
    }
  } catch (error) {
    console.error('Failed to upgrade:', error)
    alert('Erreur lors du passage en Premium : ' + error.message)
  }
}

const freeFeatures = [
  'Dashboard Analytics',
  'Unlimited Applications (List)',
  'Document Storage',
  'Find Jobs Scraper'
]

const premiumFeatures = [
  ...freeFeatures,
  'Kanban Board View',
  'Recruiter CRM',
  'Interview Manager',
  'AI Cover Letter Generator',
  'ATS Keyword Analysis (Coming Soon)',
  'Intelligent Reminders'
]
</script>

<template>
  <div class="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-base font-semibold text-primary tracking-wide uppercase">Pricing</h2>
      <p class="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
        Upgrade to <span class="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">JobTracker Pro</span>
      </p>
      <p class="mt-4 max-w-2xl text-xl text-muted-foreground mx-auto">
        Get the edge in your job search with our AI-powered features and professional management tools.
      </p>
    </div>

    <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      <!-- Free Plan -->
      <Card class="glass border-transparent flex flex-col opacity-80 scale-95 origin-right">
        <CardHeader>
          <CardTitle class="text-xl flex items-center justify-between">
            Free Plan
            <Zap class="h-5 w-5 text-muted-foreground" />
          </CardTitle>
          <div class="mt-4 flex items-baseline">
            <span class="text-4xl font-extrabold tracking-tight">0€</span>
            <span class="ml-1 text-xl font-semibold text-muted-foreground">/ forever</span>
          </div>
        </CardHeader>
        <CardContent class="flex-grow">
          <ul class="space-y-4">
            <li v-for="feature in freeFeatures" :key="feature" class="flex items-start">
              <div class="flex-shrink-0">
                <Check class="h-5 w-5 text-green-500" />
              </div>
              <p class="ml-3 text-sm text-foreground/80">{{ feature }}</p>
            </li>
            <li class="flex items-start opacity-30">
              <X class="h-5 w-5 text-red-500" />
              <p class="ml-3 text-sm line-through">AI Features</p>
            </li>
          </ul>
        </CardContent>
        <div class="p-6 pt-0 mt-auto">
          <Button variant="outline" class="w-full" disabled>Current Plan</Button>
        </div>
      </Card>

      <!-- Premium Plan -->
      <Card class="relative glass border-primary/50 flex flex-col shadow-2xl shadow-primary/20 scale-105 z-10">
        <div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span class="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
            <Sparkles class="h-3 w-3" /> Recommended
          </span>
        </div>
        
        <CardHeader>
          <CardTitle class="text-2xl font-bold flex items-center justify-between">
            Pro Plan
            <Rocket class="h-6 w-6 text-primary" />
          </CardTitle>
          <div class="mt-4 flex items-baseline">
            <span class="text-5xl font-extrabold tracking-tight">14.99€</span>
            <span class="ml-1 text-xl font-semibold text-muted-foreground">/ month</span>
          </div>
          <p class="text-xs text-muted-foreground mt-2">Unlock all premium recruitment tools</p>
        </CardHeader>
        
        <CardContent class="flex-grow">
          <ul class="space-y-4">
            <li v-for="feature in premiumFeatures" :key="feature" class="flex items-start">
              <div class="flex-shrink-0">
                <ShieldCheck class="h-5 w-5 text-primary" />
              </div>
              <p class="ml-3 text-sm font-medium">
                {{ feature }}
                <span v-if="feature.includes('AI')" class="ml-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">HOT</span>
              </p>
            </li>
          </ul>
        </CardContent>
        
        <div class="p-6 pt-0 mt-auto">
          <Button 
            v-if="!authStore.isPremium"
            @click="handleUpgrade" 
            class="w-full bg-gradient-to-r from-primary to-purple-600 hover:shadow-lg hover:shadow-primary/30 transition-all font-bold group"
          >
            Upgrade Now
            <Sparkles class="ml-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
          </Button>
          <Button 
            v-else
            variant="ghost" 
            class="w-full border-2 border-primary/20 text-primary cursor-default"
          >
            <Check class="mr-2 h-4 w-4" /> You are Pro
          </Button>
        </div>
      </Card>
    </div>

    <div class="mt-20 text-center">
      <p class="text-muted-foreground text-sm flex items-center justify-center gap-2">
         <Zap class="h-4 w-4" /> Not ready to commit? Start for free and upgrade anytime.
      </p>
    </div>
  </div>
</template>
