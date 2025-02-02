pageRequireSignIn();
pageRequireAdmin();
// Array holding the content for each page
const tooltipPages = [
    {
        title: "PUE (Power Usage Effectiveness)",
        content: `
            <p>PUE is the ratio of total energy used by the data center to the energy used specifically by IT equipment. It measures the efficiency of energy usage, aiming to reduce energy wasted on cooling, lighting, and other non-IT processes.</p>
            <p><strong>Ideal Value:</strong> 1.0 (indicating 100% energy efficiency with no waste)</p>
            <p><strong>Strategies to Improve PUE:</strong></p>
            <ul>
                <li>Optimize cooling systems with advanced technologies like liquid cooling or free air cooling.</li>
                <li>Use hot/cold aisle containment to improve airflow management and reduce cooling requirements.</li>
                <li>Regularly maintain and upgrade cooling equipment to prevent inefficiencies.</li>
                <li>Consider using renewable energy sources to power data centers.</li>
            </ul>
        `
    },
    {
        title: "CUE (Carbon Usage Effectiveness)",
        content: `
            <p>CUE measures the amount of carbon emissions produced per unit of energy consumed by a data center. Lower CUE indicates lower carbon emissions, making the data center more environmentally friendly.</p>
            <p><strong>Ideal Value:</strong> Close to 0 (indicating minimal or no carbon emissions)</p>
            <p><strong>Strategies to Improve CUE:</strong></p>
            <ul>
                <li>Transition to renewable energy sources such as solar, wind, or hydro power.</li>
                <li>Invest in carbon offset programs to compensate for emissions that cannot be eliminated.</li>
                <li>Optimize power management in IT equipment to reduce unnecessary energy consumption.</li>
            </ul>
        `
    },
    {
        title: "WUE (Water Usage Effectiveness)",
        content: `
            <p>WUE measures the amount of water used for cooling per unit of energy consumed by IT equipment. Reducing WUE improves water efficiency and decreases the environmental impact.</p>
            <p><strong>Ideal Value:</strong> Close to 0 (indicating minimal water usage)</p>
            <p><strong>Strategies to Improve WUE:</strong></p>
            <ul>
                <li>Implement air-based cooling systems that use less or no water.</li>
                <li>Recycle and reuse water where possible, especially in areas with limited water resources.</li>
                <li>Invest in cooling systems that rely on minimal or zero water usage, such as adiabatic or dry cooling.</li>
            </ul>
        `
    }
];

// Track the current page index
let currentPage = 0;

// Function to show the tooltip modal and load the first page
function showTooltip() {
    document.getElementById("tooltipModal").style.display = "block";
    loadTooltipPage(currentPage);
}

// Function to hide the tooltip modal
function hideTooltip() {
    document.getElementById("tooltipModal").style.display = "none";
}

// Function to load a specific page
function loadTooltipPage(pageIndex) {
    // Update title and content based on the current page
    const page = tooltipPages[pageIndex];
    document.getElementById("tooltipTitle").textContent = page.title;
    document.getElementById("tooltipContent").innerHTML = page.content;

    // Update button visibility
    document.getElementById("prevButton").style.display = pageIndex === 0 ? "none" : "inline";
    document.getElementById("nextButton").style.display = pageIndex === tooltipPages.length - 1 ? "none" : "inline";
}

