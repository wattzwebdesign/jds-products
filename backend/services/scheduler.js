import cron from 'node-cron';
import { autoImportProducts } from './autoImport.js';

let isImportRunning = false;
let lastImportResult = null;
let importProgress = {
  stage: null,
  processed: 0,
  total: 0,
  message: null
};

/**
 * Initialize scheduled tasks
 * Runs product import every Sunday at midnight (server time)
 */
export function initializeScheduler() {
  console.log('[Scheduler] Initializing scheduled tasks...');

  // Schedule: Every Sunday at 00:00 (midnight)
  // Cron format: '0 0 * * 0' (minute hour day month weekday)
  // 0 = Sunday, 1 = Monday, etc.
  const schedule = '0 0 * * 0';

  cron.schedule(schedule, async () => {
    console.log('[Scheduler] Triggered: Weekly product import starting...');

    if (isImportRunning) {
      console.log('[Scheduler] Import already in progress, skipping...');
      return;
    }

    try {
      isImportRunning = true;
      const result = await autoImportProducts();
      lastImportResult = result;
      console.log('[Scheduler] Weekly import completed successfully');
    } catch (error) {
      console.error('[Scheduler] Weekly import failed:', error);
      lastImportResult = {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    } finally {
      isImportRunning = false;
    }
  }, {
    timezone: 'America/New_York' // Adjust to your server's timezone
  });

  console.log('[Scheduler] Scheduled: Product import every Sunday at midnight');

  // Optional: Run a test import on startup (commented out by default)
  // Uncomment to test on server restart
  // setTimeout(async () => {
  //   console.log('[Scheduler] Running initial import on startup...');
  //   await manualImport();
  // }, 5000); // 5 seconds after startup
}

/**
 * Manually trigger import (called from admin panel)
 * Runs in background, returns immediately
 */
export function manualImport() {
  if (isImportRunning) {
    return {
      success: false,
      error: 'Import already in progress',
      isRunning: true,
      progress: importProgress
    };
  }

  // Start import in background (don't await)
  isImportRunning = true;
  importProgress = {
    stage: 'starting',
    processed: 0,
    total: 0,
    message: 'Starting import...'
  };

  // Run import async
  (async () => {
    try {
      console.log('[Scheduler] Manual import triggered');
      importProgress.stage = 'downloading';
      importProgress.message = 'Downloading CSV from JDS...';

      const result = await autoImportProducts();
      lastImportResult = result;

      importProgress.stage = 'completed';
      importProgress.message = result.message;
    } catch (error) {
      console.error('[Scheduler] Manual import failed:', error);
      const errorResult = {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
      lastImportResult = errorResult;

      importProgress.stage = 'error';
      importProgress.message = error.message;
    } finally {
      isImportRunning = false;
    }
  })();

  // Return immediately
  return {
    success: true,
    message: 'Import started in background',
    isRunning: true,
    progress: importProgress
  };
}

/**
 * Get current import status
 */
export function getImportStatus() {
  return {
    isRunning: isImportRunning,
    lastResult: lastImportResult,
    progress: isImportRunning ? importProgress : null
  };
}
