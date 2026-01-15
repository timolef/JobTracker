import { defineStore } from 'pinia'
import { API_BASE_URL } from '@/config'

export const useContactStore = defineStore('contacts', {
    state: () => ({
        contacts: [],
        loading: false,
        error: null
    }),

    actions: {
        async fetchContacts() {
            this.loading = true
            try {
                const response = await fetch(`${API_BASE_URL}/api/contacts`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                })
                if (!response.ok) throw new Error('Failed to fetch contacts')
                this.contacts = await response.json()
            } catch (err) {
                this.error = err.message
            } finally {
                this.loading = false
            }
        },

        async addContact(contactData) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/contacts`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(contactData)
                })
                if (!response.ok) throw new Error('Failed to add contact')
                const newContact = await response.json()
                this.contacts.unshift(newContact)
            } catch (err) {
                this.error = err.message
                throw err
            }
        },

        async updateContact(id, contactData) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/contacts/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(contactData)
                })
                if (!response.ok) throw new Error('Failed to update contact')
                const index = this.contacts.findIndex(c => c.id === id)
                if (index !== -1) {
                    this.contacts[index] = { ...this.contacts[index], ...contactData }
                }
            } catch (err) {
                this.error = err.message
                throw err
            }
        },

        async deleteContact(id) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/contacts/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                })
                if (!response.ok) throw new Error('Failed to delete contact')
                this.contacts = this.contacts.filter(c => c.id !== id)
            } catch (err) {
                this.error = err.message
                throw err
            }
        }
    }
})
