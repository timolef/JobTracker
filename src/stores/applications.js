import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { API_BASE_URL } from '@/config'
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
            active: applications.value.filter(a => ['Applied', 'Interview'].includes(a.status)).length,
            // Gamification Stats
            streak: calculateStreak(applications.value),
            badges: calculateBadges(applications.value, total, interview)
        }
    })

    function calculateStreak(apps) {
        if (!apps.length) return 0
        const dates = [...new Set(apps.map(a => new Date(a.date_applied || a.created_at).toISOString().split('T')[0]))].sort().reverse()
        let streak = 0
        let today = new Date().toISOString().split('T')[0]
        let yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

        // If no app today or yesterday, streak is broken (unless it's 0)
        // But we count from the latest contiguous block relative to now
        if (dates[0] !== today && dates[0] !== yesterday) return 0

        let currentCheck = dates.includes(today) ? today : yesterday

        for (let date of dates) {
            if (date === currentCheck) {
                streak++
                let d = new Date(currentCheck)
                d.setDate(d.getDate() - 1)
                currentCheck = d.toISOString().split('T')[0]
            } else {
                break
            }
        }
        return streak
    }

    function calculateBadges(apps, total, interviewCount) {
        const streak = calculateStreak(apps)
        const offerCount = apps.filter(a => a.status === 'Offer').length

        return [
            { id: 'first_step', icon: '🌱', title: 'First Step', description: 'Apply to your first job', unlocked: total >= 1 },
            { id: 'on_fire', icon: '🔥', title: 'On Fire', description: '3-day application streak', unlocked: streak >= 3 },
            { id: 'marathon', icon: '🏃', title: 'Marathon', description: '20 Total Applications', unlocked: total >= 20 },
            { id: 'networker', icon: '🤝', title: 'Networker', description: 'Have 5 active contacts', unlocked: false }, // Placeholder, needs contact store access or param
            { id: 'interview_pro', icon: '🎙️', title: 'Interview Pro', description: 'Land an interview', unlocked: interviewCount >= 1 },
            { id: 'offer_secured', icon: '🥂', title: 'Offer Secured', description: 'Receive a job offer', unlocked: offerCount >= 1 }
        ]
    }

    // Helper to get token
    const getToken = () => localStorage.getItem('token')

    async function fetchApplications() {
        const token = getToken()
        if (!token) return;

        isLoading.value = true
        try {
            const response = await fetch(`${API_BASE_URL}/api/applications`, {
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
            const response = await fetch(`${API_BASE_URL}/api/applications`, {
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
            const response = await fetch(`${API_BASE_URL}/api/applications/${id}`, {
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
            const response = await fetch(`${API_BASE_URL}/api/applications/${id}`, {
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

    async function updateApplication(id, updates) {
        const token = getToken()
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/applications/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            })

            if (response.ok) {
                await fetchApplications() // Full refresh to get joined names
                return true
            }
        } catch (error) {
            console.error('Failed to update application:', error)
            throw error
        }
    }

    return { applications, isLoading, stats, fetchApplications, addApplication, updateStatus, updateApplication, deleteApplication }
})
