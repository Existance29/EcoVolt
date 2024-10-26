// Global variable to store selected data center ID
let selectedDataCenterId = null;
let dataCenterDropdown = null; // Moved to global scope

// Ensure the DOM is fully loaded before running the script
document.addEventListener("DOMContentLoaded", async function() {
    await pageRequireSignIn();
    const companyId = getCompanyId();
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0'); // Current month as "01", "02", etc.

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

            // Load data for the selected year and month, and set the first data center if not already selected
            await loadDataForSelectedYearAndMonth(!selectedDataCenterId);
        } catch (error) {
            console.error("Error fetching available years and months:", error);
        }
    }

    // Load data for selected year and month, set default data center if required
    async function loadDataForSelectedYearAndMonth(setDefaultDataCenter = false) {
        const selectedYear = document.getElementById('yearDropdown').value || currentYear;
        const selectedMonth = document.getElementById('monthDropdown').value || currentMonth;

        // Always load energy consumption data for the selected month and year
        await loadEnergyConsumptionData(selectedYear, selectedMonth, setDefaultDataCenter);

        console.log("Filters applied - Year:", selectedYear, "Month:", selectedMonth, "Data Center:", selectedDataCenterId);
        
        loadCarbonEmissionsData(selectedYear, selectedMonth);
        loadEfficiencyData(selectedYear, selectedMonth);
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
    
                    if (window.carbonEmissionsChart instanceof Chart) {
                        window.carbonEmissionsChart.destroy();
                    }
    
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

    // Fetch energy consumption data and assign the first data center as default if setDefault is true
    async function loadEnergyConsumptionData(year, month, setDefault = false) {
        console.log('Loading Energy Consumption Data for year:', year, 'month:', month);
        try {
            const response = await get(`/Dashboard/Data-Center/energy-consumption/${companyId}/${year}/${month}`);
            const data = await response.json();
            console.log('Energy Consumption Data:', data);

            if (data && data.length > 0) {
                if (!dataCenterDropdown) {
                    dataCenterDropdown = document.getElementById('dataCenterDropdown');
                    if (!dataCenterDropdown) {
                        console.error("Dropdown element with ID 'dataCenterDropdown' not found.");
                        return;
                    }
                }

                // Clear the dropdown and repopulate it
                dataCenterDropdown.innerHTML = '<option value="" disabled>Select Data Center</option>';
                data.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.data_center_id;
                    option.textContent = item.data_center_name;
                    dataCenterDropdown.appendChild(option);
                });

                // Set initial selected data center if required
                if (setDefault && data.length > 0) {
                    selectedDataCenterId = data[0].data_center_id; // Assign the first data center as default
                    dataCenterDropdown.value = selectedDataCenterId;
                    console.log("Initial Data Center set to:", selectedDataCenterId);
                } else {
                    dataCenterDropdown.value = selectedDataCenterId;
                }

                const selectedDataCenter = data.find(item => item.data_center_id == selectedDataCenterId);
                if (selectedDataCenter) loadEnergyConsumptionPieChart(selectedDataCenter);

                // Add the 'change' event listener if it's not already added
                if (!dataCenterDropdown.hasAttribute("listener")) {
                    dataCenterDropdown.addEventListener('change', function () {
                        selectedDataCenterId = this.value; // Update global variable
                        const selectedDataCenter = data.find(item => item.data_center_id == selectedDataCenterId);
                        if (selectedDataCenter) {
                            loadEnergyConsumptionPieChart(selectedDataCenter);
                        }
                        loadDataForSelectedYearAndMonth(); // Reload data for the selected data center
                    });
                    dataCenterDropdown.setAttribute("listener", "true"); // Mark as having an event listener
                }
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

    // Load efficiency data (PUE, WUE, CUE) for the selected year, month, and data center
    async function loadEfficiencyData(year, selectedMonth) {
        const monthDropdown = document.getElementById('monthDropdown');
        const availableMonths = Array.from(monthDropdown.options)
            .filter(option => option.value)
            .map(option => option.value);

        const selectedMonthIndex = availableMonths.indexOf(selectedMonth);
        let monthsToShow;

        if (selectedMonthIndex === 0) {
            monthsToShow = availableMonths.slice(0, 3);
        } else if (selectedMonthIndex === availableMonths.length - 1) {
            monthsToShow = availableMonths.slice(-3);
        } else {
            monthsToShow = availableMonths.slice(selectedMonthIndex - 1, selectedMonthIndex + 2);
        }

        console.log("Months to display on chart:", monthsToShow);

        const efficiencyDataPromises = monthsToShow.map(async m => {
            try {
                const response = await get(`/Dashboard/Data-Center/energy-consumption/${companyId}/${year}/${m}`);
                const monthData = await response.json();
                const entry = monthData.find(item => item.date.includes(`-${m}-`));
                const date = `${year}-${m}-01`; // Use the first day of each month for consistency
                return entry
                    ? { pue: entry.pue, wue: entry.wue, cue: entry.cue, date }
                    : { pue: null, wue: null, cue: null, date };
            } catch (error) {
                console.error(`Error fetching data for month ${m}:`, error);
                return { pue: null, wue: null, cue: null, date: `${year}-${m}-01` };
            }
        });

        const efficiencyData = await Promise.all(efficiencyDataPromises);
        console.log("Filtered Efficiency Data for Chart with Dates:", efficiencyData);

        const chartCanvas = document.getElementById('efficiencyChart');
        const ctx = chartCanvas.getContext('2d');

        if (window.efficiencyChart instanceof Chart) {
            window.efficiencyChart.destroy();
        }

        window.efficiencyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: efficiencyData.map(d => d.date),
                datasets: [
                    {
                        label: 'PUE',
                        data: efficiencyData.map(d => d.pue),
                        borderColor: 'rgba(75, 192, 192, 1)',
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: 'WUE',
                        data: efficiencyData.map(d => d.wue),
                        borderColor: 'rgba(153, 102, 255, 1)',
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: 'CUE',
                        data: efficiencyData.map(d => d.cue),
                        borderColor: 'rgba(255, 159, 64, 1)',
                        fill: false,
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Efficiency Metrics (PUE, WUE, CUE) - Past 3 Months' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                return value === null ? 'No data available' : `${context.dataset.label}: ${value}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'month',
                            displayFormats: {
                                month: 'MMM yyyy' // Display in "MMM YYYY" format
                            }
                        }
                    },
                    y: { beginAtZero: true }
                }
            }
        });
    }

    const yearDropdown = document.getElementById('yearDropdown');
    const monthDropdown = document.getElementById('monthDropdown');

    if (yearDropdown) {
        yearDropdown.addEventListener('change', () => loadDataForSelectedYearAndMonth(false));
    } else {
        console.error("Element with ID 'yearDropdown' not found.");
    }

    if (monthDropdown) {
        monthDropdown.addEventListener('change', () => loadDataForSelectedYearAndMonth(false));
    } else {
        console.error("Element with ID 'monthDropdown' not found.");
    }

    fetchAvailableYearsAndMonths();
});
