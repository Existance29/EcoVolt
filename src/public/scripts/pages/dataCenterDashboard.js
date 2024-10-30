pageRequireSignIn();
const company_id = sessionStorage.getItem('company_id');

// Global variables
let selectedDataCenter = 'all'; // Default to "all" data centers
let energyConsumptionChart; // Chart instance placeholder

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
        });
    } catch (error) {
        console.error('Error loading data centers:', error);
    }
}

// Function to update chart data based on selected data center
async function updateChartData(dataCenterId) {
    console.log(`Updating chart data for selected data center: ${dataCenterId}`);
    let chartData;

    const optionsContainer = document.getElementById('dataCenterOptions');
    if (dataCenterId === 'all') {
        console.log("Showing data center options for 'All Data Centers' selection.");
        optionsContainer.style.display = 'flex';
        chartData = await fetchEnergyConsumptionByCompanyId();
        renderDataCenterOptions();
    } else {
        console.log("Hiding data center options for specific data center selection.");
        optionsContainer.style.display = 'none';
        chartData = await fetchEnergyConsumptionByDataCenterId(dataCenterId);
    }

    renderDonutChart(chartData);
}

// Fetch energy consumption for all data centers in the company
async function fetchEnergyConsumptionByCompanyId() {
    console.log("Fetching energy consumption data for all data centers...");
    const response = await fetch(`/Dashboard/Data-Center/EnergyConsumption/company/${company_id}`);
    const data = await response.json();
    console.log("Energy consumption data for all data centers:", data);
    return data;
}

// Fetch energy consumption for a specific data center
async function fetchEnergyConsumptionByDataCenterId(dataCenterId) {
    console.log(`Fetching energy consumption data for data center ID: ${dataCenterId}...`);
    const response = await fetch(`/Dashboard/Data-Center/EnergyConsumption/data-center/${dataCenterId}`);
    const data = await response.json();
    console.log(`Energy consumption data for data center ${dataCenterId}:`, data);
    return data;
}

// Render the donut chart
function renderDonutChart(data) {
    const ctx = document.getElementById('energyConsumptionDonut').getContext('2d');

    const totalIT = data.reduce((sum, entry) => sum + entry.it_energy_mwh, 0);
    const totalCooling = data.reduce((sum, entry) => sum + entry.cooling_energy_mwh, 0);
    const totalBackup = data.reduce((sum, entry) => sum + entry.backup_power_energy_mwh, 0);
    const totalLighting = data.reduce((sum, entry) => sum + entry.lighting_energy_mwh, 0);
    
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
    const totalMWh = chartData.datasets[0].data.reduce((sum, value) => sum + value, 0);

    energyConsumptionChart = new Chart(ctx, {
        type: 'doughnut',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '65%',
            elements: {
                arc: {
                    borderWidth: 6,       // Increase for more spacing between segments
                    borderColor: '#ffffff', // Set to background color for a clean gap effect
                    borderAlign: 'center', // Center the border to create even gaps
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
                    // color: '#000000',
                    font: {
                    //     weight: 'bold',
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
                    const fontSize = (height / 160).toFixed(2); // Adjust font size based on chart height
                    ctx.font = `${fontSize}em sans-serif`;
                    ctx.textBaseline = "middle";
    
                    const text = `${totalMWh} MWh`;
                    const textX = Math.round((width - ctx.measureText(text).width) / 2);
                    const textY = height / 2;
    
                    ctx.fillStyle = "#333"; // Color for the central text
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
                    // If already selected, unselect and reset chart to "All Data Centers"
                    button.classList.remove('selected-button');
                    selectedDataCenter = 'all';
                    updateChartData(selectedDataCenter); // Reset chart to show all data centers
                    console.log(`Data center unselected, showing all data centers.`);
                } else {
                    // Unselect any previously selected button
                    document.querySelectorAll('.data-center-button').forEach(btn => {
                        btn.classList.remove('selected-button');
                    });
                    // Select this button and update chart
                    button.classList.add('selected-button');
                    selectedDataCenter = dc.id.toString();
                    console.log(`Data center button clicked, selectedDataCenter is now: ${selectedDataCenter}`);
                    
                    // Fetch data and update chart for the specific data center
                    const data = await fetchEnergyConsumptionByDataCenterId(selectedDataCenter);
                    renderDonutChart(data);
                }
            });

            optionsContainer.appendChild(button);
        });
        console.log("Data center options rendered.");
    }).catch(error => console.error('Error fetching data centers:', error));
}


// Initialize dropdown and chart on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log("Page loaded. Initializing data center options and default chart...");
    loadDataCenterOptions();
    updateChartData(selectedDataCenter);
});
