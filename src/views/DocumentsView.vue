<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDocumentsStore } from '@/stores/documents'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
import { FileText, File, Plus, Download, Trash2, Upload, PenTool, Eye, Sparkles, Loader2, Lock } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Dialog from '@/components/ui/Dialog.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import AdBanner from '@/components/AdBanner.vue'

const docStore = useDocumentsStore()
const authStore = useAuthStore()
const router = useRouter()
const isUploadOpen = ref(false)
const isEditorOpen = ref(false)
const isAIModalOpen = ref(false)
const isGenerating = ref(false)

const fileInput = ref(null)
const selectedFile = ref(null)

const letterForm = ref({
    name: '',
    content: ''
})

const aiForm = ref({
    jobTitle: '',
    company: '',
    jobDescription: ''
})

onMounted(() => {
    docStore.fetchDocuments()
})

// Upload Logic
function handleFileChange(event) {
    selectedFile.value = event.target.files[0]
}

async function handleUpload() {
    if (!selectedFile.value) return;
    await docStore.uploadDocument(selectedFile.value)
    isUploadOpen.value = false
    selectedFile.value = null
}

// Letter Logic
async function handleSaveLetter() {
    await docStore.createCoverLetter(letterForm.value.name, letterForm.value.content)
    isEditorOpen.value = false
    letterForm.value = { name: '', content: '' }
}

// AI Generation Logic
async function handleGenerateAI() {
    isGenerating.value = true
    try {
        const content = await docStore.generateAI(aiForm.value)
        letterForm.value = {
            name: `AI - LM ${aiForm.value.company || aiForm.value.jobTitle}`,
            content: content
        }
        isAIModalOpen.value = false
        isEditorOpen.value = true // Open editor with generated content
    } catch (err) {
        alert("Erreur lors de la génération. Vérifiez votre clé API OpenAI.")
    } finally {
        isGenerating.value = false
    }
}

const isRenameOpen = ref(false)
const renameId = ref(null)
const renameName = ref('')

function openRenameModal(doc) {
    renameId.value = doc.id
    renameName.value = doc.name
    isRenameOpen.value = true
}

