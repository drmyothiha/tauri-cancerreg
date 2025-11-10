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
        setInterval(() => this.checkOnlineStatus(), 30000);
    }

    async checkOnlineStatus() {
        try {
            // Simple fetch to check connectivity
            const response = await fetch('https://www.google.com/favicon.ico', {
                method: 'HEAD',
                cache: 'no-cache'
            });
            this.handleOnlineStatusChange(response.ok);
        } catch (error) {
            this.handleOnlineStatusChange(false);
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
        // Listen for auth state changes
        // This should integrate with your existing auth system
        this.checkAuthState();
        
        // Simulate auth check every 5 seconds (replace with your actual auth system)
        setInterval(() => this.checkAuthState(), 5000);
    }

    checkAuthState() {
        // Replace this with your actual authentication check
        // For now, we'll check if user data exists in localStorage
        const userData = localStorage.getItem('currentUser');
        
        if (userData) {
            try {
                const user = JSON.parse(userData);
                this.setUser(user);
            } catch (error) {
                this.clearUser();
            }
        } else {
            this.clearUser();
        }
    }

    setUser(user) {
        this.currentUser = user;
        
        if (this.userStatusElement && this.usernameDisplay) {
            this.usernameDisplay.textContent = user.username || user.email || 'User';
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
        localStorage.setItem('currentUser', JSON.stringify(userData));
        this.setUser(userData);
    }

    // Method to manually trigger user logout
    logoutUser() {
        localStorage.removeItem('currentUser');
        this.clearUser();
    }
}

// Initialize status bar when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    const statusBarManager = new StatusBarManager();
    statusBarManager.init();
    
    // Expose to global scope for easy access
    window.statusBarManager = statusBarManager;
    
    // Example: Simulate login after 3 seconds (remove in production)
    setTimeout(() => {
        // window.statusBarManager.loginUser({ username: 'john_doe', email: 'john@example.com' });
    }, 3000);
});