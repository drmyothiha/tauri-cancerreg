// =====================
// Authorized Fetch with Offline-First Cache
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
        if (Date.now() - timestamp > 5 * 60 * 1000) { // 5 minutes
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

async function apiFetch(endpoint, options = {}, useCache = true, cacheKey = null) {
    const method = (options.method || "GET").toUpperCase();
    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;
    const effectiveCacheKey = cacheKey || endpoint;

    console.log("🔍 apiFetch: Starting request for", endpoint);

    // Step 1: First check if there's cached data for the endpoint
    if (method === "GET" && useCache) {
        console.log("🔍 apiFetch: Checking for cached data for", effectiveCacheKey);
        const cached = getCached(effectiveCacheKey, method);
        
        if (cached) {
            console.log("✅ apiFetch: Cache HIT - Found cached data for", effectiveCacheKey);
            
            // Step 2: If online, make a background request to update the cache
            if (navigator.onLine) {
                console.log("🌐 apiFetch: Device is online - updating cache in background for", effectiveCacheKey);
                (async () => {
                    try {
                        console.log("🔄 apiFetch: Starting background network request for", effectiveCacheKey);
                        const token = localStorage.getItem("authToken");
                        const headers = {
                            "Content-Type": "application/json",
                            ...(options.headers || {}),
                        };
                        if (token) headers["Authorization"] = `Bearer ${token}`;

                        const response = await fetch(url, { ...options, headers });
                        if (response.ok) {
                            const freshData = await response.json();
                            setCached(effectiveCacheKey, freshData, method);
                            console.log("🔄 apiFetch: Background cache update successful for", effectiveCacheKey);
                        } else {
                            console.log("⚠️ apiFetch: Background request failed with status", response.status, "for", effectiveCacheKey);
                        }
                    } catch (e) {
                        console.log("⚠️ apiFetch: Background request failed with error:", e.message, "for", effectiveCacheKey);
                    }
                })();
            } else {
                console.log("📱 apiFetch: Device is offline - skipping background update for", effectiveCacheKey);
            }
            
            console.log("✅ apiFetch: Returning cached data immediately for", effectiveCacheKey);
            return cached;
        } else {
            console.log("❌ apiFetch: Cache MISS - No cached data found for", effectiveCacheKey);
        }
    }

    // Step 3: If no cache or not GET request, proceed with network request
    console.log("🌐 apiFetch: Making network request to", url);
    try {
        const token = localStorage.getItem("authToken");
        const headers = {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch(url, { ...options, headers });

        if (!response.ok) {
            console.log("❌ apiFetch: Network request failed with status", response.status, "for", endpoint);
            if (response.status === 401) {
                console.log("🔐 apiFetch: Unauthorized - logging out user for", endpoint);
                logout();
                openLoginModal();
            }
            const errorText = await response.text();
            throw new Error(`Request failed: ${response.status} ${errorText}`);
        }

        console.log("✅ apiFetch: Network request successful for", endpoint);
        const data = await response.json();
        if (method === "GET" && useCache) {
            setCached(effectiveCacheKey, data, method);
            console.log("💾 apiFetch: Saved response to cache for", effectiveCacheKey);
        }
        return data;
    } catch (error) {
        console.log("❌ apiFetch: Network request threw error:", error.message, "for", endpoint);
        
        // Step 4: If network request fails but we have cached data, return the cached data
        if (method === "GET" && useCache) {
            console.log("🔍 apiFetch: Checking for fallback cached data after network failure for", effectiveCacheKey);
            const fallback = getCached(effectiveCacheKey, method);
            if (fallback) {
                console.log("✅ apiFetch: Network failed but fallback cache found - returning cached data for", effectiveCacheKey);
                console.log("📱 apiFetch: Running in OFFLINE mode for", effectiveCacheKey);
                return fallback;
            } else {
                console.log("❌ apiFetch: Network failed and no fallback cache available for", effectiveCacheKey);
            }
        }
        
        // Step 5: If no cache exists and network fails, throw the error
        console.log("💥 apiFetch: No cache available and network failed - throwing error for", endpoint);
        throw error;
    }
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
// Exports
// =====================
export { apiFetch, logout, updateLoginStatus };