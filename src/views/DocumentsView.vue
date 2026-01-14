<script setup>
import { ref, onMounted } from 'vue'
import { useDocumentsStore } from '@/stores/documents'
import { FileText, File, Plus, Download, Trash2, Upload, PenTool, Eye } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Dialog from '@/components/ui/Dialog.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'

const docStore = useDocumentsStore()
const isUploadOpen = ref(false)
const isEditorOpen = ref(false)

const fileInput = ref(null)
const selectedFile = ref(null)

const letterForm = ref({
    name: '',
    content: ''
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
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">Documents</h2>
        <p class="text-muted-foreground">Manage your CVs and Cover Letters.</p>
      </div>
      <div class="flex gap-2">
         <Button variant="outline" @click="isEditorOpen = true">
            <PenTool class="mr-2 h-4 w-4" /> Write Letter
         </Button>
         <Button @click="isUploadOpen = true">
            <Upload class="mr-2 h-4 w-4" /> Upload File
         </Button>
      </div>
    </div>

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
