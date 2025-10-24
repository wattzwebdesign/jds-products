<template>
  <div class="admin-page">
    <header class="header">
      <div class="header-content">
        <h1>Admin - Product Import</h1>
        <router-link to="/products" class="btn btn-secondary">← Back to Products</router-link>
      </div>
    </header>

    <main class="main-content">
      <!-- Automatic Sync Section -->
      <div class="import-section sync-section">
        <h2>Automatic Product Sync</h2>
        <p class="instructions">
          Sync products directly from JDS master data.
          Scheduled to run automatically every Sunday at midnight.
        </p>

        <!-- Sync Status - Only show when NOT running -->
        <div class="sync-info" v-if="syncStatus && !syncStatus.isRunning">
          <div class="sync-status-item">
            <span class="label">Last Sync:</span>
            <span class="value">{{ syncStatus.lastSyncTimeFormatted || 'Never' }}</span>
          </div>
          <div class="sync-status-item" v-if="syncStatus.lastResult">
            <span class="status-badge" :class="syncStatus.lastResult.success ? 'success' : 'error'">
              {{ syncStatus.lastResult.success ? 'Last sync successful' : 'Last sync failed' }}
            </span>
          </div>
        </div>

        <!-- Active Sync Progress -->
        <div v-if="syncStatus?.isRunning" class="sync-progress-container">
          <div class="progress-header">
            <div class="spinner-large"></div>
            <div class="progress-text">
              <h3>Syncing Products...</h3>
              <p>{{ syncStatus.progress?.message || 'Starting sync...' }}</p>
            </div>
          </div>
          <div class="progress-bar">
            <div class="progress-bar-fill"></div>
          </div>
          <p class="progress-note">This may take 5-10 minutes for large catalogs. You can leave this page.</p>
        </div>

        <button
          @click="handleSyncNow"
          class="btn btn-sync"
          :disabled="syncing || syncStatus?.isRunning"
          v-if="!syncStatus?.isRunning"
        >
          Sync from JDS Now
        </button>

        <div v-if="syncResult && !syncing" class="result-message" :class="syncResult.success ? 'success' : 'error'">
          <h3>{{ syncResult.success ? '✓ Sync Complete' : '✗ Sync Failed' }}</h3>
          <p>{{ syncResult.message || syncResult.error }}</p>
          <div v-if="syncResult.success && syncResult.total" class="import-stats">
            <span>Total: {{ syncResult.total }}</span>
            <span>New: {{ syncResult.imported }}</span>
            <span>Updated: {{ syncResult.updated }}</span>
            <span v-if="syncResult.errors > 0">Errors: {{ syncResult.errors }}</span>
            <span v-if="syncResult.duration">Duration: {{ syncResult.duration }}</span>
          </div>
        </div>
      </div>

      <!-- Manual Excel Import Section -->
      <div class="import-section">
        <h2>Manual Import from Excel</h2>
        <p class="instructions">
          Upload an Excel file (.xlsx or .xls) with your JDS product catalog.
          Use this for one-time imports or custom product data.
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
import { ref, onMounted, onUnmounted } from 'vue';
import { adminAPI } from '../services/api';

const fileInput = ref(null);
const selectedFile = ref(null);
const importing = ref(false);
const importResult = ref(null);
const errorMessage = ref('');
const stats = ref(null);

// Sync state
const syncing = ref(false);
const syncResult = ref(null);
const syncStatus = ref(null);
let statusPollingInterval = null;

const loadStats = async () => {
  try {
    stats.value = await adminAPI.getImportStats();
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
};

const loadSyncStatus = async () => {
  try {
    syncStatus.value = await adminAPI.getSyncStatus();

    // Update syncing state based on server status
    syncing.value = syncStatus.value?.isRunning || false;

    // If sync just completed, show result
    if (!syncStatus.value?.isRunning && syncStatus.value?.lastResult) {
      if (!syncResult.value || syncResult.value.startTime !== syncStatus.value.lastResult.startTime) {
        syncResult.value = syncStatus.value.lastResult;

        // Reload stats if sync was successful
        if (syncStatus.value.lastResult.success) {
          await loadStats();
        }

        // Stop polling
        if (statusPollingInterval) {
          clearInterval(statusPollingInterval);
          statusPollingInterval = null;
        }
      }
    }
  } catch (error) {
    console.error('Failed to load sync status:', error);
  }
};

const startStatusPolling = () => {
  // Poll every 2 seconds while sync is running
  if (!statusPollingInterval) {
    statusPollingInterval = setInterval(() => {
      loadSyncStatus();
    }, 2000);
  }
};

const handleSyncNow = async () => {
  syncResult.value = null;

  try {
    const result = await adminAPI.syncNow();

    if (result.isRunning || (result.success && result.message && result.message.includes('background'))) {
      // Sync started successfully in background
      syncing.value = true;

      // Don't set syncResult yet - wait for actual completion
      // Start polling for status updates
      startStatusPolling();
    } else if (result.success === false && result.error) {
      // Sync failed to start (e.g., already running)
      syncResult.value = result;
    } else {
      // Immediate result (shouldn't happen with background processing)
      syncResult.value = result;
    }
  } catch (error) {
    syncing.value = false;
    syncResult.value = {
      success: false,
      error: error.response?.data?.message || error.response?.data?.error || 'Sync failed. Please try again.'
    };
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
  loadSyncStatus();
});

onUnmounted(() => {
  // Clear polling interval when component unmounts
  if (statusPollingInterval) {
    clearInterval(statusPollingInterval);
    statusPollingInterval = null;
  }
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
  margin-bottom: 30px;
}

.sync-section {
  background: #667eea;
  color: white;
  border-left: 4px solid #5568d3;
}

.sync-section h2 {
  color: white;
}

.sync-section .instructions {
  color: rgba(255, 255, 255, 0.95);
}

.sync-info {
  background: rgba(255, 255, 255, 0.15);
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.sync-status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.sync-status-item:last-child {
  margin-bottom: 0;
}

.sync-status-item .label {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.sync-status-item .value {
  color: white;
  font-size: 14px;
}

.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
}

.status-badge.success {
  background: #28a745;
  color: white;
}

.status-badge.error {
  background: #dc3545;
  color: white;
}

.sync-progress-container {
  background: rgba(255, 255, 255, 0.2);
  padding: 30px;
  border-radius: 12px;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.progress-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.spinner-large {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  flex-shrink: 0;
}

.progress-text h3 {
  margin: 0 0 8px 0;
  color: white;
  font-size: 20px;
  font-weight: 600;
}

.progress-text p {
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
  font-weight: 500;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-bar-fill {
  height: 100%;
  background: white;
  animation: progress-indeterminate 1.5s ease-in-out infinite;
  width: 30%;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

@keyframes progress-indeterminate {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(400%);
  }
}

.progress-note {
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  text-align: center;
  font-style: italic;
}

.btn-sync {
  background: white;
  color: #667eea;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 700;
}

.btn-sync:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.3);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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
