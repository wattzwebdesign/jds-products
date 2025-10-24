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

      <div class="product-pricing" v-if="product.basePrice">
        <h4>Pricing</h4>
        <div class="pricing-grid">
          <div class="price-item">
            <span class="price-label">Less than case:</span>
            <span class="price-value">${{ formatPrice(product.basePrice) }}</span>
          </div>
          <div class="price-item">
            <span class="price-label">1 case ({{ product.caseQuantity || '-' }} units):</span>
            <span class="price-value">${{ product.oneCase ? formatPrice(product.oneCase) : '-' }}</span>
          </div>
          <div class="price-item">
            <span class="price-label">5+ cases:</span>
            <span class="price-value">${{ product.fiveCases ? formatPrice(product.fiveCases) : '-' }}</span>
          </div>
          <div class="price-item">
            <span class="price-label">10+ cases:</span>
            <span class="price-value">${{ product.tenCases ? formatPrice(product.tenCases) : '-' }}</span>
          </div>
        </div>
      </div>

      <div class="product-availability">
        <div class="availability-item">
          <span class="availability-label">Available:</span>
          <span class="availability-value" :class="availableQty > 0 ? 'in-stock' : 'out-of-stock'">
            {{ availableQty }} units
          </span>
        </div>
        <div class="availability-item">
          <span class="availability-label">Local:</span>
          <span class="availability-value">{{ localQty }} units</span>
        </div>
      </div>

      <button @click.stop="$emit('view-details', product)" class="btn-view-details">
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
  }
});

const showFullDescription = ref(false);
const imageError = ref(false);

const hasLongDescription = computed(() => {
  const desc = props.product.description || '';
  return desc.length > 150; // Show "Read More" if description is longer than 150 chars
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

.product-pricing {
  margin: 20px 0;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
}

.product-pricing h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.pricing-grid {
  display: grid;
  gap: 8px;
}

.price-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.price-label {
  color: #666;
}

.price-value {
  color: #333;
  font-weight: 600;
}

.product-availability {
  display: flex;
  gap: 20px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.availability-item {
  display: flex;
  gap: 8px;
  font-size: 14px;
}

.availability-label {
  color: #666;
}

.availability-value {
  font-weight: 600;
}

.in-stock {
  color: #22c55e;
}

.out-of-stock {
  color: #ef4444;
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
