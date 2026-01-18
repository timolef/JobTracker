<script setup>
import { ref, onMounted } from 'vue';
import { API_BASE_URL } from '@/config';
import { useInterviewStore } from '@/stores/interviews';
import Button from '@/components/ui/Button.vue';
import Dialog from '@/components/ui/Dialog.vue';
import Badge from '@/components/ui/Badge.vue';
import Label from '@/components/ui/Label.vue';
import Input from '@/components/ui/Input.vue';
import { Calendar, Download, Loader2, CheckCircle2, AlertCircle, ExternalLink, X } from 'lucide-vue-next';

const emit = defineEmits(['imported']);

const interviewStore = useInterviewStore();

const isConnected = ref(false);
const isLoading = ref(false);
const isImportDialogOpen = ref(false);
const events = ref([]);
const selectedEvents = ref([]);
const importedCount = ref(0);

// Event mapping forms
const eventMappings = ref({});

onMounted(async () => {
    await checkConnectionStatus();
    
    // Check for OAuth callback success
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('google_connected') === 'true') {
        isConnected.value = true;
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
        // Auto-fetch events
        await fetchCalendarEvents();
    }
});

async function checkConnectionStatus() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/calendar/status`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            isConnected.value = data.connected;
        }
    } catch (error) {
        console.error('Error checking calendar status:', error);
    }
}

async function connectGoogleCalendar() {
    try {
        isLoading.value = true;
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/api/calendar/auth-url`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            // Redirect to Google OAuth
            window.location.href = data.authUrl;
        } else {
            alert('Failed to connect to Google Calendar');
        }
    } catch (error) {
        console.error('Error connecting calendar:', error);
        alert('Failed to connect to Google Calendar');
    } finally {
        isLoading.value = false;
    }
}

async function fetchCalendarEvents() {
    try {
        isLoading.value = true;
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/api/calendar/import`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            events.value = data.events;
            
            // Initialize mappings for each event
            events.value.forEach(event => {
                eventMappings.value[event.googleEventId] = {
                    company: event.suggestedCompany || '',
                    position: event.suggestedPosition || event.summary,
                    type: event.suggestedType || 'Video',
                    notes: event.description || ''
                };
            });
            
            if (events.value.length > 0) {
                isImportDialogOpen.value = true;
            } else {
                alert('No potential interview events found in your calendar for the next 60 days.');
            }
        } else {
            const error = await response.json();
            alert(error.error || 'Failed to fetch calendar events');
        }
    } catch (error) {
        console.error('Error fetching events:', error);
        alert('Failed to fetch calendar events');
    } finally {
        isLoading.value = false;
    }
}

function toggleEventSelection(eventId) {
    const index = selectedEvents.value.indexOf(eventId);
    if (index > -1) {
        selectedEvents.value.splice(index, 1);
    } else {
        selectedEvents.value.push(eventId);
    }
}

function selectAll() {
    selectedEvents.value = events.value.map(e => e.googleEventId);
}

function deselectAll() {
    selectedEvents.value = [];
}

async function importSelectedEvents() {
    if (selectedEvents.value.length === 0) {
        alert('Please select at least one event to import');
        return;
    }
    
    try {
        isLoading.value = true;
        importedCount.value = 0;
        
        for (const eventId of selectedEvents.value) {
            const event = events.value.find(e => e.googleEventId === eventId);
            const mapping = eventMappings.value[eventId];
            
            if (event && mapping) {
                await interviewStore.addInterview({
                    company: mapping.company,
                    position: mapping.position,
                    interview_date: event.startTime,
                    type: mapping.type,
                    notes: mapping.notes,
                    research: '',
                    questions: ''
                });
                
                importedCount.value++;
            }
        }
        
        isImportDialogOpen.value = false;
        emit('imported', importedCount.value);
        
        // Reset
        selectedEvents.value = [];
        events.value = [];
        
    } catch (error) {
        console.error('Error importing events:', error);
        alert('Failed to import some events');
    } finally {
        isLoading.value = false;
    }
}

async function disconnectCalendar() {
    if (!confirm('Disconnect Google Calendar? You can reconnect anytime.')) return;
    
    try {
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE_URL}/api/calendar/disconnect`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        isConnected.value = false;
    } catch (error) {
        console.error('Error disconnecting:', error);
    }
}

