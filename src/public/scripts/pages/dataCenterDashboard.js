// Set your company ID (replace with the actual ID)
const company_id = getCompanyId(); // Replace with actual company ID



const monthPicker = document.getElementById("monthPicker");
const yearPicker = document.getElementById("yearPicker");
const dataCenterDropdown = document.getElementById("dataCenterDropdown");

// Initialize chart instances
let carbonEmissionChart;
let energyBreakdownChart;

// Event listeners to handle changes in the date or data center dropdown
monthPicker.addEventListener("change", fetchData);
yearPicker.addEventListener("change", fetchData);
dataCenterDropdown.addEventListener("change", fetchData);

// Elements for the metric buttons
const pueButton = document.getElementById("pueButton");
const cueButton = document.getElementById("cueButton");
const wueButton = document.getElementById("wueButton");

// Function to set the active button
function setActiveButton(button) {
    // Remove the active class from all buttons
    pueButton.classList.remove("active");
    cueButton.classList.remove("active");
    wueButton.classList.remove("active");

    // Add the active class to the clicked button
    button.classList.add("active");
}

// Event listeners for metric buttons
pueButton.addEventListener("click", () => {
    fetchMetricData("PUE");
    setActiveButton(pueButton);
});
cueButton.addEventListener("click", () => {
    fetchMetricData("CUE");
    setActiveButton(cueButton);
});
wueButton.addEventListener("click", () => {
    fetchMetricData("WUE");
    setActiveButton(wueButton);
});


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
    const selectedMonth = monthPicker.value;
    const selectedYear = yearPicker.value;
    const selectedDataCenter = dataCenterDropdown.value;

    console.log("fetchData called with:", { selectedMonth, selectedYear, selectedDataCenter });

    // Combine month and year if both are selected
    const selectedDate = selectedYear ? (selectedMonth ? `${selectedYear}-${selectedMonth}` : `${selectedYear}`) : null;


    if (!selectedDate && (selectedDataCenter === "all" || !selectedDataCenter)) {
        // No date, fetch totals for all data centers under the company
        await fetchAllCarbonEmissionByCompanyId();
        await fetchTotalCarbonEmissionByCompanyId();
        await fetchTotalEnergyConsumptionByCompanyId(); // Fetch energy consumption for the company
        await fetchEnergyConsumptionBreakdownByCompanyId(); // Fetch energy breakdown for the company
        await fetchTotalRenewableEnergyByCompanyId(); // Fetch total renewable energy for the company
    } else if (!selectedDate && selectedDataCenter !== "all") {
        // No date, fetch totals for a specific data center
        await fetchAllCarbonEmissionByDataCenterId(selectedDataCenter);
        await fetchTotalCarbonEmissionByDataCenterId(selectedDataCenter);
        await fetchTotalEnergyConsumptionByDataCenterId(selectedDataCenter); // Fetch energy consumption for the data center
        await fetchEnergyConsumptionBreakdownByDataCenterId(selectedDataCenter); // Fetch energy breakdown for the data center
        await fetchTotalRenewableEnergyByDataCenterId(selectedDataCenter); // Fetch total renewable energy for the specific data center
    } else if (selectedDate && (selectedDataCenter === "all" || !selectedDataCenter)) {
        // With date, fetch totals for the company by date
        await fetchAllCarbonEmissionByCompanyIdAndDate(selectedDate);
        await fetchTotalCarbonEmissionByCompanyIdAndDate();
        await fetchTotalEnergyConsumptionByCompanyIdAndDate(); // Fetch energy consumption for the company by date
        await fetchEnergyConsumptionBreakdownByCompanyIdAndDate(selectedDate); // Fetch energy breakdown for the company by date
        await fetchTotalRenewableEnergyByCompanyIdAndDate(selectedDate); // Fetch total renewable energy for the company by date
    } else if (selectedDate && selectedDataCenter !== "all") {
        // With date, fetch totals for a specific data center by date
        await fetchAllCarbonEmissionByDataCenterIdAndDate(selectedDataCenter, selectedDate);
        await fetchTotalCarbonEmissionByDataCenterIdAndDate(selectedDataCenter);
        await fetchTotalEnergyConsumptionByDataCenterIdAndDate(selectedDataCenter); // Fetch energy consumption for the data center by date
        await fetchEnergyConsumptionBreakdownByDataCenterIdAndDate(selectedDataCenter, selectedDate); // Fetch energy breakdown for the data center by date
        await fetchTotalRenewableEnergyByDataCenterIdAndDate(selectedDataCenter, selectedDate); // Fetch total renewable energy for the data center by date
    }
        // Fetch metric data for the selected metric button
        const activeMetric = document.querySelector(".button-container .active").innerText;
        fetchMetricData(activeMetric); // Ensure the gauge chart updates based on the active metric
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
// Function to determine which data to fetch based on the current filters
async function fetchData() {
    const selectedMonth = monthPicker.value;
    const selectedYear = yearPicker.value;
    const selectedDataCenter = dataCenterDropdown.value;

    console.log("fetchData called with:", { selectedMonth, selectedYear, selectedDataCenter });

    // Construct selectedDate based on available inputs
    const selectedDate = selectedYear ? (selectedMonth ? `${selectedYear}-${selectedMonth}` : `${selectedYear}`) : null;

    if (!selectedDate && (selectedDataCenter === "all" || !selectedDataCenter)) {
        // No date, fetch totals for all data centers under the company
        await fetchAllCarbonEmissionByCompanyId();
        await fetchTotalCarbonEmissionByCompanyId();
        await fetchTotalEnergyConsumptionByCompanyId();
        await fetchEnergyConsumptionBreakdownByCompanyId();
        await fetchTotalRenewableEnergyByCompanyId();
    } else if (!selectedDate && selectedDataCenter !== "all") {
        // No date, fetch totals for a specific data center
        await fetchAllCarbonEmissionByDataCenterId(selectedDataCenter);
        await fetchTotalCarbonEmissionByDataCenterId(selectedDataCenter);
        await fetchTotalEnergyConsumptionByDataCenterId(selectedDataCenter);
        await fetchEnergyConsumptionBreakdownByDataCenterId(selectedDataCenter);
        await fetchTotalRenewableEnergyByDataCenterId(selectedDataCenter);
    } else if (selectedDate && (selectedDataCenter === "all" || !selectedDataCenter)) {
        // With date, fetch totals for the company by date
        await fetchAllCarbonEmissionByCompanyIdAndDate(selectedDate);
        await fetchTotalCarbonEmissionByCompanyIdAndDate(selectedDate);
        await fetchTotalEnergyConsumptionByCompanyIdAndDate(selectedDate);
        await fetchEnergyConsumptionBreakdownByCompanyIdAndDate(selectedDate);
        await fetchTotalRenewableEnergyByCompanyIdAndDate(selectedDate);
    } else if (selectedDate && selectedDataCenter !== "all") {
        // With date, fetch totals for a specific data center by date
        await fetchAllCarbonEmissionByDataCenterIdAndDate(selectedDataCenter, selectedDate);
        await fetchTotalCarbonEmissionByDataCenterIdAndDate(selectedDataCenter, selectedDate);
        await fetchTotalEnergyConsumptionByDataCenterIdAndDate(selectedDataCenter, selectedDate);
        await fetchEnergyConsumptionBreakdownByDataCenterIdAndDate(selectedDataCenter, selectedDate);
        await fetchTotalRenewableEnergyByDataCenterIdAndDate(selectedDataCenter, selectedDate);
    }

    // Fetch metric data for the selected metric button
    const activeMetric = document.querySelector(".button-container .active").innerText;
    fetchMetricData(activeMetric); // Ensure the gauge chart updates based on the active metric
}

