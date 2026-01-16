<script setup>
import { ref, computed, onMounted } from 'vue'
import { useContactStore } from '@/stores/contacts'
import { Plus, Search, User, Mail, Phone, Linkedin, Building2, Calendar, Trash2, Edit2 } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import Dialog from '@/components/ui/Dialog.vue'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'

const contactStore = useContactStore()

onMounted(() => {
  contactStore.fetchContacts()
})

const searchQuery = ref('')
const isDialogOpen = ref(false)
const isEditing = ref(false)
const currentId = ref(null)

const form = ref({
  linkedin_url: '',
  notes: '',
  follow_up_date: null
})

const filteredContacts = computed(() => {
  return contactStore.contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    c.company.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

function openAddModal() {
  isEditing.value = false
  currentId.value = null
  form.value = { 
    name: '', 
    company: '', 
    role: '', 
    email: '', 
    phone: '', 
    linkedin_url: '', 
    notes: '',
    follow_up_date: null
  }
  isDialogOpen.value = true
}

function openEditModal(contact) {
  isEditing.value = true
  currentId.value = contact.id
  form.value = { 
    ...contact,
    follow_up_date: contact.follow_up_date ? new Date(contact.follow_up_date).toISOString().split('T')[0] : null
  }
  isDialogOpen.value = true
}

async function saveContact() {
  if (isEditing.value) {
    await contactStore.updateContact(currentId.value, form.value)
  } else {
    await contactStore.addContact(form.value)
  }
  isDialogOpen.value = false
}

async function deleteContact(id) {
  if (confirm('Are you sure you want to delete this contact?')) {
    await contactStore.deleteContact(id)
  }
}

function formatDate(date) {
  if (!date) return 'Never'
  return new Date(date).toLocaleDateString()
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">Recruiter CRM</h2>
        <p class="text-muted-foreground">Manage your professional network and recruiter contacts.</p>
      </div>
      <Button @click="openAddModal">
        <Plus class="mr-2 h-4 w-4" /> Add Contact
      </Button>
    </div>

    <div class="flex items-center gap-4">
      <div class="relative w-full max-w-sm">
        <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input type="search" placeholder="Search contacts..." class="pl-8" v-model="searchQuery" />
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card v-for="contact in filteredContacts" :key="contact.id" class="relative group overflow-hidden">
        <CardContent class="p-6">
          <div class="flex justify-between items-start mb-4">
            <div class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
              {{ contact.name.charAt(0) }}
            </div>
            <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground hover:text-primary" @click="openEditModal(contact)">
                <Edit2 class="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground hover:text-destructive" @click="deleteContact(contact.id)">
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div class="space-y-1 mb-4">
            <h3 class="font-semibold text-lg">{{ contact.name }}</h3>
            <p class="text-sm text-primary font-medium">{{ contact.role }} @ {{ contact.company }}</p>
          </div>

          <div class="space-y-2 text-sm text-muted-foreground">
            <div v-if="contact.email" class="flex items-center gap-2">
              <Mail class="h-3.5 w-3.5" />
              <a :href="'mailto:' + contact.email" class="hover:underline">{{ contact.email }}</a>
            </div>
            <div v-if="contact.phone" class="flex items-center gap-2">
              <Phone class="h-3.5 w-3.5" />
              <span>{{ contact.phone }}</span>
            </div>
            <div v-if="contact.linkedin_url" class="flex items-center gap-2">
              <Linkedin class="h-3.5 w-3.5" />
              <a :href="contact.linkedin_url" target="_blank" class="hover:underline text-blue-500">LinkedIn Profile</a>
            </div>
          </div>

          <div class="mt-4 pt-4 border-t flex flex-col gap-2 text-[10px] text-muted-foreground uppercase tracking-wider">
            <div class="flex justify-between">
              <span>Last Contact: {{ formatDate(contact.last_contact_date) }}</span>
            </div>
            <div v-if="contact.follow_up_date" class="flex items-center gap-1.5 text-orange-500 font-bold">
              <Calendar class="h-3 w-3" />
              <span>Next Follow-up: {{ formatDate(contact.follow_up_date) }}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div v-if="filteredContacts.length === 0" class="col-span-full text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
         No contacts found. Start building your network!
      </div>
    </div>

    <!-- Add/Edit Dialog -->
    <Dialog v-model:open="isDialogOpen" :title="isEditing ? 'Edit Contact' : 'Add New Contact'">
       <form @submit.prevent="saveContact" class="space-y-4 mt-4">
          <div class="grid grid-cols-2 gap-4">
             <div class="space-y-2">
                <Label for="name">Full Name</Label>
                <Input id="name" v-model="form.name" required placeholder="John Doe" />
             </div>
             <div class="space-y-2">
                <Label for="role">Role</Label>
                <Input id="role" v-model="form.role" placeholder="IT Recruiter" />
             </div>
          </div>
          
          <div class="space-y-2">
             <Label for="company">Company</Label>
             <Input id="company" v-model="form.company" placeholder="TechCorp" />
          </div>

          <div class="grid grid-cols-2 gap-4">
             <div class="space-y-2">
                <Label for="email">Email</Label>
                <Input id="email" type="email" v-model="form.email" placeholder="john@company.com" />
             </div>
             <div class="space-y-2">
                <Label for="phone">Phone</Label>
                <Input id="phone" v-model="form.phone" placeholder="+33 6..." />
             </div>
          </div>

          <div class="space-y-2">
             <Label for="linkedin">LinkedIn URL</Label>
             <Input id="linkedin" v-model="form.linkedin_url" placeholder="https://linkedin.com/in/..." />
          </div>

          <div class="space-y-2">
             <Label for="follow_up_date">Follow-up Reminder Date</Label>
             <Input id="follow_up_date" type="date" v-model="form.follow_up_date" />
          </div>

          <div class="space-y-2">
             <Label for="notes">Notes</Label>
             <textarea id="notes" v-model="form.notes" class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" placeholder="How you met, specific interests..."></textarea>
          </div>
          
          <div class="flex justify-end gap-2 pt-4">
             <Button type="button" variant="ghost" @click="isDialogOpen = false">Cancel</Button>
             <Button type="submit">{{ isEditing ? 'Update' : 'Add Contact' }}</Button>
          </div>
       </form>
    </Dialog>
  </div>
</template>
