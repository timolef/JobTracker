<script setup>
import { Download, FileText, FileSpreadsheet } from 'lucide-vue-next'
import { ref } from 'vue'
import Button from './ui/Button.vue'

const props = defineProps({
    data: {
        type: Array,
        required: true
    },
    stats: {
        type: Object,
        default: () => ({})
    },
    type: {
        type: String,
        default: 'applications', // applications, interviews, contacts
        validator: (value) => ['applications', 'interviews', 'contacts'].includes(value)
    },
    filename: {
        type: String,
        default: ''
    }
})

const showMenu = ref(false)

async function handleExport(format) {
    showMenu.value = false
    
    const { exportToCSV, exportToPDF, exportInterviewsToCSV, exportContactsToCSV } = await import('@/utils/export')
    
    const baseFilename = props.filename || `${props.type}-${new Date().toISOString().split('T')[0]}`
    
    if (format === 'csv') {
        if (props.type === 'applications') {
            exportToCSV(props.data, `${baseFilename}.csv`)
        } else if (props.type === 'interviews') {
            exportInterviewsToCSV(props.data, `${baseFilename}.csv`)
        } else if (props.type === 'contacts') {
            exportContactsToCSV(props.data, `${baseFilename}.csv`)
        }
    } else if (format === 'pdf') {
        if (props.type === 'applications') {
            exportToPDF(props.data, props.stats, `${baseFilename}.pdf`)
        }
    }
}
</script>

<template>
    <div class="relative">
        <Button @click="showMenu = !showMenu" variant="outline" size="sm">
            <Download class="mr-2 h-4 w-4" />
            Export
        </Button>
        
        <!-- Dropdown Menu -->
        <div 
            v-if="showMenu" 
            @click.stop
            class="absolute right-0 mt-2 w-48 rounded-lg border bg-background shadow-lg z-50"
        >
            <div class="p-1">
                <button
                    @click="handleExport('csv')"
                    class="flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                >
                    <FileSpreadsheet class="mr-2 h-4 w-4 text-green-600" />
                    Export as CSV
                </button>
                <button
                    v-if="type === 'applications'"
                    @click="handleExport('pdf')"
                    class="flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                >
                    <FileText class="mr-2 h-4 w-4 text-red-600" />
                    Export as PDF
                </button>
            </div>
        </div>
        
        <!-- Backdrop to close menu -->
        <div 
            v-if="showMenu" 
            @click="showMenu = false"
            class="fixed inset-0 z-40"
        ></div>
    </div>
</template>
