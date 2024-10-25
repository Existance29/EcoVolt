// Ensure the DOM is fully loaded before running the script
document.addEventListener("DOMContentLoaded", async function() {

    // console.log(sessionStorage.getItem("accessToken"));
    await pageRequireSignIn();
    // Retrieve company ID from session storage
    const companyId = getCompanyId();

    // Set date to today if the element exists
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentDateElement = document.getElementById('current-date');
    if (currentDateElement) {
        currentDateElement.textContent = currentYear;
    }











    // Fetch the available years and populate the dropdown
    async function fetchAvailableYears() {
        try {
            const response = await fetch(`/Dashboard/Data-Center/years`);
            const years = await response.json();
            console.log('Years:', years);

            // Get the year dropdown element
            const yearDropdown = document.getElementById('yearDropdown');
            if (!yearDropdown) {
                console.error('Year dropdown element not found.');
                return;
            }

            // Populate the dropdown with available years
            years.forEach(year => {
                const option = document.createElement('option');
                option.value = year.year;
                option.textContent = year.year;
                yearDropdown.appendChild(option);
            });

            // Set the default selected year to the current year if available
            if (years.some(item => item.year === currentYear)) {
                yearDropdown.value = currentYear;
            } else {
                yearDropdown.value = years[0].year;
            }

            // Load carbon emissions data for the selected/default year
            loadCarbonEmissionsData(yearDropdown.value);
            loadEnergyConsumptionData(yearDropdown.value);
        } catch (error) {
            console.error("Error fetching available years:", error);
        }
    }
    








    

    // Fetch carbon emissions and renewable energy data for the selected year
    async function loadCarbonEmissionsData(year) {
        try {
            const response = await fetch(`/Dashboard/Data-Center/carbon-emissions/${companyId}/${year}`);
            const data = await response.json();
            console.log('Carbon Emissions Data:', data);

            if (data && data.length > 0) {
                const companyNameElement = document.getElementById('company-name');
                if (companyNameElement) {
                    companyNameElement.textContent = data[0].company_name;
                }

                // Map the data center names for X-axis
                const dataCenterNames = data.map(item => item.data_center_name);
                // Map the carbon emissions data
                const carbonEmissionsData = data.map(item => item.co2_emissions_tons);
                // Map the renewable energy percentage data
                const renewableEnergyData = data.map(item => item.renewable_energy_percentage);

                // Get the chart context
                const chartCanvas = document.getElementById('carbonEmissionsChart');
                if (chartCanvas) {
                    const ctx = chartCanvas.getContext('2d');
                    // If a previous chart instance exists, destroy it to avoid duplication
                    if (window.carbonEmissionsChart && typeof window.carbonEmissionsChart.destroy === 'function') {
                        window.carbonEmissionsChart.destroy();
                    }

                    // Bar Chart with Carbon Emissions and Renewable Energy Data
                    window.carbonEmissionsChart = new Chart(ctx, {
                        type: 'bar', // Bar chart type
                        data: {
                            labels: dataCenterNames, // Use data center names for X-axis labels
                            datasets: [
                                {
                                    label: 'Carbon Emissions (tons)',
                                    data: carbonEmissionsData,
                                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                                    borderColor: 'rgba(75, 192, 192, 1)',
                                    borderWidth: 1,
                                    yAxisID: 'y1',
                                },
                                {
                                    label: 'Renewable Energy (%)',
                                    data: renewableEnergyData,
                                    backgroundColor: 'rgba(153, 102, 255, 0.6)',
                                    borderColor: 'rgba(153, 102, 255, 1)',
                                    borderWidth: 1,
                                    yAxisID: 'y2',
                                }
                            ]
                        },
                        options: {
                            responsive: true,
                            scales: {
                                y1: {
                                    beginAtZero: true,
                                    type: 'linear',
                                    position: 'left',
                                    title: {
                                        display: true,
                                        text: 'Carbon Emissions (tons)'
                                    }
                                },
                                y2: {
                                    beginAtZero: true,
                                    type: 'linear',
                                    position: 'right',
                                    title: {
                                        display: true,
                                        text: 'Renewable Energy (%)'
                                    },
                                    grid: {
                                        drawOnChartArea: false
                                    }
                                }
                            }
                        }
                    });
                } else {
                    console.error("Canvas element with ID 'carbonEmissionsChart' not found.");
                }
            } else {
                alert("No carbon emissions or renewable energy data found.");
            }
        } catch (error) {
            console.error("Error fetching carbon emissions and renewable energy data:", error);
        }
    }
    








    

// Fetch energy consumption data for the selected year and populate dropdowns
async function loadEnergyConsumptionData(year) {
    console.log('Loading Energy Consumption Data for year:', year);
    try {
        const response = await fetch(`/Dashboard/Data-Center/energy-consumption/${companyId}/${year}`);
        const data = await response.json();
        console.log('Energy Consumption Data:', data);

        if (data && data.length > 0) {
            // Populate the Data Center Dropdown
            const dataCenterDropdown = document.getElementById('dataCenterDropdown');
            if (!dataCenterDropdown) {
                console.error("Dropdown element with ID 'dataCenterDropdown' not found.");
                return;
            }

            // Clear any previous options
            dataCenterDropdown.innerHTML = '<option value="" disabled>Select Data Center</option>';

            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item.data_center_id;
                option.textContent = item.data_center_name;
                dataCenterDropdown.appendChild(option);
            });

            // Automatically select the first item in the dropdown and load its chart
            if (data.length > 0) {
                dataCenterDropdown.selectedIndex = 1; // Select the first data center
                const firstDataCenter = data[0];
                loadEnergyConsumptionPieChart(firstDataCenter); // Load the chart for the first data center
            }

            // Add event listener for data center selection
            dataCenterDropdown.addEventListener('change', function () {
                const selectedDataCenterId = this.value;
                const selectedDataCenter = data.find(item => item.data_center_id == selectedDataCenterId);
                if (selectedDataCenter) {
                    // Load the Pie Chart for the selected data center
                    loadEnergyConsumptionPieChart(selectedDataCenter);
                }
            });
        } else {
            alert('No energy consumption data found for the selected year.');
        }
    } catch (error) {
        console.error('Error fetching energy consumption data:', error);
        alert('Failed to load energy consumption data. Please try again later.');
    }
}

