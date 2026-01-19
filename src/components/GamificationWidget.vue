<script setup>
import { computed } from 'vue'
import { useApplicationStore } from '@/stores/applications'
import { Flame, Trophy, Lock } from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'

const appStore = useApplicationStore()

const streak = computed(() => appStore.stats.streak)
const badges = computed(() => appStore.stats.badges)

const nextBadge = computed(() => {
    return badges.value.find(b => !b.unlocked)
})

const progressToNext = computed(() => {
    // Simple mock progress for now as badges have varied criteria
    if (!nextBadge.value) return 100
    return 0 
})
</script>

<template>
  <Card class="glass border-none overflow-hidden relative">
    <!-- Decorative Background -->
    <div class="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
       <Trophy class="h-32 w-32" />
    </div>

    <CardHeader class="pb-2">
       <CardTitle class="flex items-center justify-between text-lg font-semibold">
          <div class="flex items-center gap-2">
             <Trophy class="h-5 w-5 text-yellow-500" />
             <span>Achievements</span>
          </div>
          <div v-if="streak > 0" class="flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 text-orange-500 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse">
             <Flame class="h-4 w-4 fill-orange-500" />
             <span>{{ streak }} Day Streak</span>
          </div>
       </CardTitle>
    </CardHeader>
    
    <CardContent>
       <div class="grid grid-cols-3 sm:grid-cols-6 gap-4">
          <div 
             v-for="badge in badges" 
             :key="badge.id" 
             class="group relative flex flex-col items-center gap-2 p-2 rounded-xl transition-all duration-300"
             :class="badge.unlocked ? 'bg-primary/5 hover:bg-primary/10' : 'opacity-40 grayscale'"
             :title="badge.description"
          >
             <div class="relative">
                <div class="text-2xl filter drop-shadow-lg transition-transform group-hover:scale-110 duration-300">
                   {{ badge.icon }}
                </div>
                <div v-if="!badge.unlocked" class="absolute -bottom-1 -right-1 bg-muted rounded-full p-0.5">
                   <Lock class="h-3 w-3 text-muted-foreground" />
                </div>
             </div>
             <span class="text-[10px] font-medium text-center leading-tight">{{ badge.title }}</span>
             
             <!-- Tooltip (Custom) -->
             <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border border-border">
                {{ badge.description }}
             </div>
          </div>
       </div>

       <div v-if="nextBadge" class="mt-4 pt-4 border-t border-border/50 text-center">
          <p class="text-xs text-muted-foreground">
             Next Goal: <span class="font-bold text-foreground">{{ nextBadge.title }}</span> — {{ nextBadge.description }}
          </p>
       </div>
    </CardContent>
  </Card>
</template>
