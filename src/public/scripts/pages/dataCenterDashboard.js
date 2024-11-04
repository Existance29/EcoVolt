// Set your company ID (replace with the actual ID)
const company_id = getCompanyId(); // Replace with actual company ID

// Elements from the page for filters
const datePicker = document.getElementById("datePicker");
const dataCenterDropdown = document.getElementById("dataCenterDropdown");

// Initialize chart instances
let carbonEmissionChart;
let co2VsRenewableChart;

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
        await fetchAllCarbonEmissionByCompanyId();
    } else if (!selectedDate && selectedDataCenter !== "all") {
        await fetchAllCarbonEmissionByDataCenterId(selectedDataCenter);
    } else if (selectedDate && (selectedDataCenter === "all" || !selectedDataCenter)) {
        await fetchAllCarbonEmissionByCompanyIdAndDate(selectedDate);
    } else if (selectedDate && selectedDataCenter !== "all") {
        await fetchAllCarbonEmissionByDataCenterIdAndDate(selectedDataCenter, selectedDate);
    }

    // Fetch CO2 vs Renewable data for gauge chart
    await fetchCo2VsRenewableData(selectedDate, selectedDataCenter);
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




// Function to fetch and display CO2 vs Renewable Energy data for the gauge chart
async function fetchCo2VsRenewableData(selectedDate, selectedDataCenter) {
    try {
        let url;
        if (!selectedDate && (selectedDataCenter === "all" || !selectedDataCenter)) {
            url = `/Dashboard/Data-Center/CarbonEmissionRenewableEnergyValue/company/${company_id}`;
        } else if (!selectedDate && selectedDataCenter !== "all") {
            url = `/Dashboard/Data-Center/CarbonEmissionRenewableEnergyValue/company/${company_id}/${selectedDataCenter}`;
        } else if (selectedDate && (selectedDataCenter === "all" || !selectedDataCenter)) {
            url = `/Dashboard/Data-Center/CarbonEmissionRenewableEnergyValue/company/${company_id}/date?date=${encodeURIComponent(selectedDate)}`;
        } else if (selectedDate && selectedDataCenter !== "all") {
            url = `/Dashboard/Data-Center/CarbonEmissionRenewableEnergyValue/company/${company_id}/${selectedDataCenter}/date?date=${encodeURIComponent(selectedDate)}`;
        }

        const response = await fetch(url);
        const data = await response.json();
        console.log("Data received for CO2 vs Renewable Energy gauge chart:", data);

        renderGaugeChart(data);
    } catch (error) {
        console.error("Error fetching CO2 vs Renewable Energy data:", error);
    }
}
// Function to render the gauge chart for CO2 vs Renewable Energy
function renderGaugeChart(data) {
    console.log("Rendering gauge chart with data:", data);

    const totalCO2 = data.total_co2_emissions || 0;
    const renewableEnergy = data.total_renewable_energy_value || 0;
    const total = totalCO2 + renewableEnergy;

    const renewablePercentage = total > 0 ? (renewableEnergy / total) * 100 : 0;

    const ctx = document.getElementById("co2VsRenewableChart").getContext("2d");

    if (co2VsRenewableChart) {
        co2VsRenewableChart.destroy();
    }

    co2VsRenewableChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Renewable Energy', 'CO2 Emissions'],
            datasets: [{
                data: [renewablePercentage, 100 - renewablePercentage],
                backgroundColor: ['#4FD1C5', '#F56565'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Ensures it fills the container
            cutout: '75%',
            rotation: -90,
            circumference: 180,
            layout: {
                padding: 0
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'right',
                    labels: {
                        boxWidth: 15,
                        padding: 5,
                        font: {
                            size: 12
                        },
                        generateLabels: (chart) => {
                            const data = chart.data.datasets[0].data;
                            return [
                                {
                                    text: [`Renewable Energy`, `${renewableEnergy.toFixed(2)} tons`],
                                    fillStyle: '#4FD1C5',
                                },
                                {
                                    text: [`CO2 Emissions`, `${totalCO2.toFixed(2)} tons`],
                                    fillStyle: '#F56565',
                                }
                            ];
                        }
                    }
                },
                tooltip: {
                    enabled: false
                }
            }
        }
    });
}



