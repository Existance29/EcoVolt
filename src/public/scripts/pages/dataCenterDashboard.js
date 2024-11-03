pageRequireSignIn();
const company_id = getCompanyId();

// Global variables
let selectedDataCenter = 'all'; // Default to "all" data centers
let energyConsumptionChart; // Chart instance placeholder
let carbonEmissionChart; // Chart instance placeholder
let carbonVsRenewableGauge; // gauge chart instance

// Function to load data centers into the dropdown
async function loadDataCenterOptions() {
    try {
        console.log("Loading data centers for dropdown...");
        const response = await get(`/Dashboard/Data-Center/${company_id}`);
        const dataCenters = await response.json();
        console.log("Data centers loaded:", dataCenters);

        const dataCenterDropdown = document.getElementById('dataCenterDropdown');
        dataCenterDropdown.innerHTML = '';

        // Add "All Data Centers" option
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = 'All Data Centers';
        dataCenterDropdown.appendChild(allOption);

        // Populate dropdown with data centers
        dataCenters.forEach(dc => {
            const option = document.createElement('option');
            option.value = dc.id;
            option.textContent = dc.data_center_name;
            dataCenterDropdown.appendChild(option);
        });

        dataCenterDropdown.value = selectedDataCenter;

        // Event listener for dropdown selection
        dataCenterDropdown.addEventListener('change', (e) => {
            selectedDataCenter = e.target.value;
            console.log(`Dropdown changed, selectedDataCenter is now: ${selectedDataCenter}`);
            updateChartData(selectedDataCenter);
            renderCarbonEmissionChart(); // Render carbon emissions when selection changes
        });
    } catch (error) {
        console.error('Error loading data centers:', error);
    }
}

async function updateChartData(dataCenterId) {
    console.log(`Updating chart data for selected data center: ${dataCenterId}`);
    const selectedDate = document.getElementById('datePicker') ? document.getElementById('datePicker').value : '';
    
    // Get the dataCenterOptions element
    // const dataCenterOptions = document.getElementById('dataCenterOptions');

    if (dataCenterId === 'all') {
        // Show data center options if "All Data Centers" is selected
        // dataCenterOptions.style.display = 'flex';
        
        if (selectedDate) {
            await fetchTotalCarbonEmissionAndRenewableEnergyByDate(selectedDate);
        } else {
            await fetchTotalCarbonEmissionAndRenewableEnergy();
        }
        const chartData = await fetchEnergyConsumptionByCompanyId(selectedDate);
        // renderDataCenterOptions(); // Ensure the data center options are rendered
        renderDonutChart(chartData, dataCenterId);
    } else {
        // Hide data center options for specific data center selection
        // dataCenterOptions.style.display = 'none';
        
        if (selectedDate) {
            await fetchTotalCarbonEmissionAndRenewableEnergyByDataCenterAndDate(company_id, dataCenterId, selectedDate);
        } else {
            await fetchTotalCarbonEmissionAndRenewableEnergyByDataCenter(company_id, dataCenterId);
        }
        const chartData = await fetchEnergyConsumptionByDataCenterId(dataCenterId, selectedDate);
        renderDonutChart(chartData, dataCenterId);
    }

    // Call renderCarbonVsRenewableGauge with the current data center and date filter
    await renderCarbonVsRenewableGauge(dataCenterId, selectedDate);
    
    // Render the line chart immediately after updating data
    renderCarbonEmissionChart();
}




