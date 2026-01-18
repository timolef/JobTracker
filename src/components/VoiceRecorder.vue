<script setup>
import { ref, computed } from 'vue'
import { Mic, Square, Play, Trash2, Loader2 } from 'lucide-vue-next'
import Button from './ui/Button.vue'

const emit = defineEmits(['recorded'])

const isRecording = ref(false)
const audioBlob = ref(null)
const audioUrl = ref(null)
const mediaRecorder = ref(null)
const recordingTime = ref(0)
const timerInterval = ref(null)

const isSupported = computed(() => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
})

const formattedTime = computed(() => {
    const minutes = Math.floor(recordingTime.value / 60)
    const seconds = recordingTime.value % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        mediaRecorder.value = new MediaRecorder(stream)
        
        const chunks = []
        
        mediaRecorder.value.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunks.push(e.data)
            }
        }
        
        mediaRecorder.value.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/webm' })
            audioBlob.value = blob
            audioUrl.value = URL.createObjectURL(blob)
            
            // Stop all tracks
            stream.getTracks().forEach(track => track.stop())
            
            // Emit the audio blob
            emit('recorded', blob)
        }
        
        mediaRecorder.value.start()
        isRecording.value = true
        recordingTime.value = 0
        
        // Start timer
        timerInterval.value = setInterval(() => {
            recordingTime.value++
            // Auto-stop after 5 minutes
            if (recordingTime.value >= 300) {
                stopRecording()
            }
        }, 1000)
        
    } catch (error) {
        console.error('Error accessing microphone:', error)
        alert('Could not access microphone. Please check permissions.')
    }
}

function stopRecording() {
    if (mediaRecorder.value && isRecording.value) {
        mediaRecorder.value.stop()
        isRecording.value = false
        
        if (timerInterval.value) {
            clearInterval(timerInterval.value)
            timerInterval.value = null
        }
    }
}

function deleteRecording() {
    if (audioUrl.value) {
        URL.revokeObjectURL(audioUrl.value)
    }
    audioBlob.value = null
    audioUrl.value = null
    recordingTime.value = 0
}
</script>

<template>
    <div class="space-y-3">
        <div v-if="!isSupported" class="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
            ⚠️ Voice recording is not supported in your browser
        </div>
        
        <div v-else>
            <!-- Recording Controls -->
            <div v-if="!audioUrl" class="flex items-center gap-3">
                <Button
                    v-if="!isRecording"
                    @click="startRecording"
                    type="button"
                    variant="outline"
                    size="sm"
                    class="flex-1"
                >
                    <Mic class="mr-2 h-4 w-4" />
                    Start Recording
                </Button>
                
                <div v-else class="flex-1 flex items-center gap-3">
                    <div class="flex items-center gap-2 flex-1">
                        <div class="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                        <span class="text-sm font-medium">{{ formattedTime }}</span>
                    </div>
                    <Button
                        @click="stopRecording"
                        type="button"
                        variant="destructive"
                        size="sm"
                    >
                        <Square class="mr-2 h-4 w-4" />
                        Stop
                    </Button>
                </div>
            </div>
            
            <!-- Playback Controls -->
            <div v-else class="space-y-2">
                <audio :src="audioUrl" controls class="w-full h-10"></audio>
                <Button
                    @click="deleteRecording"
                    type="button"
                    variant="ghost"
                    size="sm"
                    class="w-full"
                >
                    <Trash2 class="mr-2 h-4 w-4" />
                    Delete Recording
                </Button>
            </div>
            
            <!-- Info -->
            <p class="text-xs text-muted-foreground">
                {{ audioUrl ? 'Recording saved' : isRecording ? 'Recording... (max 5 min)' : 'Click to record a voice note' }}
            </p>
        </div>
    </div>
</template>
