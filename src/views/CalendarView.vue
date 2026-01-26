<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTransition } from '@vueuse/core'
import { useInterviewStore } from '@/stores/interviews'
import { useContactStore } from '@/stores/contacts'
import { useI18n } from 'vue-i18n'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Video, 
  Phone, 
  MapPin, 
  User,
  Clock
} from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'

const { t } = useI18n()
const interviewStore = useInterviewStore()
const contactStore = useContactStore()

const currentDate = ref(new Date())

onMounted(() => {
    interviewStore.fetchInterviews()
    contactStore.fetchContacts()
})

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const currentMonthName = computed(() => {
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentDate.value)
})

const calendarGrid = computed(() => {
    const year = currentDate.value.getFullYear()
    const month = currentDate.value.getMonth()
    
    // First day of the month
    const firstDay = new Date(year, month, 1)
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0)
    
    const daysInMonth = lastDay.getDate()
    const startingDayIndex = (firstDay.getDay() + 6) % 7 // Adjust so Monday is 0
    
    const grid = []
    
    // Previous month filler
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startingDayIndex - 1; i >= 0; i--) {
        grid.push({
            day: prevMonthLastDay - i,
            isCurrentMonth: false,
            date: new Date(year, month - 1, prevMonthLastDay - i),
            events: []
        })
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i)
        grid.push({
            day: i,
            isCurrentMonth: true,
            isToday: isSameDay(date, new Date()),
            date: date,
            events: getEventsForDate(date)
        })
    }
    
    // Next month filler
    const remainingCells = 42 - grid.length // 6 rows * 7 cols
    for (let i = 1; i <= remainingCells; i++) {
        grid.push({
            day: i,
            isCurrentMonth: false,
            date: new Date(year, month + 1, i),
            events: []
        })
    }
    
    return grid
})

function getEventsForDate(date) {
    const events = []
    
    // Interviews
    interviewStore.interviews.forEach(interview => {
        if (isSameDay(new Date(interview.interview_date), date)) {
            events.push({
                type: 'interview',
                title: `${interview.type} Interview`,
                subtitle: interview.company,
                time: new Date(interview.interview_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                data: interview
            })
        }
    })
    
    // Follow-ups
    contactStore.contacts.forEach(contact => {
        if (contact.follow_up_date && isSameDay(new Date(contact.follow_up_date), date)) {
            events.push({
                type: 'followup',
                title: 'Follow-up',
                subtitle: contact.name,
                data: contact
            })
        }
    })
    
    return events
}

function isSameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate()
}

function prevMonth() {
    currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

function nextMonth() {
    currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}

function goToToday() {
    currentDate.value = new Date()
}
</script>

<template>
  <div class="space-y-6 h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">Calendar</h2>
        <p class="text-muted-foreground">Manage your schedule and follow-ups.</p>
      </div>
      <div class="flex items-center gap-4">
         <Button variant="outline" size="sm" @click="goToToday">Today</Button>
         <div class="flex items-center bg-muted/50 rounded-lg p-1">
             <Button variant="ghost" size="icon" @click="prevMonth">
                 <ChevronLeft class="h-4 w-4" />
             </Button>
             <span class="w-40 text-center font-medium">{{ currentMonthName }}</span>
             <Button variant="ghost" size="icon" @click="nextMonth">
                 <ChevronRight class="h-4 w-4" />
             </Button>
         </div>
      </div>
    </div>

    <!-- Calendar Grid -->
    <div class="flex-1 bg-card border rounded-xl shadow-sm flex flex-col overflow-hidden">
        <!-- Weekday Headers -->
        <div class="grid grid-cols-7 border-b bg-muted/20">
            <div v-for="day in daysOfWeek" :key="day" class="py-3 text-center text-sm font-semibold text-muted-foreground">
                {{ day }}
            </div>
        </div>
        
        <!-- Days -->
        <div :key="currentMonthName" class="grid grid-cols-7 flex-1 auto-rows-fr animate-fade-in">
            <div 
                v-for="(cell, idx) in calendarGrid" 
                :key="idx" 
                class="min-h-[100px] border-b border-r p-2 transition-all duration-200 relative group hover:bg-muted/5 hover:shadow-inner"
                :class="[
                    !cell.isCurrentMonth ? 'bg-muted/10 text-muted-foreground' : 'bg-background',
                    cell.isToday ? 'bg-primary/5' : ''
                ]"
                :style="{ animationDelay: `${idx * 5}ms` }"
            >
                <div class="flex justify-between items-start mb-2">
                    <span 
                        class="text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full transition-transform group-hover:scale-110"
                        :class="cell.isToday ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground'"
                    >
                        {{ cell.day }}
                    </span>
                </div>
                
                <div class="space-y-1.5 overflow-y-auto max-h-[80px] custom-scrollbar">
                    <div 
                        v-for="(event, eIdx) in cell.events" 
                        :key="eIdx" 
                        class="text-xs p-1.5 rounded-md border shadow-sm cursor-pointer transition-all hover:scale-105 hover:shadow-md animate-scale-in"
                        :class="[
                            event.type === 'interview' 
                                ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300' 
                                : 'bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300'
                        ]"
                        :style="{ animationDelay: `${idx * 5 + eIdx * 50}ms` }"
                    >
                        <div class="flex items-center gap-1 font-semibold mb-0.5">
                            <Video v-if="event.type === 'interview' && event.data.type === 'Video'" class="h-3 w-3" />
                            <Phone v-else-if="event.type === 'interview' && event.data.type === 'Phone'" class="h-3 w-3" />
                            <MapPin v-else-if="event.type === 'interview'" class="h-3 w-3" />
                            <User v-else class="h-3 w-3" />
                            
                            <span v-if="event.time">{{ event.time }}</span>
                        </div>
                        <div class="font-medium truncate">{{ event.subtitle }}</div>
                        <div class="truncate opacity-75">{{ event.title }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 2px;
}
</style>
