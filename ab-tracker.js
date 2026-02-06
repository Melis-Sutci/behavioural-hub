/**
 * AB Testing Tracker Library
 * Simple client-side library for AB testing tracking
 */

class ABTracker {
  constructor(config = {}) {
    this.apiUrl = config.apiUrl || 'http://localhost:4000/api';
    this.userId = this._getUserId();
    this.cache = {}; // Cache variant assignments
  }

  /**
   * Get or create user ID
   * @private
   */
  _getUserId() {
    let userId = localStorage.getItem('ab_user_id');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('ab_user_id', userId);
    }
    return userId;
  }

  /**
   * Get variant assignment for an experiment
   * @param {number} experimentId - Experiment ID
   * @returns {Promise<Object>} Variant object
   */
  async getVariant(experimentId) {
    // Check cache first
    if (this.cache[experimentId]) {
      return this.cache[experimentId];
    }

    try {
      const response = await fetch(
        `${this.apiUrl}/experiments/${experimentId}/assign?user_id=${this.userId}`
      );
      const result = await response.json();

      if (result.success) {
        // Parse config if it's a string
        if (typeof result.data.config === 'string') {
          result.data.config = JSON.parse(result.data.config);
        }

        // Cache the variant
        this.cache[experimentId] = result.data;

        // Auto-track view event
        await this.track(experimentId, result.data.id, 'view');

        return result.data;
      } else {
        console.error('Failed to get variant:', result.error);
        return null;
      }
    } catch (error) {
      console.error('Error getting variant:', error);
      return null;
    }
  }

  /**
   * Track an event
   * @param {number} experimentId - Experiment ID
   * @param {number} variantId - Variant ID
   * @param {string} eventType - Event type (view, click, conversion, etc.)
   * @param {Object} eventData - Additional event data
   * @returns {Promise<Object>} Result object
   */
  async track(experimentId, variantId, eventType, eventData = {}) {
    try {
      const response = await fetch(`${this.apiUrl}/events/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          experiment_id: experimentId,
          variant_id: variantId,
          user_id: this.userId,
          event_type: eventType,
          event_data: eventData
        })
      });

      const result = await response.json();

      if (!result.success) {
        console.error('Failed to track event:', result.error);
      }

      return result;
    } catch (error) {
      console.error('Error tracking event:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Track a click event
   * @param {number} experimentId - Experiment ID
   * @param {number} variantId - Variant ID
   * @param {Object} eventData - Additional event data
   */
  async trackClick(experimentId, variantId, eventData = {}) {
    return this.track(experimentId, variantId, 'click', eventData);
  }

  /**
   * Track a conversion event
   * @param {number} experimentId - Experiment ID
   * @param {number} variantId - Variant ID
   * @param {Object} eventData - Additional event data (e.g., {amount: 9.99})
   */
  async trackConversion(experimentId, variantId, eventData = {}) {
    return this.track(experimentId, variantId, 'conversion', eventData);
  }

  /**
   * Track a custom event
   * @param {number} experimentId - Experiment ID
   * @param {number} variantId - Variant ID
   * @param {string} eventType - Custom event type
   * @param {Object} eventData - Additional event data
   */
  async trackCustom(experimentId, variantId, eventType, eventData = {}) {
    return this.track(experimentId, variantId, eventType, eventData);
  }

  /**
   * Helper: Run an experiment and apply variant config
   * @param {number} experimentId - Experiment ID
   * @param {Function} callback - Callback function that receives variant config
   * @returns {Promise<Object>} Variant object
   */
  async run(experimentId, callback) {
    const variant = await this.getVariant(experimentId);

    if (variant && callback) {
      callback(variant.config, variant);
    }

    return variant;
  }

  /**
   * Get current user ID
   * @returns {string} User ID
   */
  getUserId() {
    return this.userId;
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache() {
    this.cache = {};
  }
}

// Export for use in browser
if (typeof window !== 'undefined') {
  window.ABTracker = ABTracker;
}

// Export for use in Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ABTracker;
}
