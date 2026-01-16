import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE_URL } from '@/config'

export const useAuthStore = defineStore('auth', () => {
    const router = useRouter()
    const user = ref(JSON.parse(localStorage.getItem('user')) || null)
    const token = ref(localStorage.getItem('token') || null)
    const isAuthenticated = ref(!!token.value)

    async function login(email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Login failed')
            }

            const data = await response.json()
            user.value = data.user
            token.value = data.token
            isAuthenticated.value = true

            localStorage.setItem('user', JSON.stringify(data.user))
            localStorage.setItem('token', data.token)

            return true
        } catch (error) {
            console.error('Login error:', error)
            throw error
        }
    }

    async function register(email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Registration failed')
            }

            const data = await response.json()
            user.value = data.user
            token.value = data.token
            isAuthenticated.value = true

            localStorage.setItem('user', JSON.stringify(data.user))
            localStorage.setItem('token', data.token)

            return true
        } catch (error) {
            console.error('Registration error:', error)
            throw error
        }
    }

    async function checkAuth() {
        if (!token.value) return false
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${token.value}` }
            })
            if (response.ok) {
                const data = await response.json()
                user.value = data.user
                localStorage.setItem('user', JSON.stringify(data.user))
                return true
            } else {
                logout()
                return false
            }
        } catch (error) {
            console.error('Check auth error:', error)
            return false
        }
    }

    function logout() {
        user.value = null
        token.value = null
        isAuthenticated.value = false
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        router.push('/login')
    }

    return { user, token, isAuthenticated, login, register, logout, checkAuth }
})
