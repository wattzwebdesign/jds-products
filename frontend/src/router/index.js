import { createRouter, createWebHashHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
  {
    path: '/',
    redirect: '/products'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/products',
    name: 'Products',
    component: () => import('../views/ProductLookup.vue'),
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

// Navigation guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;

  // Redirect to products if trying to access login/register while authenticated
  if (to.meta.requiresGuest && isAuthenticated) {
    next('/products');
  }
  // Redirect to login if trying to access protected route while not authenticated
  else if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
  }
  // Allow navigation
  else {
    next();
  }
});

export default router;
