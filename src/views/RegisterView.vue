<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardDescription from '@/components/ui/CardDescription.vue'
import CardContent from '@/components/ui/CardContent.vue'
import CardFooter from '@/components/ui/CardFooter.vue'
import { UserPlus, Sun, Moon } from 'lucide-vue-next'
import { useUIStore } from '@/stores/ui'

const ui = useUIStore()

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)

async function handleRegister() {
  if (password.value !== confirmPassword.value) {
    alert("Passwords don't match")
    return
  }

  isLoading.value = true
  
  try {
    await auth.register(email.value, password.value)
    router.push('/dashboard')
  } catch (error) {
    alert(error.message)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-muted/50 p-4 relative">
    <!-- Theme Toggle -->
    <Button 
      variant="ghost" 
      size="icon" 
      @click="ui.toggleTheme" 
      class="absolute top-4 right-4 rounded-full"
    >
      <Sun v-if="ui.theme === 'light'" class="h-5 w-5" />
      <Moon v-else class="h-5 w-5" />
    </Button>
    <Card class="w-full max-w-md shadow-lg border-opacity-50">
      <CardHeader class="space-y-1">
        <CardTitle class="text-2xl font-bold tracking-tight text-center">Create an account</CardTitle>
        <CardDescription class="text-center">
          Enter your email below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleRegister" class="space-y-4">
          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" v-model="email" required />
          </div>
          <div class="space-y-2">
            <Label for="password">Password</Label>
            <Input id="password" type="password" v-model="password" required />
          </div>
          <div class="space-y-2">
            <Label for="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" type="password" v-model="confirmPassword" required />
          </div>
          <Button type="submit" class="w-full" :disabled="isLoading">
            <UserPlus v-if="!isLoading" class="mr-2 h-4 w-4" />
            <span v-else class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {{ isLoading ? 'Creating account...' : 'Create account' }}
          </Button>
        </form>
      </CardContent>
      <CardFooter class="flex justify-center">
        <p class="text-xs text-muted-foreground">
          Already have an account? 
          <router-link to="/login" class="underline underline-offset-4 hover:text-primary">
            Sign in
          </router-link>
        </p>
      </CardFooter>
    </Card>
  </div>
</template>