// Function to fetch CO2 Breakdown data
// Fetch and update CO2 Breakdown data
async function fetchCO2Breakdown() {
    try {
        let url = `/Dashboard/Data-Center/CarbonEmission/company/${company_id}`; // Replace this as needed

        // Fetch the data
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.length >= 2) { // Ensure we have data for at least two periods
            displayCO2Breakdown(data);
        } else {
            console.error("Insufficient data for CO2 Breakdown.");
        }
    } catch (error) {
        console.error('Error fetching CO2 Breakdown:', error);
    }
}

// Display the CO2 Breakdown in the HTML
function displayCO2Breakdown(data) {
    // Assuming the most recent data is at the end of the array
    const thisPeriod = data[data.length - 1].co2_emissions_tons;
    const lastPeriod = data[data.length - 2].co2_emissions_tons;
    const changePercentage = ((lastPeriod - thisPeriod) / lastPeriod * 100).toFixed(2);
    const equivalentCars = Math.round(changePercentage / 3); // Adjust this factor as needed for conversion

    // Update elements in the HTML
    document.getElementById('change-percentage').textContent = `${changePercentage > 0 ? '↓' : '↑'}${Math.abs(changePercentage)}%`;
    document.getElementById('equivalent-cars').textContent = equivalentCars;
    document.getElementById('last-period-co2').textContent = `${lastPeriod.toLocaleString()} kg CO₂e`;
    document.getElementById('this-period-co2').textContent = `${thisPeriod.toLocaleString()} kg CO₂e`;
    document.getElementById('last-period-change').textContent = `${changePercentage}%`;

    // Update styles based on positive or negative change
    document.getElementById('change-percentage').className = changePercentage > 0 ? 'increase' : 'decrease';
    document.getElementById('last-period-change').className = changePercentage > 0 ? 'increase' : 'decrease';
}

// Load CO2 breakdown data on page load
document.addEventListener('DOMContentLoaded', fetchCO2Breakdown);


// Function to update the CO2 Breakdown section
function updateCO2Breakdown(data) {
    const lastPeriodCO2 = data.lastPeriodCO2 || 0;
    const thisPeriodCO2 = data.thisPeriodCO2 || 0;

    // Calculate percentage change
    const changePercentage = lastPeriodCO2 > 0 ? ((thisPeriodCO2 - lastPeriodCO2) / lastPeriodCO2) * 100 : 0;
    const equivalentCars = Math.round((lastPeriodCO2 - thisPeriodCO2) / 4170); // Example conversion rate

    // Update the DOM elements with the fetched data
    document.getElementById('change-percentage').textContent = `${changePercentage > 0 ? '↓' : '↑'}${Math.abs(changePercentage).toFixed(2)}%`;
    document.getElementById('equivalent-cars').textContent = equivalentCars;
    document.getElementById('last-period-change').textContent = `${changePercentage.toFixed(2)}%`;
    document.getElementById('last-period-co2').textContent = `${lastPeriodCO2.toLocaleString()} kg CO₂e`;
    document.getElementById('this-period-co2').textContent = `${thisPeriodCO2.toLocaleString()} kg CO₂e`;

    // Set colors based on increase or decrease
    document.getElementById('change-percentage').classList.toggle('positive', changePercentage > 0);
    document.getElementById('change-percentage').classList.toggle('negative', changePercentage < 0);
}


// Load data centers and chart on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM fully loaded, initializing data center options...");
    await loadDataCenterOptions(); // Load data centers when the page loads
    fetchData(); // Call fetchData to load the initial chart data based on filters
    fetchCO2Breakdown(); // Load the CO2 breakdown data
});
