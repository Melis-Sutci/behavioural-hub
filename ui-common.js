/**
 * UI Common Utilities
 * Shared utilities for consistent UI patterns across all pages
 * Quick Win #6-10 Implementation
 */

// ============================================
// HTML ESCAPING - PREVENT XSS
// ============================================

// HTML escaping helper to prevent XSS
function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') {
    return '';
  }
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ============================================
// QUICK WIN #7: LOADING STATES
// ============================================

const LoadingStates = {
  // Show loading spinner overlay
  showPageLoading(message = 'Loading...') {
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
    overlay.innerHTML = `
      <div class="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center">
        <div class="loading-spinner w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p class="text-gray-700 font-medium">${message}</p>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  // Hide loading overlay
  hidePageLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.remove();
  },

  // Show skeleton loader for content
  showSkeletonLoader(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="animate-pulse space-y-4">
        <div class="h-4 bg-gray-200 rounded w-3/4"></div>
        <div class="h-4 bg-gray-200 rounded"></div>
        <div class="h-4 bg-gray-200 rounded w-5/6"></div>
        <div class="h-8 bg-gray-200 rounded w-1/2 mt-6"></div>
      </div>
    `;
  },

  // Show inline loading spinner
  showInlineLoader(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const originalContent = element.innerHTML;
    element.dataset.originalContent = originalContent;
    element.innerHTML = `
      <div class="flex items-center justify-center gap-2">
        <div class="loading-spinner-small w-4 h-4 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
        <span>Loading...</span>
      </div>
    `;
    element.disabled = true;
  },

  // Hide inline loader
  hideInlineLoader(elementId) {
    const element = document.getElementById(elementId);
    if (!element || !element.dataset.originalContent) return;

    element.innerHTML = element.dataset.originalContent;
    delete element.dataset.originalContent;
    element.disabled = false;
  }
};

// ============================================
// QUICK WIN #8: ERROR HANDLING
// ============================================

const ErrorHandler = {
  // Show error toast
  showError(message, duration = 5000) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-2xl z-50 flex items-center gap-3 max-w-md animate-slide-in';
    toast.innerHTML = `
      <span class="text-2xl">❌</span>
      <div class="flex-1">
        <p class="font-semibold">Error</p>
        <p class="text-sm text-red-100">${escapeHtml(message)}</p>
      </div>
      <button onclick="this.parentElement.remove()" class="text-white hover:text-red-200">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
        </svg>
      </button>
    `;
    document.body.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }
  },

  // Show success toast
  showSuccess(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl z-50 flex items-center gap-3 max-w-md animate-slide-in';
    toast.innerHTML = `
      <span class="text-2xl">✅</span>
      <div class="flex-1">
        <p class="font-semibold">Success</p>
        <p class="text-sm text-green-100">${message}</p>
      </div>
      <button onclick="this.parentElement.remove()" class="text-white hover:text-green-200">×</button>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // Show warning toast
  showWarning(message, duration = 4000) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-yellow-500 text-white px-6 py-4 rounded-lg shadow-2xl z-50 flex items-center gap-3 max-w-md animate-slide-in';
    toast.innerHTML = `
      <span class="text-2xl">⚠️</span>
      <div class="flex-1">
        <p class="font-semibold">Warning</p>
        <p class="text-sm text-yellow-100">${message}</p>
      </div>
      <button onclick="this.parentElement.remove()" class="text-white hover:text-yellow-200">×</button>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // Show error modal
  showErrorModal(title, message, details = null) {
    const modal = document.createElement('div');
    modal.id = 'error-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div class="bg-red-500 text-white p-6 rounded-t-xl flex items-center gap-3">
          <span class="text-3xl">❌</span>
          <h2 class="text-xl font-bold">${escapeHtml(title)}</h2>
        </div>
        <div class="p-6">
          <p class="text-gray-700 mb-4">${escapeHtml(message)}</p>
          ${details ? `
            <details class="text-sm text-gray-500">
              <summary class="cursor-pointer font-semibold mb-2">Technical Details</summary>
              <pre class="bg-gray-100 p-3 rounded overflow-x-auto">${escapeHtml(details)}</pre>
            </details>
          ` : ''}
        </div>
        <div class="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end gap-3">
          <button onclick="this.closest('#error-modal').remove()" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300">
            Close
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  // Handle API errors consistently
  handleApiError(error, context = 'API request') {
    console.error(`${context} failed:`, error);

    let message = 'An unexpected error occurred. Please try again.';
    let details = null;

    if (error.response) {
      // Server responded with error
      message = error.response.data?.message || `Server error: ${error.response.status}`;
      details = JSON.stringify(error.response.data, null, 2);
    } else if (error.request) {
      // Request made but no response
      message = 'Network error. Please check your connection and try again.';
      details = 'No response received from server';
    } else {
      // Something else went wrong
      message = error.message || message;
      details = error.stack;
    }

    this.showError(message);
    return { message, details };
  }
};

// ============================================
// QUICK WIN #10: VALIDATION
// ============================================

const Validator = {
  // Validate required fields
  validateRequired(value, fieldName = 'This field') {
    if (!value || value.trim() === '') {
      return { valid: false, error: `${fieldName} is required` };
    }
    return { valid: true };
  },

  // Validate email
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Please enter a valid email address' };
    }
    return { valid: true };
  },

  // Validate number range
  validateNumberRange(value, min, max, fieldName = 'Value') {
    const num = parseFloat(value);
    if (isNaN(num)) {
      return { valid: false, error: `${fieldName} must be a number` };
    }
    if (num < min || num > max) {
      return { valid: false, error: `${fieldName} must be between ${min} and ${max}` };
    }
    return { valid: true };
  },

  // Validate URL
  validateUrl(url) {
    try {
      new URL(url);
      return { valid: true };
    } catch {
      return { valid: false, error: 'Please enter a valid URL' };
    }
  },

  // Validate form
  validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return { valid: false, errors: ['Form not found'] };

    const errors = [];
    const inputs = form.querySelectorAll('[required]');

    inputs.forEach(input => {
      if (!input.value || input.value.trim() === '') {
        const label = form.querySelector(`label[for="${input.id}"]`)?.textContent || input.name;
        errors.push(`${label} is required`);
        input.classList.add('border-red-500');
      } else {
        input.classList.remove('border-red-500');
      }
    });

    return { valid: errors.length === 0, errors };
  },

  // Show validation error on input
  showFieldError(inputId, message) {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.classList.add('border-red-500');

    // Remove existing error message
    const existingError = input.parentElement.querySelector('.field-error');
    if (existingError) existingError.remove();

    // Add error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error text-sm text-red-500 mt-1';
    errorDiv.textContent = message;
    input.parentElement.appendChild(errorDiv);
  },

  // Clear validation error
  clearFieldError(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.classList.remove('border-red-500');
    const errorDiv = input.parentElement.querySelector('.field-error');
    if (errorDiv) errorDiv.remove();
  },

  // Clear all form errors
  clearFormErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.querySelectorAll('.border-red-500').forEach(el => el.classList.remove('border-red-500'));
    form.querySelectorAll('.field-error').forEach(el => el.remove());
  }
};

