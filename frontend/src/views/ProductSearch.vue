<template>
  <div class="product-search">
    <header class="header">
      <div class="header-content">
        <h1>JDS Product Search</h1>
        <div class="user-info">
          <router-link to="/admin" class="btn btn-admin">⚙ Admin</router-link>
          <span>{{ authStore.user?.username }}</span>
          <button @click="handleLogout" class="btn btn-logout">Logout</button>
        </div>
      </div>
    </header>

    <main class="main-content">
      <div class="search-header">
        <div class="search-box">
          <input
            v-model="searchQuery"
            @input="handleSearchInput"
            type="text"
            placeholder="Search by product name, description, or SKU..."
            class="search-input"
          />
          <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8" stroke-width="2"/>
            <path d="m21 21-4.35-4.35" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>

        <button @click="showFilters = !showFilters" class="btn btn-filter">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="4" y1="21" x2="4" y2="14" stroke-width="2" stroke-linecap="round"/>
            <line x1="4" y1="10" x2="4" y2="3" stroke-width="2" stroke-linecap="round"/>
            <line x1="12" y1="21" x2="12" y2="12" stroke-width="2" stroke-linecap="round"/>
            <line x1="12" y1="8" x2="12" y2="3" stroke-width="2" stroke-linecap="round"/>
            <line x1="20" y1="21" x2="20" y2="16" stroke-width="2" stroke-linecap="round"/>
            <line x1="20" y1="12" x2="20" y2="3" stroke-width="2" stroke-linecap="round"/>
            <line x1="1" y1="14" x2="7" y2="14" stroke-width="2" stroke-linecap="round"/>
            <line x1="9" y1="8" x2="15" y2="8" stroke-width="2" stroke-linecap="round"/>
            <line x1="17" y1="16" x2="23" y2="16" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Filters
        </button>
      </div>

      <div v-if="showFilters" class="filters-panel">
        <div class="filter-group">
          <label>
            <input type="checkbox" v-model="filters.inStock" @change="handleFilterChange" />
            In Stock Only (Available Qty > 0)
          </label>
        </div>
        <div class="filter-group">
          <label>
            <input type="checkbox" v-model="filters.localStock" @change="handleFilterChange" />
            Local Stock Only (Local Qty > 0)
          </label>
        </div>
        <button @click="clearFilters" class="btn btn-clear">Clear Filters</button>
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Searching products...</p>
      </div>

      <div v-else-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div v-else-if="products.length > 0">
        <div class="results-header">
          <h2>Search Results</h2>
          <span class="results-count">
            {{ pagination.total?.toLocaleString() || 0 }} product{{ pagination.total !== 1 ? 's' : '' }} found
          </span>
        </div>

        <div class="products-grid">
          <ProductCard
            v-for="product in products"
            :key="product.sku"
            :product="product"
            @view-details="handleProductClick(product)"
          />
        </div>

        <div v-if="pagination.totalPages > 1" class="pagination">
          <button
            @click="goToPage(pagination.page - 1)"
            :disabled="pagination.page === 1"
            class="btn btn-page"
          >
            ← Previous
          </button>

          <span class="page-info">
            Page {{ pagination.page }} of {{ pagination.totalPages }}
          </span>

          <button
            @click="goToPage(pagination.page + 1)"
            :disabled="pagination.page >= pagination.totalPages"
            class="btn btn-page"
          >
            Next →
          </button>
        </div>
      </div>

      <div v-else-if="hasSearched" class="no-results">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="8" stroke-width="2"/>
          <path d="m21 21-4.35-4.35" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <p>No products found</p>
        <span>Try adjusting your search or filters</span>
      </div>

      <div v-else class="welcome">
        <h2>Welcome to Product Search</h2>
        <p>Search through thousands of products by name, description, or SKU</p>
      </div>
    </main>

    <!-- Product Detail Modal -->
    <div v-if="selectedProduct" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <button @click="closeModal" class="modal-close">×</button>

        <div v-if="loadingLive" class="loading-live">
          <div class="spinner"></div>
          <p>Fetching live inventory & pricing...</p>
        </div>

        <div v-else-if="liveProduct" class="live-product-details">
          <div class="detail-header">
            <div class="detail-image">
              <img v-if="liveProduct.imageUrl" :src="liveProduct.imageUrl" :alt="liveProduct.name" />
              <div v-else class="no-image">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke-width="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5" stroke-width="2"/>
                  <polyline points="21 15 16 10 5 21" stroke-width="2"/>
                </svg>
                <span>No Image</span>
              </div>
            </div>
            <div class="detail-info">
              <h2>{{ liveProduct.name }}</h2>
              <span class="detail-sku">SKU: {{ liveProduct.sku }}</span>
              <p class="detail-description">{{ liveProduct.description || 'No description available' }}</p>
            </div>
          </div>

          <div class="detail-pricing">
            <h3>Live Pricing & Inventory</h3>
            <div class="pricing-table">
              <div class="pricing-row" v-if="liveProduct.basePrice || liveProduct.lessThanCasePrice">
                <span class="pricing-label">Less than case:</span>
                <span class="pricing-value">${{ formatPrice(liveProduct.basePrice || liveProduct.lessThanCasePrice) }}</span>
              </div>
              <div class="pricing-row" v-if="liveProduct.oneCase">
                <span class="pricing-label">1 case ({{ liveProduct.caseQuantity || '-' }} units):</span>
                <span class="pricing-value">${{ formatPrice(liveProduct.oneCase) }}</span>
              </div>
              <div class="pricing-row" v-if="liveProduct.fiveCases">
                <span class="pricing-label">5+ cases:</span>
                <span class="pricing-value">${{ formatPrice(liveProduct.fiveCases) }}</span>
              </div>
              <div class="pricing-row" v-if="liveProduct.tenCases">
                <span class="pricing-label">10+ cases:</span>
                <span class="pricing-value">${{ formatPrice(liveProduct.tenCases) }}</span>
              </div>
            </div>
          </div>

          <div class="detail-availability">
            <div class="availability-card" :class="getAvailableQty(liveProduct) > 0 ? 'in-stock' : 'out-of-stock'">
              <div class="availability-label">Available Quantity</div>
              <div class="availability-number">{{ getAvailableQty(liveProduct) }}</div>
              <div class="availability-status">{{ getAvailableQty(liveProduct) > 0 ? 'In Stock' : 'Out of Stock' }}</div>
            </div>
            <div class="availability-card">
              <div class="availability-label">Local Quantity</div>
              <div class="availability-number">{{ getLocalQty(liveProduct) }}</div>
              <div class="availability-status">{{ getLocalQty(liveProduct) > 0 ? 'Available Locally' : 'Not in Local Stock' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { productsAPI } from '../services/api';
import ProductCard from '../components/ProductCard.vue';

const router = useRouter();
const authStore = useAuthStore();

const searchQuery = ref('');
const filters = ref({
  inStock: false,
  localStock: false
});
const showFilters = ref(false);
const products = ref([]);
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0
});
const loading = ref(false);
const hasSearched = ref(false);
const errorMessage = ref('');

