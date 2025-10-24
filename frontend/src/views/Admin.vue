<template>
  <div class="admin-page">
    <header class="header">
      <div class="header-content">
        <h1>Admin - Product Import</h1>
        <router-link to="/products" class="btn btn-secondary">← Back to Products</router-link>
      </div>
    </header>

    <main class="main-content">
      <div class="import-section">
        <h2>Import Products from Excel</h2>
        <p class="instructions">
          Upload an Excel file (.xlsx or .xls) with your JDS product catalog.
          The system will import all products into the searchable database.
        </p>

        <div class="stats-grid" v-if="stats">
          <div class="stat-card">
            <div class="stat-value">{{ stats.totalProducts?.toLocaleString() || 0 }}</div>
            <div class="stat-label">Total Products</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats.inStockCount?.toLocaleString() || 0 }}</div>
            <div class="stat-label">In Stock</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats.localStockCount?.toLocaleString() || 0 }}</div>
            <div class="stat-label">Local Stock</div>
          </div>
        </div>

        <div class="upload-area" @click="triggerFileInput" @drop.prevent="handleDrop" @dragover.prevent>
          <input
            ref="fileInput"
            type="file"
            accept=".xlsx,.xls"
            @change="handleFileSelect"
            style="display: none"
          />

          <div v-if="!selectedFile" class="upload-placeholder">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <p>Click to select or drag and drop your Excel file here</p>
            <span class="file-types">.xlsx or .xls files only</span>
          </div>

          <div v-else class="file-selected">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <polyline points="14 2 14 8 20 8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <p class="filename">{{ selectedFile.name }}</p>
            <p class="filesize">{{ formatFileSize(selectedFile.size) }}</p>
          </div>
        </div>

        <button
          v-if="selectedFile"
          @click="handleImport"
          class="btn btn-primary"
          :disabled="importing"
        >
          {{ importing ? 'Importing...' : 'Import Products' }}
        </button>

        <div v-if="importResult" class="result-message" :class="importResult.success ? 'success' : 'error'">
          <h3>{{ importResult.success ? '✓ Import Complete' : '✗ Import Failed' }}</h3>
          <p>{{ importResult.message }}</p>
          <div v-if="importResult.success" class="import-stats">
            <span>Total: {{ importResult.total }}</span>
            <span>New: {{ importResult.imported }}</span>
            <span>Updated: {{ importResult.updated }}</span>
            <span v-if="importResult.errors > 0">Errors: {{ importResult.errors }}</span>
          </div>
        </div>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { adminAPI } from '../services/api';

const fileInput = ref(null);
const selectedFile = ref(null);
const importing = ref(false);
const importResult = ref(null);
const errorMessage = ref('');
const stats = ref(null);

const loadStats = async () => {
  try {
    stats.value = await adminAPI.getImportStats();
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
};

const triggerFileInput = () => {
  if (!importing.value) {
    fileInput.value?.click();
  }
};

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedFile.value = file;
    importResult.value = null;
    errorMessage.value = '';
  }
};

const handleDrop = (event) => {
  const file = event.dataTransfer.files[0];
  if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
    selectedFile.value = file;
    importResult.value = null;
    errorMessage.value = '';
  } else {
    errorMessage.value = 'Please drop a valid Excel file (.xlsx or .xls)';
  }
};

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const handleImport = async () => {
  if (!selectedFile.value) return;

  importing.value = true;
  errorMessage.value = '';
  importResult.value = null;

  try {
    const result = await adminAPI.importProducts(selectedFile.value);
    importResult.value = result;

    if (result.success) {
      // Reload stats after successful import
      await loadStats();
      // Reset file selection
      selectedFile.value = null;
      fileInput.value.value = '';
    }
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Import failed. Please try again.';
  } finally {
    importing.value = false;
  }
};

onMounted(() => {
  loadStats();
});
</script>

<style scoped>
.admin-page {
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

.main-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

.import-section {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.import-section h2 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 20px;
}

.instructions {
  margin: 0 0 30px 0;
  color: #666;
  font-size: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 30px;
}

.stat-card {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.upload-area {
  border: 2px dashed #ddd;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 20px;
}

.upload-area:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.upload-placeholder svg,
.file-selected svg {
  color: #667eea;
  margin-bottom: 16px;
}

.upload-placeholder p {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 16px;
}

.file-types {
  color: #999;
  font-size: 13px;
}

.filename {
  font-weight: 600;
  color: #333;
  margin: 12px 0 4px 0;
}

.filesize {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: #667eea;
  color: white;
  width: 100%;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.3);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.result-message {
  margin-top: 20px;
  padding: 16px;
  border-radius: 8px;
}

.result-message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.result-message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.result-message h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
}

.result-message p {
  margin: 0 0 12px 0;
}

.import-stats {
  display: flex;
  gap: 16px;
  font-size: 14px;
  font-weight: 600;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 12px;
  border-radius: 6px;
  margin-top: 16px;
  font-size: 14px;
}
</style>
