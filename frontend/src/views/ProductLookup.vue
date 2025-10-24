<template>
  <div class="product-lookup">
    <AppHeader />

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
          <span class="results-count">{{ products.length}} product{{ products.length !== 1 ? 's' : '' }} found</span>
        </div>

        <!-- Save Missing Products Button -->
        <div v-if="missingProducts.length > 0" class="save-section">
          <div class="save-info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" stroke-width="2"/>
              <line x1="12" y1="8" x2="12" y2="12" stroke-width="2" stroke-linecap="round"/>
              <line x1="12" y1="16" x2="12.01" y2="16" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span>{{ missingProducts.length }} product{{ missingProducts.length !== 1 ? 's' : '' }} not in database</span>
          </div>
          <button
            @click="handleSaveMissingProducts"
            class="btn btn-save"
            :disabled="saving"
          >
            {{ saving ? 'Saving...' : `Save ${missingProducts.length} Missing Product${missingProducts.length !== 1 ? 's' : ''}` }}
          </button>
        </div>

        <!-- Success Message -->
        <div v-if="saveResult" class="save-result" :class="saveResult.success ? 'success' : 'error'">
          <strong>{{ saveResult.success ? '✓ Success' : '✗ Error' }}</strong>
          <p>{{ saveResult.message }}</p>
        </div>

        <div class="products-grid">
          <div
            v-for="product in products"
            :key="product.sku"
            class="product-wrapper"
          >
            <div v-if="!product.inDatabase" class="database-badge not-in-db">
              Not in Database
            </div>
            <div v-else class="database-badge in-db">
              In Database
            </div>
            <ProductCard
              :product="product"
              @view-details="handleViewProduct(product)"
            />
          </div>
        </div>
      </div>

      <div v-else-if="hasSearched && !loading" class="no-results">
        <p>No products found. Please check your SKU codes and try again.</p>
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
          <h2>{{ liveProduct.name }}</h2>
          <p class="sku">SKU: {{ liveProduct.sku }}</p>

          <div class="inventory-section">
            <h3>Inventory</h3>
            <div class="inventory-grid">
              <div class="inventory-item">
                <span class="label">Available:</span>
                <span class="value">{{ liveProduct.availability?.available || 0 }}</span>
              </div>
              <div class="inventory-item">
                <span class="label">Local:</span>
                <span class="value">{{ liveProduct.availability?.local || 0 }}</span>
              </div>
            </div>
          </div>

          <div v-if="liveProduct.pricing" class="pricing-section">
            <h3>Pricing</h3>
            <div class="pricing-grid">
              <div class="price-item">
                <span class="label">Price:</span>
                <span class="value">${{ liveProduct.pricing?.price?.toFixed(2) || '0.00' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { productsAPI, adminAPI } from '../services/api';
import ProductCard from '../components/ProductCard.vue';
import AppHeader from '../components/AppHeader.vue';

const router = useRouter();
const authStore = useAuthStore();

const skuInput = ref('');
const products = ref([]);
const searchResult = ref(null);
const errorMessage = ref('');
const loading = ref(false);
const hasSearched = ref(false);
const saving = ref(false);
const saveResult = ref(null);

const missingProducts = computed(() => {
  return products.value.filter(p => !p.inDatabase);
});

const handleSearch = async () => {
  errorMessage.value = '';
  saveResult.value = null;
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

const handleSaveMissingProducts = async () => {
  saving.value = true;
  saveResult.value = null;

  try {
    const skusToSave = missingProducts.value.map(p => p.sku);
    const result = await adminAPI.addMissingProducts(skusToSave);

    saveResult.value = result;

    // Mark saved products as now in database
    if (result.success) {
      products.value = products.value.map(p => {
        if (skusToSave.includes(p.sku)) {
          return { ...p, inDatabase: true };
        }
        return p;
      });
    }
  } catch (error) {
    saveResult.value = {
      success: false,
      message: error.response?.data?.error || 'Failed to save products. Please try again.'
    };
  } finally {
    saving.value = false;
  }
};

const selectedProduct = ref(null);
const liveProduct = ref(null);
const loadingLive = ref(false);

const handleViewProduct = async (product) => {
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
</script>

<style scoped>
.product-lookup {
  min-height: 100vh;
  background: #f5f5f5;
}

.main-content {
  max-width: 1400px;
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
  border-color: #0F3F92;
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
  background: #0F3F92;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(15, 63, 146, 0.4);
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

.save-section {
  background: #fff8e1;
  border-left: 4px solid #ffc107;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.save-info {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #856404;
  font-weight: 600;
}

.save-info svg {
  color: #ffc107;
  flex-shrink: 0;
}

.btn-save {
  background: #0F3F92;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.btn-save:hover:not(:disabled) {
  background: #0d3577;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(15, 63, 146, 0.4);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.save-result {
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.save-result.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.save-result.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.save-result strong {
  display: block;
  margin-bottom: 4px;
  font-size: 16px;
}

.save-result p {
  margin: 0;
  font-size: 14px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.product-wrapper {
  position: relative;
}

.database-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.database-badge.in-db {
  background: #28a745;
  color: white;
}

.database-badge.not-in-db {
  background: #ffc107;
  color: #856404;
}

.no-results {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

/* Modal Styles */
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

.loading-live {
  text-align: center;
  padding: 60px 20px;
}

.loading-live p {
  color: #666;
  margin-top: 20px;
  font-size: 16px;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #0F3F92;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.live-product-details {
  padding: 20px 0;
}

.live-product-details h2 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 24px;
  line-height: 1.3;
}

.live-product-details .sku {
  display: inline-block;
  background: #0F3F92;
  color: white;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 24px;
}

.inventory-section,
.pricing-section {
  margin-bottom: 30px;
}

.inventory-section h3,
.pricing-section h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

.inventory-grid,
.pricing-grid {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 12px;
  display: grid;
  gap: 16px;
}

.inventory-item,
.price-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
  font-size: 15px;
}

.inventory-item:last-child,
.price-item:last-child {
  border-bottom: none;
}

.inventory-item .label,
.price-item .label {
  color: #666;
  font-weight: 500;
}

.inventory-item .value,
.price-item .value {
  color: #333;
  font-weight: 700;
  font-size: 16px;
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

  .modal-content {
    padding: 24px;
  }
}
</style>