const selectedProduct = ref(null);
const liveProduct = ref(null);
const loadingLive = ref(false);

let searchTimeout = null;

const performSearch = async (page = 1) => {
  loading.value = true;
  errorMessage.value = '';
  hasSearched.value = true;

  try {
    const result = await productsAPI.search(
      searchQuery.value,
      filters.value,
      page,
      pagination.value.limit
    );

    products.value = result.products || [];
    pagination.value = result.pagination || pagination.value;
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Search failed. Please try again.';
    products.value = [];
  } finally {
    loading.value = false;
  }
};

const handleSearchInput = () => {
  // Debounce search
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    performSearch(1);
  }, 500);
};

const handleFilterChange = () => {
  performSearch(1);
};

const clearFilters = () => {
  filters.value = {
    inStock: false,
    localStock: false
  };
  performSearch(1);
};

const goToPage = (page) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    performSearch(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const handleProductClick = async (product) => {
  selectedProduct.value = product;
  loadingLive.value = true;
  liveProduct.value = null;

  try {
    const result = await productsAPI.getLiveProduct(product.sku);
    liveProduct.value = result.product;
  } catch (error) {
    console.error('Failed to fetch live product:', error);
    liveProduct.value = product; // Fallback to cached data
  } finally {
    loadingLive.value = false;
  }
};

const closeModal = () => {
  selectedProduct.value = null;
  liveProduct.value = null;
};

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};

const formatPrice = (price) => {
  if (price === null || price === undefined) return '-';
  return Number(price).toFixed(2);
};

const getAvailableQty = (product) => {
  return product.availableQty ?? product.availableQuantity ?? 0;
};

