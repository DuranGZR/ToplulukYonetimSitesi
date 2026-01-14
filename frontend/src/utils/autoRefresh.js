/**
 * Auto-refresh utility with exponential backoff
 * Prevents infinite loops and excessive API calls on errors
 */

export class AutoRefresh {
  constructor(fetchFunction, interval = 30000) {
    this.fetchFunction = fetchFunction;
    this.baseInterval = interval;
    this.currentInterval = interval;
    this.maxInterval = interval * 8; // Max 4 minutes
    this.retryCount = 0;
    this.maxRetries = 5;
    this.timerId = null;
    this.isRunning = false;
  }

  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.scheduleNext();
  }

  stop() {
    this.isRunning = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.resetBackoff();
  }

  scheduleNext() {
    if (!this.isRunning) return;

    this.timerId = setTimeout(async () => {
      try {
        await this.fetchFunction();
        
        // Success - reset backoff
        this.resetBackoff();
        
        // Schedule next refresh
        this.scheduleNext();
      } catch (error) {
        console.error('Auto-refresh failed:', error);
        
        this.retryCount++;
        
        if (this.retryCount >= this.maxRetries) {
          console.error(`Auto-refresh stopped after ${this.maxRetries} failures`);
          this.stop();
          return;
        }
        
        // Apply exponential backoff
        this.currentInterval = Math.min(
          this.currentInterval * 2,
          this.maxInterval
        );
        
        console.log(`Retrying in ${this.currentInterval / 1000}s (attempt ${this.retryCount}/${this.maxRetries})`);
        
        // Schedule next retry
        this.scheduleNext();
      }
    }, this.currentInterval);
  }

  resetBackoff() {
    this.currentInterval = this.baseInterval;
    this.retryCount = 0;
  }

  updateInterval(newInterval) {
    this.baseInterval = newInterval;
    if (this.retryCount === 0) {
      this.currentInterval = newInterval;
    }
  }
}

/**
 * React hook for auto-refresh with error handling
 * @param {Function} fetchFn - Async function to call periodically
 * @param {number} interval - Refresh interval in milliseconds (default: 30000)
 * @param {Array} dependencies - Dependencies array like useEffect
 */
export const useAutoRefresh = (fetchFn, interval = 30000, dependencies = []) => {
  const { useEffect, useRef } = require('react');
  const refresherRef = useRef(null);

  useEffect(() => {
    // Create refresher instance
    refresherRef.current = new AutoRefresh(fetchFn, interval);
    refresherRef.current.start();

    // Cleanup on unmount
    return () => {
      if (refresherRef.current) {
        refresherRef.current.stop();
      }
    };
  }, dependencies);

  return refresherRef.current;
};
