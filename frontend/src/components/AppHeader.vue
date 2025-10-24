<template>
  <header class="header">
    <div class="header-content">
      <h1>Product Catalog</h1>

      <!-- Navigation Links -->
      <nav class="nav-links">
        <router-link to="/products" class="nav-link">All Products</router-link>
        <router-link v-if="authStore.isAuthenticated" to="/sku-lookup" class="nav-link">Bulk SKU Search</router-link>
      </nav>

      <div class="user-info">
        <!-- Show when NOT authenticated -->
        <router-link v-if="!authStore.isAuthenticated" to="/login" class="btn btn-login">Login</router-link>

        <!-- Show when authenticated -->
        <template v-else>
          <router-link to="/admin" class="btn btn-admin">⚙ Admin</router-link>
          <span>{{ authStore.user?.username }}</span>
          <button @click="handleLogout" class="btn btn-logout">Logout</button>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.header {
  background: #0F3F92;
  color: white;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: 75px;
  box-sizing: border-box;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 30px;
}

.header h1 {
  margin: 0;
  font-size: 24px;
  white-space: nowrap;
  line-height: 1;
}

.nav-links {
  display: flex;
  gap: 20px;
  align-items: center;
  flex: 1;
}

.nav-link {
  color: white;
  text-decoration: none;
  font-size: 15px;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 6px;
  transition: background 0.2s;
  white-space: nowrap;
  line-height: 1;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.15);
}

.nav-link.router-link-active {
  background: rgba(255, 255, 255, 0.2);
  font-weight: 600;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info span {
  font-size: 14px;
  white-space: nowrap;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
  white-space: nowrap;
  line-height: 1;
}

.btn-login {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.btn-login:hover {
  background: rgba(255, 255, 255, 0.3);
}

.btn-admin {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.btn-admin:hover {
  background: rgba(255, 255, 255, 0.3);
}

.btn-logout {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.btn-logout:hover {
  background: rgba(255, 255, 255, 0.3);
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .header h1 {
    font-size: 20px;
  }
}
</style>
