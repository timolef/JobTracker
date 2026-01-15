<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { 
  LayoutDashboard, 
  Briefcase, 
  LogOut, 
  User,
  Search,
  FileText,
  Calendar,
  Sun,
  Moon
} from 'lucide-vue-next'

const route = useRoute()
const auth = useAuthStore()

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Board', href: '/kanban', icon: Briefcase },
  { name: 'Contacts', href: '/contacts', icon: User },
  { name: 'Interviews', href: '/interviews', icon: Calendar },
  { name: 'Applications', href: '/applications', icon: Briefcase },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Find Jobs', href: '/search', icon: Search },
]

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
import { onMounted, ref } from 'vue'

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
  <div class="min-h-screen bg-background flex">
    <!-- Sidebar -->
    <aside class="w-64 border-r md:flex flex-col hidden glass z-20 transition-all duration-500">
      <div class="p-6">
        <h1 class="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">JobTracker</h1>
      </div>
      
      <nav class="flex-1 px-4 space-y-2">
        <router-link 
          v-for="item in navigation" 
          :key="item.name" 
          :to="item.href"
          class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 group"
          :class="currentRoute === item.href 
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]' 
            : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground hover:translate-x-1'"
        >
          <component :is="item.icon" class="h-4 w-4 transition-transform group-hover:scale-110" />
          {{ item.name }}
        </router-link>
      </nav>

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
        <div class="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-accent/30 transition-colors cursor-pointer group">
          <div class="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
            <User class="h-4.5 w-4.5" />
          </div>
          <div class="flex-1 overflow-hidden">
            <p class="text-sm font-semibold truncate">{{ auth.user?.name || 'User' }}</p>
            <p class="text-[11px] text-muted-foreground truncate">{{ auth.user?.email }}</p>
          </div>
          <button @click="auth.logout" class="text-muted-foreground hover:text-destructive transition-all">
            <LogOut class="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Mobile Header (Visible on small screens) -->
    <!-- TODO: Add mobile menu toggle -->

    <!-- Main Content -->
    <main class="flex-1 overflow-auto">
      <div class="h-full p-8">
        <router-view />
      </div>
    </main>
  </div>
</template>
