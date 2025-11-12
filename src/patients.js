// src/patients.js
import { apiFetch } from './auth.js';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';

// Global variable for Tabulator instance
let patientsTable = null;

// =====================
// Patients Data Loading
// =====================
export async function initPatients(forceReload = true) {
    const loadingEl = document.getElementById("patients-loading");
    const errorEl = document.getElementById("patients-error");
    const tableContainer = document.getElementById("patients-table");

    if (loadingEl) loadingEl.classList.remove("hidden");
    if (errorEl) errorEl.classList.add("hidden");
    if (tableContainer) tableContainer.style.opacity = "0.5";

    try {
        const patientsData = await apiFetch('/pts', {}, true, 'patientsListData', forceReload);
        console.log("Loaded patients:", patientsData?.length || 0, "records");

        initializeTabulator(patientsData || []);
        showNotification("Patients loaded successfully!", "success");
    } catch (err) {
        console.error("Failed to load patients:", err);
        if (loadingEl) loadingEl.classList.add("hidden");
        if (errorEl) errorEl.classList.remove("hidden");
        const errorMsg = document.getElementById("error-message");
        if (errorMsg) errorMsg.textContent = "Failed to load patients: " + err.message;
    } finally {
        if (loadingEl) loadingEl.classList.add("hidden");
        if (tableContainer) tableContainer.style.opacity = "1";
    }
}


// =====================
// Tabulator Initialization
// =====================
function initializeTabulator(patientsData) {
    const tableContainer = document.getElementById("patients-table");
    
    // Destroy existing table if it exists
    if (patientsTable) {
        patientsTable.destroy();
    }

const columns = [
    { title: "No", field: "cancer_registry_id", widthGrow: 1, headerFilter: "input", headerFilterPlaceholder: "Search Reg ID..." },
    { title: "Name", field: "Name", widthGrow: 2, headerFilter: "input", headerFilterPlaceholder: "Search name..." },
    { 
        title: "Sex", field: "Sex", widthGrow: 1, hozAlign: "center",
        headerFilter: "input", headerFilterPlaceholder: "Filter sex...",
        formatter: cell => (cell.getValue() ? cell.getValue().toUpperCase() : '-')
    },
    { title: "Date of Birth", field: "dob", widthGrow: 1.5, headerFilter: "input", headerFilterPlaceholder: "Filter DOB..." },
    { title: "Disease", field: "Disease", widthGrow: 3, headerFilter: "input", headerFilterPlaceholder: "Search disease..." },
    { title: "Hospital", field: "Hospital", widthGrow: 2, headerFilter: "input", headerFilterPlaceholder: "Search hospital..." }
];

    // Initialize Tabulator
    patientsTable = new Tabulator(tableContainer, {
        data: patientsData,
        columns: columns,
        layout: "fitColumns",
        pagination: true,
        paginationSize: 12,
        paginationSizeSelector: [12, 24, 36, 48],
        paginationCounter: "rows",
        movableColumns: true,
        responsiveLayout: "collapse",
        initialSort: [
            {column: "tx_id", dir: "asc"}
        ]
    });

    // Add search functionality
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", function(e) {
            if (patientsTable) {
                patientsTable.setFilter([
                    [
                        {field: "Name", type: "like", value: e.target.value},
                        {field: "Disease", type: "like", value: e.target.value},
                        {field: "Hospital", type: "like", value: e.target.value},
                        {field: "Sex", type: "like", value: e.target.value}
                    ]
                ]);
            }
        });
    }
}

// =====================
// Export to Excel function
// =====================
export function exportToExcel() {
    if (patientsTable) {
        patientsTable.download("xlsx", "patients.xlsx", {
            sheetName: "Patients Data"
        });
        
        // Show notification using the same notification system as home.js
        showNotification("Patients data exported to Excel successfully!", "success");
    }
}

// =====================
// Edit patient function
// =====================
export function editPatient(id) {
    console.log("Edit patient:", id);
    // Save the patient ID for editing
    localStorage.setItem("editPatientId", id);
    
    // Show notification
    showNotification(`Editing patient ID: ${id}`);
    
    // You can implement navigation to edit form here
    // For example: window.tabManager.switchToPage('edit-patient.html');
}

