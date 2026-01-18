<script setup>
import { ref, computed, onMounted } from 'vue'
import { useContactStore } from '@/stores/contacts'
import InteractionLog from '@/components/InteractionLog.vue'
import { Plus, Search, User, Mail, Phone, Linkedin, Building2, Calendar, Trash2, Edit2, Clock, CheckCircle2, History } from 'lucide-vue-next'
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
const isViewDialogOpen = ref(false)
const selectedContact = ref(null)
const isEditing = ref(false)
const currentId = ref(null)
const activeTab = ref('all') // 'all' or 'reminders'

const form = ref({
  linkedin_url: '',
  notes: '',
  follow_up_date: null,
  follow_up_frequency: 30,
  relationship_strength: 'Medium'
})

const filteredContacts = computed(() => {
  let contacts = contactStore.contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    c.company.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
  
  if (activeTab.value === 'reminders') {
    const today = new Date()
    contacts = contacts.filter(c => {
       if (!c.follow_up_date) return false
       return new Date(c.follow_up_date) <= today
    })
  }
  
  return contacts
})

const remindersCount = computed(() => {
    const today = new Date()
    return contactStore.contacts.filter(c => c.follow_up_date && new Date(c.follow_up_date) <= today).length
})

function openAddModal() {
  isEditing.value = false
  currentId.value = null
  selectedContact.value = null
  form.value = { 
    name: '', 
    company: '', 
    role: '', 
    email: '', 
    phone: '', 
    linkedin_url: '', 
    notes: '',
    follow_up_date: null,
    follow_up_frequency: 30,
    relationship_strength: 'Medium'
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

function openViewModal(contact) {
    selectedContact.value = contact
    isViewDialogOpen.value = true
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
    if (selectedContact.value?.id === id) {
        isViewDialogOpen.value = false
        selectedContact.value = null
    }
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
      
      <div class="flex gap-2 p-1 bg-muted/20 rounded-lg">
         <button 
            @click="activeTab = 'all'" 
            :class="['px-3 py-1.5 text-sm font-medium rounded-md transition-all', activeTab === 'all' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground']">
            All Contacts
         </button>
         <button 
            @click="activeTab = 'reminders'" 
            :class="['px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2', activeTab === 'reminders' ? 'bg-background shadow-sm text-orange-500' : 'text-muted-foreground hover:text-foreground']">
            <span>Needs Follow-up</span>
            <span v-if="remindersCount > 0" class="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] text-white">{{ remindersCount }}</span>
         </button>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card 
        v-for="contact in filteredContacts" 
        :key="contact.id" 
        class="relative group overflow-hidden cursor-pointer hover:border-primary/50 transition-all active:scale-[0.98]"
        @click="openViewModal(contact)"
      >
        <CardContent class="p-6">
          <div class="flex justify-between items-start mb-4">
            <div class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
              {{ contact.name.charAt(0) }}
            </div>
            <div class="flex gap-2">
               <!-- Strength Badge -->
               <div v-if="contact.relationship_strength" :class="[
                  'px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider',
                  contact.relationship_strength === 'Strong' ? 'bg-green-500/10 text-green-500' :
                  contact.relationship_strength === 'Medium' ? 'bg-blue-500/10 text-blue-500' :
                  'bg-gray-500/10 text-gray-500'
               ]">
                  {{ contact.relationship_strength }}
               </div>
            </div>
          </div>

          <div class="space-y-1 mb-4">
            <h3 class="font-semibold text-lg">{{ contact.name }}</h3>
            <p class="text-sm text-primary font-medium">{{ contact.role }} @ {{ contact.company }}</p>
          </div>

          <div class="space-y-2 text-sm text-muted-foreground">
             <!-- Only show primary contact info on card to avoid clutter -->
            <div v-if="contact.email" class="flex items-center gap-2">
              <Mail class="h-3.5 w-3.5" />
              <span class="truncate">{{ contact.email }}</span>
            </div>
             <div v-if="contact.linkedin_url" class="flex items-center gap-2">
              <Linkedin class="h-3.5 w-3.5" />
              <span class="text-blue-500">LinkedIn Connected</span>
            </div>
          </div>

          <div class="mt-4 pt-4 border-t flex flex-col gap-2 text-[10px] text-muted-foreground uppercase tracking-wider">
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-1">
                 <History class="h-3 w-3" />
                 <span>Last: {{ formatDate(contact.last_contact_date) }}</span>
              </div>
            </div>
            <div v-if="contact.follow_up_date" :class="['flex items-center gap-1.5 font-bold', new Date(contact.follow_up_date) <= new Date() ? 'text-orange-500' : 'text-muted-foreground']">
              <Calendar class="h-3 w-3" />
              <span>Next: {{ formatDate(contact.follow_up_date) }}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div v-if="filteredContacts.length === 0" class="col-span-full text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed flex flex-col items-center gap-2">
         <Users class="h-8 w-8 opacity-50" />
         <p v-if="activeTab === 'reminders'">Great job! You're all caught up with your network.</p>
         <p v-else>No contacts found. Start building your network!</p>
      </div>
    </div>

    <!-- View Details Dialog -->
    <Dialog v-model:open="isViewDialogOpen" title="Contact Details" class="max-w-2xl">
       <div v-if="selectedContact" class="space-y-6">
          <!-- Header -->
          <div class="flex items-start justify-between">
             <div class="flex gap-4">
                <div class="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                   {{ selectedContact.name.charAt(0) }}
                </div>
                <div>
                   <h2 class="text-2xl font-bold">{{ selectedContact.name }}</h2>
                   <p class="text-lg text-primary">{{ selectedContact.role }} @ {{ selectedContact.company }}</p>
                   <div class="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" @click="openEditModal(selectedContact)">
                         <Edit2 class="h-3 w-3 mr-2" /> Edit Output
                      </Button>
                      <Button variant="outline" size="sm" class="text-destructive hover:text-destructive" @click="deleteContact(selectedContact.id)">
                         <Trash2 class="h-3 w-3 mr-2" /> Delete
                      </Button>
                   </div>
                </div>
             </div>
             <div class="text-right space-y-1">
                 <div class="text-sm text-muted-foreground">Relationship Strength</div>
                 <div :class="['inline-block px-2 py-1 rounded text-xs font-bold uppercase', 
                    selectedContact.relationship_strength === 'Strong' ? 'bg-green-100 text-green-700' :
                    selectedContact.relationship_strength === 'Medium' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700']">
                    {{ selectedContact.relationship_strength || 'Medium' }}
                 </div>
             </div>
          </div>

          <!-- Contact Info Grid -->
          <div class="grid grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg border border-border/50">
             <div v-if="selectedContact.email" class="flex items-center gap-2 text-sm">
                <Mail class="h-4 w-4 text-muted-foreground" />
                <a :href="'mailto:' + selectedContact.email" class="hover:underline">{{ selectedContact.email }}</a>
             </div>
             <div v-if="selectedContact.phone" class="flex items-center gap-2 text-sm">
                <Phone class="h-4 w-4 text-muted-foreground" />
                <span>{{ selectedContact.phone }}</span>
             </div>
             <div v-if="selectedContact.linkedin_url" class="flex items-center gap-2 text-sm col-span-2">
                <Linkedin class="h-4 w-4 text-muted-foreground" />
                <a :href="selectedContact.linkedin_url" target="_blank" class="text-blue-500 hover:underline">{{ selectedContact.linkedin_url }}</a>
             </div>
          </div>

          <!-- Follow-up Plan -->
          <div class="flex items-center gap-6 p-4 border rounded-lg">
             <div>
                <Label class="text-xs text-muted-foreground uppercase">Follow-up Frequency</Label>
                <div class="flex items-center gap-2 font-medium">
                   <Clock class="h-4 w-4" />
                   Every {{ selectedContact.follow_up_frequency || 30 }} days
                </div>
             </div>
             <div>
                <Label class="text-xs text-muted-foreground uppercase">Next Due</Label>
                <div :class="['flex items-center gap-2 font-medium', selectedContact.follow_up_date && new Date(selectedContact.follow_up_date) <= new Date() ? 'text-orange-500' : '']">
                   <Calendar class="h-4 w-4" />
                   {{ formatDate(selectedContact.follow_up_date) }}
                </div>
             </div>
          </div>

          <!-- Interaction Log Compoenent -->
          <InteractionLog :contact-id="selectedContact.id" />
       </div>
    </Dialog>

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

          <div class="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded-lg">
             <div class="space-y-2">
                <Label for="frequency">Frequency (Days)</Label>
                <Input id="frequency" type="number" v-model="form.follow_up_frequency" min="1" />
             </div>
             <div class="space-y-2">
                <Label for="strength">Relationship Strength</Label>
                <select id="strength" v-model="form.relationship_strength" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                   <option value="Weak">Weak</option>
                   <option value="Medium">Medium</option>
                   <option value="Strong">Strong</option>
                </select>
             </div>
             <div class="space-y-2 col-span-2">
                <Label for="follow_up_date">Next Follow-up Date</Label>
                <Input id="follow_up_date" type="date" v-model="form.follow_up_date" />
             </div>
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
