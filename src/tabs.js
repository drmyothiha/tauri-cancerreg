class TabManager {
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
            // Load and display the page
            const content = await this.loadPage(page);
            this.displayContent(content);
            this.currentTab = page;
        } catch (error) {
            this.showError(`Failed to load ${page}`, error);
        }
    }

    updateActiveButton(activeButton) {
        // Remove active class from all buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to clicked button
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

        // Add event listener to retry button
        const retryButton = container.querySelector('.retry-button');
        if (retryButton) {
            retryButton.addEventListener('click', () => {
                const activeButton = document.querySelector('.tab-button.active');
                if (activeButton) {
                    this.switchTab(activeButton);
                }
            });
        }
    }

    async loadPage(page) {
        // Check cache first
        if (this.cache.has(page)) {
            return this.cache.get(page);
        }

        // Fetch the page
fetch("app://localhost/pages/home.html")
  .then(r => r.text())
  .then(html => {
    document.querySelector(".welcome-message").innerHTML = html;
  })
  .catch(err => {
  document.body.innerHTML += `<pre style="color:red">${err}</pre>`;
});


        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const content = await response.text();
        
        // Cache the content
        this.cache.set(page, content);
        
        return content;
    }

    displayContent(content) {
        const container = document.getElementById('content-container');
        if (!container) return;
        
        container.innerHTML = content;
        
        // Execute any scripts in the loaded content
        this.executeScripts(container);
    }

    executeScripts(container) {
        const scripts = container.querySelectorAll('script');
        scripts.forEach(script => {
            const newScript = document.createElement('script');
            if (script.src) {
                newScript.src = script.src;
            } else {
                newScript.textContent = script.textContent;
            }
            document.body.appendChild(newScript);
            document.body.removeChild(newScript);
        });
    }

    // Utility method to switch tabs by page name
    switchToPage(pageName) {
        const button = document.querySelector(`[data-page="${pageName}"]`);
        if (button) {
            this.switchTab(button);
        }
    }

    // Clear cache if needed
    clearCache() {
        this.cache.clear();
    }
}

// Initialize tab manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.tabManager = new TabManager();
});