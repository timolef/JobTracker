<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'
import { 
  LayoutDashboard, 
  Briefcase, 
  LogOut, 
  User,
  Search,
  FileText,
  Calendar,
  Sun,
  Moon,
  Lock,
  Sparkles,
  Menu,
  X
} from 'lucide-vue-next'

const route = useRoute()
const auth = useAuthStore()
const { t, locale } = useI18n()

const navigation = computed(() => [
  { name: t('nav.dashboard'), href: '/dashboard', icon: LayoutDashboard, premium: false },
  { name: t('nav.board'), href: '/kanban', icon: Briefcase, premium: true },
  { name: t('nav.applications'), href: '/applications', icon: Briefcase, premium: false },
  { name: t('nav.documents'), href: '/documents', icon: FileText, premium: false },
  { name: t('nav.search'), href: '/search', icon: Search, premium: false },
  { name: t('nav.contacts'), href: '/contacts', icon: User, premium: true },
  { name: t('nav.interviews'), href: '/interviews', icon: Calendar, premium: true },
])

const isMobileMenuOpen = ref(false)

function toggleLanguage() {
  const newLocale = locale.value === 'fr' ? 'en' : 'fr'
  locale.value = newLocale
  localStorage.setItem('locale', newLocale)
}

const router = useRouter()

function handleNavClick(item, e) {
  if (item.premium && !auth.isPremium) {
    e.preventDefault()
    router.push('/pricing')
  }
}

const currentRoute = computed(() => route.path)

const theme = ref('light')

function toggleTheme() {
  const newTheme = theme.value === 'light' ? 'dark' : 'light'
  theme.value = newTheme
  
  const root = window.document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(newTheme)
  
  localStorage.setItem('theme', newTheme)
}