// Fetch energy consumption for all data centers in the company, with optional date filtering
async function fetchEnergyConsumptionByCompanyId(date) {
    let url = `/Dashboard/Data-Center/EnergyConsumption/company/${company_id}`;
    if (date) {
        url += `/date?date=${encodeURIComponent(date)}`; // Use route with date if provided
    }
    console.log("Requesting URL for all data centers:", url);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText} (Status ${response.status})`);
        }
        const data = await response.json();
        console.log("Energy consumption data for all data centers:", data);
        return data;
    } catch (error) {
        console.error("Error fetching energy consumption data for all data centers:", error);
        return [];
    }
}

// Fetch energy consumption for a specific data center, with optional date filtering
async function fetchEnergyConsumptionByDataCenterId(dataCenterId, date) {
    let url = `/Dashboard/Data-Center/EnergyConsumption/data-center/${dataCenterId}`;
    if (date) {
        url += `/date?date=${encodeURIComponent(date)}`; // Use route with date if provided
    }
    console.log("Requesting URL for specific data center:", url);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText} (Status ${response.status})`);
        }
        const data = await response.json();
        console.log(`Energy consumption data for data center ${dataCenterId}:`, data);
        return data;
    } catch (error) {
        console.error(`Error fetching energy consumption data for data center ${dataCenterId}:`, error);
        return [];
    }
}

// Fetch carbon emissions and renewable energy data for the gauge chart
async function fetchCarbonVsRenewableData() {
    const url = `/Dashboard/Data-Center/CarbonEmission/company/${company_id}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText} (Status ${response.status})`);
        }
        const data = await response.json();
        console.log("Carbon vs Renewable data:", data);

        // Assuming data includes renewable_energy_percentage
        // Calculate the average renewable energy percentage from the data
        const renewablePercentage = data.reduce((sum, entry) => sum + entry.renewable_energy_percentage, 0) / data.length;

        return { renewablePercentage };
    } catch (error) {
        console.error("Error fetching carbon vs renewable data:", error);
        return { renewablePercentage: 0 };
    }
}


// Render the donut chart
function renderDonutChart(data, dataCenterId) {
    const ctx = document.getElementById('energyConsumptionDonut').getContext('2d');

    let totalIT, totalCooling, totalBackup, totalLighting, totalEnergy;
    
    if (dataCenterId === 'all') {
        // Calculate the sum of all data centers' total energy
        totalIT = data.reduce((sum, entry) => sum + entry.it_energy_mwh, 0);
        totalCooling = data.reduce((sum, entry) => sum + entry.cooling_energy_mwh, 0);
        totalBackup = data.reduce((sum, entry) => sum + entry.backup_power_energy_mwh, 0);
        totalLighting = data.reduce((sum, entry) => sum + entry.lighting_energy_mwh, 0);
        totalEnergy = data.reduce((sum, entry) => sum + entry.total_energy_mwh, 0); // Use total_energy_mwh directly
    } else {
        // Use the values directly from the selected data center
        totalIT = data[0].it_energy_mwh;
        totalCooling = data[0].cooling_energy_mwh;
        totalBackup = data[0].backup_power_energy_mwh;
        totalLighting = data[0].lighting_energy_mwh;
        totalEnergy = data[0].total_energy_mwh;
    }

    const chartData = {
        labels: ['IT Energy', 'Cooling Energy', 'Backup Power', 'Lighting Energy'],
        datasets: [{
            data: [totalIT, totalCooling, totalBackup, totalLighting],
            backgroundColor: ['#4FD1C5', '#36A2EB', '#FF6384', '#FFCE56'],
        }]
    };
    
    // Destroy previous chart instance if it exists
    if (energyConsumptionChart) {
        energyConsumptionChart.destroy();
    }
    
    // Create new chart
    energyConsumptionChart = new Chart(ctx, {
        type: 'doughnut',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '65%',
            elements: {
                arc: {
                    borderWidth: 6,
                    borderColor: '#ffffff',
                    borderAlign: 'center',
                    borderRadius: 6
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (tooltipItem) => `${tooltipItem.label}: ${tooltipItem.raw} MWh`
                    }
                },
                datalabels: {
                    font: {
                        size: 7
                    },
                    formatter: (value) => {
                        let displayValue = value > 1000 ? `${Math.round(value / 1000)}K MWh` : `${value} MWh`;
                        return displayValue.length > 7 ? `${displayValue.slice(0, 7)}…` : displayValue;
                    },
                    anchor: 'center',
                    align: 'center',
                    padding: 5,
                    clamp: true,
                    rotation: 0,
                    clip: false
                }
            }
        },
        plugins: [
            ChartDataLabels,
            {
                id: 'centerText',
                beforeDraw: function(chart) {
                    const { width, height, ctx } = chart;
                    ctx.restore();
                    const fontSize = (height / 160).toFixed(2);
                    ctx.font = `${fontSize}em sans-serif`;
                    ctx.textBaseline = "middle";
    
                    const text = `${totalEnergy} MWh`;
                    const textX = Math.round((width - ctx.measureText(text).width) / 2);
                    const textY = height / 2;
    
                    ctx.fillStyle = "#333";
                    ctx.fillText(text, textX, textY);
                    ctx.save();
                }
            }
        ]
    });
    
    // Custom Legend Rendering
    const legendContainer = document.getElementById('customLegend');
    legendContainer.innerHTML = ''; // Clear existing legend
    
    chartData.labels.forEach((label, index) => {
        const legendItem = document.createElement('div');
        legendItem.classList.add('legend-item');
        legendItem.innerHTML = `    
            <span class="legend-color" style="background-color: ${chartData.datasets[0].backgroundColor[index]};"></span>
            ${label}
        `;
        legendContainer.appendChild(legendItem);
    });
    
    console.log("Donut chart rendered with data:", data);
}

