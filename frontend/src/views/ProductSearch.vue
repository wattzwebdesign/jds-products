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
        <div class="filter-section">
          <label for="color-filter" class="filter-label">Filter by Color:</label>
          <select
            id="color-filter"
            v-model="selectedColor"
            @change="handleColorChange"
            class="color-filter-select"
          >
            <option value="">All Colors</option>
            <option
              v-for="colorOption in availableColors"
              :key="colorOption.color"
              :value="colorOption.color"
            >
              {{ colorOption.color }} ({{ colorOption.count }})
            </option>
          </select>
          <div v-if="selectedColor" class="color-swatch-display">
            <div
              class="color-swatch"
              :style="{ background: getColorHex(selectedColor) }"
              :title="selectedColor"
            ></div>
            <span class="selected-color-name">{{ selectedColor }}</span>
          </div>
        </div>

        <div class="filter-info">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" stroke-width="2"/>
            <line x1="12" y1="16" x2="12" y2="12" stroke-width="2" stroke-linecap="round"/>
            <line x1="12" y1="8" x2="12.01" y2="8" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <div>
            <strong>Note:</strong> Inventory levels are not available in bulk search.
            Click "View Inventory & Pricing" on any product card to see live stock quantities.
          </div>
        </div>
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

        <div v-if="pagination.total > 0" class="pagination">
          <div class="pagination-controls">
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

          <div class="items-per-page">
            <label for="page-size">Items per page:</label>
            <select id="page-size" v-model="pagination.limit" @change="handlePageSizeChange">
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
          </div>
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
              <img
                v-if="liveProduct.imageUrl && !imageLoadError"
                :src="liveProduct.imageUrl"
                :alt="liveProduct.name"
                @error="handleImageLoadError"
                @load="handleImageLoadSuccess"
              />
              <div v-else class="no-image">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke-width="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5" stroke-width="2"/>
                  <polyline points="21 15 16 10 5 21" stroke-width="2"/>
                </svg>
                <span>{{ imageLoadError ? 'Image Failed to Load' : 'No Image' }}</span>
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
const showFilters = ref(false);
const selectedColor = ref('');
const availableColors = ref([]);
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
const imageLoadError = ref(false);

let searchTimeout = null;

const performSearch = async (page = 1) => {
  loading.value = true;
  errorMessage.value = '';
  hasSearched.value = true;

  try {
    const filters = {};
    if (selectedColor.value) {
      filters.color = selectedColor.value;
    }

    const result = await productsAPI.search(
      searchQuery.value,
      filters,
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

const goToPage = (page) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    performSearch(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const handlePageSizeChange = () => {
  // Reset to page 1 when changing page size
  performSearch(1);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleColorChange = () => {
  performSearch(1);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const loadColors = async () => {
  try {
    const result = await productsAPI.getColors();
    availableColors.value = result.colors || [];
  } catch (error) {
    console.error('Failed to load colors:', error);
  }
};

// Map common color names to hex values for swatches
const colorMap = {
  // Basic colors
  'BLACK': '#000000',
  'WHITE': '#FFFFFF',
  'RED': '#FF0000',
  'BLUE': '#0000FF',
  'GREEN': '#008000',
  'YELLOW': '#FFFF00',
  'ORANGE': '#FFA500',
  'PURPLE': '#800080',
  'PINK': '#FFC0CB',
  'BROWN': '#8B4513',
  'GRAY': '#808080',
  'GREY': '#808080',
  'SILVER': '#C0C0C0',
  'GOLD': '#FFD700',
  'CLEAR': '#FFFFFF',
  'TRANSPARENT': '#FFFFFF',

  // Shades
  'LIGHT BLUE': '#ADD8E6',
  'DARK BLUE': '#00008B',
  'NAVY': '#000080',
  'ROYAL BLUE': '#4169E1',
  'SKY BLUE': '#87CEEB',
  'LIGHT GREEN': '#90EE90',
  'DARK GREEN': '#006400',
  'LIME': '#00FF00',
  'OLIVE': '#808000',
  'LIGHT GRAY': '#D3D3D3',
  'DARK GRAY': '#A9A9A9',
  'CHARCOAL': '#36454F',
};

const getColorHex = (colorName) => {
  if (!colorName) return '#CCCCCC';

  const upper = colorName.toUpperCase().trim();

  // Direct match
  if (colorMap[upper]) {
    return colorMap[upper];
  }

  // Partial match
  for (const [key, value] of Object.entries(colorMap)) {
    if (upper.includes(key) || key.includes(upper)) {
      return value;
    }
  }

  // Default to gray for unknown colors
  return '#CCCCCC';
};

const handleProductClick = async (product) => {
  selectedProduct.value = product;
  loadingLive.value = true;
  liveProduct.value = null;
  imageLoadError.value = false;

  try {
    const result = await productsAPI.getLiveProduct(product.sku);
    liveProduct.value = result.product;

    // Debug logging
    console.log('Live product data:', result.product);
    console.log('Image URL:', result.product.imageUrl);
  } catch (error) {
    console.error('Failed to fetch live product:', error);
    liveProduct.value = product; // Fallback to cached data
    console.log('Fallback product data:', product);
    console.log('Fallback image URL:', product.imageUrl);
  } finally {
    loadingLive.value = false;
  }
};

const closeModal = () => {
  selectedProduct.value = null;
  liveProduct.value = null;
  imageLoadError.value = false;
};

const handleImageLoadError = (e) => {
  console.error('Image failed to load:', liveProduct.value?.imageUrl);
  console.error('Error event:', e);
  imageLoadError.value = true;
};

const handleImageLoadSuccess = () => {
  console.log('Image loaded successfully:', liveProduct.value?.imageUrl);
  imageLoadError.value = false;
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
  // Load available colors for filter
  loadColors();
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-label {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.color-filter-select {
  padding: 10px 14px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  color: #333;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  max-width: 300px;
}

.color-filter-select:hover {
  border-color: #667eea;
}

.color-filter-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.color-swatch-display {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.color-swatch {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 2px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.selected-color-name {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.filter-info {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  color: #856404;
  font-size: 13px;
  line-height: 1.5;
  background: #fff8e1;
  padding: 12px;
  border-radius: 6px;
  border-left: 3px solid #ffc107;
}

.filter-info svg {
  flex-shrink: 0;
  margin-top: 2px;
  color: #ffc107;
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
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-top: 32px;
}

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

.items-per-page {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

.items-per-page label {
  font-weight: 500;
}

.items-per-page select {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  color: #333;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.items-per-page select:hover {
  border-color: #667eea;
}

.items-per-page select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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
