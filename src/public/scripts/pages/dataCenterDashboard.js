pageRequireSignIn();
const company_id = sessionStorage.getItem('company_id');

// Global variables
let selectedDataCenter = 'all'; // Default to "all" data centers
let energyConsumptionChart; // Chart instance placeholder
let carbonEmissionChart; // Chart instance placeholder

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

// Function to update chart data based on selected data center and date
async function updateChartData(dataCenterId) {
    console.log(`Updating chart data for selected data center: ${dataCenterId}`);
    let chartData;
    const selectedDate = document.getElementById('datePicker') ? document.getElementById('datePicker').value : '';

    const optionsContainer = document.getElementById('dataCenterOptions');
    if (dataCenterId === 'all') {
        console.log("Showing data center options for 'All Data Centers' selection.");
        optionsContainer.style.display = 'flex';
        chartData = await fetchEnergyConsumptionByCompanyId(selectedDate);
        renderDataCenterOptions();
    } else {
        console.log("Hiding data center options for specific data center selection.");
        optionsContainer.style.display = 'none';
        chartData = await fetchEnergyConsumptionByDataCenterId(dataCenterId, selectedDate);
    }

    renderDonutChart(chartData, dataCenterId);
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

function renderDataCenterOptions() {
    const optionsContainer = document.getElementById('dataCenterOptions');
    optionsContainer.innerHTML = ''; // Clear existing options if in "All Data Centers" mode
    console.log("Rendering data center options...");

    fetch(`/Dashboard/Data-Center/${company_id}`).then(response => response.json()).then(dataCenters => {
        dataCenters.forEach(dc => {
            const button = document.createElement('button');
            button.textContent = dc.data_center_name;
            button.classList.add('data-center-button'); // Add a base class for styling
            console.log(`Created button for: ${dc.data_center_name}`);

            // Event listener for toggling selection
            button.addEventListener('click', async () => {
                // Toggle selected state
                if (button.classList.contains('selected-button')) {
                    button.classList.remove('selected-button');
                    selectedDataCenter = 'all';
                    updateChartData(selectedDataCenter);
                    console.log(`Data center unselected, showing all data centers.`);
                } else {
                    document.querySelectorAll('.data-center-button').forEach(btn => {
                        btn.classList.remove('selected-button');
                    });
                    button.classList.add('selected-button');
                    selectedDataCenter = dc.id.toString();
                    console.log(`Data center button clicked, selectedDataCenter is now: ${selectedDataCenter}`);
                    
                    const data = await fetchEnergyConsumptionByDataCenterId(selectedDataCenter, document.getElementById('datePicker') ? document.getElementById('datePicker').value : '');
                    renderDonutChart(data, selectedDataCenter);
                }
            });

            optionsContainer.appendChild(button);
        });
        console.log("Data center options rendered.");
    }).catch(error => console.error('Error fetching data centers:', error));
}

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
        carbonData = await fetchCarbonEmissionsByCompanyId();
    } else {
        carbonData = await fetchCarbonEmissionsByDataCenterId(selectedDataCenter);
    }

    // Check if a date filter has been applied
    const datePicker = document.getElementById('datePicker');
    let selectedDate = datePicker ? datePicker.value : null;

    if (selectedDate) {
        const parsedDate = new Date(selectedDate);
        const selectedYear = parsedDate.getFullYear();
        const selectedMonth = parsedDate.getMonth();

        // Filter the data to include only entries from the selected month and year onwards
        carbonData = carbonData.filter((entry) => {
            const entryDate = new Date(entry.date);
            return (
                entryDate.getFullYear() > selectedYear ||
                (entryDate.getFullYear() === selectedYear && entryDate.getMonth() >= selectedMonth)
            );
        });
    }

    // Aggregate data by month and calculate emissions
    const monthlyEmissions = carbonData.reduce((acc, entry) => {
        const date = new Date(entry.date);
        const monthYear = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date);

        if (!acc[monthYear]) {
            acc[monthYear] = 0;
        }
        acc[monthYear] += entry.co2_emissions_tons;
        return acc;
    }, {});

    // Prepare data for the chart
    const labels = Object.keys(monthlyEmissions);
    const emissions = Object.values(monthlyEmissions);

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
                        text: 'Date (Month-Year)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Carbon Emissions (tons)'
                    },
                    min: Math.min(...emissions) - 1000,
                    max: Math.max(...emissions) + 1000,
                }
            }
        }
    });
}


// Render gauge chart for Carbon vs Renewable Energy
async function renderCarbonVsRenewableGauge() {
    const { renewablePercentage } = await fetchCarbonVsRenewableData();

    const ctx = document.getElementById('carbonVsRenewableGauge').getContext('2d');

    // Create new gauge chart
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Renewable Energy', 'Carbon Emissions'],
            datasets: [{
                data: [renewablePercentage, 100 - renewablePercentage],
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
        }
    });

    console.log("Gauge chart rendered with renewable percentage:", renewablePercentage);
}



// Initialize dropdown, date picker, and chart on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log("Page loaded. Initializing data center options and default chart...");
    loadDataCenterOptions();
    updateChartData(selectedDataCenter);
    renderCarbonEmissionChart(); // Render carbon emission chart on page load
    renderCarbonVsRenewableGauge(); // Render the new gauge chart


    // Event listener for date selection
    const datePicker = document.getElementById('datePicker');
    if (datePicker) {
        datePicker.addEventListener('change', () => {
            console.log("Date selected:", datePicker.value);
            updateChartData(selectedDataCenter);
            renderCarbonEmissionChart(); // Update carbon emissions chart on date change
            renderCarbonVsRenewableGauge(); // Update gauge chart on date change
        });
    }
});
