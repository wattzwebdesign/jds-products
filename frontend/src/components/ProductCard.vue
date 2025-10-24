<template>
  <div class="product-card">
    <div class="product-image">
      <img
        v-if="product.imageUrl"
        :src="product.imageUrl"
        :alt="product.name"
        @error="handleImageError"
      />
      <div v-else class="no-image">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke-width="2"/>
          <circle cx="8.5" cy="8.5" r="1.5" stroke-width="2"/>
          <polyline points="21 15 16 10 5 21" stroke-width="2"/>
        </svg>
        <span>No Image</span>
      </div>
    </div>

    <div class="product-details">
      <div class="product-header">
        <h3>{{ product.name }}</h3>
        <span class="product-sku">SKU: {{ product.sku }}</span>
      </div>

      <div class="product-description-container">
        <p class="product-description" :class="{ 'truncated': !showFullDescription }">
          {{ product.description || 'No description available' }}
        </p>
        <button
          v-if="hasLongDescription"
          @click.stop="showFullDescription = !showFullDescription"
          class="read-more-btn"
        >
          {{ showFullDescription ? 'Show Less' : 'Read More' }}
        </button>
      </div>

      <div v-if="hasProductDetails" class="product-specs">
        <div v-if="product.caseQty" class="spec-item">
          <span class="spec-label">Case Qty:</span>
          <span class="spec-value">{{ product.caseQty }}</span>
        </div>
        <div v-if="product.color" class="spec-item">
          <span class="spec-label">Color:</span>
          <span class="spec-value">{{ product.color }}</span>
        </div>
        <div v-if="hasDimensions" class="spec-item dimensions">
          <span class="spec-label">Dimensions:</span>
          <span class="spec-value">{{ formatDimensions }}</span>
        </div>
        <div v-if="product.lastPriceChange" class="spec-item price-change">
          <span class="spec-label">Last Price Change:</span>
          <span class="spec-value">{{ product.lastPriceChange }}</span>
        </div>
      </div>

      <button v-if="!hideViewButton" @click.stop="$emit('view-details', product)" class="btn-view-details">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" stroke-width="2"/>
          <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z" stroke-width="2"/>
        </svg>
        View Inventory & Pricing
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  product: {
    type: Object,
    required: true
  },
  hideViewButton: {
    type: Boolean,
    default: false
  }
});

const showFullDescription = ref(false);
const imageError = ref(false);

const hasLongDescription = computed(() => {
  const desc = props.product.description || '';
  return desc.length > 150; // Show "Read More" if description is longer than 150 chars
});

const hasProductDetails = computed(() => {
  return props.product.caseQty || props.product.color || hasDimensions.value || props.product.lastPriceChange;
});

const hasDimensions = computed(() => {
  return props.product.length || props.product.height || props.product.width;
});

const formatDimensions = computed(() => {
  const dims = [];
  if (props.product.length) dims.push(`L: ${Number(props.product.length).toFixed(2)}"`);
  if (props.product.width) dims.push(`W: ${Number(props.product.width).toFixed(2)}"`);
  if (props.product.height) dims.push(`H: ${Number(props.product.height).toFixed(2)}"`);
  return dims.join(' × ');
});

// Handle different field name variations from database
const availableQty = computed(() => {
  return props.product.availableQty ?? props.product.availableQuantity ?? 0;
});

const localQty = computed(() => {
  return props.product.localQty ?? props.product.localQuantity ?? 0;
});

const formatPrice = (price) => {
  if (price === null || price === undefined) return '-';
  return Number(price).toFixed(2);
};

const handleImageError = (e) => {
  imageError.value = true;
  e.target.style.display = 'none';
};
</script>

<style scoped>
.product-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s, box-shadow 0.3s;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.product-image {
  width: 100%;
  height: 250px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.product-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.no-image {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #ccc;
  gap: 8px;
}

.no-image span {
  font-size: 14px;
  color: #999;
}

.product-details {
  padding: 20px;
}

.product-header {
  margin-bottom: 12px;
}

.product-header h3 {
  margin: 0 0 6px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 47px; /* 2 lines minimum */
}

.product-sku {
  display: inline-block;
  background: #667eea;
  color: white;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.product-description-container {
  margin: 12px 0;
  min-height: 84px; /* Fixed height for consistency */
}

.product-description {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
  transition: all 0.3s ease;
}

.product-description.truncated {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-height: 63px; /* 3 lines at line-height 1.5 */
}

.read-more-btn {
  background: none;
  border: none;
  color: #667eea;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s;
}

.read-more-btn:hover {
  color: #5568d3;
  text-decoration: underline;
}

.product-specs {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #667eea;
}

.spec-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.spec-label {
  color: #666;
  font-weight: 500;
}

.spec-value {
  color: #333;
  font-weight: 600;
}

.spec-item.dimensions .spec-value {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.spec-item.price-change {
  border-top: 1px solid #e0e0e0;
  padding-top: 8px;
  margin-top: 4px;
}

.spec-item.price-change .spec-value {
  color: #667eea;
}

.btn-view-details {
  width: 100%;
  margin-top: 16px;
  padding: 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;
}

.btn-view-details:hover {
  background: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-view-details svg {
  flex-shrink: 0;
}
</style>
