// src/home.js
import { apiFetch } from './auth.js';
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

// =====================
// Global state
// =====================
window.API_DATA = {
    dashboard: null,
    hospitals: [],
    statistics: {},
    reports: []
};

let cancerTypesChart = null;
let yearlyCasesChart = null;
let genderChart = null;
let ageChart = null;
let regionalChart = null;
let stagingChart = null;


// =====================
// Dashboard Data Loading
// =====================

export async function loadRealDashboard(forceReload = false) {
  showLoadingState();

  try {
    // ✅ Fetch dashboard data using apiFetch with built-in cache support
    const result = await apiFetch("/dashboard", {}, true, "dashboardData", forceReload);

    if (!result) throw new Error("No data returned from API");

    // ✅ Transform and update global dashboard data
    API_DATA.dashboard = transformDashboardData(result);

    // ✅ Render the updated dashboard
    renderDashboardMetrics();
    renderStatisticsTable();
    updateAllCharts();
    showNotification("Data loaded successfully", "success");
  } 
  catch (err) {
    console.error("Dashboard load error:", err);
    showErrorState(`Could not load live data: ${err.message}`);

    // ✅ Fallback to cached data
    const cached = localStorage.getItem("dashboardData");
    if (cached) {
      try {
        API_DATA.dashboard = JSON.parse(cached);
        renderDashboardMetrics();
        renderStatisticsTable();
        updateAllCharts();
        showNotification("Using cached data", "warning");
      } catch (e) {
        showErrorState("No data available. Please check your connection.");
      }
    }
  }
}

// =====================
// Data Transformation
// =====================
function transformDashboardData(apiData) {
    return {
        metrics: {
            totalPatients: apiData.summary?.total_patients || 0,
            totalTreatments: apiData.summary?.total_treatments || 0,
            malePatients: apiData.summary?.male_patients || 0,
            femalePatients: apiData.summary?.female_patients || 0
        },
        cancerTypes: {
            labels: apiData.charts?.top_sites?.map(i => i.site) || [],
            data: apiData.charts?.top_sites?.map(i => i.count) || []
        },
        yearlyCases: {
            labels: apiData.charts?.cases_by_year?.map(i => i.year) || [],
            data: apiData.charts?.cases_by_year?.map(i => i.count) || []
        },
        genderDistribution: {
            labels: apiData.charts?.sex_distribution?.map(i => i.Sex === 'm' ? 'Male' : 'Female') || [],
            data: apiData.charts?.sex_distribution?.map(i => i.count) || []
        },
        stagingDistribution: apiData.charts?.staging_distribution || [],
        statistics: {
            ageDistribution: apiData.statistics?.ageDistribution || {
                labels: ['0-20','21-40','41-60','61-80','80+'],
                data: [45,180,245,80,10]
            },
            regionalDistribution: apiData.statistics?.regionalDistribution || {
                labels: ['Yangon','Mandalay','Naypyitaw','Shan State','Others'],
                data: [280,150,80,30,20]
            },
            detailedStats: apiData.statistics?.detailedStats || []
        }
    };
}

// =====================
// UI Rendering Functions
// =====================
function showLoadingState() {
    const metrics = document.getElementById("dashboard-metrics");
    const table = document.getElementById("statistics-table");

    if (metrics) {
        metrics.innerHTML = `<div class="metric-loading"><div class="loading-spinner-small"></div><p>Loading metrics...</p></div>`.repeat(4);
    }
    if (table) {
        table.innerHTML = `<tr><td colspan="5" class="table-loading"><div class="loading-spinner-small"></div><p>Loading statistics...</p></td></tr>`;
    }
}

function showErrorState(message) {
    const metrics = document.getElementById("dashboard-metrics");
    if (metrics) {
        metrics.innerHTML = `<div class="error-message"><span class="material-icons">error</span><p>${message}</p></div>`;
    }
}