async function handleRename() {
    if (!renameId.value || !renameName.value) return;
    await docStore.renameDocument(renameId.value, renameName.value)
    isRenameOpen.value = false
    renameId.value = null
    renameName.value = ''
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString()
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">{{ t('documents.title') }}</h2>
        <p class="text-muted-foreground mt-1">{{ t('documents.subtitle') }}</p>
      </div>
      <div class="flex flex-wrap gap-2">
         <Button 
            variant="outline" 
            class="flex-1 sm:flex-initial border-primary/50 text-primary hover:bg-primary/10 relative h-9 px-3" 
            @click="authStore.isPremium ? (isAIModalOpen = true) : router.push('/pricing')"
         >
            <Sparkles class="mr-2 h-4 w-4" /> 
            {{ t('documents.ai_gen') }}
            <Lock v-if="!authStore.isPremium" class="absolute -top-1 -right-1 h-3 w-3 text-orange-500 bg-background rounded-full p-0.5 border" />
         </Button>
         <Button variant="outline" class="flex-1 sm:flex-initial h-9 px-3" @click="isEditorOpen = true">
            <PenTool class="mr-2 h-4 w-4" /> {{ t('documents.write') }}
         </Button>
         <Button class="flex-1 sm:flex-initial h-9 px-3" @click="isUploadOpen = true">
            <Upload class="mr-2 h-4 w-4" /> {{ t('documents.upload') }}
         </Button>
      </div>
    </div>

    <!-- Ad Banner for Free Users -->
    <AdBanner v-if="!authStore.isPremium" type="horizontal" />

    <!-- Documents Grid -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card v-for="doc in docStore.documents" :key="doc.id">
            <CardContent class="p-6 flex items-start justify-between">
                <div class="flex items-center gap-3">
                    <div class="p-3 rounded-lg" :class="doc.type === 'CV' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'">
                        <File v-if="doc.type === 'CV'" class="h-6 w-6" />
                        <FileText v-else class="h-6 w-6" />
                    </div>
                    <div>
                        <h3 class="font-medium truncate max-w-[150px]" :title="doc.name">{{ doc.name }}</h3>
                        <p class="text-xs text-muted-foreground">{{ formatDate(doc.created_at) }} • {{ doc.type }}</p>
                    </div>
                </div>
                <div class="flex gap-1">
                    <Button variant="ghost" size="icon" @click="docStore.viewDocument(doc.id)">
                        <Eye class="h-4 w-4" />
                    </Button>
                     <Button variant="ghost" size="icon" @click="openRenameModal(doc)">
                        <PenTool class="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" @click="docStore.downloadDocument(doc.id, doc.name)">
                        <Download class="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" class="text-destructive hover:text-destructive" @click="docStore.deleteDocument(doc.id)">
                        <Trash2 class="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>

        <div v-if="docStore.documents.length === 0" class="col-span-full text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
            No documents yet. Upload a CV or write a cover letter!
        </div>
    </div>

    <!-- Upload Dialog -->
    <Dialog v-model:open="isUploadOpen" title="Upload Document">
        <div class="space-y-4 mt-4">
            <div class="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition cursor-pointer" @click="$refs.fileInput.click()">
                <Upload class="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p class="text-sm text-muted-foreground" v-if="!selectedFile">Click to select a file (PDF, Word...)</p>
                <p class="text-sm font-medium" v-else>{{ selectedFile.name }}</p>
                <input type="file" ref="fileInput" class="hidden" @change="handleFileChange" accept=".pdf,.doc,.docx,.txt" />
            </div>
            <div class="flex justify-end gap-2">
                <Button variant="ghost" @click="isUploadOpen = false">Cancel</Button>
                <Button :disabled="!selectedFile" @click="handleUpload">Upload</Button>
            </div>
        </div>
    </Dialog>

    <!-- Editor Dialog -->
    <Dialog v-model:open="isEditorOpen" title="Write Cover Letter">
        <div class="space-y-4 mt-4 w-full">
            <div class="space-y-2">
                <Label>Document Name</Label>
                <Input v-model="letterForm.name" placeholder="e.g. Google Cover Letter" />
            </div>
            <div class="space-y-2">
                <Label>Content</Label>
                <textarea 
                    v-model="letterForm.content" 
                    class="flex min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Dear Hiring Manager..."
                ></textarea>
            </div>
            <div class="flex justify-end gap-2">
                <Button variant="ghost" @click="isEditorOpen = false">Cancel</Button>
                <Button :disabled="!letterForm.name || !letterForm.content" @click="handleSaveLetter">Save Letter</Button>
            </div>
        </div>
    </Dialog>
    <!-- AI Generator Dialog -->
    <Dialog v-model:open="isAIModalOpen" title="AI Cover Letter Generator">
        <div class="space-y-4 mt-4 w-full">
            <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                    <Label>Job Title</Label>
                    <Input v-model="aiForm.jobTitle" placeholder="e.g. Frontend Developer" />
                </div>
                <div class="space-y-2">
                    <Label>Company</Label>
                    <Input v-model="aiForm.company" placeholder="e.g. Google" />
                </div>
            </div>
            <div class="space-y-2">
                <Label>Job Description (Paste here)</Label>
                <textarea 
                    v-model="aiForm.jobDescription" 
                    class="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Paste the requirements and description..."
                ></textarea>
            </div>
            <div class="flex justify-end gap-2">
                <Button variant="ghost" @click="isAIModalOpen = false">Cancel</Button>
                <Button :disabled="!aiForm.jobDescription || isGenerating" @click="handleGenerateAI">
                    <Loader2 v-if="isGenerating" class="mr-2 h-4 w-4 animate-spin" />
                    <Sparkles v-else class="mr-2 h-4 w-4" />
                    {{ isGenerating ? 'Generating...' : 'Magic Generate' }}
                </Button>
            </div>
        </div>
    </Dialog>

    <!-- Rename Dialog -->
    <Dialog v-model:open="isRenameOpen" title="Rename Document">
        <div class="space-y-4 mt-4 w-full">
            <div class="space-y-2">
                <Label>New Name</Label>
                <Input v-model="renameName" placeholder="Document Name" @keyup.enter="handleRename" />
            </div>
            <div class="flex justify-end gap-2">
                <Button variant="ghost" @click="isRenameOpen = false">Cancel</Button>
                <Button :disabled="!renameName" @click="handleRename">Save</Button>
            </div>
        </div>
    </Dialog>
  </div>
</template>