// function renderDataCenterOptions() {
//     const optionsContainer = document.getElementById('dataCenterOptions');
//     optionsContainer.innerHTML = ''; // Clear existing options if in "All Data Centers" mode
//     console.log("Rendering data center options...");

//     fetch(`/Dashboard/Data-Center/${company_id}`).then(response => response.json()).then(dataCenters => {
//         dataCenters.forEach(dc => {
//             const button = document.createElement('button');
//             button.textContent = dc.data_center_name;
//             button.classList.add('data-center-button'); // Add a base class for styling
//             console.log(`Created button for: ${dc.data_center_name}`);

//             // Event listener for toggling selection
//             button.addEventListener('click', async () => {
//                 // Toggle selected state
//                 if (button.classList.contains('selected-button')) {
//                     button.classList.remove('selected-button');
//                     selectedDataCenter = 'all';
//                     updateChartData(selectedDataCenter);
//                     console.log(`Data center unselected, showing all data centers.`);
//                 } else {
//                     document.querySelectorAll('.data-center-button').forEach(btn => {
//                         btn.classList.remove('selected-button');
//                     });
//                     button.classList.add('selected-button');
//                     selectedDataCenter = dc.id.toString();
//                     console.log(`Data center button clicked, selectedDataCenter is now: ${selectedDataCenter}`);
                    
//                     const data = await fetchEnergyConsumptionByDataCenterId(selectedDataCenter, document.getElementById('datePicker') ? document.getElementById('datePicker').value : '');
//                     renderDonutChart(data, selectedDataCenter);
//                 }
//             });

//             optionsContainer.appendChild(button);
//         });
//         console.log("Data center options rendered.");
//     }).catch(error => console.error('Error fetching data centers:', error));
// }

// Fetch carbon emissions for all data centers
async function fetchCarbonEmissionsByCompanyId() {
    const url = `/Dashboard/Data-Center/CarbonEmission/company/${company_id}`;
    console.log("Requesting URL for carbon emissions:", url);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText} (Status ${response.status})`);
        }
        const data = await response.json();
        console.log("Carbon emissions data for all data centers:", data);
        return data;
    } catch (error) {
        console.error("Error fetching carbon emissions data for all data centers:", error);
        return [];
    }
}

// Fetch carbon emissions for a specific data center
async function fetchCarbonEmissionsByDataCenterId(dataCenterId) {
    const url = `/Dashboard/Data-Center/CarbonEmission/data-center/${dataCenterId}`;
    console.log("Requesting URL for carbon emissions:", url); // Log the URL
    try {
        const response = await fetch(url);
        // Check response status
        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText} (Status ${response.status})`);
        }
        const data = await response.json();
        console.log("Carbon emissions data for data center:", data); // Log the data
        return data;
    } catch (error) {
        console.error("Error fetching carbon emissions data:", error);
        return [];
    }
}

