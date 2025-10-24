import { createRouter, createWebHashHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
  {
    path: '/',
    redirect: '/products'
  },
  {
    path: '/search',
    name: 'PublicSearch',
    component: () => import('../views/PublicProductSearch.vue')
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
    component: () => import('../views/ProductSearch.vue')
    // No authentication required - public route
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/Admin.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/sku-lookup',
    name: 'SKULookup',
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
  const isAdmin = authStore.isAdmin;

  // Redirect to products if trying to access login/register while authenticated
  if (to.meta.requiresGuest && isAuthenticated) {
    next('/products');
  }
  // Redirect to login if trying to access protected route while not authenticated
  else if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
  }
  // Redirect to products if trying to access admin route without admin privileges
  else if (to.meta.requiresAdmin && !isAdmin) {
    next('/products');
  }
  // Allow navigation
  else {
    next();
  }
});

// Track page views with Fathom Analytics after each route change
router.afterEach(() => {
  // Wait for Fathom to load (it has defer attribute)
  const trackPageview = () => {
    if (window.fathom) {
      // For SPAs with hash routing, pass the full URL including hash fragment
      // See: https://usefathom.com/docs/script/script-advanced#single-page-applications
      const fullUrl = window.location.href;
      console.log('✅ Router tracking pageview (SPA hash):', fullUrl);
      console.log('window.fathom exists:', !!window.fathom);
      window.fathom.trackPageview({
        url: fullUrl
      });
    } else {
      console.warn('⚠️ Fathom not loaded yet, waiting...');
      setTimeout(trackPageview, 100);
    }
  };

  // Give Fathom time to load on first navigation
  setTimeout(trackPageview, 200);
});

export default router;
