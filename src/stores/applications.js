import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
// Remove useStorage as we now sync with DB

export const useApplicationStore = defineStore('applications', () => {
    const applications = ref([])
    const isLoading = ref(false)

    const stats = computed(() => {
        const total = applications.value.length
        const interview = applications.value.filter(a => a.status === 'Interview').length
        const responseCount = applications.value.filter(a => ['Interview', 'Refusal', 'Offer'].includes(a.status)).length
        const responseRate = total > 0 ? Math.round((responseCount / total) * 100) : 0

        return {
            total,
            interview,
            responseRate,
            active: applications.value.filter(a => ['Applied', 'Interview'].includes(a.status)).length
        }
    })

    // Helper to get token
    const getToken = () => localStorage.getItem('token')

    async function fetchApplications() {
        const token = getToken()
        if (!token) return;

        isLoading.value = true
        try {
            const response = await fetch('http://localhost:3000/api/applications', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
                applications.value = await response.json()
            }
        } catch (error) {
            console.error('Failed to fetch applications:', error)
        } finally {
            isLoading.value = false
        }
    }

    async function addApplication(app) {
        const token = getToken()
        if (!token) return;

        try {
            const response = await fetch('http://localhost:3000/api/applications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(app)
            })

            if (response.ok) {
                const newApp = await response.json()
                applications.value.unshift(newApp)
                return true
            }
        } catch (error) {
            console.error('Failed to add application:', error)
            throw error
        }
    }

    async function updateStatus(id, status) {
        const token = getToken()
        if (!token) return;

        // Optimistic update
        const index = applications.value.findIndex(a => a.id === id)
        const oldStatus = index !== -1 ? applications.value[index].status : null

        if (index !== -1) {
            applications.value[index].status = status
            applications.value[index].updated_at = new Date().toISOString()
        }

        try {
            const response = await fetch(`http://localhost:3000/api/applications/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            })

            if (!response.ok && index !== -1) {
                // Revert if failed
                applications.value[index].status = oldStatus
            }
        } catch (error) {
            console.error('Failed to update status:', error)
            // Revert
            if (index !== -1) applications.value[index].status = oldStatus
        }
    }

    async function deleteApplication(id) {
        const token = getToken()
        if (!token) return;

        // Optimistic delete
        const originalList = [...applications.value]
        applications.value = applications.value.filter(a => a.id !== id)

        try {
            const response = await fetch(`http://localhost:3000/api/applications/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (!response.ok) {
                applications.value = originalList
            }
        } catch (error) {
            console.error('Failed to delete application:', error)
            applications.value = originalList
        }
    }

    return { applications, isLoading, stats, fetchApplications, addApplication, updateStatus, deleteApplication }
})
