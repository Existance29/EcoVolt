// Set your company ID (replace with the actual ID)
const company_id = getCompanyId(); // Replace with actual company ID

// Elements from the page for filters
const datePicker = document.getElementById("datePicker");
const dataCenterDropdown = document.getElementById("dataCenterDropdown");

// Initialize chart instances
let carbonEmissionChart;
let energyBreakdownChart;

// Event listeners to handle changes in the date or data center dropdown
datePicker.addEventListener("change", fetchData);
dataCenterDropdown.addEventListener("change", fetchData);

// Function to load data centers into the dropdown
async function loadDataCenterOptions() {
    console.log("Starting to load data centers...");

    try {
        // Fetch data centers for the company
        const response = await fetch(`/Dashboard/Data-Center/${company_id}`);
        if (!response.ok) {
            throw new Error(`Failed to load data centers. Status: ${response.status}`);
        }

        const dataCenters = await response.json();
        console.log("Data centers fetched successfully:", dataCenters);

        // Clear the dropdown first
        dataCenterDropdown.innerHTML = '';

        // Add "All Data Centers" option
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = 'All Data Centers';
        dataCenterDropdown.appendChild(allOption);

        // Populate dropdown with fetched data centers
        dataCenters.forEach(dc => {
            const option = document.createElement('option');
            option.value = dc.id;
            option.textContent = dc.data_center_name;
            dataCenterDropdown.appendChild(option);
        });

        console.log("Data center dropdown populated successfully.");
    } catch (error) {
        console.error("Error loading data centers:", error);
    }
}

// Function to determine which data to fetch based on the current filters
async function fetchData() {
    const selectedDate = datePicker.value;
    const selectedDataCenter = dataCenterDropdown.value;

    console.log("fetchData called with:", { selectedDate, selectedDataCenter });

    if (!selectedDate && (selectedDataCenter === "all" || !selectedDataCenter)) {
        // No date, fetch totals for all data centers under the company
        await fetchAllCarbonEmissionByCompanyId();
        await fetchTotalCarbonEmissionByCompanyId();
        await fetchTotalEnergyConsumptionByCompanyId(); // Fetch energy consumption for the company
        await fetchEnergyConsumptionBreakdownByCompanyId(); // Fetch energy breakdown for the company
    } else if (!selectedDate && selectedDataCenter !== "all") {
        // No date, fetch totals for a specific data center
        await fetchAllCarbonEmissionByDataCenterId(selectedDataCenter);
        await fetchTotalCarbonEmissionByDataCenterId(selectedDataCenter);
        await fetchTotalEnergyConsumptionByDataCenterId(selectedDataCenter); // Fetch energy consumption for the data center
        await fetchEnergyConsumptionBreakdownByDataCenterId(selectedDataCenter); // Fetch energy breakdown for the data center
    } else if (selectedDate && (selectedDataCenter === "all" || !selectedDataCenter)) {
        // With date, fetch totals for the company by date
        await fetchAllCarbonEmissionByCompanyIdAndDate(selectedDate);
        await fetchTotalCarbonEmissionByCompanyIdAndDate();
        await fetchTotalEnergyConsumptionByCompanyIdAndDate(); // Fetch energy consumption for the company by date
        await fetchEnergyConsumptionBreakdownByCompanyIdAndDate(selectedDate); // Fetch energy breakdown for the company by date
    } else if (selectedDate && selectedDataCenter !== "all") {
        // With date, fetch totals for a specific data center by date
        await fetchAllCarbonEmissionByDataCenterIdAndDate(selectedDataCenter, selectedDate);
        await fetchTotalCarbonEmissionByDataCenterIdAndDate(selectedDataCenter);
        await fetchTotalEnergyConsumptionByDataCenterIdAndDate(selectedDataCenter); // Fetch energy consumption for the data center by date
        await fetchEnergyConsumptionBreakdownByDataCenterIdAndDate(selectedDataCenter, selectedDate); // Fetch energy breakdown for the data center by date
    }
}






