// src/tabs.js
import { loadRealDashboard, initHomePage } from './home.js';
import { initPatients, initPatientsPage, exportToExcel, editPatient, deletePatient } from './patients.js';

export class TabManager {
    constructor() {
        this.currentTab = null;
        this.cache = new Map();
        this.init();
    }

    init() {
        // Add click listeners to all tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.closest('.tab-button'));
            });
        });

        // Load home page by default
        const homeButton = document.querySelector('[data-page="home.html"]');
        if (homeButton) {
            this.switchTab(homeButton);
        }
    }

    async switchTab(button) {
        if (!button) return;
        const page = button.getAttribute('data-page');

        // Don't reload if already active
        if (this.currentTab === page) return;

        // Update UI
        this.updateActiveButton(button);

        // Show loading state
        this.showLoading();

        try {
            // Load page content
            const content = await this.loadPage(page);
            this.displayContent(content);
            this.currentTab = page;

            if (page === 'home.html') {
                // Use setTimeout to ensure DOM elements exist
                setTimeout(() => {
                    loadRealDashboard(false);
                }, 0);
            } else if (page === 'patients.html') {
                // Initialize patients page
                setTimeout(() => {
                    initPatientsPage();
                }, 0);
            }

        } catch (error) {
            this.showError(`Failed to load ${page}`, error);
        }
    }

    updateActiveButton(activeButton) {
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        activeButton.classList.add('active');
    }

    showLoading() {
        const container = document.getElementById('content-container');
        if (!container) return;
        container.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Loading...</p>
            </div>
        `;
    }

    showError(message, error) {
        console.error('Tab loading error:', error);
        const container = document.getElementById('content-container');
        if (!container) return;
        container.innerHTML = `
            <div class="error-message">
                <h3>⚠️ Oops!</h3>
                <p>${message}</p>
                <button class="retry-button">Try Again</button>
            </div>
        `;
        const retryButton = container.querySelector('.retry-button');
        if (retryButton) {
            retryButton.addEventListener('click', () => {
                const activeButton = document.querySelector('.tab-button.active');
                if (activeButton) this.switchTab(activeButton);
            });
        }
    }

    async loadPage(page) {
        if (this.cache.has(page)) return this.cache.get(page);

        const response = await fetch(`pages/${page}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const content = await response.text();
        this.cache.set(page, content);
        return content;
    }

    displayContent(content) {
        const container = document.getElementById('content-container');
        if (!container) return;
        container.innerHTML = content;
        this.executeScripts(container);
    }

    executeScripts(container) {
        const scripts = container.querySelectorAll('script');
        scripts.forEach(script => {
            const newScript = document.createElement('script');
            if (script.src) newScript.src = script.src;
            else newScript.textContent = script.textContent;
            document.body.appendChild(newScript);
            document.body.removeChild(newScript);
        });
    }

    switchToPage(pageName) {
        const button = document.querySelector(`[data-page="${pageName}"]`);
        if (button) this.switchTab(button);
    }

    clearCache() {
        this.cache.clear();
    }
    
    // Method to refresh the current page if it's home
    refreshCurrentPage() {
        if (this.currentTab === 'home.html') {
            loadRealDashboard(true); // force reload
        } else if (this.currentTab === 'patients.html') {
            initPatients(true); // force reload
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.tabManager = new TabManager();
    
    // Expose the loadRealDashboard function globally so titlebar can call it
    window.loadRealDashboard = loadRealDashboard;
    window.refreshCurrentPage = () => {
        if (window.tabManager) {
            window.tabManager.refreshCurrentPage();
        }
    };
    
    // Also expose patients functions globally for use in HTML onclick attributes
    window.patientsModule = {
        initPatients,
        exportToExcel,
        editPatient,
        deletePatient
    };
});