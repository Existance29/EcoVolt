function showTooltip() {
    document.getElementById("tooltipModal").style.display = "block";
}

function hideTooltip() {
    document.getElementById("tooltipModal").style.display = "none";
}

// Close the tooltip when clicking outside the modal content
window.onclick = function(event) {
    const modal = document.getElementById("tooltipModal");
    if (event.target == modal) {
        modal.style.display = "none";
    }
};

const company_id = getCompanyId();

document.getElementById("datePickerToggle").addEventListener("click", function(event) {
    event.stopPropagation(); 
    var container = document.getElementById("datePickerContainer");
    container.style.display = container.style.display === "none" || !container.style.display ? "block" : "none";
});

document.addEventListener("click", function(event) {
    var container = document.getElementById("datePickerContainer");
    var toggle = document.getElementById("datePickerToggle");
    if (!toggle.contains(event.target) && !container.contains(event.target)) {
        container.style.display = "none";
    }
});

// monthPicker.addEventListener("change", fetchData);
// yearPicker.addEventListener("change", fetchData);

// Call fetchData only when "Apply" button is clicked
document.getElementById("datePickerApply").addEventListener("click", function(event) {
    event.preventDefault();
    
    const selectedMonth = monthPicker.value;
    const selectedYear = yearPicker.value;

    // Show error if month is selected without a year
    if (selectedMonth && !selectedYear) {
        yearErrorMessage.textContent = "Please select a year";
        yearErrorMessage.style.display = "block";
        return;
    } else {
        yearErrorMessage.style.display = "none"; // Hide error if validation passes
    }

    updateDatePickerToggleLabel(); // Update the label based on the selected month/year
    document.getElementById("datePickerContainer").style.display = "none";
    fetchData();
});

// Event listener for the Clear button
document.getElementById("datePickerClear").addEventListener("click", function(event) {
    event.preventDefault();
    monthPicker.value = "";
    yearPicker.value = "";
    updateDatePickerToggleLabel(); // Reset the label to "All"
    document.getElementById("datePickerContainer").style.display = "none";
    fetchData();
});



const monthPicker = document.getElementById("monthPicker");
const yearPicker = document.getElementById("yearPicker");
const dataCenterDropdown = document.getElementById("dataCenterDropdown");
const noDataMessage = document.getElementById("noDataMessage");
const mainChartContent = document.querySelector(".main-chart-content");

const yearErrorMessage = document.createElement("div"); // Create error message element

yearErrorMessage.style.color = "red";
yearErrorMessage.style.fontSize = "12px";
yearErrorMessage.style.marginTop = "4px";
yearErrorMessage.style.display = "none"; // Initially hidden
yearPicker.parentNode.insertBefore(yearErrorMessage, yearPicker.nextSibling); // Insert error message below year picker


// Initialize chart instances
let carbonEmissionChart;
let energyBreakdownChart;

// Event listeners to handle changes in the date or data center dropdown
// monthPicker.addEventListener("change", fetchData);
// yearPicker.addEventListener("change", fetchData);
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
        allOption.textContent = 'All';
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

async function fetchAvailableDates() {
    try {
        const response = await fetch(`/Dashboard/Data-Center/AvailableDates/${company_id}`);
        const data = await response.json();
        console.log("Full fetched data:", data);

        // Extract years and months from the fetched data
        const availableDates = data.recordsets[0].map(item => item.date.split('T')[0]); // "YYYY-MM-DD"
        const availableYears = new Set(availableDates.map(date => date.split('-')[0])); // Extract year part
        const availableMonths = new Set(availableDates.map(date => date.slice(0, 7))); // "YYYY-MM"

        console.log("Available years:", availableYears);
        console.log("Available months:", availableMonths);

        return { availableYears, availableMonths };
    } catch (error) {
        console.error("Error fetching available dates:", error);
        return { availableYears: new Set(), availableMonths: new Set() };
    }
}

