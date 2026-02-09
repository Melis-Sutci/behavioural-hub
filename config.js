/**
 * Behavioural Hub - Central Configuration
 *
 * This file contains all environment-specific configurations.
 * Include this file in all HTML pages before other scripts.
 */

// Detect environment
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isProduction = !isDevelopment;

// Production API URL - Update this when you deploy your backend
// NOTE: process.env doesn't work in browser! Use a hardcoded URL for production
const PRODUCTION_API_URL = 'http://localhost:4000/api'; // Change this when deploying

// Configuration object
const BehaviouralConfig = {
  // API Configuration
  API: {
    BASE_URL: isDevelopment ? 'http://localhost:4000/api' : PRODUCTION_API_URL,
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000 // 1 second
  },

  // Feature Flags
  FEATURES: {
    ENABLE_AI_SUGGESTIONS: true,
    ENABLE_AUTO_SHIP: false, // Not yet implemented
    ENABLE_NOTIFICATIONS: false, // Not yet implemented
    ENABLE_TEAM_COLLABORATION: false, // Not yet implemented
    ENABLE_EXPORT: false, // Not yet implemented
    DEBUG_MODE: isDevelopment
  },

  // UI Configuration
  UI: {
    TOAST_DURATION: 3000, // 3 seconds
    ANIMATION_DURATION: 300, // 300ms
    ITEMS_PER_PAGE: 20,
    CHART_COLORS: {
      primary: '#8B5CF6',
      secondary: '#14B8A6',
      tertiary: '#A8A29E',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6'
    }
  },

  // Business Rules
  BUSINESS_RULES: {
    MIN_SAMPLE_SIZE: 5000,
    MIN_TEST_DURATION_DAYS: 7,
    MAX_TEST_DURATION_DAYS: 30,
    CONFIDENCE_LEVEL: 95,
    MIN_CONVERSION_RATE: 0.01, // 1%
    SMALL_SEGMENT_THRESHOLD: 0.05, // 5% of population
    SEGMENT_OVERLAP_THRESHOLD: 0.85, // 85% overlap for merge suggestion

    // Impact score thresholds
    IMPACT_HIGH: 8,
    IMPACT_MEDIUM: 4,
    IMPACT_LOW: 0,

    // Success rate thresholds
    SUCCESS_HIGH: 70,
    SUCCESS_MEDIUM: 50,
    SUCCESS_LOW: 0
  },

  // Storage Keys
  STORAGE: {
    USER_ID: 'behavioural_hub_user_id',
    SETTINGS: 'behavioural_hub_settings',
    THEME: 'behavioural_hub_theme',
    SESSION: 'behavioural_hub_session'
  },

  // Environment Info
  ENV: {
    IS_DEVELOPMENT: isDevelopment,
    IS_PRODUCTION: isProduction,
    VERSION: '0.1.0'
  }
};