async function renderCarbonEmissionChart() {
    let carbonData;

    if (selectedDataCenter === 'all') {
        // Fetch carbon emissions for all data centers
        carbonData = await fetchCarbonEmissionsByCompanyId();
    } else {
        // Fetch carbon emissions for the specific data center
        carbonData = await fetchCarbonEmissionsByDataCenterId(selectedDataCenter);
    }

    // Check if a date filter has been applied
    const datePicker = document.getElementById('datePicker');
    let selectedDate = datePicker && datePicker.value ? new Date(datePicker.value) : null;

    if (selectedDate) {
        // Get the month and year of the selected date
        const selectedMonth = selectedDate.getMonth();
        const selectedYear = selectedDate.getFullYear();

        // Filter the data to include entries within the selected month
        carbonData = carbonData.filter((entry) => {
            const entryDate = new Date(entry.date);
            return (
                entryDate.getFullYear() === selectedYear &&
                entryDate.getMonth() === selectedMonth
            );
        });
    }

    // If no data is available after filtering, provide a default message or set empty arrays
    if (!carbonData || carbonData.length === 0) {
        console.warn("No carbon emission data available for the selected filters.");
        carbonData = [{ date: selectedDate || new Date(), co2_emissions_tons: 0 }];
    }

    // Aggregate data by date within the selected month and calculate emissions
    const dailyEmissions = carbonData.reduce((acc, entry) => {
        const date = new Date(entry.date).toLocaleDateString("en-US", { day: '2-digit', month: 'short' });

        if (!acc[date]) {
            acc[date] = 0;
        }
        acc[date] += entry.co2_emissions_tons;
        return acc;
    }, {});

    // Prepare data for the chart
    const labels = Object.keys(dailyEmissions);
    const emissions = Object.values(dailyEmissions);

    const ctx = document.getElementById('carbonEmissionChart').getContext('2d');

    // Destroy previous chart instance if it exists
    if (carbonEmissionChart) {
        carbonEmissionChart.destroy();
    }

    // Create new chart instance
    carbonEmissionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Carbon Emissions (tons)',
                data: emissions,
                borderColor: '#FF6384',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                fill: true,
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Date (Day of Month)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Carbon Emissions (tons)'
                    },
                    min: emissions.length ? Math.min(...emissions) - 1000 : 0,
                    max: emissions.length ? Math.max(...emissions) + 1000 : 1000,
                }
            }
        }
    });
}






// Render gauge chart for Carbon vs Renewable Energy
async function renderCarbonVsRenewableGauge(dataCenterId, selectedDate) {
    let renewablePercentage = 0; // Default value in case of error or missing data

    try {
        let totalRenewableEnergy = parseFloat(document.getElementById('renewable-energy-value-text').textContent.split(" ")[0]) || 0;
        let totalCarbonEmissions = parseFloat(document.getElementById('carbon-emission-value-text').textContent.split(" ")[0]) || 0;

        if (totalCarbonEmissions > 0) {
            renewablePercentage = (totalRenewableEnergy / totalCarbonEmissions) * 100;
        } else {
            console.warn("Total carbon emissions is zero or not defined. Cannot calculate renewable percentage.");
        }
    } catch (error) {
        console.error("Error fetching or calculating data for gauge chart:", error);
    }

    const carbonPercentage = 100 - renewablePercentage;
    const ctx = document.getElementById('carbonVsRenewableGauge').getContext('2d');

    // Destroy previous chart instance if it exists
    if (carbonVsRenewableGauge) {
        carbonVsRenewableGauge.destroy();
    }

    // Create new gauge chart and assign it to the global variable
    carbonVsRenewableGauge = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Renewable Energy', 'Carbon Emissions'],
            datasets: [{
                data: [renewablePercentage, carbonPercentage],
                backgroundColor: ['#36A2EB', '#FF6384'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            rotation: -90,
            circumference: 180,
            cutout: '70%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (tooltipItem) => `${tooltipItem.label}: ${tooltipItem.raw.toFixed(2)}%`
                    }
                }
            }
        },
        plugins: [
            {
                id: 'centerText',
                beforeDraw: function(chart) {
                    const { ctx, chartArea: { width, height } } = chart;
                    ctx.save();
                    
                    // Center text (xx/xx format)
                    ctx.font = '16px sans-serif';
                    ctx.fillStyle = '#666';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(
                        `${renewablePercentage.toFixed(1)}/${carbonPercentage.toFixed(1)}`,
                        width / 2,
                        height / 1.5
                    );

                    ctx.restore();
                }
            }
        ]
    });

    console.log("Gauge chart rendered with renewable and carbon percentages based on displayed values.");
}



















