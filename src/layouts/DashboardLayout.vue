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
  Sun,
  Moon
} from 'lucide-vue-next'

const route = useRoute()
const auth = useAuthStore()

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Board', href: '/kanban', icon: Briefcase },
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
    <aside class="w-64 border-r bg-card hidden md:flex flex-col">
      <div class="p-6">
        <h1 class="text-2xl font-bold tracking-tight text-primary">JobTracker</h1>
      </div>
      
      <nav class="flex-1 px-4 space-y-2">
        <router-link 
          v-for="item in navigation" 
          :key="item.name" 
          :to="item.href"
          class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors"
          :class="currentRoute === item.href ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'"
        >
          <component :is="item.icon" class="h-4 w-4" />
          {{ item.name }}
        </router-link>
      </nav>

      <div class="px-4 py-2">
        <div class="flex items-center justify-between p-2 rounded-lg bg-muted/50">
           <Sun class="h-4 w-4 text-muted-foreground" :class="{ 'text-primary': theme === 'light' }" />
           <button 
             @click="toggleTheme" 
             class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
             :class="theme === 'dark' ? 'bg-primary' : 'bg-input'"
           >
             <span
               class="pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform"
               :class="theme === 'dark' ? 'translate-x-4' : 'translate-x-1'"
             />
           </button>
           <Moon class="h-4 w-4 text-muted-foreground" :class="{ 'text-primary': theme === 'dark' }" />
        </div>
      </div>

      <div class="p-4 border-t">
        <div class="flex items-center gap-3 px-3 py-2">
          <div class="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <User class="h-4 w-4" />
          </div>
          <div class="flex-1 overflow-hidden">
            <p class="text-sm font-medium truncate">{{ auth.user?.name || 'User' }}</p>
            <p class="text-xs text-muted-foreground truncate">{{ auth.user?.email }}</p>
          </div>
          <button @click="auth.logout" class="text-muted-foreground hover:text-destructive transition-colors">
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
