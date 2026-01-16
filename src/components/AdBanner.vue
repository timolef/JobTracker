<script setup>
import { Sparkles, X, ExternalLink } from 'lucide-vue-next'
import { ref } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'horizontal' // horizontal, sidebar, or card
  }
})

const ads = [
  {
    title: "Propulsez votre carrière avec le Pack Pro !",
    description: "Accédez à l'IA Génératrice de Lettres de Motivation et au Kanban illimité.",
    cta: "Passer Pro",
    image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=400&h=200"
  },
  {
    title: "Marre des candidatures perdues ?",
    description: "Utilisez notre CRM Recruteur pour ne plus jamais manquer une relance.",
    cta: "Découvrir Pro",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=400&h=200"
  },
  {
    title: "L'IA à votre service.",
    description: "Analysez vos documents avec notre moteur d'analyse ATS intelligent.",
    cta: "Essayer l'IA",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=400&h=200"
  }
]

const randomAd = ads[Math.floor(Math.random() * ads.length)]
const isVisible = ref(true)

function closeAd() {
  isVisible.value = false
}
</script>

<template>
  <div v-if="isVisible" class="relative overflow-hidden transition-all duration-500">
    <!-- Horizontal Banner -->
    <div v-if="type === 'horizontal'" 
         class="w-full bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10 border border-primary/20 rounded-2xl p-4 flex items-center justify-between gap-6 backdrop-blur-sm group">
      <div class="flex items-center gap-4 flex-1">
        <div class="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
          <Sparkles class="h-5 w-5" />
        </div>
        <div>
          <h4 class="text-sm font-bold">{{ randomAd.title }}</h4>
          <p class="text-xs text-muted-foreground">{{ randomAd.description }}</p>
        </div>
      </div>
      
      <div class="flex items-center gap-3">
        <router-link to="/pricing">
          <button class="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
            {{ randomAd.cta }}
          </button>
        </router-link>
        <button @click="closeAd" class="p-1 hover:bg-black/5 rounded-full text-muted-foreground transition-colors">
          <X class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- Sidebar/Card Style Ad -->
    <div v-else-if="type === 'sidebar'" 
         class="w-full bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <img :src="randomAd.image" class="w-full h-32 object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Ad">
      <div class="p-4 space-y-3">
        <div class="flex items-center gap-2">
          <span class="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Publicité</span>
          <router-link to="/pricing" class="ml-auto">
            <ExternalLink class="h-3 w-3 text-muted-foreground hover:text-primary transition-colors" />
          </router-link>
        </div>
        <div>
          <h4 class="text-sm font-bold leading-snug">{{ randomAd.title }}</h4>
          <p class="text-[11px] text-muted-foreground mt-1">{{ randomAd.description }}</p>
        </div>
        <router-link to="/pricing" class="block">
          <button class="w-full py-2 bg-secondary text-secondary-foreground text-xs font-bold rounded-lg hover:bg-primary hover:text-white transition-all">
            Sign Up Now
          </button>
        </router-link>
      </div>
    </div>
  </div>
</template>