// Function to change the page
function changePage(direction) {
    currentPage += direction;
    loadTooltipPage(currentPage);
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
let deviceTypesChart;

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
        const response = await get(`/Dashboard/Data-Center`);
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
        const response = await get(`/Dashboard/Data-Center/AvailableDates`);
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
    await fetchDeviceTypesData();
    await fetchDeviceCount(); 

    const selectedDate = selectedYear && selectedMonth ? `${selectedYear}-${selectedMonth}` : selectedYear;

    if (selectedDate && (selectedDate.length !== 4 && selectedDate.length !== 7)) {
        console.error("Invalid date format. Expected format: YYYY or YYYY-MM.");
        noDataMessage.style.display = "block";
        currentDashboard.style.display = "none";
        return;
    }

    const { availableYears, availableMonths } = await fetchAvailableDates();

    if (selectedYear && !availableYears.has(selectedYear)) {
        console.warn("Year not found:", selectedYear);
        noDataMessage.style.display = "block";
        currentDashboard.style.display = "none";
        return;
    }

    if (selectedDate && selectedMonth && !availableMonths.has(selectedDate)) {
        console.warn("Month-year not found:", selectedDate);
        noDataMessage.style.display = "block";
        currentDashboard.style.display = "none";
        return;
    }

    noDataMessage.style.display = "none";
    currentDashboard.style.display = "flex";

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
        await fetchTotalCarbonEmissionByDataCenterIdAndDate(selectedDataCenter, selectedDate);
        await fetchTotalEnergyConsumptionByDataCenterIdAndDate(selectedDataCenter, selectedDate); // Fetch energy consumption for the data center by date
        await fetchEnergyConsumptionBreakdownByDataCenterIdAndDate(selectedDataCenter, selectedDate); // Fetch energy breakdown for the data center by date
        await fetchTotalRenewableEnergyByDataCenterIdAndDate(selectedDataCenter, selectedDate); // Fetch total renewable energy for the data center by date
    }
        // Fetch metric data for the selected metric button
        const activeMetric = document.querySelector(".button-container .active").innerText;
        fetchMetricData(activeMetric); // Ensure the gauge chart updates based on the active metric

    //forecast 
    const month = selectedMonth || "all"
    const year = selectedYear || "all"
    const forecastOriginalData = await (await get(`/Dashboard/Data-Center/EnergyConsumption/trend/${selectedDataCenter || "all"}/${month}/${year}`)).json()
    const color1 = "#4FD1C5"
    const color2 = "#AE85FF"
    console.log(forecastOriginalData)

    //setup the labels
    const forecastPeriod = parseInt(document.getElementById("forecast-period").value)
    let allLabels = forecastOriginalData.map(x => x.num)
    let start = allLabels[allLabels.length - 1]; // Get the last element to continue incrementally

    for (let i = 1; i <= forecastPeriod; i++) {
        allLabels.push(start + i); // Add the next incremental value
    }
    allLabels = allLabels.map(x => formatNum(x, month, year))

    //total energy consumption
    const energyConsumptionData = forecastOriginalData.map(x => x.total_energy)
    const energyConsumptionForecastData = await (await post(`/Dashboard/Forecast/holt-linear/${forecastPeriod}`, {data: JSON.stringify(energyConsumptionData)})).json()
    renderForecastLineChart(document.getElementById('energyConsumptionForecastChart'), energyConsumptionData, energyConsumptionForecastData, allLabels, color1, color2)

    //pue
    const pueData = forecastOriginalData.map(x => x.pue)
    const pueForecastData = await (await post(`/Dashboard/Forecast/holt-linear/${forecastPeriod}`, {data: JSON.stringify(pueData)})).json()
    renderForecastLineChart(document.getElementById('pueForecastChart'), pueData, pueForecastData, allLabels, color1, color2)

    //cue
    const cueData = forecastOriginalData.map(x => x.pue)
    const cueForecastData = await (await post(`/Dashboard/Forecast/holt-linear/${forecastPeriod}`, {data: JSON.stringify(cueData)})).json()
    renderForecastLineChart(document.getElementById('cueForecastChart'), cueData, cueForecastData, allLabels, color1, color2)

    //wue
    const wueData = forecastOriginalData.map(x => x.wue)
    const wueForecastData = await (await post(`/Dashboard/Forecast/holt-linear/${forecastPeriod}`, {data: JSON.stringify(wueData)})).json()
    renderForecastLineChart(document.getElementById('wueForecastChart'), wueData, wueForecastData, allLabels, color1, color2)
}

