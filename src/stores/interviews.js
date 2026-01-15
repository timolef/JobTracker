import { defineStore } from 'pinia'
import { API_BASE_URL } from '@/config'

export const useInterviewStore = defineStore('interviews', {
    state: () => ({
        interviews: [],
        loading: false,
        error: null
    }),

    actions: {
        async fetchInterviews() {
            this.loading = true
            try {
                const response = await fetch(`${API_BASE_URL}/api/interviews`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                })
                if (!response.ok) throw new Error('Failed to fetch interviews')
                this.interviews = await response.json()
            } catch (err) {
                this.error = err.message
            } finally {
                this.loading = false
            }
        },

        async addInterview(interviewData) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/interviews`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(interviewData)
                })
                if (!response.ok) throw new Error('Failed to add interview')
                const newInterview = await response.json()
                this.interviews.push(newInterview)
                this.interviews.sort((a, b) => new Date(a.interview_date) - new Date(b.interview_date))
            } catch (err) {
                this.error = err.message
                throw err
            }
        },

        async updateInterview(id, interviewData) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/interviews/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(interviewData)
                })
                if (!response.ok) throw new Error('Failed to update interview')
                const index = this.interviews.findIndex(i => i.id === id)
                if (index !== -1) {
                    this.interviews[index] = { ...this.interviews[index], ...interviewData }
                    this.interviews.sort((a, b) => new Date(a.interview_date) - new Date(b.interview_date))
                }
            } catch (err) {
                this.error = err.message
                throw err
            }
        },

        async deleteInterview(id) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/interviews/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                })
                if (!response.ok) throw new Error('Failed to delete interview')
                this.interviews = this.interviews.filter(i => i.id !== id)
            } catch (err) {
                this.error = err.message
                throw err
            }
        }
    }
})