// Case 3: Fetch carbon emissions for all data centers under the company for a specific date - fix
async function fetchAllCarbonEmissionByCompanyIdAndDate(date) {
    try {
        const url = `/Dashboard/Data-Center/CarbonEmission/company/${company_id}/date?date=${encodeURIComponent(date)}`;
        
        console.log("Request URL for company by date:", url);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch data. Status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Data received from fetchAllCarbonEmissionByCompanyIdAndDate:", data);

        if (data) {
            renderChart(data);
        } else {
            console.warn("No data received for the specified date range.");
        }
    } catch (error) {
        console.error("Error fetching carbon emission data for company by date:", error);
    }
}

// Case 4: Fetch carbon emissions for a specific data center and date - fix
async function fetchAllCarbonEmissionByDataCenterIdAndDate(data_center_id, date) {
    try {
        const url = `/Dashboard/Data-Center/CarbonEmission/data-center/${data_center_id}/date?date=${encodeURIComponent(date)}`;
        
        console.log("Request URL for data center by date:", url);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch data. Status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Data received from fetchAllCarbonEmissionByDataCenterIdAndDate:", data);

        if (data) {
            renderChart(data);
        } else {
            console.warn("No data received for the specified date range.");
        }
    } catch (error) {
        console.error("Error fetching carbon emission data for specific data center by date:", error);
    }
}