function updateDatePickerToggleLabel() {
    const selectedMonth = monthPicker.value;
    const selectedYear = yearPicker.value;
    
    if (selectedYear && selectedMonth) {
        // Show month and year (e.g., January 2024)
        const monthName = monthPicker.options[monthPicker.selectedIndex].text;
        document.getElementById("datePickerToggle").textContent = `${monthName} ${selectedYear}`;
    } else if (selectedYear) {
        // Show only year (e.g., 2024)
        document.getElementById("datePickerToggle").textContent = selectedYear;
    } else {
        // Default to "All"
        document.getElementById("datePickerToggle").textContent = "All";
    }
}

async function fetchData() {
    const selectedMonth = monthPicker.value;
    const selectedYear = yearPicker.value;
    const selectedDataCenter = dataCenterDropdown.value;

    // // Check if month is selected without a year
    // if (selectedMonth && !selectedYear) {
    //     yearErrorMessage.textContent = "Please select a year";
    //     yearErrorMessage.style.display = "block";
    //     return; // Stop fetch if month is selected without a year
    // } else {
    //     yearErrorMessage.style.display = "none"; // Hide the error message if validation passes
    // }

    const selectedDate = selectedYear && selectedMonth ? `${selectedYear}-${selectedMonth}` : selectedYear;

    if (selectedDate && (selectedDate.length !== 4 && selectedDate.length !== 7)) {
        console.error("Invalid date format. Expected format: YYYY or YYYY-MM.");
        noDataMessage.style.display = "block";
        mainChartContent.style.display = "none";
        return;
    }

    const { availableYears, availableMonths } = await fetchAvailableDates();

    if (selectedYear && !availableYears.has(selectedYear)) {
        console.warn("Year not found:", selectedYear);
        noDataMessage.style.display = "block";
        mainChartContent.style.display = "none";
        return;
    }

    if (selectedDate && selectedMonth && !availableMonths.has(selectedDate)) {
        console.warn("Month-year not found:", selectedDate);
        noDataMessage.style.display = "block";
        mainChartContent.style.display = "none";
        return;
    }

    noDataMessage.style.display = "none";
    mainChartContent.style.display = "flex";

    console.log("fetchData called with:", { selectedMonth, selectedYear, selectedDataCenter });

    updateDatePickerToggleLabel();

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
        await fetchTotalCarbonEmissionByCompanyIdAndDate(selectedDate);
        await fetchTotalEnergyConsumptionByCompanyIdAndDate(selectedDate); // Fetch energy consumption for the company by date
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
        const url = `/Dashboard/Data-Center/CarbonEmission/data-center/${data_center_id}/date?date=${date}`;
        
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

    // Step 1: Check if both month and year filters are selected
    const selectedMonth = monthPicker.value;
    const selectedYear = yearPicker.value;
    const isDailyView = selectedMonth && selectedYear;

    // Step 2: Process data to group by day if daily view is required; otherwise, by month-year
    const groupedData = data.reduce((acc, item) => {
        const date = new Date(item.date);
        let dateLabel;

        if (isDailyView) {
            // Group by day-month (e.g., 01-Jan, 02-Jan)
            dateLabel = date.toLocaleDateString("en-US", { day: '2-digit', month: 'short' });
        } else {
            // Group by month-year (e.g., Jan-2024)
            dateLabel = date.toLocaleDateString("en-US", { year: 'numeric', month: 'short' });
        }

        if (!acc[dateLabel]) {
            acc[dateLabel] = 0;
        }
        acc[dateLabel] += item.co2_emissions_tons;
        return acc;
    }, {});

    // Step 3: Extract labels and emissions from grouped data
    const labels = Object.keys(groupedData);
    const emissions = Object.values(groupedData);

    if (!labels.length || !emissions.length) {
        console.warn("No data available to display.");
        return;
    }

    const ctx = document.getElementById("carbonEmissionChart").getContext("2d");

    if (carbonEmissionChart) {
        carbonEmissionChart.destroy();
    }

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
                    display: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: isDailyView ? 'Day-Month' : 'Month-Year'
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
        const totalCarbonEmissions = parseFloat(data.total_co2_emissions);
        document.getElementById("totalCarbonEmissions").textContent = 
            `${totalCarbonEmissions % 1 !== 0 ? totalCarbonEmissions.toFixed(1) : totalCarbonEmissions} Tons`;                
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
        const totalCarbonEmissions = parseFloat(data.total_co2_emissions);
        document.getElementById("totalCarbonEmissions").textContent = 
            `${totalCarbonEmissions % 1 !== 0 ? totalCarbonEmissions.toFixed(1) : totalCarbonEmissions} Tons`;                
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
        const totalCarbonEmissions = parseFloat(data.total_co2_emissions);
        document.getElementById("totalCarbonEmissions").textContent = 
            `${totalCarbonEmissions % 1 !== 0 ? totalCarbonEmissions.toFixed(1) : totalCarbonEmissions} Tons`;                
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
        const totalCarbonEmissions = parseFloat(data.total_co2_emissions);
        document.getElementById("totalCarbonEmissions").textContent = 
            `${totalCarbonEmissions % 1 !== 0 ? totalCarbonEmissions.toFixed(1) : totalCarbonEmissions} Tons`;
                
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
        const totalEnergyConsumption = parseFloat(data.total_energy_consumption);
        document.getElementById("totalEnergyConsumption").textContent = 
            `${totalEnergyConsumption % 1 !== 0 ? totalEnergyConsumption.toFixed(1) : totalEnergyConsumption} MWh`;
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
        
        const totalEnergyConsumption = parseFloat(data.total_energy_consumption);
        document.getElementById("totalEnergyConsumption").textContent = 
            `${totalEnergyConsumption % 1 !== 0 ? totalEnergyConsumption.toFixed(1) : totalEnergyConsumption} MWh`;
    } catch (error) {
        console.error("Error fetching total energy consumption data for data center:", error);
    }
}