// Function to fetch and display total Carbon Emission and Renewable Energy values for all data centers
async function fetchTotalCarbonEmissionAndRenewableEnergy() {
    const url = `/Dashboard/Data-Center/CarbonEmissionRenewableEnergyValue/company/${company_id}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText} (Status ${response.status})`);
        }
        const data = await response.json();
        
        // Display the values in the designated HTML containers
        document.getElementById('carbon-emission-value-text').textContent = `${data.total_co2_emissions.toFixed(2)} tons`;
        document.getElementById('renewable-energy-value-text').textContent = `${data.total_renewable_energy_value.toFixed(2)} MWh`;
        
        console.log("Total Carbon Emission and Renewable Energy values displayed.");
    } catch (error) {
        console.error("Error fetching total carbon and renewable values:", error);
        document.getElementById('carbon-emission-value-text').textContent = "Error loading data";
        document.getElementById('renewable-energy-value-text').textContent = "Error loading data";
    }
}


// Function to fetch and display total Carbon Emission and Renewable Energy values for all data centers with date filter
async function fetchTotalCarbonEmissionAndRenewableEnergyByDate(date) {
    const url = `/Dashboard/Data-Center/CarbonEmissionRenewableEnergyValue/company/${company_id}/date?date=${encodeURIComponent(date)}`;
    try {
        const response = await fetch(url);
        console.log("Response status:", response.status); // Log the response status
        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText} (Status ${response.status})`);
        }
        const data = await response.json();
        
        // Display the values in the designated HTML containers
        document.getElementById('carbon-emission-value-text').textContent = `${data.total_co2_emissions.toFixed(2)} tons`;
        document.getElementById('renewable-energy-value-text').textContent = `${data.total_renewable_energy_value.toFixed(2)} MWh`;
        
        console.log("Fetched data with date:", data); // Log fetched data
    } catch (error) {
        console.error("Error fetching total carbon and renewable values by date:", error);
        document.getElementById('carbon-emission-value-text').textContent = "Error loading data";
        document.getElementById('renewable-energy-value-text').textContent = "Error loading data";
    }
}



// Fetch carbon emission and renewable energy data for a specific data center
async function fetchTotalCarbonEmissionAndRenewableEnergyByDataCenter(company_id, dataCenterId, date = '') {
    let url = `/Dashboard/Data-Center/CarbonEmissionRenewableEnergyValue/company/${company_id}/${dataCenterId}`;
    if (date) {
        url += `?date=${encodeURIComponent(date)}`; // Append date as query parameter if provided
    }
    console.log("Requesting URL for specific data center's carbon emission and renewable data:", url);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText} (Status ${response.status})`);
        }
        const data = await response.json();
        console.log("Carbon emission and renewable energy data for data center:", data);

        // Display the values in the designated HTML containers
        document.getElementById('carbon-emission-value-text').textContent = `${data.total_co2_emissions.toFixed(2)} tons`;
        document.getElementById('renewable-energy-value-text').textContent = `${data.total_renewable_energy_value.toFixed(2)} MWh`;

        return data;
    } catch (error) {
        console.error("Error fetching total carbon and renewable values:", error);
        document.getElementById('carbon-emission-value-text').textContent = "Error loading data";
        document.getElementById('renewable-energy-value-text').textContent = "Error loading data";
    }
}











