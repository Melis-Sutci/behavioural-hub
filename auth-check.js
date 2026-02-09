/**
 * Auth Check - Include this in protected pages
 * Add this script BEFORE other scripts that make API calls
 */

(function() {
  // Skip auth check on login page
  if (window.location.pathname.includes('login.html')) {
    return;
  }

  // Check if user is authenticated
  const token = localStorage.getItem('auth_token');
  const user = localStorage.getItem('user');

  if (!token || !user) {
    // Not authenticated - redirect to login
    console.warn('No authentication found. Redirecting to login...');
    window.location.href = 'login.html';
    return;
  }

  // Optional: Add user info to page
  try {
    const userData = JSON.parse(user);
    console.log('Authenticated as:', userData.email, '(', userData.role, ')');

    // Add logout button if not exists
    document.addEventListener('DOMContentLoaded', () => {
      // Check if logout button already exists
      if (!document.getElementById('logout-btn-container')) {
        const logoutContainer = document.createElement('div');
        logoutContainer.id = 'logout-btn-container';
        logoutContainer.className = 'fixed top-4 right-4 z-50';
        logoutContainer.innerHTML = `
          <div class="flex items-center gap-3 bg-white rounded-lg shadow-lg px-4 py-2">
            <div class="text-sm">
              <p class="font-semibold text-gray-800">${userData.full_name || userData.email}</p>
              <p class="text-xs text-gray-500">${userData.role}</p>
            </div>
            <button
              id="logout-btn"
              onclick="handleLogout()"
              class="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition"
            >
              Logout
            </button>
          </div>
        `;
        document.body.appendChild(logoutContainer);
      }
    });
  } catch (e) {
    console.error('Error parsing user data:', e);
  }

  // Global logout handler
  window.handleLogout = async function() {
    if (!confirm('Are you sure you want to logout?')) {
      return;
    }

    try {
      // Call logout API (optional - to invalidate refresh token)
      await fetch('http://localhost:4000/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }).catch(() => {}); // Ignore errors

      // Clear local storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');

      // Redirect to login
      window.location.href = 'login.html';
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout anyway
      localStorage.clear();
      window.location.href = 'login.html';
    }
  };
})();