// Function to load the pie chart for a specific data center
function loadEnergyConsumptionPieChart(dataCenter) {
    const chartCanvas = document.getElementById('energyConsumptionChart');
    if (!chartCanvas) {
        console.error("Canvas element with ID 'energyConsumptionChart' not found.");
        return;
    }

    const ctx = chartCanvas.getContext('2d');

    // Destroy the old chart if it exists
    if (window.energyConsumptionPieChart && typeof window.energyConsumptionPieChart.destroy === 'function') {
        window.energyConsumptionPieChart.destroy();
    }

    // Data for the Pie Chart
    const energyData = [
        dataCenter.backup_power_energy_mwh,
        dataCenter.cooling_energy_mwh,
        dataCenter.it_energy_mwh,
        dataCenter.lighting_energy_mwh
    ];

    // Labels for the Pie Chart
    const energyLabels = [
        'Backup Power (MWh)',
        'Cooling Energy (MWh)',
        'IT Energy (MWh)',
        'Lighting Energy (MWh)'
    ];

    // Create a Pie Chart
    window.energyConsumptionPieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: energyLabels,
            datasets: [{
                data: energyData,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',   // Backup Power
                    'rgba(54, 162, 235, 0.6)',   // Cooling Energy
                    'rgba(255, 206, 86, 0.6)',   // IT Energy
                    'rgba(75, 192, 192, 0.6)'    // Lighting Energy
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: `Energy Consumption Breakdown - ${dataCenter.data_center_name}`
                }
            }
        }
    });
}
    
    







    // Listen for year selection changes
    const yearDropdown = document.getElementById('yearDropdown');
    if (yearDropdown) {
        yearDropdown.addEventListener('change', function() {
            const selectedYear = this.value || currentYear;
            loadCarbonEmissionsData(selectedYear);
            loadEnergyConsumptionData(selectedYear);
        });
    } else {
        console.error("Element with ID 'yearDropdown' not found.");
    }

    // Call the function to fetch the available years when the page loads
    fetchAvailableYears();

});
