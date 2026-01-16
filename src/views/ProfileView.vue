<script setup>
import { useAuthStore } from '@/stores/auth'
import { useApplicationStore } from '@/stores/applications'
import { useDocumentsStore } from '@/stores/documents'
import { onMounted, computed } from 'vue'
import { 
  User, 
  Mail, 
  ShieldCheck, 
  Settings, 
  LogOut, 
  FileText, 
  Briefcase, 
  TrendingUp,
  CreditCard,
  Zap,
  CheckCircle2,
  Calendar
} from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Button from '@/components/ui/Button.vue'

const auth = useAuthStore()
const appStore = useApplicationStore()
const docStore = useDocumentsStore()

onMounted(() => {
  if (auth.isAuthenticated) {
    appStore.fetchApplications()
    docStore.fetchDocuments()
  }
})

const userStats = computed(() => [
  { label: 'Applications', value: appStore.applications.length, icon: Briefcase, color: 'text-blue-500' },
  { label: 'Documents', value: docStore.documents.length, icon: FileText, color: 'text-green-500' },
  { label: 'Interviews', value: appStore.stats.interview, icon: Calendar, color: 'text-purple-500' },
  { label: 'Response Rate', value: `${appStore.stats.responseRate}%`, icon: TrendingUp, color: 'text-orange-500' },
])