// Helper Functions
const BehaviouralHelpers = {
  /**
   * Get API base URL
   */
  getApiUrl(endpoint) {
    const baseUrl = BehaviouralConfig.API.BASE_URL;
    return endpoint.startsWith('/') ? `${baseUrl}${endpoint}` : `${baseUrl}/${endpoint}`;
  },

  /**
   * Make API request with error handling and retry logic
   */
  async apiRequest(endpoint, options = {}) {
    const url = this.getApiUrl(endpoint);
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    let lastError;
    for (let attempt = 0; attempt < BehaviouralConfig.API.RETRY_ATTEMPTS; attempt++) {
      try {
        const response = await fetch(url, defaultOptions);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        lastError = error;
        if (attempt < BehaviouralConfig.API.RETRY_ATTEMPTS - 1) {
          await this.sleep(BehaviouralConfig.API.RETRY_DELAY * (attempt + 1));
        }
      }
    }

    throw lastError;
  },

  /**
   * Sleep utility for retry logic
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-orange-500',
      info: 'bg-blue-500'
    };

    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white ${colors[type] || colors.info} z-50 transition-opacity duration-300`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), BehaviouralConfig.UI.ANIMATION_DURATION);
    }, BehaviouralConfig.UI.TOAST_DURATION);
  },

  /**
   * Get impact badge configuration based on score
   */
  getImpactBadge(score) {
    if (score >= BehaviouralConfig.BUSINESS_RULES.IMPACT_HIGH) {
      return {
        color: 'green',
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
        text: 'High Impact',
        icon: '🔥'
      };
    } else if (score >= BehaviouralConfig.BUSINESS_RULES.IMPACT_MEDIUM) {
      return {
        color: 'yellow',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-700',
        text: 'Medium Impact',
        icon: '⚡'
      };
    } else {
      return {
        color: 'gray',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-700',
        text: 'Low Impact',
        icon: '📊'
      };
    }
  },

  /**
   * Get success rate color
   */
  getSuccessRateColor(rate) {
    if (rate >= BehaviouralConfig.BUSINESS_RULES.SUCCESS_HIGH) {
      return 'text-green-600';
    } else if (rate >= BehaviouralConfig.BUSINESS_RULES.SUCCESS_MEDIUM) {
      return 'text-yellow-600';
    } else {
      return 'text-red-600';
    }
  },

  /**
   * Get success rate badge
   */
  getSuccessRateBadge(rate) {
    if (rate >= BehaviouralConfig.BUSINESS_RULES.SUCCESS_HIGH) {
      return {
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
        text: 'Excellent',
        icon: '✅'
      };
    } else if (rate >= BehaviouralConfig.BUSINESS_RULES.SUCCESS_MEDIUM) {
      return {
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-700',
        text: 'Good',
        icon: '👍'
      };
    } else {
      return {
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
        text: 'Needs Improvement',
        icon: '⚠️'
      };
    }
  },

  /**
   * Check if test has enough data to be conclusive
   */
  isTestReady(sampleSize, durationDays) {
    return (
      sampleSize >= BehaviouralConfig.BUSINESS_RULES.MIN_SAMPLE_SIZE &&
      durationDays >= BehaviouralConfig.BUSINESS_RULES.MIN_TEST_DURATION_DAYS
    );
  },

  /**
   * Get test readiness warning
   */
  getTestReadinessWarning(sampleSize, durationDays) {
    const warnings = [];

    if (sampleSize < BehaviouralConfig.BUSINESS_RULES.MIN_SAMPLE_SIZE) {
      warnings.push(`Sample size too small (${sampleSize}/${BehaviouralConfig.BUSINESS_RULES.MIN_SAMPLE_SIZE})`);
    }

    if (durationDays < BehaviouralConfig.BUSINESS_RULES.MIN_TEST_DURATION_DAYS) {
      warnings.push(`Test duration too short (${durationDays}/${BehaviouralConfig.BUSINESS_RULES.MIN_TEST_DURATION_DAYS} days)`);
    }

    if (durationDays > BehaviouralConfig.BUSINESS_RULES.MAX_TEST_DURATION_DAYS) {
      warnings.push(`Test running too long (${durationDays}/${BehaviouralConfig.BUSINESS_RULES.MAX_TEST_DURATION_DAYS} days)`);
    }

    return warnings;
  },

  /**
   * Check if segment is too small
   */
  isSmallSegment(populationPercentage) {
    return populationPercentage < BehaviouralConfig.BUSINESS_RULES.SMALL_SEGMENT_THRESHOLD;
  },

  /**
   * Format currency
   */
  formatCurrency(amount) {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${Math.round(amount / 1000)}K`;
    }
    return `$${Math.round(amount)}`;
  },

  /**
   * Format percentage
   */
  formatPercentage(value, decimals = 1) {
    return `${value.toFixed(decimals)}%`;
  },

  /**
   * Calculate days between dates
   */
  daysBetween(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000;
    const firstDate = new Date(date1);
    const secondDate = new Date(date2);
    return Math.round(Math.abs((firstDate - secondDate) / oneDay));
  },

  /**
   * Check if date is recent (within 7 days)
   */
  isRecent(date, days = 7) {
    const daysDiff = this.daysBetween(new Date(), date);
    return daysDiff <= days;
  },

  /**
   * Generate unique user ID
   */
  generateUserId() {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Get or create user ID
   */
  getUserId() {
    let userId = localStorage.getItem(BehaviouralConfig.STORAGE.USER_ID);
    if (!userId) {
      userId = this.generateUserId();
      localStorage.setItem(BehaviouralConfig.STORAGE.USER_ID, userId);
    }
    return userId;
  },

  /**
   * Log debug message (only in development)
   */
  debug(...args) {
    if (BehaviouralConfig.FEATURES.DEBUG_MODE) {
      console.log('[BehaviouralHub]', ...args);
    }
  },

  /**
   * Log error
   */
  error(...args) {
    console.error('[BehaviouralHub ERROR]', ...args);
  }
};

// Make available globally
window.BehaviouralConfig = BehaviouralConfig;
window.BehaviouralHelpers = BehaviouralHelpers;

// Short alias
window.BH = BehaviouralHelpers;

// Log initialization
if (BehaviouralConfig.FEATURES.DEBUG_MODE) {
  console.log('🧠 Behavioural Hub Config Loaded', {
    version: BehaviouralConfig.ENV.VERSION,
    environment: BehaviouralConfig.ENV.IS_DEVELOPMENT ? 'development' : 'production',
    apiUrl: BehaviouralConfig.API.BASE_URL
  });
}