function showNotification(message, type="info") {
    const bgColor = type === 'warning' ? '#ffa500' : type === 'success' ? '#4ec9b0' : '#007acc';
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

function renderDashboardMetrics() {
    const cont = document.getElementById("dashboard-metrics");
    if (!cont || !API_DATA.dashboard) return;
    const m = API_DATA.dashboard.metrics;
    const metrics = [
        { label: "Total Patients", value: m.totalPatients.toLocaleString(), icon: "👤", color: "blue" },
        { label: "Total Treatments", value: m.totalTreatments.toLocaleString(), icon: "💊", color: "green" },
        { label: "Male Patients", value: m.malePatients.toLocaleString(), icon: "♂️", color: "purple" },
        { label: "Female Patients", value: m.femalePatients.toLocaleString(), icon: "♀️", color: "pink" }
    ];
    cont.innerHTML = metrics.map(metric => `
        <div class="metric-card metric-${metric.color}">
            <div class="metric-content">
                <div class="metric-text">
                    <p class="metric-label">${metric.label}</p>
                    <p class="metric-value">${metric.value}</p>
                </div>
                <div class="metric-icon">
                    <span class="metric-emoji">${metric.icon}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function renderStatisticsTable() {
    const cont = document.getElementById("statistics-table");
    const stats = API_DATA.dashboard?.statistics?.detailedStats || [];
    if (!cont) return;
    if (stats.length === 0) {
        cont.innerHTML = `<tr><td colspan="5" class="text-center">No data available</td></tr>`;
        return;
    }
    cont.innerHTML = stats.map(s => {
        const color = s.trendDirection === 'up' ? 'green' : s.trendDirection === 'down' ? 'red' : 'gray';
        const icon = s.trendDirection === 'up' ? '▲' : s.trendDirection === 'down' ? '▼' : '■';
        return `
            <tr>
                <td>${s.cancerType}</td>
                <td>${s.totalCases.toLocaleString()}</td>
                <td>${s.newCases}</td>
                <td>${s.percentage}</td>
                <td><span class="trend-${color}">${icon} ${s.trend}</span></td>
            </tr>
        `;
    }).join('');
}

// =====================
// Chart Functions
// =====================
function updateAllCharts() {
    updateCancerTypesChart();
    updateYearlyCasesChart();
    updateGenderChart();
    renderAgeChart();
    renderRegionalChart();
    renderStagingChart();
}

function updateCancerTypesChart() {
    const ctx = document.getElementById("cancerTypesChart");
    if (!ctx) return;
    if (cancerTypesChart) cancerTypesChart.destroy();
    const data = API_DATA.dashboard.cancerTypes;
    cancerTypesChart = new Chart(ctx, {
        type: "doughnut",
        data: { labels:data.labels, datasets:[{data:data.data, backgroundColor:['#007acc','#4ec9b0','#ce9178','#d7ba7d','#c586c0','#9cdcfe','#4fc1ff','#269db2','#008080','#045d5d']}] },
        options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{position:"right", labels:{color:'#cccccc', font:{size:11}}}} }
    });
}

function updateYearlyCasesChart() {
    const ctx = document.getElementById("yearlyCasesChart");
    if (!ctx) return;
    if (yearlyCasesChart) yearlyCasesChart.destroy();
    const data = API_DATA.dashboard.yearlyCases;
    yearlyCasesChart = new Chart(ctx, {
        type:"bar",
        data:{ labels:data.labels, datasets:[{label:'Cases', data:data.data, backgroundColor:'#007acc', borderColor:'#005a9e', borderWidth:1}] },
        options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{x:{ticks:{color:'#cccccc'}, grid:{color:'#3e3e42'}}, y:{ticks:{color:'#cccccc'}, grid:{color:'#3e3e42'}}} }
    });
}

function updateGenderChart() {
    const ctx = document.getElementById("genderChart");
    if (!ctx) return;
    if (genderChart) genderChart.destroy();
    const data = API_DATA.dashboard.genderDistribution;
    genderChart = new Chart(ctx, {
        type:"pie",
        data:{ labels:data.labels, datasets:[{data:data.data, backgroundColor:['#4ec9b0','#c586c0']}] },
        options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{position:"bottom", labels:{color:'#cccccc', font:{size:11}}}} }
    });
}

function renderAgeChart() {
    const s = API_DATA.dashboard?.statistics;
    const ctxEl = document.getElementById('ageChart');
    if (!ctxEl) return;
    if (ageChart) ageChart.destroy();
    ageChart = new Chart(ctxEl.getContext('2d'), {
        type:'bar',
        data:{ labels:s.ageDistribution.labels, datasets:[{label:'Cases', data:s.ageDistribution.data, backgroundColor:'#10B981'}]},
        options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true, ticks:{color:'#cccccc'}, grid:{color:'#3e3e42'}}, x:{ticks:{color:'#cccccc'}, grid:{color:'#3e3e42'}}} }
    });
}

function renderRegionalChart() {
    const s = API_DATA.dashboard?.statistics;
    const ctxEl = document.getElementById('regionalChart');
    if (!ctxEl) return;
    if (regionalChart) regionalChart.destroy();
    regionalChart = new Chart(ctxEl.getContext('2d'), {
        type:'pie',
        data:{ labels:s.regionalDistribution.labels, datasets:[{data:s.regionalDistribution.data, backgroundColor:['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6']}] },
        options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom', labels:{color:'#cccccc', font:{size:11}}}} }
    });
}

function renderStagingChart() {
    const data = API_DATA.dashboard?.stagingDistribution || [];
    if (data.length===0) return;
    const ctxEl = document.getElementById('stagingChart');
    if (!ctxEl) return;
    if (stagingChart) stagingChart.destroy();
    const top = data.slice(0,15);
    stagingChart = new Chart(ctxEl.getContext('2d'), {
        type:'bar',
        data:{ labels:top.map(i=>i.Staging), datasets:[{label:'Cases', data:top.map(i=>i.count), backgroundColor:'#EF4444'}]},
        options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false, scales:{x:{beginAtZero:true, ticks:{color:'#cccccc'}, grid:{color:'#3e3e42'}}, y:{ticks:{color:'#cccccc'}, grid:{color:'#3e3e42'}}}, plugins:{legend:{display:false}}}
    });
}

// =====================
// Initialize when this module is loaded inside TabManager
// =====================
export function initHomePage() {
    // Only load data after content is injected
    setTimeout(() => loadRealDashboard(false), 0);
}