// =====================
// Delete patient function
// =====================
export async function deletePatient(cancerRegId) {
    if (!confirm("Are you sure you want to delete this patient? This action cannot be undone.")) {
        return;
    }

    try {
        const result = await apiFetch(`https://api.cancerreg.org/v1/pts/${cancerRegId}`, {
            method: "DELETE"
        });

        if (result.status === 401) return; // Already handled in auth.js
        if (result.error) {
            throw new Error(result.error);
        }

        // Show success notification
        showNotification("Patient deleted successfully!");
        
        // Refresh the table
        initPatients(true);
    } catch (err) {
        const errorMessage = "Failed to delete patient: " + err.message;
        showNotification(errorMessage, "error");
    }
}

// =====================
// Show Notification
// =====================
function showNotification(message, type = "info") {
    const bgColor = type === 'error' ? '#f44336' : 
                   type === 'warning' ? '#ffa500' : 
                   type === 'success' ? '#4ec9b0' : '#007acc';
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; top:50px; right:20px; background:${bgColor};
        color:white; padding:10px 16px; border-radius:4px; font-size:13px; z-index:10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// =====================
// Initialize when this module is loaded inside TabManager
// =====================
export function initPatientsPage() {
    // Only load data after content is injected
    setTimeout(() => initPatients(false), 0);
    
    // Set up event listeners after content is loaded
    setTimeout(() => {
        setupEventListeners();
    }, 100);
}

// Custom right-click menu for table rows
document.addEventListener("contextmenu", (e) => {
  const rowEl = e.target.closest(".tabulator-row");
  if (rowEl) {
    e.preventDefault();
    e.stopPropagation();
    showRowContextMenu(e, rowEl);
  } else {
    e.preventDefault(); // block default right-click everywhere else
  }
});


function showRowContextMenu(event, rowEl) {
  // Remove any existing menu
  const oldMenu = document.getElementById("custom-context-menu");
  if (oldMenu) oldMenu.remove();

  // Build a new menu
  const menu = document.createElement("div");
  menu.id = "custom-context-menu";
  menu.style.position = "fixed";
  menu.style.top = `${event.clientY}px`;
  menu.style.left = `${event.clientX}px`;
  menu.style.background = "#222";
  menu.style.color = "white";
  menu.style.borderRadius = "6px";
  menu.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
  menu.style.padding = "6px 0";
  menu.style.zIndex = 9999;
  menu.style.minWidth = "160px";
  menu.style.fontFamily = "Segoe UI, sans-serif";

  // Get row data
  const rowComponent = patientsTable.getRow(rowEl);
  const rowData = rowComponent ? rowComponent.getData() : null;

  // Define menu items
  const items = [];

  if (rowData) {
    items.push(
      { label: "Edit Patient", action: () => editPatient(rowData.cancer_registry_id) },
      { label: "Delete", action: () => deletePatient(rowData.cancer_registry_id) }
    );
  }

  // Always add Refresh
  items.push({ label: "Refresh Data", action: () => patientsModule.initPatients(true) });

  // Add items to menu
  items.forEach((item) => {
    const btn = document.createElement("div");
    btn.textContent = item.label;
    btn.style.padding = "6px 12px";
    btn.style.cursor = "pointer";
    btn.addEventListener("click", () => {
      item.action();
      menu.remove();
    });
    btn.addEventListener("mouseenter", () => (btn.style.background = "#444"));
    btn.addEventListener("mouseleave", () => (btn.style.background = "transparent"));
    menu.appendChild(btn);
  });

  document.body.appendChild(menu);

  // Remove menu on click outside
  document.addEventListener(
    "click",
    () => {
      if (menu) menu.remove();
    },
    { once: true }
  );
}

// =====================
// Set up event listeners
// =====================
function setupEventListeners() {
    // Refresh button
    const refreshBtn = document.getElementById("refreshPatients");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => initPatients(true));
    }
    
    // Export to Excel button
    const exportBtn = document.getElementById("exportExcel");
    if (exportBtn) {
        exportBtn.addEventListener("click", exportToExcel);
    }
}

// Re-initialize when tab becomes visible
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible' && !patientsTable) {
        if (typeof initPatients === 'function') {
            initPatients(false);
        }
    }
});

// Make functions globally available for HTML onclick handlers
window.editPatient = editPatient;
window.deletePatient = deletePatient;