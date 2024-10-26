// Global variable to store selected data center ID
let selectedDataCenterId = null;

// Ensure the DOM is fully loaded before running the script
document.addEventListener("DOMContentLoaded", async function() {

    await pageRequireSignIn();
    const companyId = getCompanyId();
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0'); // Current month as "01", "02", etc.

    let dataCenterDropdown = null; 

    // Fetch the available years and months and populate the dropdowns
    async function fetchAvailableYearsAndMonths() {
        try {
            const response = await get(`/Dashboard/Data-Center/years-months`);
            const yearsMonths = await response.json();
            console.log('Years and Months:', yearsMonths);

            const yearDropdown = document.getElementById('yearDropdown');
            const monthDropdown = document.getElementById('monthDropdown');
            if (!yearDropdown || !monthDropdown) {
                console.error('Dropdown elements not found.');
                return;
            }

            // Populate the year dropdown
            const uniqueYears = [...new Set(yearsMonths.map(item => item.year))];
            yearDropdown.innerHTML = '<option value="" disabled selected>Select Year</option>';
            uniqueYears.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearDropdown.appendChild(option);
            });

            // Populate the month dropdown
            const uniqueMonths = [...new Set(yearsMonths.map(item => item.month))];
            monthDropdown.innerHTML = '<option value="" disabled selected>Select Month</option>';
            uniqueMonths.forEach(month => {
                const option = document.createElement('option');
                option.value = month.toString().padStart(2, '0'); // Format month as "01", "02", etc.
                option.textContent = new Date(0, month - 1).toLocaleString('en-US', { month: 'long' });
                monthDropdown.appendChild(option);
            });

            // Set the current year and month as default values if available
            if (uniqueYears.includes(currentYear)) yearDropdown.value = currentYear;
            if (uniqueMonths.includes(parseInt(currentMonth))) monthDropdown.value = currentMonth;

            // Load data for the selected/default year and month
            loadDataForSelectedYearAndMonth();
        } catch (error) {
            console.error("Error fetching available years and months:", error);
        }
    }

    // Load data for selected year and month
    async function loadDataForSelectedYearAndMonth() {
        const selectedYear = document.getElementById('yearDropdown').value || currentYear;
        const selectedMonth = document.getElementById('monthDropdown').value || currentMonth;

        loadCarbonEmissionsData(selectedYear, selectedMonth);
        loadEnergyConsumptionData(selectedYear, selectedMonth);
        if (selectedDataCenterId) {
            loadEfficiencyMetricsData(selectedYear, selectedMonth);
        } else {
            console.warn("No data center selected for efficiency metrics.");
        }
    }

    // Fetch carbon emissions and renewable energy data for the selected year and month
    async function loadCarbonEmissionsData(year, month) {
        try {
            const response = await get(`/Dashboard/Data-Center/carbon-emissions/${companyId}/${year}/${month}`);
            const data = await response.json();
            console.log('Carbon Emissions Data:', data);
    
            if (data && data.length > 0) {
                const dataCenterNames = data.map(item => item.data_center_name);
                const carbonEmissionsData = data.map(item => item.co2_emissions_tons);
                const renewableEnergyData = data.map(item => item.renewable_energy_percentage);
    
                const chartCanvas = document.getElementById('carbonEmissionsChart');
                if (chartCanvas) {
                    const ctx = chartCanvas.getContext('2d');
    
                    // Check if window.carbonEmissionsChart is defined and is a Chart instance
                    if (window.carbonEmissionsChart instanceof Chart) {
                        window.carbonEmissionsChart.destroy();
                    }
    
                    // Create a new Chart instance
                    window.carbonEmissionsChart = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: dataCenterNames,
                            datasets: [
                                {
                                    label: 'Carbon Emissions (tons)',
                                    data: carbonEmissionsData,
                                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                                    yAxisID: 'y1',
                                },
                                {
                                    label: 'Renewable Energy (%)',
                                    data: renewableEnergyData,
                                    backgroundColor: 'rgba(153, 102, 255, 0.6)',
                                    yAxisID: 'y2',
                                }
                            ]
                        },
                        options: {
                            scales: {
                                y1: {
                                    beginAtZero: true,
                                    position: 'left',
                                    title: { display: true, text: 'Carbon Emissions (tons)' }
                                },
                                y2: {
                                    beginAtZero: true,
                                    position: 'right',
                                    title: { display: true, text: 'Renewable Energy (%)' },
                                    grid: { drawOnChartArea: false }
                                }
                            }
                        }
                    });
                }
            } else {
                alert("No carbon emissions or renewable energy data found.");
            }
        } catch (error) {
            console.error("Error fetching carbon emissions data:", error);
        }
    }
    

    // Fetch energy consumption data for the selected year and month and populate dropdowns
    async function loadEnergyConsumptionData(year, month) {
        console.log('Loading Energy Consumption Data for year:', year, 'month:', month);
        try {
            const response = await get(`/Dashboard/Data-Center/energy-consumption/${companyId}/${year}/${month}`);
            const data = await response.json();
            console.log('Energy Consumption Data:', data);

            if (data && data.length > 0) {
                dataCenterDropdown = document.getElementById('dataCenterDropdown');
                availableDataCenters = data;
                if (!dataCenterDropdown) {
                    console.error("Dropdown element with ID 'dataCenterDropdown' not found.");
                    return;
                }

                dataCenterDropdown.innerHTML = '<option value="" disabled>Select Data Center</option>';
                data.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.data_center_id;
                    option.textContent = item.data_center_name;
                    dataCenterDropdown.appendChild(option);
                });

                if (data.length > 0) {
                    dataCenterDropdown.selectedIndex = 1;
                    selectedDataCenterId = data[0].data_center_id; // Set default to first data center
                    loadEnergyConsumptionPieChart(data[0]);
                }

                dataCenterDropdown.addEventListener('change', function () {
                    selectedDataCenterId = this.value; // Update global variable
                    const selectedDataCenter = data.find(item => item.data_center_id == selectedDataCenterId);
                    if (selectedDataCenter) {
                        loadEnergyConsumptionPieChart(selectedDataCenter);
                    }
                    loadDataForSelectedYearAndMonth(); // Reload data for the selected data center
                });
            } else {
                alert('No energy consumption data found for the selected year and month.');
            }
        } catch (error) {
            console.error('Error fetching energy consumption data:', error);
        }
    }

    // Function to load the pie chart for a specific data center
    function loadEnergyConsumptionPieChart(dataCenter) {
        const chartCanvas = document.getElementById('energyConsumptionChart');
        const ctx = chartCanvas.getContext('2d');

        if (window.energyConsumptionPieChart) window.energyConsumptionPieChart.destroy();

        const energyData = [
            dataCenter.backup_power_energy_mwh,
            dataCenter.cooling_energy_mwh,
            dataCenter.it_energy_mwh,
            dataCenter.lighting_energy_mwh
        ];

        const energyLabels = [
            'Backup Power (MWh)',
            'Cooling Energy (MWh)',
            'IT Energy (MWh)',
            'Lighting Energy (MWh)'
        ];

        window.energyConsumptionPieChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: energyLabels,
                datasets: [{
                    data: energyData,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: `Energy Consumption Breakdown - ${dataCenter.data_center_name}` }
                }
            }
        });
    }


