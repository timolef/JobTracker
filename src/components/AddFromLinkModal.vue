<script setup>
import { ref } from 'vue'
import { useApplicationStore } from '@/stores/applications'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
import CardFooter from '@/components/ui/CardFooter.vue'
import { X, Link2, Loader2, CheckCircle2, AlertCircle } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const emit = defineEmits(['close', 'jobExtracted'])

const applicationStore = useApplicationStore()

const url = ref('')
const isLoading = ref(false)
const error = ref(null)
const extractedJob = ref(null)

async function extractJobDetails() {
    if (!url.value.trim()) {
        error.value = t('addFromLink.urlRequired')
        return
    }

    // Validate URL format
    if (!url.value.includes('indeed.com')) {
        error.value = t('addFromLink.onlyIndeed')
        return
    }

    isLoading.value = true
    error.value = null
    extractedJob.value = null

    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/scrape-job`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: url.value.trim() })
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Failed to extract job details')
        }

        const jobDetails = await response.json()
        extractedJob.value = jobDetails
        
    } catch (err) {
        console.error('Error extracting job:', err)
        error.value = err.message || t('addFromLink.extractionFailed')
    } finally {
        isLoading.value = false
    }
}

function createApplication() {
    if (!extractedJob.value) return
    
    emit('jobExtracted', extractedJob.value)
    emit('close')
}

function reset() {
    url.value = ''
    error.value = null
    extractedJob.value = null
}
</script>

<template>
    <div class="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="emit('close')">
        <Card class="w-full max-w-2xl shadow-2xl border-opacity-50 animate-scale-in">
            <CardHeader class="border-b">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Link2 class="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle class="text-xl">{{ t('addFromLink.title') }}</CardTitle>
                    </div>
                    <button @click="emit('close')" class="p-2 hover:bg-accent rounded-lg transition-colors">
                        <X class="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>
            </CardHeader>

            <CardContent class="pt-6 space-y-6">
                <!-- URL Input -->
                <div class="space-y-2">
                    <Label for="job-url">{{ t('addFromLink.urlLabel') }}</Label>
                    <div class="flex gap-2">
                        <Input 
                            id="job-url"
                            v-model="url"
                            type="url"
                            :placeholder="t('addFromLink.urlPlaceholder')"
                            :disabled="isLoading || !!extractedJob"
                            @keyup.enter="extractJobDetails"
                            class="flex-1"
                        />
                        <Button 
                            v-if="!extractedJob"
                            @click="extractJobDetails"
                            :disabled="isLoading || !url.trim()"
                        >
                            <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin mr-2" />
                            {{ isLoading ? t('addFromLink.extracting') : t('addFromLink.extract') }}
                        </Button>
                        <Button 
                            v-else
                            variant="outline"
                            @click="reset"
                        >
                            {{ t('common.reset') }}
                        </Button>
                    </div>
                    <p class="text-xs text-muted-foreground">
                        {{ t('addFromLink.hint') }}
                    </p>
                </div>

                <!-- Error Message -->
                <div v-if="error" class="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <AlertCircle class="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div class="flex-1">
                        <p class="text-sm font-medium text-destructive">{{ t('addFromLink.error') }}</p>
                        <p class="text-xs text-destructive/80 mt-1">{{ error }}</p>
                    </div>
                </div>

                <!-- Extracted Job Preview -->
                <div v-if="extractedJob" class="space-y-4 animate-fade-in">
                    <div class="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                        <CheckCircle2 class="h-4 w-4" />
                        <span class="font-medium">{{ t('addFromLink.success') }}</span>
                    </div>

                    <div class="p-4 rounded-lg border bg-muted/30 space-y-3">
                        <div>
                            <p class="text-xs text-muted-foreground uppercase tracking-wide mb-1">{{ t('addFromLink.jobTitle') }}</p>
                            <p class="font-semibold text-lg">{{ extractedJob.title }}</p>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <p class="text-xs text-muted-foreground uppercase tracking-wide mb-1">{{ t('addFromLink.company') }}</p>
                                <p class="font-medium">{{ extractedJob.company }}</p>
                            </div>
                            <div>
                                <p class="text-xs text-muted-foreground uppercase tracking-wide mb-1">{{ t('addFromLink.location') }}</p>
                                <p class="font-medium">{{ extractedJob.location }}</p>
                            </div>
                        </div>

                        <div v-if="extractedJob.salary" class="grid grid-cols-2 gap-4">
                            <div>
                                <p class="text-xs text-muted-foreground uppercase tracking-wide mb-1">{{ t('addFromLink.salary') }}</p>
                                <p class="font-medium">{{ extractedJob.salary }}</p>
                            </div>
                            <div>
                                <p class="text-xs text-muted-foreground uppercase tracking-wide mb-1">{{ t('addFromLink.type') }}</p>
                                <p class="font-medium">{{ extractedJob.type }}</p>
                            </div>
                        </div>

                        <div v-if="extractedJob.description" class="pt-2 border-t">
                            <p class="text-xs text-muted-foreground uppercase tracking-wide mb-2">{{ t('addFromLink.description') }}</p>
                            <div class="text-sm text-muted-foreground max-h-32 overflow-y-auto custom-scrollbar">
                                {{ extractedJob.description.substring(0, 300) }}{{ extractedJob.description.length > 300 ? '...' : '' }}
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>

            <CardFooter class="border-t flex justify-end gap-3">
                <Button variant="outline" @click="emit('close')">
                    {{ t('common.cancel') }}
                </Button>
                <Button 
                    v-if="extractedJob"
                    @click="createApplication"
                    class="bg-gradient-to-r from-primary to-blue-500"
                >
                    {{ t('addFromLink.createApplication') }}
                </Button>
            </CardFooter>
        </Card>
    </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: hsl(var(--muted-foreground) / 0.3);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: hsl(var(--muted-foreground) / 0.5);
}
</style>
