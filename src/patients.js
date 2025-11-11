// src/patients.js
import { apiFetch } from './auth.js';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';

// Global variable for Tabulator instance
let patientsTable = null;

// =====================
// Patients Data Loading
// =====================
export async function initPatients(forceReload = false) {
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

    // Define columns for Tabulator
    const columns = [

        {
            title: "No",
            field: "cancer_registry_id",
            width: 200,
            headerFilter: "input",
            headerFilterPlaceholder: "Search name..."
        },{
            title: "Name",
            field: "Name",
            width: 200,
            headerFilter: "input",
            headerFilterPlaceholder: "Search name..."
        },
        {
            title: "Sex",
            field: "Sex",
            width: 100,
            hozAlign: "center",
            headerFilter: "input",
            headerFilterPlaceholder: "Filter sex...",
            formatter: function(cell) {
                const value = cell.getValue();
                return value ? value.toUpperCase() : '-';
            }
        },
        {
            title: "Date of Birth",
            field: "dob",
            width: 150,
            headerFilter: "input",
            headerFilterPlaceholder: "Filter DOB..."
        },
        {
            title: "Disease",
            field: "Disease",
            width: 200,
            headerFilter: "input",
            headerFilterPlaceholder: "Search disease..."
        },
        {
            title: "Hospital",
            field: "Hospital",
            width: 180,
            headerFilter: "input",
            headerFilterPlaceholder: "Search hospital..."
        },
        {
            title: "Actions",
            field: "cancer_registry_id",
            width: 150,
            hozAlign: "center",
            headerSort: false,
            formatter: function(cell) {
                const id = cell.getValue();
                return `
                    <div class="action-buttons">
                        <button onclick="editPatient(${id})" class="action-btn edit-btn" title="Edit Patient">
                            <span class="material-icons">edit</span>
                        </button>
                        <button onclick="deletePatient(${id})" class="action-btn delete-btn" title="Delete Patient">
                            <span class="material-icons">delete</span>
                        </button>
                    </div>
                `;
            }
        }
    ];

    // Initialize Tabulator
    patientsTable = new Tabulator(tableContainer, {
        data: patientsData,
        columns: columns,
        layout: "fitColumns",
        pagination: true,
        paginationSize: 25,
        paginationSizeSelector: [10, 25, 50, 100],
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