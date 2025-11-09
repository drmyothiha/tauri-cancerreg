// =====================
// Authentication Functions
// =====================



// Close modal when clicking outside
document.addEventListener('click', e => {
    if (e.target === document.getElementById('login-modal')) {
        closeLoginModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !document.getElementById('login-modal').classList.contains('hidden')) {
        closeLoginModal();
    }
});

// Login form handler
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    if (form) {
        form.addEventListener('submit', async e => {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            const errorEl = document.getElementById('login-error');
            const submitBtn = form.querySelector('button[type="submit"]');
            
            errorEl.classList.add('hidden');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="material-icons">hourglass_empty</span> Logging in...';

            try {
                const res = await fetch('https://api.cancerreg.org/v1/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await res.json();
                
                if (res.ok && data.token) {
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('username', username);
                    localStorage.setItem('authToken', data.token);

                    // Update UI
                    updateLoginStatus();
                    showNotification(`Welcome ${username}!`);
                    
                    closeLoginModal();
                    
                    // Refresh data if needed
                    if (window.tabManager && window.tabManager.currentTab) {
                        const currentTab = window.tabManager.currentTab;
                        if (currentTab.includes('home.html') || currentTab.includes('patients.html')) {
                            // Reload the current tab data
                            const activeButton = document.querySelector('.tab-button.active');
                            if (activeButton) {
                                window.tabManager.switchTab(activeButton);
                            }
                        }
                    }

                } else {
                    errorEl.textContent = data.message || 'Invalid credentials';
                    errorEl.classList.remove('hidden');
                }
            } catch (err) {
                errorEl.textContent = 'Network error: Unable to connect to server';
                errorEl.classList.remove('hidden');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span class="material-icons">login</span> Login';
            }
        });
    }
});

// =====================
// Update Login Status in UI
// =====================
function updateLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const username = localStorage.getItem('username');
    
    const loginItem = document.getElementById('login-menu-item');
    const logoutItem = document.getElementById('logout-menu-item');
    
    if (loginItem && logoutItem) {
        if (isLoggedIn) {
            loginItem.style.display = 'none';
            logoutItem.style.display = 'flex';
            // Update app title to show logged in status
            const appTitle = document.querySelector('.app-title');
            if (appTitle) {
                appTitle.textContent = `My Tauri App (${username})`;
            }
        } else {
            loginItem.style.display = 'flex';
            logoutItem.style.display = 'none';
            // Reset app title
            const appTitle = document.querySelector('.app-title');
            if (appTitle) {
                appTitle.textContent = 'My Tauri App';
            }
        }
    }
}

// =====================
// Show Notification
// =====================
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <span class="material-icons">close</span>
        </button>
    `;
    
    // Add styles if not already added
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 60px;
                right: 20px;
                background: #333;
                color: white;
                padding: 12px 16px;
                border-radius: 4px;
                display: flex;
                align-items: center;
                gap: 10px;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            }
            .notification-success { background: #4CAF50; }
            .notification-error { background: #f44336; }
            .notification-warning { background: #ff9800; }
            .notification-close {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 0;
                display: flex;
                align-items: center;
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// =====================
// Unified API fetch with caching
// =====================
async function apiFetch(endpoint, options = {}, { cacheKey = null, forceReload = false } = {}) {
    const token = localStorage.getItem("authToken");
    const headers = options.headers || {};

    if (token) headers['Authorization'] = `Bearer ${token}`;
    headers['Content-Type'] = 'application/json';

    // Handle caching
    if (cacheKey && !forceReload) {
        const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
        if (cached) return { fromCache: true, data: cached };
    }

    try {
        const res = await fetch(endpoint, { ...options, headers });

        if (res.status === 401) {
            logout();
            openLoginModal();
            return { status: 401, data: null };
        }

        const data = await res.json();

        // Cache if cacheKey is provided and response is successful
        if (cacheKey && res.ok) {
            localStorage.setItem(cacheKey, JSON.stringify(data));
        }

        return { status: res.status, data, fromCache: false };

    } catch (err) {
        console.error('API fetch error:', err);
        return { status: 0, data: null, error: err.message };
    }
}

// =====================
// Logout helper
// =====================
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('authToken');
    
    // Clear all cached data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('dashboardData') || key.startsWith('patientsData')) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Update UI
    updateLoginStatus();
    showNotification('Logged out successfully');
}

// =====================
// Helper: fetch and render section data
// =====================
async function fetchAndRender(endpoint, cacheKey, renderFn, forceReload = false) {
    const result = await apiFetch(endpoint, {}, { cacheKey, forceReload });

    if (result.status === 401) return; // already handled in apiFetch
    if (result.error) {
        renderFn(null, `Network error: ${result.error}`);
        return;
    }

    renderFn(result.data, null, result.fromCache);
}

// =====================
// Check authentication status on page load
// =====================
document.addEventListener('DOMContentLoaded', () => {
    // Update login status when app starts
    updateLoginStatus();
});

    export { apiFetch, logout, updateLoginStatus };

