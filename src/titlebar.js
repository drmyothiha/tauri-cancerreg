// Temporarily comment out Tauri imports
import './database.js';
import { getCurrentWindow } from '@tauri-apps/api/window';


class TitlebarManager {
    constructor() {
        this.isMaximized = false;
        this.init();
    }

    async init() {
		this.appWindow = getCurrentWindow();
        // Check initial window state
        this.isMaximized = await this.appWindow.isMaximized();
        this.updateMaximizeButton();
        
        // Add event listeners
        this.setupEventListeners();
        
        // Setup menu interactions
        this.setupMenus();

        // Listen for window state changes
        this.setupWindowListeners();
    }

    setupModalListeners() {
        console.log('TitlebarManager: Setting up modal listeners...');
        
        // Modal close button
        const modalCloseBtn = document.getElementById('modal-close-button');
        if (modalCloseBtn) {
            console.log('TitlebarManager: Found modal close button, adding listener');
            modalCloseBtn.addEventListener('click', (e) => {
                console.log('TitlebarManager: Modal close button clicked');
                e.preventDefault();
                e.stopPropagation();
                this.closeLoginModal();
            });
        } else {
            console.error('TitlebarManager: Modal close button not found!');
        }

        // Cancel button
        const cancelBtn = document.getElementById('cancel-button');
        if (cancelBtn) {
            console.log('TitlebarManager: Found cancel button, adding listener');
            cancelBtn.addEventListener('click', (e) => {
                console.log('TitlebarManager: Cancel button clicked');
                e.preventDefault();
                e.stopPropagation();
                this.closeLoginModal();
            });
        } else {
            console.error('TitlebarManager: Cancel button not found!');
        }

        // Close modal when clicking outside
        const modalOverlay = document.getElementById('login-modal');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                console.log('TitlebarManager: Modal overlay clicked', e.target, e.currentTarget);
                if (e.target === e.currentTarget) {
                    console.log('TitlebarManager: Clicked outside modal content, closing modal');
                    this.closeLoginModal();
                }
            });
        }

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            const modal = document.getElementById('login-modal');
            if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
                console.log('TitlebarManager: Escape key pressed, closing modal');
                this.closeLoginModal();
            }
        });
    }

    setupEventListeners() {
        console.log('TitlebarManager: Setting up event listeners...');
        
        // Window control buttons
        const minimizeBtn = document.getElementById('minimize-button');
        const maximizeBtn = document.getElementById('maximize-button');
        const closeBtn = document.getElementById('close-button');

        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => {
                this.minimizeWindow();
            });
        }

        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', () => {
                this.toggleMaximize();
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeWindow();
            });
        }
    }


    setupMenus() {
        // Menu hover functionality
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('mouseenter', (e) => {
                this.closeAllMenus();
                const menuId = e.currentTarget.getAttribute('data-menu') + '-menu';
                const menu = document.getElementById(menuId);
                if (menu) {
                    menu.style.display = 'block';
                }
            });

            item.addEventListener('click', (e) => {
                const menuId = e.currentTarget.getAttribute('data-menu') + '-menu';
                const menu = document.getElementById(menuId);
                if (menu) {
                    const isVisible = menu.style.display === 'block';
                    this.closeAllMenus();
                    if (!isVisible) {
                        menu.style.display = 'block';
                    }
                }
            });
        });

        // Close menus when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.menu-item') && !e.target.closest('.menu-dropdown')) {
                this.closeAllMenus();
            }
        });

        // Menu item click handlers
        document.querySelectorAll('.menu-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const action = e.currentTarget.getAttribute('data-action');
                this.handleMenuAction(action);
                this.closeAllMenus();
            });
        });

        // Prevent menu close when clicking inside menu
        document.querySelectorAll('.menu-dropdown').forEach(menu => {
            menu.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });
    }

    // Update the handleMenuAction function to include login:
    async handleMenuAction(action) {
        console.log('Menu action:', action);
        
        switch (action) {
            case 'new-file':
                this.showNotification('Creating new file...');
                break;
            case 'open-file':
                this.showNotification('Opening file...');
                break;
            case 'save':
                this.showNotification('Saving...');
                break;
            case 'login':
                openLoginModal();
                break;
            case 'logout':
                this.logout();
                break;
            case 'exit':
                this.closeWindow();
                break;
            case 'undo':
                this.showNotification('Undo');
                break;
            case 'redo':
                this.showNotification('Redo');
                break;
            case 'cut':
                this.showNotification('Cut');
                break;
            case 'copy':
                this.showNotification('Copy');
                break;
            case 'paste':
                this.showNotification('Paste');
                break;
            case 'command-palette':
                this.showNotification('Opening command palette...');
                break;
            case 'zoom-in':
                this.showNotification('Zoom in');
                break;
            case 'zoom-out':
                this.showNotification('Zoom out');
                break;
            case 'reset-zoom':
                this.showNotification('Reset zoom');
                break;
            case 'welcome':
                // Switch to home tab
                const homeTab = document.querySelector('[data-page="home.html"]');
                if (homeTab) homeTab.click();
                break;
            case 'documentation':
                this.showNotification('Opening documentation...');
                break;
            case 'about':
                const aboutTab = document.querySelector('[data-page="about.html"]');
                if (aboutTab) aboutTab.click();
                break;
            default:
                console.log('Unknown action:', action);
        }
    }


    logout() {
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
        
        this.showNotification('Logged out successfully');
        this.updateLoginStatus();
    }

    updateLoginStatus() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const username = localStorage.getItem('username');
        
        // Update menu items based on login status
        this.updateMenuForLoginStatus(isLoggedIn);
        
        // Update app title to show logged in status
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
        // Create a simple notification
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
    await this.appWindow.minimize();
    console.log('Minimize window');
}

async toggleMaximize() {
    if (this.isMaximized) {
        await this.appWindow.unmaximize();
        this.isMaximized = false;
    } else {
        await this.appWindow.maximize();
        this.isMaximized = true;
    }
    this.updateMaximizeButton();
    console.log('Toggle maximize:', this.isMaximized);
}

async closeWindow() {
    await this.appWindow.close();
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

async handleWindowResize() {
    const currentMaximized = await this.appWindow.isMaximized();
    if (this.isMaximized !== currentMaximized) {
        this.isMaximized = currentMaximized;
        this.updateMaximizeButton();
    }
}

    async startDragging() {
        // Temporarily comment out Tauri call
        // await appWindow.startDragging();
        console.log('Start dragging');
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