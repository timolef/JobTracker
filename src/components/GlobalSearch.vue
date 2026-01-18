<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useApplicationStore } from '@/stores/applications'
import { useContactStore } from '@/stores/contacts'
import { useInterviewStore } from '@/stores/interviews'
import { Search, X, Briefcase, User, Calendar, FileText } from 'lucide-vue-next'

const router = useRouter()
const appStore = useApplicationStore()
const contactStore = useContactStore()
const interviewStore = useInterviewStore()

const isOpen = ref(false)
const searchQuery = ref('')
const selectedIndex = ref(0)

// Search results
const results = computed(() => {
    if (!searchQuery.value || searchQuery.value.length < 2) return []
    
    const query = searchQuery.value.toLowerCase()
    const allResults = []
    
    // Search applications
    const apps = appStore.applications
        .filter(app => 
            app.company.toLowerCase().includes(query) ||
            app.position.toLowerCase().includes(query) ||
            (app.location && app.location.toLowerCase().includes(query))
        )
        .slice(0, 5)
        .map(app => ({
            type: 'application',
            icon: Briefcase,
            title: `${app.position} @ ${app.company}`,
            subtitle: app.status,
            id: app.id,
            route: '/applications'
        }))
    
    // Search contacts
    const contacts = contactStore.contacts
        .filter(contact =>
            contact.name.toLowerCase().includes(query) ||
            (contact.company && contact.company.toLowerCase().includes(query)) ||
            (contact.position && contact.position.toLowerCase().includes(query))
        )
        .slice(0, 5)
        .map(contact => ({
            type: 'contact',
            icon: User,
            title: contact.name,
            subtitle: contact.company ? `${contact.position} @ ${contact.company}` : contact.position,
            id: contact.id,
            route: '/contacts'
        }))
    
    // Search interviews
    const interviews = interviewStore.interviews
        .filter(interview =>
            interview.company.toLowerCase().includes(query) ||
            interview.position.toLowerCase().includes(query)
        )
        .slice(0, 5)
        .map(interview => ({
            type: 'interview',
            icon: Calendar,
            title: `${interview.position} @ ${interview.company}`,
            subtitle: new Date(interview.interview_date).toLocaleDateString('fr-FR'),
            id: interview.id,
            route: '/interviews'
        }))
    
    if (apps.length) allResults.push({ category: 'Applications', items: apps })
    if (contacts.length) allResults.push({ category: 'Contacts', items: contacts })
    if (interviews.length) allResults.push({ category: 'Interviews', items: interviews })
    
    return allResults
})

const flatResults = computed(() => {
    return results.value.flatMap(group => group.items)
})

// Keyboard shortcuts
function handleKeyDown(e) {
    // Ctrl+K or Cmd+K to open
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        isOpen.value = !isOpen.value
        if (isOpen.value) {
            setTimeout(() => {
                document.getElementById('global-search-input')?.focus()
            }, 100)
        }
    }
    
    // Escape to close
    if (e.key === 'Escape' && isOpen.value) {
        close()
    }
    
    // Arrow navigation
    if (isOpen.value && flatResults.value.length > 0) {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            selectedIndex.value = Math.min(selectedIndex.value + 1, flatResults.value.length - 1)
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
        } else if (e.key === 'Enter') {
            e.preventDefault()
            selectResult(flatResults.value[selectedIndex.value])
        }
    }
}

function selectResult(result) {
    if (!result) return
    router.push(result.route)
    close()
}

function close() {
    isOpen.value = false
    searchQuery.value = ''
    selectedIndex.value = 0
}

watch(searchQuery, () => {
    selectedIndex.value = 0
})

onMounted(() => {
    document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
    <!-- Backdrop -->
    <Teleport to="body">
        <div 
            v-if="isOpen"
            @click="close"
            class="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        >
            <!-- Search Modal -->
            <div 
                @click.stop
                class="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-2xl animate-in zoom-in-95 duration-200"
            >
                <div class="bg-background border rounded-xl shadow-2xl overflow-hidden">
                    <!-- Search Input -->
                    <div class="flex items-center border-b px-4 py-3">
                        <Search class="h-5 w-5 text-muted-foreground mr-3" />
                        <input
                            id="global-search-input"
                            v-model="searchQuery"
                            type="text"
                            placeholder="Search applications, contacts, interviews..."
                            class="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                            autocomplete="off"
                        />
                        <button 
                            @click="close"
                            class="ml-2 p-1 rounded-md hover:bg-accent transition-colors"
                        >
                            <X class="h-4 w-4 text-muted-foreground" />
                        </button>
                    </div>
                    
                    <!-- Results -->
                    <div class="max-h-[60vh] overflow-y-auto">
                        <div v-if="searchQuery.length < 2" class="p-8 text-center text-sm text-muted-foreground">
                            Type at least 2 characters to search...
                        </div>
                        
                        <div v-else-if="results.length === 0" class="p-8 text-center text-sm text-muted-foreground">
                            No results found for "{{ searchQuery }}"
                        </div>
                        
                        <div v-else class="py-2">
                            <div 
                                v-for="(group, groupIndex) in results" 
                                :key="groupIndex"
                                class="mb-2"
                            >
                                <div class="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    {{ group.category }}
                                </div>
                                <div>
                                    <button
                                        v-for="(item, itemIndex) in group.items"
                                        :key="item.id"
                                        @click="selectResult(item)"
                                        @mouseenter="selectedIndex = flatResults.indexOf(item)"
                                        class="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                                        :class="flatResults.indexOf(item) === selectedIndex ? 'bg-accent' : 'hover:bg-accent/50'"
                                    >
                                        <component 
                                            :is="item.icon" 
                                            class="h-4 w-4 shrink-0"
                                            :class="{
                                                'text-blue-600': item.type === 'application',
                                                'text-green-600': item.type === 'contact',
                                                'text-purple-600': item.type === 'interview'
                                            }"
                                        />
                                        <div class="flex-1 min-w-0">
                                            <div class="text-sm font-medium truncate">{{ item.title }}</div>
                                            <div class="text-xs text-muted-foreground truncate">{{ item.subtitle }}</div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div class="border-t px-4 py-2 flex items-center justify-between text-xs text-muted-foreground bg-muted/30">
                        <div class="flex items-center gap-4">
                            <span class="flex items-center gap-1">
                                <kbd class="px-1.5 py-0.5 rounded bg-background border text-[10px]">↑</kbd>
                                <kbd class="px-1.5 py-0.5 rounded bg-background border text-[10px]">↓</kbd>
                                Navigate
                            </span>
                            <span class="flex items-center gap-1">
                                <kbd class="px-1.5 py-0.5 rounded bg-background border text-[10px]">Enter</kbd>
                                Select
                            </span>
                            <span class="flex items-center gap-1">
                                <kbd class="px-1.5 py-0.5 rounded bg-background border text-[10px]">Esc</kbd>
                                Close
                            </span>
                        </div>
                        <span class="flex items-center gap-1">
                            <kbd class="px-1.5 py-0.5 rounded bg-background border text-[10px]">Ctrl</kbd>
                            <kbd class="px-1.5 py-0.5 rounded bg-background border text-[10px]">K</kbd>
                            to open
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>