// Efficiency function to load efficiency metrics data for a selected year, month, and data center
async function loadEfficiencyMetricsData(year, month) {
    console.log('Loading Efficiency Metrics for year:', year, 'month:', month, 'data center:', selectedDataCenterId);
    const selectedDate = new Date(year, month - 1); // Adjust month to be zero-indexed
    let datesToFetch = [];

    // Try to get three consecutive months of data, starting from the selected month
    for (let i = 0; i < 3; i++) {
        const monthToFetch = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + i);
        datesToFetch.push({
            year: monthToFetch.getFullYear(),
            month: String(monthToFetch.getMonth() + 1).padStart(2, '0')
        });
    }

    // Fetch data for the next two months first; if not available, look for previous months
    const data = await fetchThreeMonthsOfData(datesToFetch, selectedDate, selectedDataCenterId);

    if (data.length < 1) {
        alert('Not enough data available for the selected month and the surrounding months.');
        return;
    }

    // Prepare the data for the chart
    const dates = [];
    const pueValues = [];
    const wueValues = [];
    const cueValues = [];

    data.forEach(monthData => {
        monthData.forEach(item => {
            dates.push(item.date);
            pueValues.push(item.pue || null);
            wueValues.push(item.wue || null);
            cueValues.push(item.cue || null);
        });
    });

    // Plot the data on the efficiency chart
    const ctx = document.getElementById('efficiencyChart').getContext('2d');
    if (window.efficiencyLineChart) window.efficiencyLineChart.destroy();

    window.efficiencyLineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'PUE (Power Usage Effectiveness)',
                    data: pueValues,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    fill: false,
                    tension: 0.1
                },
                {
                    label: 'WUE (Water Usage Effectiveness)',
                    data: wueValues,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    fill: false,
                    tension: 0.1
                },
                {
                    label: 'CUE (Carbon Usage Effectiveness)',
                    data: cueValues,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    fill: false,
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Efficiency Metrics (PUE, WUE, CUE) over Time' }
            },
            scales: {
                x: {
                    type: 'time',
                    time: { unit: 'day' },
                    title: { display: true, text: 'Date' }
                },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Efficiency Metrics' }
                }
            }
        }
    });
}

