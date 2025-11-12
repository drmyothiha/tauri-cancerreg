// =====================
// Modal Control Functions
// =====================
function openLoginModal() {
    const loginModal = document.getElementById('login-modal');
    if (loginModal) {
        loginModal.classList.add('show');
        document.getElementById('login-error')?.classList.add('hidden');
    }
}

function closeLoginModal() {
    const loginModal = document.getElementById('login-modal');
    if (loginModal) {
        loginModal.classList.remove('show');
        document.getElementById('login-error')?.classList.add('hidden');
    }
}

// =====================
// Login & UI Event Bindings
// =====================
document.addEventListener('DOMContentLoaded', () => {
    const loginModal = document.getElementById('login-modal');
    const cancelBtn = document.getElementById('cancel-login');
    const loginForm = document.getElementById('login-form');
    const loginMenuItem = document.getElementById('login-menu-item');

    // Open and close modal
    loginMenuItem?.addEventListener('click', openLoginModal);
    cancelBtn?.addEventListener('click', closeLoginModal);

    // Close modal when clicking outside or pressing Escape
    document.addEventListener('click', e => {
        if (e.target === loginModal) closeLoginModal();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && loginModal?.classList.contains('show')) {
            closeLoginModal();
        }
    });

    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async e => {
            e.preventDefault();
            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value.trim();
            const errorEl = document.getElementById('login-error');
            const submitBtn = loginForm.querySelector('button[type="submit"]');

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

                    updateLoginStatus();
                    showNotification(`Welcome ${username}!`, 'success');
                    closeLoginModal();

                    // Optional: reload tab if needed
                    if (window.tabManager && window.tabManager.currentTab) {
                        const currentTab = window.tabManager.currentTab;
                        if (currentTab.includes('home.html') || currentTab.includes('patients.html')) {
                            const activeButton = document.querySelector('.tab-button.active');
                            if (activeButton) window.tabManager.switchTab(activeButton);
                        }
                    }
                } else {
                    errorEl.textContent = data.message || 'Invalid credentials';
                    errorEl.classList.remove('hidden');
                }
            } catch {
                errorEl.textContent = 'Network error: Unable to connect to server';
                errorEl.classList.remove('hidden');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span class="material-icons">login</span> Login';
            }
        });
    }

    updateLoginStatus();
});

// =====================
// Update Login Status
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
            const appTitle = document.querySelector('.app-title');
            if (appTitle) appTitle.textContent = `My Tauri App (${username})`;
        } else {
            loginItem.style.display = 'flex';
            logoutItem.style.display = 'none';
            const appTitle = document.querySelector('.app-title');
            if (appTitle) appTitle.textContent = 'My Tauri App';
        }
    }
}

// =====================
// Notifications
// =====================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <span class="material-icons">close</span>
        </button>
    `;

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
    setTimeout(() => notification.remove(), 5000);
}

// =====================
// Authorized Fetch with Cache
// =====================
const API_BASE = "https://api.cancerreg.org/v1";
const CACHE_PREFIX = "apiCache:";

function getCached(endpoint, method = "GET") {
    if (method !== "GET") return null;
    const key = CACHE_PREFIX + `${method}:${endpoint}`;
    const item = localStorage.getItem(key);
    if (!item) return null;

    try {
        const { data, timestamp } = JSON.parse(item);
        if (Date.now() - timestamp > 5 * 60 * 1000) {
            localStorage.removeItem(key);
            return null;
        }
        return data;
    } catch {
        localStorage.removeItem(key);
        return null;
    }
}

function setCached(endpoint, data, method = "GET") {
    if (method !== "GET") return;
    const key = CACHE_PREFIX + `${method}:${endpoint}`;
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
}

export function clearApiCache(endpoint = null) {
    if (endpoint) {
        const keyPrefix = CACHE_PREFIX + `GET:${endpoint}`;
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(keyPrefix)) localStorage.removeItem(key);
        });
    } else {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(CACHE_PREFIX)) localStorage.removeItem(key);
        });
    }
}

async function apiFetch(endpoint, options = {}) {
    const method = (options.method || "GET").toUpperCase();
    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;

    const token = localStorage.getItem("authToken");
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const cached = getCached(endpoint, method);
    if (cached) {
        console.log("📦 Loaded from cache:", endpoint);
        return cached;
    }

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
        if (response.status === 401) {
            logout();
            openLoginModal();
        }
        const errorText = await response.text();
        throw new Error(`Request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    setCached(endpoint, data, method);
    return data;
}

// =====================
// Logout Helper
// =====================
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('authToken');
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('apiCache:')) localStorage.removeItem(key);
    });
    updateLoginStatus();
    showNotification('Logged out successfully', 'success');
}

// =====================
// Fetch & Render Helper
// =====================
async function fetchAndRender(endpoint, renderFn, forceReload = false) {
    try {
        const data = await apiFetch(endpoint, { cache: !forceReload });
        renderFn(data, null);
    } catch (err) {
        renderFn(null, `Error: ${err.message}`);
    }
}

// =====================
// Exports
// =====================
export { apiFetch, logout, updateLoginStatus };
