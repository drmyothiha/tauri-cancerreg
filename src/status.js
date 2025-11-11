// src/status.js
class StatusBarManager {
    constructor() {
        this.isOnline = true;
        this.currentUser = null;
        this.onlineStatusElement = document.getElementById('online-status');
        this.userStatusElement = document.getElementById('user-status');
        this.usernameDisplay = document.getElementById('username-display');
    }

    init() {
        this.setupOnlineStatusChecker();
        this.setupAuthListener();
        console.log('🟢 StatusBarManager initialized');
    }

    setupOnlineStatusChecker() {
        // Check initial online status
        this.checkOnlineStatus();
        
        // Listen for online/offline events
        window.addEventListener('online', () => this.handleOnlineStatusChange(true));
        window.addEventListener('offline', () => this.handleOnlineStatusChange(false));
        
        // Periodic check (every 30 seconds)
        setInterval(() => this.checkOnlineStatus(), 300000000);
    }

    async checkOnlineStatus() {
        try {
            // Check your API endpoint instead of Google
            const response = await fetch('https://api.cancerreg.org', {
                method: 'GET',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            // If API returns health check or status endpoint
            this.handleOnlineStatusChange(response.ok);
        } catch (error) {
            // Try a simpler endpoint if health check doesn't exist
            try {
                const fallbackResponse = await fetch('https://api.cancerreg.org', {
                    method: 'HEAD',
                    cache: 'no-cache'
                });
                this.handleOnlineStatusChange(fallbackResponse.ok);
            } catch (fallbackError) {
                this.handleOnlineStatusChange(false);
            }
        }
    }

    handleOnlineStatusChange(online) {
        this.isOnline = online;
        
        if (this.onlineStatusElement) {
            if (online) {
                this.onlineStatusElement.innerHTML = '<span class="status-icon">🌐</span><span class="status-text">Online</span>';
                this.onlineStatusElement.classList.add('status-online');
                this.onlineStatusElement.classList.remove('status-offline');
            } else {
                this.onlineStatusElement.innerHTML = '<span class="status-icon">🔴</span><span class="status-text">Offline</span>';
                this.onlineStatusElement.classList.add('status-offline');
                this.onlineStatusElement.classList.remove('status-online');
            }
        }
        
        console.log(`Network status: ${online ? 'Online' : 'Offline'}`);
    }

    setupAuthListener() {
        // Listen for auth state changes using localStorage events
        window.addEventListener('storage', (e) => {
            if (e.key === 'isLoggedIn' || e.key === 'username' || e.key === 'authToken') {
                this.checkAuthState();
            }
        });
        
        // Check auth state on initialization
        this.checkAuthState();
        
        // Periodic check (every 5 seconds) as backup
        setInterval(() => this.checkAuthState(), 5000);
    }

    checkAuthState() {
        // Use the same auth check as in auth.js
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const username = localStorage.getItem('username');
        
        if (isLoggedIn && username) {
            this.setUser({ username: username });
        } else {
            this.clearUser();
        }
    }

    setUser(user) {
        this.currentUser = user;
        
        if (this.userStatusElement && this.usernameDisplay) {
            this.usernameDisplay.textContent = user.username;
            this.userStatusElement.style.display = 'flex';
        }
        
        // Update login/logout menu items
        this.updateMenuItems(true);
        console.log(`👤 User logged in: ${user.username}`);
    }

    clearUser() {
        this.currentUser = null;
        
        if (this.userStatusElement) {
            this.userStatusElement.style.display = 'none';
        }
        
        // Update login/logout menu items
        this.updateMenuItems(false);
        console.log('👤 User logged out');
    }

    updateMenuItems(isLoggedIn) {
        // This method is kept for consistency, but auth.js handles this now
        // You might want to remove this and let auth.js handle menu updates
        const loginItem = document.getElementById('login-menu-item');
        const logoutItem = document.getElementById('logout-menu-item');
        
        if (loginItem && logoutItem) {
            if (isLoggedIn) {
                loginItem.style.display = 'none';
                logoutItem.style.display = 'flex';
            } else {
                loginItem.style.display = 'flex';
                logoutItem.style.display = 'none';
            }
        }
    }

    // Method to manually trigger user login (call this when your auth completes)
    loginUser(userData) {
        // This is now handled by auth.js, but keeping for compatibility
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', userData.username);
        // Don't set authToken here as it should come from login response
        
        this.setUser(userData);
    }

    // Method to manually trigger user logout
    logoutUser() {
        // This is now handled by auth.js, but keeping for compatibility
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        localStorage.removeItem('authToken');
        
        this.clearUser();
    }
    
    // Get current status for other modules
    getStatus() {
        return {
            isOnline: this.isOnline,
            isLoggedIn: this.currentUser !== null,
            username: this.currentUser?.username || null
        };
    }
}

// Initialize status bar when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    const statusBarManager = new StatusBarManager();
    statusBarManager.init();
    
    // Expose to global scope for easy access
    window.statusBarManager = statusBarManager;
    
    // Listen to auth state changes from auth.js through localStorage
    // This ensures consistency between auth.js and status.js
});