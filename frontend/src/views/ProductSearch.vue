<template>
  <div class="product-search">
    <AppHeader />

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

        <div class="search-actions">
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

          <button
            v-if="hasSearched || searchQuery || selectedColor"
            @click="clearAllSearch"
            class="btn btn-clear-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18" stroke-width="2" stroke-linecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Clear All
          </button>
        </div>
      </div>

      <div v-if="showFilters" class="filters-panel">
        <div class="filter-section">
          <label for="color-search" class="filter-label">Filter by Color:</label>
          <div class="color-search-container">
            <input
              id="color-search"
              v-model="colorSearchQuery"
              @input="handleColorSearchInput"
              @focus="showColorDropdown = true"
              @blur="handleColorBlur"
              type="text"
              placeholder="Type to search colors (min 3 characters)..."
              class="color-search-input"
            />
            <button
              v-if="selectedColor"
              @click="clearColorFilter"
              class="clear-color-btn"
              title="Clear color filter"
            >
              ×
            </button>

            <!-- Color Dropdown -->
            <div v-if="showColorDropdown && filteredColors.length > 0" class="color-dropdown">
              <div
                v-for="colorOption in filteredColors"
                :key="colorOption.color"
                @mousedown.prevent="selectColor(colorOption.color)"
                class="color-option"
              >
                <div
                  class="color-swatch-small"
                  :style="{ background: getColorHex(colorOption.color) }"
                ></div>
                <span class="color-name">{{ colorOption.color }}</span>
                <span class="color-count">({{ colorOption.count }})</span>
              </div>
            </div>
          </div>

          <!-- Selected Color Display -->
          <div v-if="selectedColor" class="color-swatch-display">
            <div
              class="color-swatch"
              :style="{ background: getColorHex(selectedColor) }"
              :title="selectedColor"
            ></div>
            <span class="selected-color-name">{{ selectedColor }}</span>
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
            :hide-view-button="!authStore.isAuthenticated"
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

        <!-- Add Missing Product button - only show when user is admin -->
        <router-link v-if="authStore.isAdmin" to="/sku-lookup" class="btn btn-add-missing">
          📦 Add Missing Product
        </router-link>
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
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { productsAPI } from '../services/api';
import ProductCard from '../components/ProductCard.vue';
import AppHeader from '../components/AppHeader.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const searchQuery = ref('');
const showFilters = ref(false);
const selectedColor = ref('');
const colorSearchQuery = ref('');
const showColorDropdown = ref(false);
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

const filteredColors = computed(() => {
  if (!colorSearchQuery.value || colorSearchQuery.value.length < 3) {
    return [];
  }

  const query = colorSearchQuery.value.toLowerCase();
  const filtered = availableColors.value.filter(c =>
    c.color.toLowerCase().includes(query)
  ).slice(0, 20); // Limit to 20 results

  console.log('Color search:', {
    query: colorSearchQuery.value,
    availableColorsCount: availableColors.value.length,
    filteredCount: filtered.length,
    showDropdown: showColorDropdown.value
  });

  return filtered;
});