function formatEventDate(dateString) {
    return new Date(dateString).toLocaleString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}
</script>

<template>
    <div class="space-y-4">
        <!-- Connection Status -->
        <div v-if="!isConnected" class="flex items-center justify-between p-4 rounded-xl border border-dashed bg-muted/30">
            <div class="flex items-center gap-3">
                <Calendar class="h-5 w-5 text-primary" />
                <div>
                    <p class="font-medium">Import from Google Calendar</p>
                    <p class="text-xs text-muted-foreground">Automatically import your interview events</p>
                </div>
            </div>
            <Button @click="connectGoogleCalendar" :disabled="isLoading">
                <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
                <ExternalLink v-else class="mr-2 h-4 w-4" />
                Connect Google
            </Button>
        </div>

        <!-- Connected State -->
        <div v-else class="flex items-center justify-between p-4 rounded-xl border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <div class="flex items-center gap-3">
                <CheckCircle2 class="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                    <p class="font-medium text-green-900 dark:text-green-100">Google Calendar Connected</p>
                    <p class="text-xs text-green-700 dark:text-green-300">Ready to import events</p>
                </div>
            </div>
            <div class="flex gap-2">
                <Button @click="fetchCalendarEvents" :disabled="isLoading" size="sm">
                    <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
                    <Download v-else class="mr-2 h-4 w-4" />
                    Import Events
                </Button>
                <Button @click="disconnectCalendar" variant="ghost" size="sm">
                    Disconnect
                </Button>
            </div>
        </div>

        <!-- Import Dialog -->
        <Dialog v-model:open="isImportDialogOpen" title="Import Calendar Events">
            <div class="space-y-4 mt-4">
                <div class="flex items-center justify-between">
                    <p class="text-sm text-muted-foreground">
                        Found {{ events.length }} potential interview{{ events.length !== 1 ? 's' : '' }}
                    </p>
                    <div class="flex gap-2">
                        <Button variant="outline" size="sm" @click="selectAll">Select All</Button>
                        <Button variant="outline" size="sm" @click="deselectAll">Deselect All</Button>
                    </div>
                </div>

                <div class="max-h-[60vh] overflow-y-auto space-y-3">
                    <div 
                        v-for="event in events" 
                        :key="event.googleEventId"
                        class="p-4 rounded-lg border transition-all"
                        :class="selectedEvents.includes(event.googleEventId) ? 'border-primary bg-primary/5' : 'border-border'"
                    >
                        <div class="flex items-start gap-3">
                            <input 
                                type="checkbox" 
                                :checked="selectedEvents.includes(event.googleEventId)"
                                @change="toggleEventSelection(event.googleEventId)"
                                class="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <div class="flex-1 space-y-3">
                                <div>
                                    <p class="font-medium">{{ event.summary }}</p>
                                    <p class="text-xs text-muted-foreground">{{ formatEventDate(event.startTime) }}</p>
                                </div>

                                <!-- Mapping Fields -->
                                <div v-if="selectedEvents.includes(event.googleEventId)" class="grid grid-cols-2 gap-3 pt-2 border-t">
                                    <div class="space-y-1">
                                        <Label class="text-xs">Company</Label>
                                        <Input 
                                            v-model="eventMappings[event.googleEventId].company" 
                                            placeholder="Company name"
                                            class="h-8 text-sm"
                                        />
                                    </div>
                                    <div class="space-y-1">
                                        <Label class="text-xs">Position</Label>
                                        <Input 
                                            v-model="eventMappings[event.googleEventId].position" 
                                            placeholder="Job title"
                                            class="h-8 text-sm"
                                        />
                                    </div>
                                    <div class="space-y-1 col-span-2">
                                        <Label class="text-xs">Type</Label>
                                        <select 
                                            v-model="eventMappings[event.googleEventId].type"
                                            class="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                        >
                                            <option value="Phone">Phone</option>
                                            <option value="Video">Video</option>
                                            <option value="On-site">On-site</option>
                                            <option value="Technical">Technical</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" @click="isImportDialogOpen = false">Cancel</Button>
                    <Button @click="importSelectedEvents" :disabled="selectedEvents.length === 0 || isLoading">
                        <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
                        Import {{ selectedEvents.length }} Event{{ selectedEvents.length !== 1 ? 's' : '' }}
                    </Button>
                </div>
            </div>
        </Dialog>
    </div>
</template>