function renderChart(data) {
    console.log("Rendering chart with data:", data);

    // Step 1: Process data to group by month and year
    const groupedData = data.reduce((acc, item) => {
        const date = new Date(item.date);
        const monthYear = date.toLocaleDateString("en-US", { year: 'numeric', month: 'short' });

        // If monthYear is not in accumulator, add it with initial value
        if (!acc[monthYear]) {
            acc[monthYear] = 0;
        }
        // Accumulate emissions for each month-year
        acc[monthYear] += item.co2_emissions_tons;
        return acc;
    }, {});

    // Step 2: Extract labels and emissions from grouped data
    const labels = Object.keys(groupedData);
    const emissions = Object.values(groupedData);

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
                        text: 'Month-Year'
                    },
                    ticks: {
                        autoSkip: true,
                        maxTicksLimit: 10,
                        padding: 10
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
    const selectedMonth = monthPicker.value;
    const selectedYear = yearPicker.value;

    // Construct selectedDate based on available inputs
    let selectedDate;
    if (selectedYear) {
        selectedDate = selectedMonth ? `${selectedYear}-${selectedMonth}` : selectedYear;
    } else {
        // If neither year nor month is selected, return or handle the missing date scenario
        console.error("Please select a year (and optionally a month) to fetch data.");
        return;
    }

    try {
        const response = await fetch(`/Dashboard/Data-Center/CarbonEmission/Sum/company/${company_id}/date?date=${encodeURIComponent(selectedDate)}`);
        if (!response.ok) {
            console.error("Failed to fetch data. Server response:", response.statusText);
            return;
        }
        
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
    const selectedMonth = monthPicker.value;
    const selectedYear = yearPicker.value;
    // Combine month and year if both are selected
    const selectedDate = selectedMonth && selectedYear ? `${selectedYear}-${selectedMonth}` : null;
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
    const selectedMonth = monthPicker.value;
    const selectedYear = yearPicker.value;
    // Combine month and year if both are selected
    const selectedDate = selectedMonth && selectedYear ? `${selectedYear}-${selectedMonth}` : null;
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
    const selectedMonth = monthPicker.value;
    const selectedYear = yearPicker.value;
    // Combine month and year if both are selected
    const selectedDate = selectedMonth && selectedYear ? `${selectedYear}-${selectedMonth}` : null;
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


function renderEnergyBreakdownChart(data) {
    console.log("Rendering energy breakdown chart with data:", data);

    const energyData = data[0];
    if (!energyData) {
        console.warn("No energy data available for breakdown chart.");
        return;
    }

    const labels = ['Backup Power', 'Cooling', 'IT Equipment', 'Lighting'];
    const values = [
        energyData.backup_power_energy_mwh,
        energyData.cooling_energy_mwh,
        energyData.it_energy_mwh,
        energyData.lighting_energy_mwh
    ];
    const colors = ['#2F3E46', '#4E5D63', '#38B2AC', '#A8DADC']; // Colors for each section
    const total = values.reduce((acc, val) => acc + val, 0); // Calculate the total for percentage

    const ctx = document.getElementById("energyBreakdownChart").getContext("2d");

    // Check if the chart already exists before attempting to destroy
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
                backgroundColor: colors,
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

    // Generate dynamic labels for the right-side legend
    const legendContainer = document.querySelector(".pie-chart-labels-container");
    legendContainer.innerHTML = ''; // Clear any existing labels

    labels.forEach((label, index) => {
        const color = colors[index];
        const value = values[index];
        const percentage = ((value / total) * 100).toFixed(1);

        // Create a legend item
        const legendItem = document.createElement("div");
        legendItem.classList.add("legend-item");
        legendItem.innerHTML = `
        <span class="label-color" style="background-color: ${color}; width: 12px; height: 12px; display: inline-block; margin-right: 8px;"></span>
        <span class="label-name" style="font-weight: bold;">${label}:</span>
        <span class="label-value" style="font-weight: normal;">${value} MWh (${percentage}%)</span>
    `;
     

        // Append the legend item to the container
        legendContainer.appendChild(legendItem);
    });
}







// Function to fetch and display total renewable energy for the company
async function fetchTotalRenewableEnergyByCompanyId() {
    try {
        const response = await fetch(`/Dashboard/Data-Center/RenewableEnergy/Total/company/${company_id}`);
        const data = await response.json();
        console.log("Total Renewable Energy data for company:", data);
        
        // Update the "Total Renewable Energy" display
        document.getElementById("totalRenewableEnergy").textContent = `${data.total_renewable_energy} MWh`;
        
    } catch (error) {
        console.error("Error fetching total renewable energy data for company:", error);
    }
}

// Function to fetch and display total renewable energy for a specific data center
async function fetchTotalRenewableEnergyByDataCenterId(data_center_id) {
    try {
        const response = await fetch(`/Dashboard/Data-Center/RenewableEnergy/Total/data-center/${data_center_id}`);
        const data = await response.json();
        console.log("Total Renewable Energy data for data center:", data);
        
        // Update the "Total Renewable Energy" display
        document.getElementById("totalRenewableEnergy").textContent = `${data.total_renewable_energy} MWh`;
        
    } catch (error) {
        console.error("Error fetching total renewable energy data for data center:", error);
    }
}

// Function to fetch and display total renewable energy for the company with date
async function fetchTotalRenewableEnergyByCompanyIdAndDate(selectedDate) {
    const formattedDate = new Date(selectedDate).toISOString().split('T')[0];
    try {
        const response = await fetch(`/Dashboard/Data-Center/RenewableEnergy/Total/company/${company_id}/date?date=${encodeURIComponent(formattedDate)}`);
        const data = await response.json();
        console.log("Total Renewable Energy data for company by date:", data);

        // Update the "Total Renewable Energy" display
        document.getElementById("totalRenewableEnergy").textContent = `${data.total_renewable_energy} MWh`;
        
    } catch (error) {
        console.error("Error fetching total renewable energy data for company by date:", error);
    }
}

// Function to fetch and display total renewable energy for a specific data center with date
async function fetchTotalRenewableEnergyByDataCenterIdAndDate(data_center_id, selectedDate) {
    const formattedDate = new Date(selectedDate).toISOString().split('T')[0];
    try {
        const response = await fetch(`/Dashboard/Data-Center/RenewableEnergy/Total/data-center/${data_center_id}/date?date=${encodeURIComponent(formattedDate)}`);
        const data = await response.json();
        console.log("Total Renewable Energy data for data center by date:", data);

        // Update the "Total Renewable Energy" display
        document.getElementById("totalRenewableEnergy").textContent = `${data.total_renewable_energy} MWh`;
        
    } catch (error) {
        console.error("Error fetching total renewable energy data for data center by date:", error);
    }
}





async function fetchMetricData(metric) {
    const selectedDataCenter = dataCenterDropdown.value;
    const selectedMonth = monthPicker.value;
    const selectedYear = yearPicker.value;
    // Combine month and year if both are selected
    const selectedDate = selectedYear ? (selectedMonth ? `${selectedYear}-${selectedMonth}` : `${selectedYear}`) : null;

    try {
        // Determine the endpoint based on filters
        if (!selectedDate && (selectedDataCenter === "all" || !selectedDataCenter)) {
            response = await fetch(`/Dashboard/Data-Center/EnergyConsumption/company/${company_id}`);
        } else if (!selectedDate && selectedDataCenter !== "all") {
            response = await fetch(`/Dashboard/Data-Center/EnergyConsumption/data-center/${selectedDataCenter}`);
        } else if (selectedDate && (selectedDataCenter === "all" || !selectedDataCenter)) {
            response = await fetch(`/Dashboard/Data-Center/EnergyConsumption/company/${company_id}/date?date=${encodeURIComponent(selectedDate)}`);
        } else if (selectedDate && selectedDataCenter !== "all") {
            response = await fetch(`/Dashboard/Data-Center/EnergyConsumption/data-center/${selectedDataCenter}/date?date=${encodeURIComponent(selectedDate)}`);
        }

        const data = await response.json();
        console.log(`Data fetched for ${metric}:`, data);

        // Access the first object in the array to find the metric value
        if (Array.isArray(data) && data.length > 0 && data[0][`${metric.toLowerCase()}_avg`] !== undefined) {
            const metricValue = data[0][`${metric.toLowerCase()}_avg`];
            console.log(`Rendering gauge chart for ${metric} with value:`, metricValue);
            renderGaugeChart(metricValue, metric); // Render the gauge chart with the metric value
        } else {
            console.warn(`No ${metric} data found or missing ${metric.toLowerCase()}_avg field`);
        }
    } catch (error) {
        console.error(`Error fetching ${metric} data:`, error);
    }
}






function renderGaugeChart(value, label) {
    const targetValues = { PUE: 1, CUE: 0.5, WUE: 1.0 };
    const target = targetValues[label];
    const maxValue = target * 2;

    // Set canvas dimensions for better clarity
    const canvas = document.getElementById("gaugeChart");
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = 200 * pixelRatio;
    canvas.height = 200 * pixelRatio;
    canvas.style.width = '200px';
    canvas.style.height = '200px';

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawing
    ctx.scale(pixelRatio, pixelRatio);

    const centerX = canvas.width / (2 * pixelRatio);
    const centerY = canvas.height / (2 * pixelRatio) + 10;
    const radius = 70;

    // Draw green section
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, Math.PI + (0.5 * Math.PI));
    ctx.lineWidth = 20;
    ctx.strokeStyle = "#4FD1C5";
    ctx.stroke();

    // Draw red section
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI + (0.5 * Math.PI), 2 * Math.PI);
    ctx.strokeStyle = "#FF6B6B";
    ctx.stroke();

    // Needle calculations and drawing
    const needleAngle = Math.PI + (value / maxValue) * Math.PI;
    const needleLength = radius - 10;

    // Draw needle shaft
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
        centerX + needleLength * Math.cos(needleAngle),
        centerY + needleLength * Math.sin(needleAngle)
    );
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#333";
    ctx.stroke();

    // Draw needle head (arrow)
    const headLength = 10;
    const headWidth = 4;
    const headAngle1 = needleAngle - 0.15;
    const headAngle2 = needleAngle + 0.15;

    ctx.beginPath();
    ctx.moveTo(
        centerX + needleLength * Math.cos(needleAngle),
        centerY + needleLength * Math.sin(needleAngle)
    );
    ctx.lineTo(
        centerX + (needleLength - headLength) * Math.cos(headAngle1),
        centerY + (needleLength - headLength) * Math.sin(headAngle1)
    );
    ctx.lineTo(
        centerX + (needleLength - headLength) * Math.cos(headAngle2),
        centerY + (needleLength - headLength) * Math.sin(headAngle2)
    );
    ctx.closePath();
    ctx.fillStyle = "#333";
    ctx.fill();

    // Needle base circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
    ctx.fillStyle = "#333";
    ctx.fill();

    // Labels
    ctx.font = "14px Arial";
    ctx.fillStyle = "#333";
    ctx.textAlign = "center";
    ctx.fillText("0", centerX - radius - 10, centerY + 15);
    ctx.fillText(target.toFixed(2), centerX, centerY - radius + 25);
    ctx.fillText(maxValue.toFixed(2), centerX + radius + 10, centerY + 15);

    // Value label below
    ctx.font = "bold 14px Arial";
    ctx.fillText(`${label}: ${value.toFixed(2)}`, centerX, centerY + 45);
}








// Load data centers and chart on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM fully loaded, initializing data center options...");
    await loadDataCenterOptions(); // Load data centers when the page loads
    fetchMetricData("PUE");
    pueButton.classList.add("active");
    fetchData(); 
});