const joinDate = computed(() => {
  if (!auth.user?.created_at) return 'Recent'
  return new Date(auth.user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
})

async function handleCancelSubscription() {
  if (confirm('Êtes-vous sûr de vouloir annuler votre abonnement Pro ? Vous perdrez l\'accès aux fonctionnalités avancées.')) {
    try {
      const success = await auth.cancelSubscription()
      if (success) {
        alert('Votre abonnement a été annulé. Vous êtes de retour sur le plan Gratuit.')
      }
    } catch (error) {
      alert('Erreur lors de l\'annulation : ' + error.message)
    }
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-10">
    <!-- Header/Cover Section -->
    <div class="relative">
      <div class="h-32 w-full bg-gradient-to-r from-primary/20 via-purple-500/20 to-blue-500/20 rounded-3xl blur-xl absolute -z-10 opacity-50"></div>
      <div class="flex flex-col md:flex-row items-center md:items-end gap-6 px-4">
        <div class="relative group">
          <div class="h-32 w-32 rounded-3xl bg-gradient-to-br from-primary to-purple-600 p-1 shadow-2xl transition-transform duration-500 group-hover:scale-105">
            <div class="h-full w-full rounded-[20px] bg-background flex items-center justify-center overflow-hidden">
               <User class="h-16 w-16 text-primary/40" />
               <!-- Could add avatar image support here -->
            </div>
          </div>
          <div v-if="auth.isPremium" class="absolute -bottom-2 -right-2 bg-primary text-white p-1.5 rounded-xl shadow-lg border-4 border-background">
             <ShieldCheck class="h-5 w-5" />
          </div>
        </div>
        
        <div class="flex-1 text-center md:text-left pb-2">
          <h1 class="text-4xl font-extrabold tracking-tight">{{ auth.user?.name || 'User' }}</h1>
          <div class="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2 text-muted-foreground">
             <div class="flex items-center gap-2">
                <Mail class="h-4 w-4" />
                <span>{{ auth.user?.email }}</span>
             </div>
             <div class="flex items-center gap-2">
                <Zap class="h-4 w-4" />
                <span>Member since {{ joinDate }}</span>
             </div>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-2 pb-2 w-full sm:w-auto">
           <Button variant="outline" class="rounded-xl w-full sm:w-auto">
              <Settings class="h-4 w-4 mr-2" /> Settings
           </Button>
           <Button variant="destructive" class="rounded-xl shadow-lg shadow-destructive/20 w-full sm:w-auto" @click="auth.logout">
              <LogOut class="h-4 w-4 mr-2" /> Logout
           </Button>
        </div>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
       <Card v-for="stat in userStats" :key="stat.label" class="glass border-none hover:translate-y-[-4px] transition-all duration-300">
          <CardContent class="p-4 flex flex-col items-center justify-center text-center">
             <component :is="stat.icon" :class="['h-6 w-6 mb-2', stat.color]" />
             <p class="text-2xl font-bold">{{ stat.value }}</p>
             <p class="text-xs text-muted-foreground uppercase tracking-widest">{{ stat.label }}</p>
          </CardContent>
       </Card>
    </div>

    <div class="grid md:grid-cols-3 gap-8">
      <!-- Subscription Card -->
      <Card class="md:col-span-1 glass border-primary/20 bg-primary/[0.02] overflow-hidden relative">
        <div v-if="auth.isPremium" class="absolute top-0 right-0 p-4">
          <CheckCircle2 class="h-8 w-8 text-primary opacity-20" />
        </div>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <CreditCard class="h-5 w-5 text-primary" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="p-4 rounded-2xl bg-muted/50 border border-border/50">
             <p class="text-sm text-muted-foreground">Current Plan</p>
             <p class="text-xl font-bold flex items-center gap-2 mt-1">
                {{ auth.isPremium ? 'Pro Plan' : 'Free Plan' }}
                <span v-if="auth.isPremium" class="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full uppercase">Active</span>
             </p>
          </div>

          <div v-if="!auth.isPremium" class="space-y-4">
             <p class="text-xs text-muted-foreground leading-relaxed">
                Unlock AI Generator, Kanban Board, and CRM tools to accelerate your career.
             </p>
             <router-link to="/pricing" class="block">
                <Button class="w-full bg-gradient-to-r from-primary to-purple-600 shadow-lg shadow-primary/20">
                   Upgrade to Pro
                </Button>
             </router-link>
          </div>
          <div v-else class="space-y-3 pb-2">
             <div class="flex items-center gap-2 text-sm text-foreground/80">
                <CheckCircle2 class="h-4 w-4 text-green-500" />
                <span>Unlimited AI Letters</span>
             </div>
             <div class="flex items-center gap-2 text-sm text-foreground/80">
                <CheckCircle2 class="h-4 w-4 text-green-500" />
                <span>Kanban Board</span>
             </div>
             <p class="text-[10px] text-muted-foreground pt-2 italic border-b border-border/50 pb-2">Pro membership is active across all devices.</p>
             
             <Button 
               variant="outline" 
               size="sm" 
               class="w-full text-xs text-destructive hover:bg-destructive/10 border-destructive/20 rounded-xl"
               @click="handleCancelSubscription"
             >
                Cancel Subscription
             </Button>
          </div>
        </CardContent>
      </Card>

      <!-- Account Settings / Security -->
      <Card class="md:col-span-2 glass border-none">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <ShieldCheck class="h-5 w-5 text-primary" />
            Account Security
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-6">
           <div class="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50 group hover:border-primary/30 transition-colors">
              <div>
                 <p class="text-sm font-semibold">Change Password</p>
                 <p class="text-xs text-muted-foreground">Keep your account secure with a strong password.</p>
              </div>
              <Button variant="ghost" size="sm" class="rounded-xl group-hover:bg-primary/10 group-hover:text-primary">Update</Button>
           </div>

           <div class="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50 group hover:border-primary/30 transition-colors">
              <div>
                 <p class="text-sm font-semibold">Two-Factor Authentication</p>
                 <p class="text-xs text-muted-foreground">Add an extra layer of protection (Coming Soon).</p>
              </div>
              <div class="h-10 w-16 bg-muted-foreground/20 rounded-full relative p-1 cursor-not-allowed">
                 <div class="h-8 w-8 bg-white/20 rounded-full shadow-sm"></div>
              </div>
           </div>

           <div class="pt-4 flex flex-col items-center justify-center text-center space-y-2 opacity-50">
              <Sparkles class="h-8 w-8 text-primary" />
              <p class="text-xs">More account management features are under development.</p>
           </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
