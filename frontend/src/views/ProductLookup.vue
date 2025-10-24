<template>
  <div class="product-lookup">
    <header class="header">
      <div class="header-content">
        <h1>JDS Product Lookup</h1>
        <div class="user-info">
          <span>{{ authStore.user?.username }}</span>
          <button @click="handleLogout" class="btn btn-logout">Logout</button>
        </div>
      </div>
    </header>

    <main class="main-content">
      <div class="search-section">
        <h2>Enter SKU Codes</h2>
        <p class="search-instructions">
          Enter one or more SKU codes (comma-separated, space-separated, or on separate lines)
        </p>

        <form @submit.prevent="handleSearch">
          <textarea
            v-model="skuInput"
            placeholder="Example: LPB004, LWB101&#10;or&#10;LPB004&#10;LWB101"
            rows="4"
            class="sku-input"
          ></textarea>

          <button type="submit" class="btn btn-primary" :disabled="loading || !skuInput.trim()">
            {{ loading ? 'Searching...' : 'Search Products' }}
          </button>
        </form>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <div v-if="searchResult && searchResult.notFound && searchResult.notFound.length > 0" class="warning-message">
          <strong>Not Found:</strong> {{ searchResult.notFound.join(', ') }}
        </div>
      </div>

      <div v-if="products.length > 0" class="results-section">
        <div class="results-header">
          <h2>Results</h2>
          <span class="results-count">{{ products.length }} product{{ products.length !== 1 ? 's' : '' }} found</span>
        </div>

        <div class="products-grid">
          <ProductCard
            v-for="product in products"
            :key="product.sku"
            :product="product"
          />
        </div>
      </div>

      <div v-else-if="hasSearched && !loading" class="no-results">
        <p>No products found. Please check your SKU codes and try again.</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { productsAPI } from '../services/api';
import ProductCard from '../components/ProductCard.vue';

const router = useRouter();
const authStore = useAuthStore();

const skuInput = ref('');
const products = ref([]);
const searchResult = ref(null);
const errorMessage = ref('');
const loading = ref(false);
const hasSearched = ref(false);

const handleSearch = async () => {
  errorMessage.value = '';
  loading.value = true;
  hasSearched.value = true;

  try {
    const result = await productsAPI.lookupBySKUs(skuInput.value);
    searchResult.value = result;
    products.value = result.products || [];
  } catch (error) {
    errorMessage.value = error.response?.data?.error || 'Failed to search products. Please try again.';
    products.value = [];
  } finally {
    loading.value = false;
  }
};

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.product-lookup {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  margin: 0;
  font-size: 24px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info span {
  font-size: 14px;
}

.btn-logout {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.btn-logout:hover {
  background: rgba(255, 255, 255, 0.3);
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.search-section {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 40px;
}

.search-section h2 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 20px;
}

.search-instructions {
  margin: 0 0 20px 0;
  color: #666;
  font-size: 14px;
}

.sku-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: 'Courier New', monospace;
  resize: vertical;
  margin-bottom: 16px;
  box-sizing: border-box;
}

.sku-input:focus {
  outline: none;
  border-color: #667eea;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 12px;
  border-radius: 6px;
  margin-top: 16px;
  font-size: 14px;
}

.warning-message {
  background: #fef3cd;
  color: #856404;
  padding: 12px;
  border-radius: 6px;
  margin-top: 16px;
  font-size: 14px;
}

.results-section {
  margin-top: 40px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.results-header h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
}

.results-count {
  color: #666;
  font-size: 14px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.no-results {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .products-grid {
    grid-template-columns: 1fr;
  }
}
</style>
