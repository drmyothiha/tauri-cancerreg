// src/titlebar.js
class TitlebarManager {
    constructor() {
        this.isMaximized = false;
        this.appWindow = null;
        this.init();
    }

    async init() {
        // Initialize Tauri API with proper error handling
        await this.initializeTauri();
        
        // Check initial window state
        if (this.appWindow && typeof this.appWindow.isMaximized === 'function') {
            this.isMaximized = await this.appWindow.isMaximized();
        }
        this.updateMaximizeButton();
        
        // Add event listeners
        this.setupEventListeners();
        
        // Setup menu interactions
        this.setupMenus();

        // Update login status
        this.updateLoginStatus();
    }

    async initializeTauri() {
        try {
            // Tauri 2.x uses different import paths
            const { appWindow } = await import('@tauri-apps/api/window');
            this.appWindow = appWindow;
            console.log('Tauri API loaded successfully');
        } catch (error) {
            console.warn('Tauri API not available, running in fallback mode:', error);
            // Create a mock appWindow for browser development
            this.appWindow = {
                minimize: () => { 
                    console.log('Minimize window');
                    return Promise.resolve();
                },
                maximize: () => { 
                    console.log('Maximize window');
                    return Promise.resolve();
                },
                unmaximize: () => { 
                    console.log('Unmaximize window');
                    return Promise.resolve();
                },
                close: () => { 
                    console.log('Close window');
                    return Promise.resolve();
                },
                isMaximized: () => {
                    console.log('Check if maximized');
                    return Promise.resolve(false);
                },
                startDragging: () => {
                    console.log('Start dragging');
                    return Promise.resolve();
                }
            };
        }
    }

    // ... rest of your methods remain the same as the previous fix
    setupModalListeners() {
        console.log('TitlebarManager: Setting up modal listeners...');
        
        const modalCloseBtn = document.getElementById('modal-close-button');
        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.closeLoginModal();
            });
        }

        const cancelBtn = document.getElementById('cancel-button');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.closeLoginModal();
            });
        }

        const modalOverlay = document.getElementById('login-modal');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) {
                    this.closeLoginModal();
                }
            });
        }

        document.addEventListener('keydown', (e) => {
            const modal = document.getElementById('login-modal');
            if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
                this.closeLoginModal();
            }
        });
    }

    setupEventListeners() {
        const minimizeBtn = document.getElementById('minimize-button');
        const maximizeBtn = document.getElementById('maximize-button');
        const closeBtn = document.getElementById('close-button');

        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => this.minimizeWindow());
        }
        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', () => this.toggleMaximize());
        }
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeWindow());
        }
    }

    setupMenus() {
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('mouseenter', (e) => {
                this.closeAllMenus();
                const menuId = e.currentTarget.getAttribute('data-menu') + '-menu';
                const menu = document.getElementById(menuId);
                if (menu) menu.style.display = 'block';
            });

            item.addEventListener('click', (e) => {
                const menuId = e.currentTarget.getAttribute('data-menu') + '-menu';
                const menu = document.getElementById(menuId);
                if (menu) {
                    const isVisible = menu.style.display === 'block';
                    this.closeAllMenus();
                    if (!isVisible) menu.style.display = 'block';
                }
            });
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.menu-item') && !e.target.closest('.menu-dropdown')) {
                this.closeAllMenus();
            }
        });

        document.querySelectorAll('.menu-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const action = e.currentTarget.getAttribute('data-action');
                this.handleMenuAction(action);
                this.closeAllMenus();
            });
        });

        document.querySelectorAll('.menu-dropdown').forEach(menu => {
            menu.addEventListener('click', (e) => e.stopPropagation());
        });
    }

    async handleMenuAction(action) {
        console.log('Menu action:', action);
        
        switch (action) {
            case 'login':
                if (typeof openLoginModal === 'function') {
                    openLoginModal();
                }
                break;
            case 'logout':
                this.logout();
                break;
            case 'exit':
                this.closeWindow();
                break;
			case 'refresh-dashboard':
            // Force reload the dashboard
            if (window.tabManager) {
                window.tabManager.switchToPage('home.html');
                // Also trigger refresh from home.js
                import('./home.js').then(mod => mod.loadRealDashboard(true));
            }
            break;
            // ... other cases
            default:
                console.log('Unknown action:', action);
        }
    }

    logout() {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        localStorage.removeItem('authToken');
        
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('dashboardData') || key.startsWith('patientsData')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        this.showNotification('Logged out successfully');
        this.updateLoginStatus();
    }

    updateLoginStatus() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const username = localStorage.getItem('username');
        
        this.updateMenuForLoginStatus(isLoggedIn);
        
        const appTitle = document.querySelector('.app-title');
        if (appTitle) {
            appTitle.textContent = isLoggedIn 
                ? `My Tauri App (${username})`
                : 'My Tauri App';
        }
    }

    updateMenuForLoginStatus(isLoggedIn) {
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

    closeAllMenus() {
        document.querySelectorAll('.menu-dropdown').forEach(menu => {
            menu.style.display = 'none';
        });
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50px;
            right: 20px;
            background: #007acc;
            color: white;
            padding: 10px 16px;
            border-radius: 4px;
            font-size: 13px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 2000);
    }

    async minimizeWindow() {
        if (this.appWindow && typeof this.appWindow.minimize === 'function') {
            await this.appWindow.minimize();
        }
        console.log('Minimize window');
    }

    async toggleMaximize() {
        if (this.appWindow && typeof this.appWindow.maximize === 'function' && typeof this.appWindow.unmaximize === 'function') {
            if (this.isMaximized) {
                await this.appWindow.unmaximize();
                this.isMaximized = false;
            } else {
                await this.appWindow.maximize();
                this.isMaximized = true;
            }
            this.updateMaximizeButton();
        }
        console.log('Toggle maximize:', this.isMaximized);
    }

    async closeWindow() {
        if (this.appWindow && typeof this.appWindow.close === 'function') {
            await this.appWindow.close();
        }
        console.log('Close window');
    }

    updateMaximizeButton() {
        const button = document.getElementById('maximize-button');
        if (button) {
            const icon = button.querySelector('span');
            if (icon) {
                icon.textContent = this.isMaximized ? '❐' : '□';
            }
        }
    }

    closeLoginModal() {
        const modal = document.getElementById('login-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
}

// Initialize titlebar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.titlebarManager = new TitlebarManager();
});

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);