// Init theme

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  
  if (savedTheme) {
    theme.value = savedTheme
    document.documentElement.classList.add(savedTheme)
  } else if (systemDark) {
    theme.value = 'dark'
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.add('light')
  }
})
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col md:flex-row">
    <!-- Mobile Top Bar -->
    <header class="md:hidden flex items-center justify-between p-4 glass sticky top-0 z-30 border-b border-border/50">
      <div class="flex items-center gap-4">
        <button @click="isMobileMenuOpen = true" class="p-2 -ml-2 rounded-lg hover:bg-accent/50 text-muted-foreground">
          <Menu class="h-6 w-6" />
        </button>
        <div class="flex items-center gap-2">
          <h1 class="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">JobTracker</h1>
          <span v-if="auth.isPremium" class="bg-primary text-white text-[8px] font-black px-1 rounded-sm shadow-sm">PRO</span>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button @click="toggleLanguage" class="p-1.5 rounded-lg bg-muted text-[10px] font-bold">
          {{ locale.toUpperCase() }}
        </button>
        <router-link to="/profile" class="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/10">
          <User class="h-4 w-4" />
        </router-link>
      </div>
    </header>

    <!-- Mobile Sidebar Overlay -->
    <div 
      v-if="isMobileMenuOpen" 
      @click="isMobileMenuOpen = false"
      class="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden transition-opacity"
    ></div>

    <!-- Mobile Sidebar Content -->
    <aside 
      class="fixed inset-y-0 left-0 w-72 bg-background border-r z-50 md:hidden transition-transform duration-300 transform"
      :class="isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex flex-col h-full">
        <div class="p-6 flex items-center justify-between border-b">
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">JobTracker</h1>
            <span v-if="auth.isPremium" class="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded border border-primary/20">PRO</span>
          </div>
          <button @click="isMobileMenuOpen = false" class="p-2 -mr-2 rounded-lg hover:bg-accent/50 text-muted-foreground">
            <X class="h-5 w-5" />
          </button>
        </div>

        <nav class="flex-1 p-4 space-y-1.5 overflow-y-auto mt-4">
          <router-link 
            v-for="item in navigation" 
            :key="item.name" 
            :to="item.premium && !auth.isPremium ? '/pricing' : item.href"
            @click="isMobileMenuOpen = false"
            class="flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-all"
            :class="[
              currentRoute === item.href 
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
            ]"
          >
            <div class="relative">
              <component :is="item.icon" class="h-5 w-5" />
              <Lock v-if="item.premium && !auth.isPremium" class="absolute -top-1.5 -right-1.5 h-2.5 w-2.5 text-orange-500" />
            </div>
            <span class="flex-1">{{ item.name }}</span>
            <span v-if="item.premium && !auth.isPremium" class="text-[9px] bg-orange-500/10 text-orange-500 px-1.5 py-0.5 rounded-full font-bold uppercase">Pro</span>
          </router-link>
        </nav>

        <div class="p-4 border-t space-y-4">
           <!-- Language & Theme for Mobile -->
           <div class="grid grid-cols-2 gap-2">
              <div class="flex items-center justify-between p-1 rounded-xl bg-muted/30 border border-border/50">
                 <button 
                   v-for="lang in ['fr', 'en']" 
                   :key="lang"
                   @click="locale = lang; localStorage.setItem('locale', lang)"
                   class="flex-1 px-2 py-1.5 text-[10px] font-bold rounded-lg transition-all"
                   :class="locale === lang ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground'"
                 >
                   {{ lang.toUpperCase() }}
                 </button>
              </div>
              <div class="flex items-center justify-between px-2 py-1 rounded-xl bg-muted/30 border border-border/50">
                 <Sun class="h-3.5 w-3.5 text-muted-foreground" :class="{ 'text-primary': theme === 'light' }" />
                 <button 
                   @click="toggleTheme" 
                   class="relative inline-flex h-5 w-9 items-center rounded-full transition-all"
                   :class="theme === 'dark' ? 'bg-primary' : 'bg-slate-200'"
                 >
                   <span class="block h-4 w-4 rounded-full bg-white transition-transform" :class="theme === 'dark' ? 'translate-x-4' : 'translate-x-1'" />
                 </button>
                 <Moon class="h-3.5 w-3.5 text-muted-foreground" :class="{ 'text-primary': theme === 'dark' }" />
              </div>
           </div>

           <router-link to="/profile" @click="isMobileMenuOpen = false" class="flex items-center gap-3 p-3 rounded-xl bg-accent/30 hover:bg-accent/50 transition-colors">
              <div class="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <User class="h-5 w-5" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold truncate">{{ auth.user?.name || 'User' }}</p>
                <p class="text-[10px] text-muted-foreground truncate">{{ auth.user?.email }}</p>
              </div>
           </router-link>
           
           <Button variant="ghost" class="w-full justify-start text-destructive hover:bg-destructive/10 rounded-xl px-3" @click="auth.logout(); isMobileMenuOpen = false">
              <LogOut class="h-4 w-4 mr-3" />
              {{ t('common.logout') }}
           </Button>
        </div>
      </div>
    </aside>

    <!-- Sidebar (Desktop only) -->
    <aside class="w-64 border-r md:flex flex-col hidden glass z-20 transition-all duration-500">
      <div class="p-6">
        <div class="flex items-center gap-2">
          <h1 class="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">JobTracker</h1>
          <span v-if="auth.isPremium" class="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded border border-primary/20 shadow-sm animate-pulse">PRO</span>
        </div>
      </div>
      
      <nav class="flex-1 px-4 space-y-2">
        <router-link 
          v-for="item in navigation" 
          :key="item.name" 
          :to="item.premium && !auth.isPremium ? '/pricing' : item.href"
          class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 group"
          :class="[
            currentRoute === item.href 
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]' 
              : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground hover:translate-x-1',
            item.premium && !auth.isPremium ? 'opacity-80' : ''
          ]"
        >
          <div class="relative">
            <component :is="item.icon" class="h-4 w-4 transition-transform group-hover:scale-110" />
            <Lock v-if="item.premium && !auth.isPremium" class="absolute -top-1.5 -right-1.5 h-2.5 w-2.5 text-orange-500" />
          </div>
          <span class="flex-1">{{ item.name }}</span>
          <span v-if="item.premium && !auth.isPremium" class="text-[9px] bg-orange-500/10 text-orange-500 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter">Pro</span>
        </router-link>
      </nav>

      <div v-if="!auth.isPremium" class="px-4 mb-4">
        <router-link to="/pricing" class="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white text-xs font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">
          <Sparkles class="h-3.5 w-3.5" /> {{ t('nav.upgrade') }}
        </router-link>
      </div>

      <div class="px-4 pb-2">
        <div class="flex items-center justify-between p-1 rounded-xl bg-muted/30 border border-border/50">
           <button 
             v-for="lang in ['fr', 'en']" 
             :key="lang"
             @click="locale = lang; localStorage.setItem('locale', lang)"
             class="flex-1 px-2 py-1.5 text-[10px] font-bold rounded-lg transition-all"
             :class="locale === lang ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'"
           >
             {{ lang.toUpperCase() }}
           </button>
        </div>
      </div>

      <div class="px-4 py-4">
        <div class="flex items-center justify-between p-2 rounded-xl bg-muted/40 backdrop-blur-sm border border-border/50">
           <Sun class="h-3.5 w-3.5 text-muted-foreground" :class="{ 'text-primary': theme === 'light' }" />
           <button 
             @click="toggleTheme" 
             class="relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
             :class="theme === 'dark' ? 'bg-primary' : 'bg-slate-200'"
           >
             <span
               class="pointer-events-none block h-5 w-5 rounded-full bg-white shadow-xl ring-0 transition-transform duration-500"
               :class="theme === 'dark' ? 'translate-x-5' : 'translate-x-1'"
             />
           </button>
           <Moon class="h-3.5 w-3.5 text-muted-foreground" :class="{ 'text-primary': theme === 'dark' }" />
        </div>
      </div>

      <div class="p-4 border-t border-border/50">
        <router-link to="/profile" class="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-accent/30 transition-colors cursor-pointer group">
          <div class="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
            <User class="h-4.5 w-4.5" />
          </div>
          <div class="flex-1 overflow-hidden">
            <div class="flex items-center gap-2">
              <p class="text-sm font-semibold truncate">{{ auth.user?.name || 'User' }}</p>
              <span v-if="auth.isPremium" class="bg-primary text-white text-[9px] font-black px-1 rounded-sm shadow-sm">PRO</span>
            </div>
            <p class="text-[11px] text-muted-foreground truncate">{{ auth.user?.email }}</p>
          </div>
          <button @click.prevent.stop="auth.logout" class="text-muted-foreground hover:text-destructive transition-all" :title="t('common.logout')">
            <LogOut class="h-4 w-4" />
          </button>
        </router-link>
      </div>
    </aside>

    <!-- Mobile Header (Visible on small screens) -->
    <!-- TODO: Add mobile menu toggle -->

    <!-- Main Content -->
    <main class="flex-1 overflow-auto">
      <div class="h-full p-4 md:p-8">
        <router-view />
      </div>
    </main>
  </div>
</template>
