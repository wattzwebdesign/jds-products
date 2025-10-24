<template>
  <div class="product-card">
    <div class="product-image">
      <img :src="product.thumbnail || product.image" :alt="product.name" />
    </div>

    <div class="product-details">
      <div class="product-header">
        <h3>{{ product.name }}</h3>
        <span class="product-sku">SKU: {{ product.sku }}</span>
      </div>

      <p class="product-description">{{ product.description }}</p>

      <div class="product-pricing">
        <h4>Pricing</h4>
        <div class="pricing-grid">
          <div class="price-item">
            <span class="price-label">Less than case:</span>
            <span class="price-value">${{ product.lessThanCasePrice?.toFixed(2) }}</span>
          </div>
          <div class="price-item">
            <span class="price-label">1 case ({{ product.caseQuantity }} units):</span>
            <span class="price-value">${{ product.oneCase?.toFixed(2) }}</span>
          </div>
          <div class="price-item">
            <span class="price-label">5+ cases:</span>
            <span class="price-value">${{ product.fiveCases?.toFixed(2) }}</span>
          </div>
          <div class="price-item">
            <span class="price-label">10+ cases:</span>
            <span class="price-value">${{ product.tenCases?.toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <div class="product-availability">
        <div class="availability-item">
          <span class="availability-label">Available:</span>
          <span class="availability-value" :class="product.availableQuantity > 0 ? 'in-stock' : 'out-of-stock'">
            {{ product.availableQuantity }} units
          </span>
        </div>
        <div class="availability-item">
          <span class="availability-label">Local:</span>
          <span class="availability-value">{{ product.localQuantity }} units</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  product: {
    type: Object,
    required: true
  }
});
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

.product-description {
  margin: 12px 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
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
</style>
