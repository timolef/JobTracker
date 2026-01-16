import { defineStore } from 'pinia'
import { ref, onMounted } from 'vue'

export const useUIStore = defineStore('ui', () => {
    const theme = ref(localStorage.getItem('theme') || 'light')

    function toggleTheme() {
        const newTheme = theme.value === 'light' ? 'dark' : 'light'
        theme.value = newTheme
        applyTheme(newTheme)
        localStorage.setItem('theme', newTheme)
    }

    function applyTheme(t) {
        const root = window.document.documentElement
        root.classList.remove('light', 'dark')
        root.classList.add(t)
        theme.value = t
    }

    function initTheme() {
        const savedTheme = localStorage.getItem('theme')
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches

        let defaultTheme = 'light'
        if (savedTheme) {
            defaultTheme = savedTheme
        } else if (systemDark) {
            defaultTheme = 'dark'
        }

        applyTheme(defaultTheme)
    }

    return {
        theme,
        toggleTheme,
        initTheme
    }
})