const performSearch = async (page = 1, updateUrl = true) => {
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

    // Track search event with Fathom Analytics (only for new searches, not pagination)
    if (page === 1 && window.fathom) {
      const eventData = {
        _site_id: 'UMVXBRTN',
        _value: pagination.value.total || 0 // Track number of results
      };

      if (searchQuery.value) {
        window.fathom.trackEvent('Product Search: ' + searchQuery.value.substring(0, 50), eventData);
      } else if (selectedColor.value) {
        window.fathom.trackEvent('Color Filter: ' + selectedColor.value, eventData);
      }
    }

    // Update URL with search parameters
    if (updateUrl) {
      const query = {};
      if (searchQuery.value) query.q = searchQuery.value;
      if (selectedColor.value) query.color = selectedColor.value;
      if (page > 1) query.page = page;
      if (pagination.value.limit !== 20) query.limit = pagination.value.limit;

      router.replace({ query });
    }
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

const handleColorSearchInput = () => {
  if (colorSearchQuery.value.length >= 3) {
    showColorDropdown.value = true;
  } else {
    showColorDropdown.value = false;
  }
};

const handleColorBlur = () => {
  // Delay to allow click event to fire
  setTimeout(() => {
    showColorDropdown.value = false;
  }, 200);
};

const selectColor = (color) => {
  selectedColor.value = color;
  colorSearchQuery.value = color;
  showColorDropdown.value = false;
  performSearch(1);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const clearColorFilter = () => {
  selectedColor.value = '';
  colorSearchQuery.value = '';
  showColorDropdown.value = false;
  performSearch(1);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const clearAllSearch = () => {
  // Reset all search parameters
  searchQuery.value = '';
  selectedColor.value = '';
  colorSearchQuery.value = '';
  showColorDropdown.value = false;
  showFilters.value = false;
  errorMessage.value = '';

  // Clear URL parameters and perform search to show all products
  router.replace({ query: {} });
  performSearch(1);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const loadColors = async () => {
  try {
    const result = await productsAPI.getColors();
    availableColors.value = result.colors || [];
    console.log('Loaded colors:', availableColors.value.length, 'colors');
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
  // Require authentication for live inventory/pricing
  if (!authStore.isAuthenticated) {
    router.push('/login');
    return;
  }

  selectedProduct.value = product;
  loadingLive.value = true;
  liveProduct.value = null;
  imageLoadError.value = false;

  // Update URL with SKU parameter
  const currentQuery = { ...route.query, sku: product.sku };
  await router.push({ query: currentQuery });

  // Track modal view as pageview in Fathom (SPA hash routing requires full URL)
  setTimeout(() => {
    if (window.fathom) {
      // For hash routing, pass the full href including the hash fragment
      const fullUrl = window.location.href;
      console.log('✅ Tracking modal pageview (SPA hash):', fullUrl);
      console.log('URL breakdown:', {
        href: window.location.href,
        hash: window.location.hash,
        pathname: window.location.pathname
      });

      window.fathom.trackPageview({
        url: fullUrl
      });

      // Also track as custom event for product analytics
      const eventName = `Product View: ${product.sku} - ${product.name?.substring(0, 50) || 'Unknown'}`;
      window.fathom.trackEvent(eventName, {
        _site_id: 'UMVXBRTN',
        _value: 1
      });
    } else {
      console.error('❌ window.fathom not available for modal tracking');
    }
  }, 200);

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

  // Remove SKU from URL
  const currentQuery = { ...route.query };
  delete currentQuery.sku;
  router.push({ query: currentQuery });
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

const openModalFromUrl = async (sku) => {
  if (!sku || !authStore.isAuthenticated) return;

  try {
    // First try to find product in current results
    let product = products.value.find(p => p.sku === sku);

    // If not in current results, fetch from API
    if (!product) {
      const result = await productsAPI.getLiveProduct(sku);
      product = result.product;
    }

    if (product) {
      selectedProduct.value = product;
      loadingLive.value = true;
      liveProduct.value = null;
      imageLoadError.value = false;

      // Track modal view as pageview in Fathom (SPA hash routing requires full URL)
      if (window.fathom) {
        setTimeout(() => {
          // For hash routing, pass the full href including the hash fragment
          const fullUrl = window.location.href;
          console.log('Tracking modal pageview from URL (SPA hash):', fullUrl);
          window.fathom.trackPageview({
            url: fullUrl
          });

          // Also track as custom event for product analytics
          const eventName = `Product View: ${sku} - ${product.name?.substring(0, 50) || 'Unknown'}`;
          window.fathom.trackEvent(eventName, {
            _site_id: 'UMVXBRTN',
            _value: 1
          });
        }, 100);
      }

      try {
        const result = await productsAPI.getLiveProduct(sku);
        liveProduct.value = result.product;
      } catch (error) {
        console.error('Failed to fetch live product:', error);
        liveProduct.value = product;
      } finally {
        loadingLive.value = false;
      }
    }
  } catch (error) {
    console.error('Failed to open product modal from URL:', error);
  }
};

onMounted(() => {
  // Load available colors for filter
  loadColors();

  // Read URL parameters
  const urlQuery = route.query.q || '';
  const urlColor = route.query.color || '';
  const urlPage = parseInt(route.query.page) || 1;
  const urlLimit = parseInt(route.query.limit) || 20;
  const urlSku = route.query.sku;

  // Set values from URL
  if (urlQuery) searchQuery.value = urlQuery;
  if (urlColor) {
    selectedColor.value = urlColor;
    colorSearchQuery.value = urlColor;
  }
  if (urlLimit !== 20) pagination.value.limit = urlLimit;

  // Perform initial search (with URL params if present, or show all products)
  performSearch(urlPage, false).then(() => {
    // After search completes, open modal if SKU in URL
    if (urlSku) {
      openModalFromUrl(urlSku);
    }
  });
});

// Watch for route changes (e.g., clicking "All Products" link)
watch(() => route.query, (newQuery, oldQuery) => {
  // Handle SKU query parameter changes (opening/closing modal)
  if (newQuery.sku !== oldQuery.sku) {
    if (newQuery.sku && authStore.isAuthenticated) {
      openModalFromUrl(newQuery.sku);
    } else if (!newQuery.sku && selectedProduct.value) {
      // Close modal if SKU removed from URL (e.g., browser back button)
      selectedProduct.value = null;
      liveProduct.value = null;
      imageLoadError.value = false;
    }
  }

  // If query params are cleared (navigating to /products without params)
  if (Object.keys(newQuery).length === 0 && Object.keys(oldQuery).length > 0) {
    // Reset search and show all products
    searchQuery.value = '';
    selectedColor.value = '';
    colorSearchQuery.value = '';
    showColorDropdown.value = false;
    showFilters.value = false;
    errorMessage.value = '';
    performSearch(1, false);
  }
});
</script>

<style scoped>
.product-search {
  min-height: 100vh;
  background: #f5f5f5;
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
  border-color: #0F3F92;
}

.search-icon {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.search-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.btn {
  padding: 10px 18px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-filter {
  background: white;
  color: #0F3F92;
  border: 1px solid #0F3F92;
}

.btn-filter:hover {
  background: #0F3F92;
  color: white;
}

.btn-clear-all {
  background: #f44336;
  color: white;
  border: 1px solid #f44336;
}

.btn-clear-all:hover {
  background: #d32f2f;
  border-color: #d32f2f;
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

.color-search-container {
  position: relative;
  max-width: 400px;
}

.color-search-input {
  width: 100%;
  padding: 10px 40px 10px 14px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  color: #333;
  background: white;
  transition: all 0.2s;
}

.color-search-input:hover {
  border-color: #0F3F92;
}

.color-search-input:focus {
  outline: none;
  border-color: #0F3F92;
  box-shadow: 0 0 0 3px rgba(15, 63, 146, 0.1);
}

.clear-color-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  border: none;
  background: #e0e0e0;
  border-radius: 50%;
  font-size: 20px;
  line-height: 1;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-color-btn:hover {
  background: #d0d0d0;
  color: #333;
}

.color-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-width: 400px;
  max-height: 300px;
  overflow-y: auto;
  background: white;
  border: 2px solid #0F3F92;
  border-radius: 6px;
  margin-top: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
}

.color-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.color-option:hover {
  background: #f5f5f5;
}

.color-swatch-small {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.color-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.color-count {
  font-size: 12px;
  color: #999;
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

.loading,
.loading-live {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #0F3F92;
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
  border-color: #0F3F92;
}

.items-per-page select:focus {
  outline: none;
  border-color: #0F3F92;
  box-shadow: 0 0 0 3px rgba(15, 63, 146, 0.1);
}

.btn-page {
  background: white;
  color: #0F3F92;
  border: 1px solid #0F3F92;
  padding: 10px 20px;
}

.btn-page:hover:not(:disabled) {
  background: #0F3F92;
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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.no-results svg,
.welcome svg {
  color: #ddd;
  margin: 0;
}

.no-results p,
.welcome h2 {
  margin: 0;
  color: #333;
  font-size: 20px;
}

.no-results span,
.welcome p {
  color: #999;
  font-size: 14px;
  margin: 0;
}

.btn-add-missing {
  margin-top: 8px;
  padding: 12px 24px;
  background: #0F3F92;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  transition: all 0.3s;
}

.btn-add-missing:hover {
  background: #0d3577;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(15, 63, 146, 0.3);
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
  background: #0F3F92;
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