// ============================================
// QUICK WIN #6: UI STANDARDIZATION
// ============================================

const UIStandards = {
  // Standard colors
  colors: {
    primary: '#667eea',
    secondary: '#764ba2',
    detective: '#8B5CF6',
    victim: '#14B8A6',
    passive: '#A8A29E',
    accent: '#FB7185',
    insight: '#7C3AED'
  },

  // Standard container width
  containerClass: 'max-w-7xl mx-auto px-6',

  // Standard card hover effect
  cardHoverClass: 'transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',

  // Standard gradient background
  gradientBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',

  // Apply standard styles to elements
  applyStandardStyles() {
    // Add standard animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slide-in {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      .animate-slide-in {
        animation: slide-in 0.3s ease-out;
      }

      @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .animate-fade-in {
        animation: fade-in 0.3s ease-out;
      }

      .loading-spinner {
        border-top-color: #4f46e5;
        animation: spin 1s linear infinite;
      }

      .loading-spinner-small {
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
};

// ============================================
// API WRAPPER WITH ERROR HANDLING & LOADING
// ============================================

const API = {
  // Use the configured API URL from config.js
  get baseUrl() {
    return window.BehaviouralConfig?.API?.BASE_URL || 'http://localhost:4000/api';
  },

  // Get stored auth token
  getToken() {
    return localStorage.getItem('auth_token');
  },

  // Set auth token
  setToken(token) {
    localStorage.setItem('auth_token', token);
  },

  // Remove auth token
  clearToken() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  // Get user data
  getUser() {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  },

  // Set user data
  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  },

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        // Handle 401 Unauthorized - redirect to login
        if (response.status === 401) {
          this.clearToken();
          if (!window.location.pathname.includes('login.html')) {
            ErrorHandler.showError('Session expired. Please login again.');
            setTimeout(() => {
              window.location.href = 'login.html';
            }, 1500);
          }
        }

        const errorData = await response.json().catch(() => ({}));
        throw {
          response: {
            status: response.status,
            data: errorData
          }
        };
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  async get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  },

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
  },

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    });
  },

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'DELETE', ...options });
  }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  UIStandards.applyStandardStyles();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LoadingStates, ErrorHandler, Validator, UIStandards, API };
}
