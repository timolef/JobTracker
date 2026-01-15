import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            redirect: '/dashboard'
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('../views/LoginView.vue')
        },
        {
            path: '/register',
            name: 'register',
            component: () => import('../views/RegisterView.vue')
        },
        {
            path: '/',
            component: () => import('../layouts/DashboardLayout.vue'),
            meta: { requiresAuth: true },
            children: [
                {
                    path: 'dashboard',
                    name: 'dashboard',
                    component: () => import('../views/DashboardView.vue')
                },

                {
                    path: 'applications',
                    name: 'applications',
                    component: () => import('../views/ApplicationsView.vue')
                },
                {
                    path: 'search',
                    name: 'search',
                    component: () => import('../views/JobSearchView.vue')
                },
                {
                    path: 'documents',
                    name: 'documents',
                    component: () => import('../views/DocumentsView.vue')
                },
                {
                    path: 'kanban',
                    name: 'kanban',
                    component: () => import('../views/KanbanView.vue')
                },
                {
                    path: 'contacts',
                    name: 'contacts',
                    component: () => import('../views/ContactsView.vue')
                },
                {
                    path: 'interviews',
                    name: 'interviews',
                    component: () => import('../views/InterviewsView.vue')
                }
            ]
        }
    ]
})

router.beforeEach((to, from, next) => {
    const isAuthenticated = localStorage.getItem('token')
    if (to.matched.some(record => record.meta.requiresAuth)) {
        if (!isAuthenticated) {
            next('/login')
        } else {
            next()
        }
    } else {
        next()
    }
})

export default router