// Case 1: Fetch carbon emissions for all data centers under the company
async function fetchAllCarbonEmissionByCompanyId() {
    try {
        const response = await get(`/Dashboard/Data-Center/CarbonEmission/company`);
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
        const response = await get(`/Dashboard/Data-Center/CarbonEmission/data-center/${data_center_id}`);
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
        const url = `/Dashboard/Data-Center/CarbonEmission/company/date?date=${encodeURIComponent(date)}`;
        
        console.log("Request URL for company by date:", url);
        
        const response = await get(url);
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
        
        const response = await get(url);
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


async function renderChart(data) {
    console.log("Rendering chart with data:", data);

    // Step 1: Check if both month and year filters are selected
    const selectedMonth = monthPicker.value;
    const selectedYear = yearPicker.value;
    const isDailyView = selectedMonth && selectedYear;
    const isFilteredByDate = selectedMonth || selectedYear;

    // Step 2: Process data to group by day if daily view is required; otherwise, by month-year
    const groupedData = data.reduce((acc, item) => {
        const date = new Date(item.date);
        let dateLabel;

        if (isFilteredByDate) {
            if (selectedMonth && selectedYear) {
                // Group by day-month (e.g., 01-Jan)
                dateLabel = date.toLocaleDateString("en-US", { day: '2-digit', month: 'short' });
            } else {
                // Group by month-year (e.g., Jan-2024)
                dateLabel = date.toLocaleDateString("en-US", { year: 'numeric', month: 'short' });
            }
        } else {
            // No filter applied, group by year
            dateLabel = date.getFullYear().toString();
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

    //forecast time
    const months = ["Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"]
    //Step 4: Set the labels for the forecast
    const forecastPeriod = parseInt(document.getElementById("forecast-period").value)
    let start = labels[labels.length - 1]; // Get the last element to continue incrementally
    let allLabels = [...labels]
    let yearIncrement = 0
    let monthIncrement = 0
    for (let i = 1; i <= forecastPeriod; i++) {
        if (!selectedMonth && !selectedYear){
            allLabels.push(parseInt(start) + i); // Add the next incremental value
        }else if (!selectedMonth && selectedYear){ //by month
            let [m, y] = start.split(" ")
            monthNum = (months.indexOf(m)+i)%12
            y = parseInt(y)+yearIncrement
            m = months[monthNum]
            if (!monthNum) yearIncrement += 1
            allLabels.push(`${m} ${y}`)
        } else{ //by day
            let [m, d] = start.split(" ")
            d = parseInt(d) + i
            if (d > 30) monthIncrement += 1
            m = months[(months.indexOf(m)+monthIncrement)%12]
            allLabels.push(`${m} ${d < 10 ? "0":""}${d}`)

        }

        
    }

    //Step 5: Get the forecasted data
    const carbonEmissionPredictionData = await (await post(`/Dashboard/Forecast/holt-linear/${forecastPeriod}`, {data: JSON.stringify(emissions)})).json()

    //Step 6: Render the forecast chart
    renderForecastLineChart(document.getElementById('carbonEmissionForecastChart'), emissions, carbonEmissionPredictionData, allLabels, "#4FD1C5", "#AE85FF")
}




// Function to fetch total carbon emissions for the company
async function fetchTotalCarbonEmissionByCompanyId() {
    try {
        const response = await get(`/Dashboard/Data-Center/CarbonEmission/Sum/company`);
        const data = await response.json();
        console.log("Total Carbon Emission data for company:", data);
        
        // Update the total emissions display in the stat-value element
        const totalCarbonEmissions = Math.round(parseFloat(data.total_co2_emissions)); // Round to nearest whole number
        document.getElementById("totalCarbonEmissions").textContent = 
            `${totalCarbonEmissions.toLocaleString()} Tons`; // Format with commas             
    } catch (error) {
        console.error("Error fetching total carbon emission data for company:", error);
    }
}

// Function to fetch total carbon emissions for a specific data center
async function fetchTotalCarbonEmissionByDataCenterId(data_center_id) {
    try {
        const response = await get(`/Dashboard/Data-Center/CarbonEmission/Sum/data-center/${data_center_id}`);
        const data = await response.json();
        console.log("Total Carbon Emission data for data center:", data);
        
        // Update the total emissions display in the stat-value element
        const totalCarbonEmissions = Math.round(parseFloat(data.total_co2_emissions)); // Round to nearest whole number
        document.getElementById("totalCarbonEmissions").textContent = 
            `${totalCarbonEmissions.toLocaleString()} Tons`; // Format with commas               
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
        const response = await get(`/Dashboard/Data-Center/CarbonEmission/Sum/company/date?date=${encodeURIComponent(selectedDate)}`);
        if (!response.ok) {
            console.error("Failed to fetch data. Server response:", response.statusText);
            return;
        }
        
        const data = await response.json();
        console.log("Total Carbon Emission data for company by date:", data);

        // Update the total emissions display in the stat-value element
        const totalCarbonEmissions = Math.round(parseFloat(data.total_co2_emissions)); // Round to nearest whole number
        document.getElementById("totalCarbonEmissions").textContent = 
            `${totalCarbonEmissions.toLocaleString()} Tons`; // Format with commas                 
    } catch (error) {
        console.error("Error fetching total carbon emission data for company by date:", error);
    }
}

// Function to fetch total carbon emissions for a specific data center using the selected date
async function fetchTotalCarbonEmissionByDataCenterIdAndDate(data_center_id,date) {
    try {
        const response = await get(`/Dashboard/Data-Center/CarbonEmission/Sum/data-center/${data_center_id}/date?date=${date}`);
        const data = await response.json();
        console.log("Total Carbon Emission data for data center by date:", data);

        // Update the total emissions display in the stat-value element
        const totalCarbonEmissions = Math.round(parseFloat(data.total_co2_emissions)); // Round to nearest whole number
        document.getElementById("totalCarbonEmissions").textContent = 
            `${totalCarbonEmissions.toLocaleString()} Tons`; // Format with commas                
    } catch (error) {
        console.error("Error fetching total carbon emission data for data center by date:", error);
    }
}








// Function to fetch total energy consumption for the company
async function fetchTotalEnergyConsumptionByCompanyId() {
    try {
        const response = await get(`/Dashboard/Data-Center/EnergyConsumption/Sum/company`);
        const data = await response.json();
        console.log("Total Energy Consumption data for company:", data);
        
        // Update the total energy consumption display in the stat-value element
        const totalEnergyConsumption = Math.round(parseFloat(data.total_energy_consumption)); 
        document.getElementById("totalEnergyConsumption").textContent = 
            `${totalEnergyConsumption.toLocaleString()} MWh`;        
    } catch (error) {
        console.error("Error fetching total energy consumption data for company:", error);
    }
}

// Function to fetch total energy consumption for a specific data center
async function fetchTotalEnergyConsumptionByDataCenterId(data_center_id) {
    try {
        const response = await get(`/Dashboard/Data-Center/EnergyConsumption/Sum/data-center/${data_center_id}`);
        const data = await response.json();
        console.log("Total Energy Consumption data for data center:", data);
        
        const totalEnergyConsumption = Math.round(parseFloat(data.total_energy_consumption)); 
        document.getElementById("totalEnergyConsumption").textContent = 
            `${totalEnergyConsumption.toLocaleString()} MWh`;       
    } catch (error) {
        console.error("Error fetching total energy consumption data for data center:", error);
    }
}

// Function to fetch total energy consumption for the company using the selected date
async function fetchTotalEnergyConsumptionByCompanyIdAndDate(selectedDate) {
    try {
        const response = await get(`/Dashboard/Data-Center/EnergyConsumption/Sum/company/date?date=${selectedDate}`);
        const data = await response.json();
        console.log("Total energy consumption data for company by date:", data);
        // Update the total energy consumption display in the stat-value element
        const totalEnergyConsumption = Math.round(parseFloat(data.total_energy_consumption)); 
        document.getElementById("totalEnergyConsumption").textContent = 
            `${totalEnergyConsumption.toLocaleString()} MWh`;       
    } catch (error) {
        console.error("Error fetching total energy consumption data for company by date:", error);
    }
}
// Function to fetch total energy consumption for a specific data center using the selected date
async function fetchTotalEnergyConsumptionByDataCenterIdAndDate(data_center_id, date) {
    try {
        const response = await get(`/Dashboard/Data-Center/EnergyConsumption/Sum/data-center/${data_center_id}/date?date=${date}`);
        const data = await response.json();
        console.log("Total Energy Consumption data for data center by date:", data);

        // Update the total energy consumption display in the stat-value element
        const totalEnergyConsumption = Math.round(parseFloat(data.total_energy_consumption)); 
        document.getElementById("totalEnergyConsumption").textContent = 
            `${totalEnergyConsumption.toLocaleString()} MWh`;
    } catch (error) {
        console.error("Error fetching total energy consumption data for data center by date:", error);
    }
}








// Function to fetch energy consumption breakdown for the company
async function fetchEnergyConsumptionBreakdownByCompanyId() {
    try {
        const response = await get(`/Dashboard/Data-Center/EnergyConsumption/company`);
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
        const response = await get(`/Dashboard/Data-Center/EnergyConsumption/data-center/${data_center_id}`);
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
        const response = await get(`/Dashboard/Data-Center/EnergyConsumption/company/date?date=${date}`);
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
        const response = await get(`/Dashboard/Data-Center/EnergyConsumption/data-center/${data_center_id}/date?date=${date}`);
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
            cutout: '55%',
            hoverOffset: 15,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw || 0;
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${value.toLocaleString()} MWh (${percentage}%)`;
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
                    const selectedColor = colors[index];

                    // Get date and data center filters
                    const dataCenterId = dataCenterDropdown.value;
                    const year = yearPicker.value || null;
                    const month = monthPicker.value || null;

                    // Open the pop-up with relevant data and color
                    openPopup(dataCenterId, year, month, selectedLabel, selectedColor);
                }
            }
        }
    });

    // Generate dynamic labels for the right-side legend
    const legendContainer = document.querySelector(".pie-chart-labels-container");
    legendContainer.innerHTML = ''; // Clear any existing labels

    labels.forEach((label, index) => {
        const color = colors[index];
        const value = parseFloat(values[index].toFixed(1)).toLocaleString();
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

function openPopup(dataCenterId, year, month, selectedLabel, selectedColor) {
    popupModal.style.display = 'flex';
    // Only destroy if popupChart exists and is a Chart instance
    if (popupChart && typeof popupChart.destroy === 'function') {
        popupChart.destroy();
    }

    // Determine chart type based on the data center filter
    const isDataCenterFiltered = dataCenterId && dataCenterId !== "all";
    const chartType = isDataCenterFiltered ? 'line' : 'bar';

    // Construct API URL based on filters
    let apiUrl = `/Dashboard/Data-Center/EnergyConsumption/GroupByDc`;
    if (isDataCenterFiltered) apiUrl += `/${dataCenterId}`;

    const queryParams = [];
    if (year) queryParams.push(`year=${year}`);
    if (month) queryParams.push(`month=${month}`);
    if (queryParams.length > 0) apiUrl += `?${queryParams.join('&')}`;

    // Fetch data and render the chart
    get(apiUrl)
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
                ? data.map(item => new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }))
                : data.map(item => item.data_center_name);

            const chartTitle = isDataCenterFiltered ? `Data Center: ${data[0].data_center_name}` : `${selectedLabel} - Energy Consumption (MWh)`;

            popupChart = new Chart(popupChartCanvas, {
                type: chartType,
                data: {
                    labels: labels,
                    datasets: [{
                        label: `${selectedLabel} - Energy Consumption (MWh)`,
                        data: dataset,
                        borderColor: selectedColor,    // Solid border color
                        backgroundColor: selectedColor + '80',    // Transparent background color
                        borderWidth: 2,
                        fill: true,      
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: chartTitle
                        },
                        legend: {
                            display: false  // Disable the legend
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
        const response = await get(`/Dashboard/Data-Center/RenewableEnergy/Total/company`);
        const data = await response.json();
        console.log("Total Renewable Energy data for company:", data);
        
        // Update the "Total Renewable Energy" display
        const totalRenewableEnergy = Math.round(parseFloat(data.total_renewable_energy));
        document.getElementById("totalRenewableEnergy").textContent = 
            `${totalRenewableEnergy.toLocaleString()} MWh`;       
                
    } catch (error) {
        console.error("Error fetching total renewable energy data for company:", error);
    }
}

// Function to fetch and display total renewable energy for a specific data center
async function fetchTotalRenewableEnergyByDataCenterId(data_center_id) {
    try {
        const response = await get(`/Dashboard/Data-Center/RenewableEnergy/Total/data-center/${data_center_id}`);
        const data = await response.json();
        console.log("Total Renewable Energy data for data center:", data);
        
        // Update the "Total Renewable Energy" display
        const totalRenewableEnergy = Math.round(parseFloat(data.total_renewable_energy));
        document.getElementById("totalRenewableEnergy").textContent = 
            `${totalRenewableEnergy.toLocaleString()} MWh`;       
                
    } catch (error) {
        console.error("Error fetching total renewable energy data for data center:", error);
    }
}

// Function to fetch and display total renewable energy for the company with date
async function fetchTotalRenewableEnergyByCompanyIdAndDate(selectedDate) {
    try {
        const response = await get(`/Dashboard/Data-Center/RenewableEnergy/Total/company/date?date=${selectedDate}`);
        const data = await response.json();
        console.log("Total Renewable Energy data for company by date:", data);

        // Update the "Total Renewable Energy" display
        const totalRenewableEnergy = Math.round(parseFloat(data.total_renewable_energy));
        document.getElementById("totalRenewableEnergy").textContent = 
            `${totalRenewableEnergy.toLocaleString()} MWh`;       
                
    } catch (error) {
        console.error("Error fetching total renewable energy data for company by date:", error);
    }
}

// Function to fetch and display total renewable energy for a specific data center with date
async function fetchTotalRenewableEnergyByDataCenterIdAndDate(data_center_id, selectedDate) {
    try {
        const response = await get(`/Dashboard/Data-Center/RenewableEnergy/Total/data-center/${data_center_id}/date?date=${selectedDate}`);
        const data = await response.json();
        console.log("Total Renewable Energy data for data center by date:", data);

        // Update the "Total Renewable Energy" display
        const totalRenewableEnergy = Math.round(parseFloat(data.total_renewable_energy));
        document.getElementById("totalRenewableEnergy").textContent = 
            `${totalRenewableEnergy.toLocaleString()} MWh`;       
                
    } catch (error) {
        console.error("Error fetching total renewable energy data for data center by date:", error);
    }
}


let targetValues = {};

// Function to fetch target values for each metric
async function fetchTargetValues() {
    try {
        const response = await get(`/Dashboard/sustainability-goals`);
        const goalsData = await response.json();

        // Map target values based on key phrases in `goal_name`
        goalsData.forEach(goal => {
            if (goal.goal_name.includes('PUE')) {
                targetValues['PUE'] = parseFloat(goal.target_value);
            } else if (goal.goal_name.includes('CUE')) {
                targetValues['CUE'] = parseFloat(goal.target_value);
            } else if (goal.goal_name.includes('WUE')) {
                targetValues['WUE'] = parseFloat(goal.target_value);
            }
        });

        console.log("Mapped target values:", targetValues);  // Verify target values
    } catch (error) {
        console.error("Error fetching target values:", error);
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
            response = await get(`/Dashboard/Data-Center/EnergyConsumption/company`);
        } else if (!selectedDate && selectedDataCenter !== "all") {
            response = await get(`/Dashboard/Data-Center/EnergyConsumption/data-center/${selectedDataCenter}`);
        } else if (selectedDate && (selectedDataCenter === "all" || !selectedDataCenter)) {
            response = await get(`/Dashboard/Data-Center/EnergyConsumption/company/date?date=${encodeURIComponent(selectedDate)}`);
        } else if (selectedDate && selectedDataCenter !== "all") {
            response = await get(`/Dashboard/Data-Center/EnergyConsumption/data-center/${selectedDataCenter}/date?date=${encodeURIComponent(selectedDate)}`);
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
    const target = targetValues[label] || 1;  // Use dynamic target value, default to 1 if not found
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
    ctx.fillText(target.toFixed(2), centerX, centerY - radius + 25);  // Midpoint label
    ctx.fillText(maxValue.toFixed(2), centerX + radius + 10, centerY + 15);

    // Value label below
    ctx.font = "bold 14px Arial";
    ctx.fillText(`${label}: ${value.toFixed(2)}`, centerX, centerY + 20);
}



// Function to fetch device count based on the selected data center
async function fetchDeviceCount() {
    const selectedDataCenter = dataCenterDropdown.value;
    const selectedYear = yearPicker.value;
    const selectedMonth = monthPicker.value;

    let apiUrl = `/Dashboard/Data-Center/Devices`;
    if (selectedDataCenter !== "all") {
        apiUrl += `/${selectedDataCenter}`;
    }

    // Append year and month filters if selected
    const queryParams = [];
    if (selectedYear) queryParams.push(`year=${selectedYear}`);
    if (selectedMonth) queryParams.push(`month=${selectedMonth}`);
    if (queryParams.length > 0) apiUrl += `?${queryParams.join('&')}`;

    try {
        const response = await get(apiUrl);
        const data = await response.json();

        const deviceCountElement = document.getElementById("totalDevices");
        // Always show total devices, regardless of the filter
        deviceCountElement.textContent = `${data[0].total_devices} Devices`;
    } catch (error) {
        console.error("Error fetching device count:", error);
    }
}


// Call fetchDeviceCount whenever the data center dropdown changes
dataCenterDropdown.addEventListener("change", fetchDeviceCount);














// Function to fetch device types data
async function fetchDeviceTypesData() {
    const selectedDataCenter = document.getElementById('dataCenterDropdown').value;
    const selectedYear = document.getElementById('yearPicker').value;  // Year picker element
    const selectedMonth = document.getElementById('monthPicker').value;  // Month picker element

    let apiUrl;

    // Determine the endpoint based on the selected data center
    if (selectedDataCenter === "all" || !selectedDataCenter) {
        apiUrl = `/Dashboard/Data-Center/DevicesTypes`;
    } else {
        apiUrl = `/Dashboard/Data-Center/DevicesTypes/${selectedDataCenter}`;
    }

    // Append query parameters for year and month if selected
    const queryParams = [];
    if (selectedYear) queryParams.push(`year=${selectedYear}`);
    if (selectedMonth) queryParams.push(`month=${selectedMonth}`);
    if (queryParams.length > 0) apiUrl += `?${queryParams.join('&')}`;

    try {
        console.log(`Fetching device types from: ${apiUrl}`);  // Debugging API URL

        const response = await get(apiUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch device types. Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Device Types Data:", data);

        const labels = data.map(item => item.device_type_group);
        const counts = data.map(item => item.device_count);

        renderDeviceTypesChart(labels, counts);
    } catch (error) {
        console.error("Error fetching device types:", error);
    }
}

// Function to render the device types chart
function renderDeviceTypesChart(labels, data) {
    const ctx = document.getElementById("deviceTypesChart").getContext("2d");

    // Destroy existing chart instance if it exists
    if (deviceTypesChart) {
        deviceTypesChart.destroy();
    }

    // Create a new vertical bar chart
    deviceTypesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Device Count',
                data: data,
                borderColor: "#38B2AC",    // Solid border color
                backgroundColor: "#38B2AC" + '80',    // Transparent background color
                borderWidth: 2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Device Types in Data Center'
                },
                legend: { display: false }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Device Type'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Count'
                    },
                    ticks: {
                        stepSize: 1 // Ensure only whole numbers are displayed
                    }
                }
            }
        }
    });
}

// Add an event listener to the "Total Number of Devices" container
document.getElementById('totalDevicesContainer').addEventListener('click', () => {
    fetchDeviceTypesData();
    openDeviceTypesPopup();
});


// Function to open the device types modal
function openDeviceTypesPopup() {
    document.getElementById("deviceTypesModal").style.display = "flex";
}

// Function to close the device types modal
function closeDeviceTypesPopup() {
    document.getElementById("deviceTypesModal").style.display = "none";
}


document.getElementById("dataCenterDropdown").addEventListener("change", fetchDeviceTypesData);


















document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM fully loaded, initializing data center options...");
    
    // Load data center options
    await loadDataCenterOptions();
    await fetchTargetValues();
    await fetchDeviceCount();

    // Extract parameters from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const dataCenterIdFromUrl = urlParams.get('data_center_id');
    const dateFromUrl = urlParams.get('date');
    const yearFromUrl = urlParams.get('year');

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

function formatNum(num, month, year){
    if (year == "all"){
        return num
    }
    //by month
    numToMonth = {
        1: "Jan",
        2: "Feb", 
        3: "Mar", 
        4: "Apr", 
        5: "May", 
        6: "Jun", 
        7: "Jul", 
        8: "Aug",
        9: "Sep", 
        10: "Oct", 
        11: "Nov",
        0: "Dec"
    }
    
    if (month == "all"){
        r = num%12
        q = Math.floor(num/12)
        return `${numToMonth[r]} ${yearPicker.value ? parseInt(yearPicker.value)+(r ? q : q-1) : 2024 + (r ? q : q-1)}`
    }
    month = parseInt(month)
    r = num%31
    q = Math.floor(num/31)
    return `${r} ${numToMonth[(month+q)%12]}`


}