// Case 1: Fetch carbon emissions for all data centers under the company
async function fetchAllCarbonEmissionByCompanyId() {
    try {
        const response = await fetch(`/Dashboard/Data-Center/CarbonEmission/company/${company_id}`);
        const data = await response.json();
        console.log("Data received from fetchAllCarbonEmissionByCompanyId:", data);
        renderChart(data);
    } catch (error) {
        console.error("Error fetching all carbon emission data for company:", error);
    }
}
// Case 2: Fetch carbon emissions for a specific data center
async function fetchAllCarbonEmissionByDataCenterId(data_center_id) {
    try {
        const response = await fetch(`/Dashboard/Data-Center/CarbonEmission/data-center/${data_center_id}`);
        const data = await response.json();
        console.log("Data received from fetchAllCarbonEmissionByDataCenterId:", data);
        renderChart(data);
    } catch (error) {
        console.error("Error fetching carbon emission data for specific data center:", error);
    }
}
// Case 3: Fetch carbon emissions for all data centers under the company for a specific date
async function fetchAllCarbonEmissionByCompanyIdAndDate(date) {
    try {
        const formattedDate = new Date(date).toISOString().split('T')[0]; // Format date as YYYY-MM-DD
        const url = `/Dashboard/Data-Center/CarbonEmission/company/${company_id}/date?date=${encodeURIComponent(formattedDate)}`;
        
        console.log("Request URL for company by date:", url);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch data. Status: ${response.status}`);
        }
        let data = await response.json();
        console.log("Data received from fetchAllCarbonEmissionByCompanyIdAndDate:", data);

        if (data.length === 1) {
            const previousDay = new Date(new Date(date).setDate(new Date(date).getDate() - 1));
            const prevDateFormatted = previousDay.toISOString().split('T')[0];
            const prevResponse = await fetch(`/Dashboard/Data-Center/CarbonEmission/company/${company_id}/date?date=${encodeURIComponent(prevDateFormatted)}`);
            if (prevResponse.ok) {
                const prevData = await prevResponse.json();
                console.log("Previous day's data:", prevData);
                data = prevData.concat(data); // Combine previous day's data with the current day
            }
        }

        renderChart(data);
    } catch (error) {
        console.error("Error fetching carbon emission data for company by date:", error);
    }
}
// Case 4: Fetch carbon emissions for a specific data center and date
async function fetchAllCarbonEmissionByDataCenterIdAndDate(data_center_id, date) {
    try {
        const response = await fetch(`/Dashboard/Data-Center/CarbonEmission/data-center/${data_center_id}/date?date=${encodeURIComponent(date)}`);
        let data = await response.json();
        console.log("Data received from fetchAllCarbonEmissionByDataCenterIdAndDate:", data);

        if (data.length === 1) {
            const previousDay = new Date(new Date(date).setDate(new Date(date).getDate() - 1));
            const prevDateFormatted = previousDay.toISOString().split('T')[0];
            const prevResponse = await fetch(`/Dashboard/Data-Center/CarbonEmission/data-center/${data_center_id}/date?date=${encodeURIComponent(prevDateFormatted)}`);
            if (prevResponse.ok) {
                const prevData = await prevResponse.json();
                console.log("Previous day's data:", prevData);
                data = prevData.concat(data); // Combine previous day's data with the current day
            }
        }

        renderChart(data);
    } catch (error) {
        console.error("Error fetching carbon emission data for specific data center by date:", error);
    }
}

function renderChart(data) {
    console.log("Rendering chart with data:", data);

    // Process data to extract date and emissions
    const labels = data.map(item => new Date(item.date).toLocaleDateString("en-US"));
    const emissions = data.map(item => item.co2_emissions_tons);

    // Check if we have any data to display
    if (!labels.length || !emissions.length) {
        console.warn("No data available to display.");
        return;
    }

    // Get chart canvas context
    const ctx = document.getElementById("carbonEmissionChart").getContext("2d");

    // Destroy previous chart instance if it exists
    if (carbonEmissionChart) {
        carbonEmissionChart.destroy();
    }

    // Create a new line chart with Chart.js
    carbonEmissionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Carbon Emissions (tons)',
                data: emissions,
                borderColor: '#4FD1C5',
                backgroundColor: 'rgba(79, 209, 197, 0.2)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    left: 20,
                    right: 20,
                    top: 20,
                    bottom: 20
                }
            },
            plugins: {
                legend: {
                    display: false // Hide the legend
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    },
                    ticks: {
                        autoSkip: true, // Automatically skip some labels to avoid clutter
                        maxTicksLimit: 10, // Limit the number of ticks displayed
                        padding: 10 // Add padding to ticks
                    },
                    grid: {
                        display: true,
                        drawBorder: false
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Carbon Emissions (tons)'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}




// Function to fetch total carbon emissions for the company
async function fetchTotalCarbonEmissionByCompanyId() {
    try {
        const response = await fetch(`/Dashboard/Data-Center/CarbonEmission/Sum/company/${company_id}`);
        const data = await response.json();
        console.log("Total Carbon Emission data for company:", data);
        
        // Update the total emissions display in the stat-value element
        document.getElementById("totalCarbonEmissions").textContent = `${data.total_co2_emissions} Tons`;
        
    } catch (error) {
        console.error("Error fetching total carbon emission data for company:", error);
    }
}

// Function to fetch total carbon emissions for a specific data center
async function fetchTotalCarbonEmissionByDataCenterId(data_center_id) {
    try {
        const response = await fetch(`/Dashboard/Data-Center/CarbonEmission/Sum/data-center/${data_center_id}`);
        const data = await response.json();
        console.log("Total Carbon Emission data for data center:", data);
        
        // Update the total emissions display in the stat-value element
        document.getElementById("totalCarbonEmissions").textContent = `${data.total_co2_emissions} Tons`;
        
    } catch (error) {
        console.error("Error fetching total carbon emission data for data center:", error);
    }
}

// Function to fetch total carbon emissions for the company using the selected date
async function fetchTotalCarbonEmissionByCompanyIdAndDate() {
    const selectedDate = datePicker.value; // Get the selected date from the date picker

    try {
        const response = await fetch(`/Dashboard/Data-Center/CarbonEmission/Sum/company/${company_id}/date?date=${encodeURIComponent(selectedDate)}`);
        const data = await response.json();
        console.log("Total Carbon Emission data for company by date:", data);

        // Update the total emissions display in the stat-value element
        document.getElementById("totalCarbonEmissions").textContent = `${data.total_co2_emissions} Tons`;
        
    } catch (error) {
        console.error("Error fetching total carbon emission data for company by date:", error);
    }
}

// Function to fetch total carbon emissions for a specific data center using the selected date
async function fetchTotalCarbonEmissionByDataCenterIdAndDate(data_center_id) {
    const selectedDate = datePicker.value; // Get the selected date from the date picker

    try {
        const response = await fetch(`/Dashboard/Data-Center/CarbonEmission/Sum/data-center/${data_center_id}/date?date=${encodeURIComponent(selectedDate)}`);
        const data = await response.json();
        console.log("Total Carbon Emission data for data center by date:", data);

        // Update the total emissions display in the stat-value element
        document.getElementById("totalCarbonEmissions").textContent = `${data.total_co2_emissions} Tons`;
        
    } catch (error) {
        console.error("Error fetching total carbon emission data for data center by date:", error);
    }
}








// Function to fetch total energy consumption for the company
async function fetchTotalEnergyConsumptionByCompanyId() {
    try {
        const response = await fetch(`/Dashboard/Data-Center/EnergyConsumption/Sum/company/${company_id}`);
        const data = await response.json();
        console.log("Total Energy Consumption data for company:", data);
        
        // Update the total energy consumption display in the stat-value element
        document.getElementById("totalEnergyConsumption").textContent = `${data.total_energy_consumption} MWh`;
    } catch (error) {
        console.error("Error fetching total energy consumption data for company:", error);
    }
}

// Function to fetch total energy consumption for a specific data center
async function fetchTotalEnergyConsumptionByDataCenterId(data_center_id) {
    try {
        const response = await fetch(`/Dashboard/Data-Center/EnergyConsumption/Sum/data-center/${data_center_id}`);
        const data = await response.json();
        console.log("Total Energy Consumption data for data center:", data);
        
        // Update the total energy consumption display in the stat-value element
        document.getElementById("totalEnergyConsumption").textContent = `${data.total_energy_consumption} MWh`;
    } catch (error) {
        console.error("Error fetching total energy consumption data for data center:", error);
    }
}

// Function to fetch total energy consumption for the company using the selected date
async function fetchTotalEnergyConsumptionByCompanyIdAndDate() {
    const selectedDate = datePicker.value; // Get the selected date from the date picker

    try {
        const response = await fetch(`/Dashboard/Data-Center/EnergyConsumption/Sum/company/${company_id}/date?date=${encodeURIComponent(selectedDate)}`);
        const data = await response.json();
        console.log("Total Energy Consumption data for company by date:", data);

        // Update the total energy consumption display in the stat-value element
        document.getElementById("totalEnergyConsumption").textContent = `${data.total_energy_consumption} MWh`;
    } catch (error) {
        console.error("Error fetching total energy consumption data for company by date:", error);
    }
}
// Function to fetch total energy consumption for a specific data center using the selected date
async function fetchTotalEnergyConsumptionByDataCenterIdAndDate(data_center_id) {
    const selectedDate = datePicker.value; // Get the selected date from the date picker

    try {
        const response = await fetch(`/Dashboard/Data-Center/EnergyConsumption/Sum/data-center/${data_center_id}/date?date=${encodeURIComponent(selectedDate)}`);
        const data = await response.json();
        console.log("Total Energy Consumption data for data center by date:", data);

        // Update the total energy consumption display in the stat-value element
        document.getElementById("totalEnergyConsumption").textContent = `${data.total_energy_consumption} MWh`;
    } catch (error) {
        console.error("Error fetching total energy consumption data for data center by date:", error);
    }
}








// Function to fetch energy consumption breakdown for the company
async function fetchEnergyConsumptionBreakdownByCompanyId() {
    try {
        const response = await fetch(`/Dashboard/Data-Center/EnergyConsumption/company/${company_id}`);
        const data = await response.json();
        console.log("Energy Breakdown data for company:", data);
        renderEnergyBreakdownChart(data); // Render the doughnut chart with the fetched data
    } catch (error) {
        console.error("Error fetching energy breakdown data for company:", error);
    }
}

// Function to fetch energy consumption breakdown for a specific data center
async function fetchEnergyConsumptionBreakdownByDataCenterId(data_center_id) {
    try {
        const response = await fetch(`/Dashboard/Data-Center/EnergyConsumption/data-center/${data_center_id}`);
        const data = await response.json();
        console.log("Energy Breakdown data for data center:", data);
        renderEnergyBreakdownChart(data);
    } catch (error) {
        console.error("Error fetching energy breakdown data for data center:", error);
    }
}

// Function to fetch energy consumption breakdown for the company using the selected date
async function fetchEnergyConsumptionBreakdownByCompanyIdAndDate(date) {
    const formattedDate = new Date(date).toISOString().split('T')[0]; // Format date as YYYY-MM-DD
    try {
        const response = await fetch(`/Dashboard/Data-Center/EnergyConsumption/company/${company_id}/date?date=${encodeURIComponent(formattedDate)}`);
        const data = await response.json();
        console.log("Energy Breakdown data for company by date:", data);
        renderEnergyBreakdownChart(data);
    } catch (error) {
        console.error("Error fetching energy breakdown data for company by date:", error);
    }
}

// Function to fetch energy consumption breakdown for a specific data center using the selected date
async function fetchEnergyConsumptionBreakdownByDataCenterIdAndDate(data_center_id, date) {
    const formattedDate = new Date(date).toISOString().split('T')[0]; // Format date as YYYY-MM-DD
    try {
        const response = await fetch(`/Dashboard/Data-Center/EnergyConsumption/data-center/${data_center_id}/date?date=${encodeURIComponent(formattedDate)}`);
        const data = await response.json();
        console.log("Energy Breakdown data for data center by date:", data);
        renderEnergyBreakdownChart(data);
    } catch (error) {
        console.error("Error fetching energy breakdown data for data center by date:", error);
    }
}


// Function to render the energy breakdown chart
function renderEnergyBreakdownChart(data) {
    console.log("Rendering energy breakdown chart with data:", data);

    const energyData = data[0];
    if (!energyData) {
        console.warn("No energy data available for breakdown chart.");
        return;
    }

    const labels = ["Backup Power", "Cooling", "IT Equipment", "Lighting"];
    const values = [
        energyData.backup_power_energy_mwh,
        energyData.cooling_energy_mwh,
        energyData.it_energy_mwh,
        energyData.lighting_energy_mwh
    ];

    const total = values.reduce((acc, val) => acc + val, 0);

    const ctx = document.getElementById("energyBreakdownChart").getContext("2d");

    // Destroy previous chart instance if it exists
    if (window.energyBreakdownChart && typeof window.energyBreakdownChart.destroy === "function") {
        window.energyBreakdownChart.destroy();
    }

    // Create a new doughnut chart with Chart.js
    window.energyBreakdownChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Energy Consumption (MWh)',
                data: values,
                backgroundColor: [
                    '#2F3E46',  // Dark grey
                    '#4E5D63',  // Grey
                    '#38B2AC',  // Teal
                    '#A8DADC'   // Light teal
                ],
                borderColor: '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} MWh (${percentage}%)`;
                        }
                    }
                }
            },
            layout: { padding: 10 }
        }
    });

    // Custom Legend Rendering
    const legendContainer = document.querySelector(".pie-chart-labels-container");
    legendContainer.innerHTML = '';
    labels.forEach((label, index) => {
        const color = window.energyBreakdownChart.data.datasets[0].backgroundColor[index];
        const value = values[index];
        const percentage = ((value / total) * 100).toFixed(1);

        const legendItem = document.createElement("div");
        legendItem.classList.add("legend-item");
        legendItem.innerHTML = `
            <span class="label-color" style="background-color: ${color}; width: 14px; height: 14px; display: inline-block; margin-right: 8px;"></span>
            <span class="label-name">${label}:</span>
            <span class="label-value">${value} MWh (${percentage}%)</span>
        `;
        legendContainer.appendChild(legendItem);
    });
}



// Load data centers and chart on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM fully loaded, initializing data center options...");
    await loadDataCenterOptions(); // Load data centers when the page loads
    fetchData(); 
});