// Helper function to fetch three months of data, prioritizing the selected month and two forward months
async function fetchThreeMonthsOfData(datesToFetch, selectedDate, dataCenterId) {
    const data = [];

    // Attempt to fetch for the selected and next two months first
    for (let i = 0; i < datesToFetch.length; i++) {
        const { year, month } = datesToFetch[i];
        try {
            const response = await get(`/Dashboard/Data-Center/energy-consumption/${dataCenterId}/${year}/${month}`);
            
            if (response.ok) {
                const monthData = await response.json();
                if (monthData && monthData.length > 0) {
                    data.push(monthData);
                }
            } else {
                console.warn(`Data for ${year}-${month} not found for Data Center ${dataCenterId}.`);
            }

            // If we have 3 months of data, stop fetching
            if (data.length === 3) return data;

        } catch (error) {
            console.error(`Error fetching data for ${year}-${month}:`, error);
        }
    }

    // If not enough data is found, look backwards
    for (let i = 1; data.length < 3; i++) {
        const monthToFetch = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - i);
        const year = monthToFetch.getFullYear();
        const month = String(monthToFetch.getMonth() + 1).padStart(2, '0');
        
        try {
            const response = await get(`/Dashboard/Data-Center/energy-consumption/${dataCenterId}/${year}/${month}`);
            
            if (response.ok) {
                const monthData = await response.json();
                if (monthData && monthData.length > 0) {
                    data.unshift(monthData); // Add to the start of the data array
                }
            } else {
                console.warn(`Data for ${year}-${month} not found for Data Center ${dataCenterId}.`);
            }
        } catch (error) {
            console.error(`Error fetching data for ${year}-${month}:`, error);
        }
    }

    return data;
}


const yearDropdown = document.getElementById('yearDropdown');
const monthDropdown = document.getElementById('monthDropdown');

if (yearDropdown) {
    yearDropdown.addEventListener('change', loadDataForSelectedYearAndMonth);
} else {
    console.error("Element with ID 'yearDropdown' not found.");
}

if (monthDropdown) {
    monthDropdown.addEventListener('change', loadDataForSelectedYearAndMonth);
} else {
    console.error("Element with ID 'monthDropdown' not found.");
}

// Call the function to fetch the available years when the page loads
fetchAvailableYearsAndMonths();
});