// Fetch carbon emission and renewable energy data for a specific data center with a specific date
async function fetchTotalCarbonEmissionAndRenewableEnergyByDataCenterAndDate(company_id, dataCenterId, date) {
    const url = `/Dashboard/Data-Center/CarbonEmissionRenewableEnergyValue/company/${company_id}/${dataCenterId}/date?date=${encodeURIComponent(date)}`;
    console.log("Requesting URL for specific data center's carbon emission and renewable data with date:", url);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText} (Status ${response.status})`);
        }
        const data = await response.json();
        console.log("Carbon emission and renewable energy data for specific data center with date:", data);

        // Display the values in the designated HTML containers
        document.getElementById('carbon-emission-value-text').textContent = `${data.total_co2_emissions.toFixed(2)} tons`;
        document.getElementById('renewable-energy-value-text').textContent = `${data.total_renewable_energy_value.toFixed(2)} MWh`;

        return data;
    } catch (error) {
        console.error("Error fetching total carbon and renewable values:", error);
        document.getElementById('carbon-emission-value-text').textContent = "Error loading data";
        document.getElementById('renewable-energy-value-text').textContent = "Error loading data";
    }
}




async function fetchAvailableDates() {
    const company_id = sessionStorage.getItem('company_id'); // Ensure company_id is available from sessionStorage

    try {
        const response = await fetch(`/Dashboard/Data-Center/AvailableDates/${company_id}`);
        
        if (!response.ok) {
            throw new Error("Error fetching available dates");
        }

        const dates = await response.json();
        
        // Convert each date object to 'YYYY-MM-DD' format for comparison
        return dates.map(dateObj => {
            const date = new Date(dateObj.date);
            return date.toISOString().split('T')[0]; // Format date to 'YYYY-MM-DD'
        });
    } catch (error) {
        console.error("Error fetching available dates:", error);
        return [];
    }
}

// Function to toggle the visibility of charts and "No Data" message
function toggleNoDataMessage(show) {
    const chartRow = document.getElementById('chartRow');
    let noDataMessage = document.querySelector('.no-data-message');

    if (show) {
        chartRow.style.display = 'none';
        if (!noDataMessage) {
            noDataMessage = document.createElement('p');
            noDataMessage.textContent = "No Data Recorded on this date";
            noDataMessage.classList.add('no-data-message');
            document.querySelector('.main-content').appendChild(noDataMessage);
        }
        noDataMessage.style.display = 'flex';
    } else {
        chartRow.style.display = 'flex';
        if (noDataMessage) {
            noDataMessage.style.display = 'none';
        }
    }
}

// Initialize dropdown, date picker, and charts on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Page loaded. Initializing data center options and default chart...");
    await loadDataCenterOptions();
    await updateChartData(selectedDataCenter);
    renderCarbonEmissionChart();

    const availableDates = await fetchAvailableDates();

    const datePicker = document.getElementById('datePicker');
    const noDataMessage = document.getElementById('noDataMessage');
    const chartContainerWrapper = document.getElementById('chartContainerWrapper');

    if (datePicker) {
        datePicker.addEventListener('change', async () => {
            const selectedDate = datePicker.value;
            console.log("Date selected:", selectedDate);

            if (!selectedDate || availableDates.includes(selectedDate)) {
                chartContainerWrapper.style.display = 'block';
                noDataMessage.style.display = 'none';
                await updateChartData(selectedDataCenter);
                renderCarbonEmissionChart();
            } else {
                chartContainerWrapper.style.display = 'none';
                noDataMessage.style.display = 'block';
            }
        });
    }

    const dataCenterDropdown = document.getElementById('dataCenterDropdown');
    if (dataCenterDropdown) {
        dataCenterDropdown.addEventListener('change', async () => {
            if (dataCenterDropdown.value === 'all' && !datePicker.value) {
                chartContainerWrapper.style.display = 'block';
                noDataMessage.style.display = 'none';
            }
            await updateChartData(selectedDataCenter);
            renderCarbonEmissionChart();
        });
    }
});

