import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API_BASE_URL } from '@/config'

export const useDocumentsStore = defineStore('documents', () => {
    const documents = ref([])
    const isLoading = ref(false)

    // Helper to get token
    const getToken = () => localStorage.getItem('token')

    async function fetchDocuments() {
        const token = getToken()
        if (!token) return;

        isLoading.value = true
        try {
            const response = await fetch(`${API_BASE_URL}/api/documents`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
                documents.value = await response.json()
            }
        } catch (error) {
            console.error('Failed to fetch documents:', error)
        } finally {
            isLoading.value = false
        }
    }

    async function uploadDocument(file, type = 'CV') {
        const token = getToken()
        if (!token) return;

        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', type)

        try {
            const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            })

            if (response.ok) {
                const newDoc = await response.json()
                documents.value.unshift(newDoc)
                return true
            }
        } catch (error) {
            console.error('Failed to upload document:', error)
            throw error
        }
    }

    async function createCoverLetter(name, content) {
        const token = getToken()
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/documents/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, content, type: 'CoverLetter' })
            })

            if (response.ok) {
                const newDoc = await response.json()
                documents.value.unshift(newDoc)
                return true
            }
        } catch (error) {
            console.error('Failed to create cover letter:', error)
            throw error
        }
    }

    async function deleteDocument(id) {
        const token = getToken()
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/documents/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (response.ok) {
                documents.value = documents.value.filter(d => d.id !== id)
            }
        } catch (error) {
            console.error('Failed to delete document:', error)
        }
    }

    function downloadDocument(id, name) {
        const token = getToken()
        if (!token) return;

        // Create a temporary link to download
        // Create a temporary link to download
        fetch(`${API_BASE_URL}/api/documents/${id}/download`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = name; // Filename is handled by backend usually, but fallback here
                document.body.appendChild(a);
                a.click();
                a.remove();
            })
            .catch(err => console.error('Download failed', err));
    }

    function viewDocument(id) {
        const token = getToken()
        if (!token) return;

        fetch(`${API_BASE_URL}/api/documents/${id}/view`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');
            })
            .catch(err => console.error('View failed', err));
    }

    async function renameDocument(id, newName) {
        const token = getToken()
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/documents/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: newName })
            })

            if (response.ok) {
                const updatedDoc = await response.json()
                const index = documents.value.findIndex(d => d.id === id)
                if (index !== -1) {
                    documents.value[index] = updatedDoc
                }
                return true
            }
        } catch (error) {
            console.error('Rename failed', error)
            throw error
        }
    }

    return { documents, isLoading, fetchDocuments, uploadDocument, createCoverLetter, deleteDocument, downloadDocument, viewDocument, renameDocument }
})