// Function to fetch total energy consumption for the company using the selected date
async function fetchTotalEnergyConsumptionByCompanyIdAndDate(selectedDate) {
    try {
        const response = await fetch(`/Dashboard/Data-Center/EnergyConsumption/Sum/company/${company_id}/date?date=${selectedDate}`);
        const data = await response.json();
        console.log("Total energy consumption data for company by date:", data);
        // Update the total energy consumption display in the stat-value element
        const totalEnergyConsumption = parseFloat(data.total_energy_consumption);
        document.getElementById("totalEnergyConsumption").textContent = 
            `${totalEnergyConsumption % 1 !== 0 ? totalEnergyConsumption.toFixed(1) : totalEnergyConsumption} MWh`;
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
        const totalEnergyConsumption = parseFloat(data.total_energy_consumption);
        document.getElementById("totalEnergyConsumption").textContent = 
            `${totalEnergyConsumption % 1 !== 0 ? totalEnergyConsumption.toFixed(1) : totalEnergyConsumption} MWh`;
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
    try {
        const response = await fetch(`/Dashboard/Data-Center/EnergyConsumption/company/${company_id}/date?date=${date}`);
        const data = await response.json();
        console.log("Energy Breakdown data for company by date:", data);
        renderEnergyBreakdownChart(data);
    } catch (error) {
        console.error("Error fetching energy breakdown data for company by date:", error);
    }
}

// Function to fetch energy consumption breakdown for a specific data center using the selected date
async function fetchEnergyConsumptionBreakdownByDataCenterIdAndDate(data_center_id, date) {
    try {
        const response = await fetch(`/Dashboard/Data-Center/EnergyConsumption/data-center/${data_center_id}/date?date=${date}`);
        const data = await response.json();
        console.log("Energy Breakdown data for data center by date:", data);
        renderEnergyBreakdownChart(data);
    } catch (error) {
        console.error("Error fetching energy breakdown data for data center by date:", error);
    }
}

const popupChartCanvas = document.getElementById("popupChart");


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
    const colors = ['#2F3E46', '#4E5D63', '#38B2AC', '#A8DADC'];
    const total = values.reduce((acc, val) => acc + val, 0);

    const ctx = document.getElementById("energyBreakdownChart").getContext("2d");

    // Destroy existing chart instance if it exists
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
                data: values.map(val => parseFloat(val.toFixed(1))),
                backgroundColor: colors,
                borderColor: '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            hoverOffset: 15,  // Add this line to set hover offset (enlarges on hover)
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw || 0;
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${value.toLocaleString()} MWh)`; // Format with commas
                        }
                    }
                }
            },
            layout: { padding: 10 },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    // Get the index of the clicked item
                    const index = elements[0].index;
                    const selectedLabel = labels[index];

                    // Get date and data center filters
                    const dataCenterId = dataCenterDropdown.value;
                    const year = yearPicker.value || null;
                    const month = monthPicker.value || null;

                    // Open the pop-up with relevant data
                    openPopup(dataCenterId, year, month, selectedLabel);
                }
            }
        }
    });

    // Generate dynamic labels for the right-side legend
    const legendContainer = document.querySelector(".pie-chart-labels-container");
    legendContainer.innerHTML = ''; // Clear any existing labels

    labels.forEach((label, index) => {
        const color = colors[index];
        const value = parseFloat(values[index].toFixed(1)).toLocaleString(); // Format with commas
        const percentage = ((values[index] / total) * 100).toFixed(1);

        // Create a legend item
        const legendItem = document.createElement("div");
        legendItem.classList.add("legend-item");
        legendItem.innerHTML = `
            <span class="label-color" style="background-color: ${color}; width: 12px; height: 12px; display: inline-block; margin-right: 8px;"></span>
            <span class="label-name" style="font-weight: bold;">${label}:</span>
            <span class="label-value" style="font-weight: normal;">${value} MWh (${percentage}%)</span>
        `;
        legendContainer.appendChild(legendItem);
    });
}


function openPopup(dataCenterId, year, month, selectedLabel) {
    popupModal.style.display = 'flex';

    // Only destroy if popupChart exists and is a Chart instance
    if (popupChart && typeof popupChart.destroy === 'function') {
        popupChart.destroy();
    }

    // Determine chart type based on the data center filter
    const isDataCenterFiltered = dataCenterId && dataCenterId !== "all";
    const chartType = isDataCenterFiltered ? 'line' : 'bar';

    // Construct API URL based on filters
    let apiUrl = `/Dashboard/Data-Center/EnergyConsumption/GroupByDc/${company_id}`;
    if (isDataCenterFiltered) apiUrl += `/${dataCenterId}`;

    const queryParams = [];
    if (year) queryParams.push(`year=${year}`);
    if (month) queryParams.push(`month=${month}`);
    if (queryParams.length > 0) apiUrl += `?${queryParams.join('&')}`;

    // Fetch data and render the chart
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) throw new Error("Network response was not ok");
            return response.json();
        })
        .then(data => {
            // Filter data based on selectedLabel for chart display
            const dataset = data.map(item => {
                switch (selectedLabel) {
                    case 'Backup Power': return item.total_backup_power_mwh;
                    case 'Cooling': return item.total_cooling_mwh;
                    case 'IT Equipment': return item.total_it_energy_mwh;
                    case 'Lighting': return item.total_lighting_mwh;
                    default: return item.total_energy_consumption_mwh;
                }
            });

            const labels = isDataCenterFiltered
                ? data.map(item => new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })) // Format as month-year
                : data.map(item => item.data_center_name);

            // Set the title based on data center
            const chartTitle = isDataCenterFiltered ? `Data Center: ${data[0].data_center_name}` : `${selectedLabel} - Energy Consumption (MWh)`;

            popupChart = new Chart(popupChartCanvas, {
                type: chartType,
                data: {
                    labels: labels,
                    datasets: [{
                        label: `${selectedLabel} - Energy Consumption (MWh)`,
                        data: dataset,
                        borderColor: '#36A2EB',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        fill: true,
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: chartTitle
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: isDataCenterFiltered ? 'Month-Year' : 'Data Center'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Energy Consumption (MWh)'
                            }
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.error('Error fetching chart data:', error);
            alert('Failed to load chart data.');
        });
}


function closePopup() {
    const popupModal = document.getElementById("popupModal");
    popupModal.style.display = 'none';
    
    // Destroy the chart instance if it exists
    if (popupChart && typeof popupChart.destroy === 'function') {
        popupChart.destroy();
    }
}







// Function to fetch and display total renewable energy for the company
async function fetchTotalRenewableEnergyByCompanyId() {
    try {
        const response = await fetch(`/Dashboard/Data-Center/RenewableEnergy/Total/company/${company_id}`);
        const data = await response.json();
        console.log("Total Renewable Energy data for company:", data);
        
        // Update the "Total Renewable Energy" display
        const totalRenewableEnergy = parseFloat(data.total_renewable_energy);
        document.getElementById("totalRenewableEnergy").textContent = 
            `${totalRenewableEnergy % 1 !== 0 ? totalRenewableEnergy.toFixed(1) : totalRenewableEnergy} MWh`;
                
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
        const totalRenewableEnergy = parseFloat(data.total_renewable_energy);
        document.getElementById("totalRenewableEnergy").textContent = 
            `${totalRenewableEnergy % 1 !== 0 ? totalRenewableEnergy.toFixed(1) : totalRenewableEnergy} MWh`;
                
    } catch (error) {
        console.error("Error fetching total renewable energy data for data center:", error);
    }
}

// Function to fetch and display total renewable energy for the company with date
async function fetchTotalRenewableEnergyByCompanyIdAndDate(selectedDate) {
    try {
        const response = await fetch(`/Dashboard/Data-Center/RenewableEnergy/Total/company/${company_id}/date?date=${selectedDate}`);
        const data = await response.json();
        console.log("Total Renewable Energy data for company by date:", data);

        // Update the "Total Renewable Energy" display
        const totalRenewableEnergy = parseFloat(data.total_renewable_energy);
        document.getElementById("totalRenewableEnergy").textContent = 
            `${totalRenewableEnergy % 1 !== 0 ? totalRenewableEnergy.toFixed(1) : totalRenewableEnergy} MWh`;
                
    } catch (error) {
        console.error("Error fetching total renewable energy data for company by date:", error);
    }
}

// Function to fetch and display total renewable energy for a specific data center with date
async function fetchTotalRenewableEnergyByDataCenterIdAndDate(data_center_id, selectedDate) {
    try {
        const response = await fetch(`/Dashboard/Data-Center/RenewableEnergy/Total/data-center/${data_center_id}/date?date=${selectedDate}`);
        const data = await response.json();
        console.log("Total Renewable Energy data for data center by date:", data);

        // Update the "Total Renewable Energy" display
        const totalRenewableEnergy = parseFloat(data.total_renewable_energy);
        document.getElementById("totalRenewableEnergy").textContent = 
            `${totalRenewableEnergy % 1 !== 0 ? totalRenewableEnergy.toFixed(1) : totalRenewableEnergy} MWh`;
                
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
    ctx.fillText(`${label}: ${value.toFixed(2)}`, centerX, centerY + 20);
}







document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM fully loaded, initializing data center options...");
    
    // Load data center options
    await loadDataCenterOptions();
    
    // Extract parameters from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const dataCenterIdFromUrl = urlParams.get('data_center_id');
    const dateFromUrl = urlParams.get('date');
    const yearFromUrl = urlParams.get('year'); // Additional year parameter

    // Set data center dropdown based on URL parameter if present
    if (dataCenterIdFromUrl) {
        dataCenterDropdown.value = dataCenterIdFromUrl;
    }

    // Set month and year pickers based on URL parameter if present
    if (dateFromUrl) {
        const [year, month] = dateFromUrl.split('/');
        if (yearPicker) yearPicker.value = year;
        if (monthPicker && month) monthPicker.value = month.padStart(2, '0'); // Ensure month is two digits
    }

    // Set year picker based on year parameter if present
    if (yearFromUrl && yearPicker) {
        yearPicker.value = yearFromUrl;
    }

    // Initialize metric gauge with PUE as default and trigger data fetch
    fetchMetricData("PUE");
    pueButton.classList.add("active");
    fetchData();
});
