// src/titlebar.js

/**
 * TitlebarManager - Handles frameless window controls for Tauri applications
 * Simplified version for Tauri 2.9+ with global Tauri API enabled
 */
class TitlebarManager {
  constructor() {
    // Track window maximize state
    this.isMaximized = false;
    // Reference to the Tauri window object
    this.appWindow = null;
    // Initialize Tauri API and set up window controls
    this.initializeTauri();
  }

  /**
   * Initialize Tauri window API and set up event listeners
   * This assumes Tauri is always available (remove browser mock logic)
   */
  initializeTauri() {
    try {
      // Access Tauri window API through global object
      // Requires "withGlobalTauri": true in tauri.conf.json
      const { getCurrentWindow } = window.__TAURI__.window;
      
      // Get the current application window instance
      this.appWindow = getCurrentWindow();
      
      // Set up all window control event listeners
      this.setupEventListeners();
      
      // Initialize window state and UI
      this.initializeWindowState();
      
    } catch (error) {
      // Log error but don't provide fallback - we're in Tauri environment
      console.error('Failed to initialize Tauri window API:', error);
    }
  }

  /**
   * Initialize window state by checking current maximize status
   */
  async initializeWindowState() {
    try {
      // Get current window maximize state from Tauri API
      this.isMaximized = await this.appWindow.isMaximized();
      // Update UI to reflect current window state
      this.updateMaximizeButton();
    } catch (error) {
      // Fallback to false if unable to get window state
      this.isMaximized = false;
    }
  }

  /**
   * Set up event listeners for window control buttons
   */
  setupEventListeners() {
    // Minimize button - reduces window to taskbar
    const minimizeBtn = document.getElementById('minimize-button');
    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', () => this.minimizeWindow());
    }

    // Maximize/Restore button - toggles between maximized and normal state
    const maximizeBtn = document.getElementById('maximize-button');
    if (maximizeBtn) {
      maximizeBtn.addEventListener('click', () => this.toggleMaximize());
    }

    // Close button - terminates the application
    const closeBtn = document.getElementById('close-button');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeWindow());
    }
  }

  /**
   * Minimize the window to taskbar
   */
  async minimizeWindow() {
    try {
      await this.appWindow.minimize();
    } catch (error) {
      console.error('Failed to minimize window:', error);
    }
  }

  /**
   * Toggle between maximized and normal window state
   */
  async toggleMaximize() {
    try {
      if (this.isMaximized) {
        // Restore window to normal size and position
        await this.appWindow.unmaximize();
        this.isMaximized = false;
      } else {
        // Maximize window to fill the entire screen
        await this.appWindow.maximize();
        this.isMaximized = true;
      }
      // Update button UI to reflect new state
      this.updateMaximizeButton();
    } catch (error) {
      console.error('Failed to toggle maximize:', error);
    }
  }

  /**
   * Close the application window
   */
  async closeWindow() {
    try {
      await this.appWindow.close();
    } catch (error) {
      console.error('Failed to close window:', error);
    }
  }

  /**
   * Update the maximize button UI to reflect current window state
   * Uses different symbols for maximized vs normal state
   */
  updateMaximizeButton() {
    const button = document.getElementById('maximize-button');
    if (!button) return;
    
    const icon = button.querySelector('span');
    if (!icon) return;
    
    // Change icon based on window state:
    // '❐' - Restore icon (when window is maximized)
    // '□' - Maximize icon (when window is normal)
    icon.textContent = this.isMaximized ? '❐' : '□';
  }

  /**
   * Set up application menu system
   * Handles hover and click events for menu items
   */
  setupMenus() {
    // Add hover event listeners to all menu items
    document.querySelectorAll('.menu-item').forEach(item => {
      // Show menu on mouse hover
      item.addEventListener('mouseenter', (e) => {
        this.closeAllMenus();
        const menuId = e.currentTarget.getAttribute('data-menu') + '-menu';
        const menu = document.getElementById(menuId);
        if (menu) menu.style.display = 'block';
      });

      // Toggle menu on click
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

    // Close menus when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.menu-item') && !e.target.closest('.menu-dropdown')) {
        this.closeAllMenus();
      }
    });

    // Handle menu option selections
    document.querySelectorAll('.menu-option').forEach(option => {
      option.addEventListener('click', (e) => {
        const action = e.currentTarget.getAttribute('data-action');
        this.handleMenuAction(action);
        this.closeAllMenus();
      });
    });
  }

  /**
   * Close all open menu dropdowns
   */
  closeAllMenus() {
    document.querySelectorAll('.menu-dropdown').forEach(menu => {
      menu.style.display = 'none';
    });
  }

  /**
   * Handle menu action selections
   * @param {string} action - The action identifier from data-action attribute
   */
  handleMenuAction(action) {
    // Implement specific actions based on the action parameter
    // Example: if (action === 'preferences') { ... }
  }

  /**
   * Set up modal dialog listeners (placeholder for implementation)
   */
  setupModalListeners() {
    // Add modal dialog event listeners here
  }

  /**
   * Update login status UI (placeholder for implementation)
   */
  updateLoginStatus() {
    // Update login/logout UI based on authentication state
  }
}

/**
 * Initialize the titlebar manager when DOM is fully loaded
 */
window.addEventListener('DOMContentLoaded', () => {
  // Create and initialize the titlebar manager
  const manager = new TitlebarManager();
  
  // Expose manager globally for debugging or external access
  window.titlebarManager = manager;
});