const getLocalQty = (product) => {
  return product.localQty ?? product.localQuantity ?? 0;
};

onMounted(() => {
  // Perform initial search to show all products
  performSearch(1);
});
</script>

<style scoped>
.product-search {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  background: #667eea;
  color: white;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1400px;
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

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-admin {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  text-decoration: none;
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

.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;
}

.search-header {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.search-box {
  flex: 1;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 14px 48px 14px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  box-sizing: border-box;
  transition: border-color 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
}

.search-icon {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.btn-filter {
  background: white;
  color: #667eea;
  border: 1px solid #667eea;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-filter:hover {
  background: #667eea;
  color: white;
}

.filters-panel {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  gap: 24px;
  align-items: center;
}

.filter-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
}

.filter-group input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.btn-clear {
  background: #f0f0f0;
  color: #666;
  margin-left: auto;
}

.btn-clear:hover {
  background: #e0e0e0;
}

.loading,
.loading-live {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading p,
.loading-live p {
  color: #666;
  margin: 0;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
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
  margin-bottom: 32px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 32px;
}

.btn-page {
  background: white;
  color: #667eea;
  border: 1px solid #667eea;
  padding: 10px 20px;
}

.btn-page:hover:not(:disabled) {
  background: #667eea;
  color: white;
}

.btn-page:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.no-results,
.welcome {
  text-align: center;
  padding: 80px 20px;
}

.no-results svg,
.welcome svg {
  color: #ddd;
  margin-bottom: 24px;
}

.no-results p,
.welcome h2 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 20px;
}

.no-results span,
.welcome p {
  color: #999;
  font-size: 14px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  padding: 32px;
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: #f0f0f0;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  color: #666;
  transition: all 0.3s;
}

.modal-close:hover {
  background: #e0e0e0;
  color: #333;
}

.live-product-details {
  padding: 20px 0;
}

.detail-header {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 30px;
  margin-bottom: 30px;
  padding-bottom: 30px;
  border-bottom: 2px solid #eee;
}

.detail-image {
  width: 100%;
  height: 300px;
  background: #f5f5f5;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.detail-image .no-image {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #ccc;
  gap: 12px;
}

.detail-image .no-image span {
  font-size: 16px;
  color: #999;
}

.detail-info h2 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 24px;
  line-height: 1.3;
}

.detail-sku {
  display: inline-block;
  background: #667eea;
  color: white;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 16px;
}

.detail-description {
  margin: 16px 0 0 0;
  color: #666;
  font-size: 15px;
  line-height: 1.6;
}

.detail-pricing {
  margin-bottom: 30px;
}

.detail-pricing h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

.pricing-table {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 12px;
}

.pricing-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
  font-size: 15px;
}

.pricing-row:last-child {
  border-bottom: none;
}

.pricing-label {
  color: #666;
  font-weight: 500;
}

.pricing-value {
  color: #333;
  font-weight: 700;
  font-size: 16px;
}

.detail-availability {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.availability-card {
  background: #f9f9f9;
  padding: 24px;
  border-radius: 12px;
  text-align: center;
  border: 2px solid #eee;
}

.availability-card.in-stock {
  background: #f0fdf4;
  border-color: #86efac;
}

.availability-card.out-of-stock {
  background: #fef2f2;
  border-color: #fca5a5;
}

.availability-label {
  font-size: 13px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
  font-weight: 600;
}

.availability-number {
  font-size: 48px;
  font-weight: 700;
  margin: 8px 0;
}

.availability-card.in-stock .availability-number {
  color: #22c55e;
}

.availability-card.out-of-stock .availability-number {
  color: #ef4444;
}

.availability-status {
  font-size: 14px;
  font-weight: 600;
  margin-top: 8px;
}

.availability-card.in-stock .availability-status {
  color: #16a34a;
}

.availability-card.out-of-stock .availability-status {
  color: #dc2626;
}

@media (max-width: 768px) {
  .detail-header {
    grid-template-columns: 1fr;
  }

  .detail-availability {
    grid-template-columns: 1fr;
  }
  .header-content {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .search-header {
    flex-direction: column;
  }

  .filters-panel {
    flex-direction: column;
    align-items: flex-start;
  }

  .products-grid {
    grid-template-columns: 1fr;
  }

  .btn-clear {
    margin-left: 0;
  }
}
</style>
