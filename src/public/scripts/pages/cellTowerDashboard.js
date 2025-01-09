Chart.defaults.font.size = 13
Chart.defaults.color = "#8A8A8A"
var hourArray = [10, 20, 30, 40, 50]
var honeyPerMin = [5,10,15,20, 13]

//round the decimals and add commas
function formatDecimals(n){
    return Math.round(n).toLocaleString()
}   

function formatNum(num, month){
   
    numToMonth = {
        "1": "Jan",
        "2": "Feb", 
        "3": "Mar", 
        "4": "Apr", 
        "5": "May", 
        "6": "Jun", 
        "7": "Jul", 
        "8": "Aug",
        "9": "Sep", 
        "10": "Oct", 
        "11": "Nov",
        "12": "Dec"
    }
    
    if (month == "all"){
        return `${numToMonth[num]} ${yearPicker.value ? yearPicker.value : 2024}`
    }

    return `${num} ${numToMonth[month]}`


}

function renderBarChart(canvasElement, xData, datasets, showLegend){
    if(Chart.getChart(canvasElement.id)) {
        Chart.getChart(canvasElement.id)?.destroy()
    }
    new Chart(canvasElement, {
        type: 'bar',
        data: {
            labels: xData,
            datasets: datasets
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    grid: {
                        color: "#E2E8F0",
                        borderDash: [8, 4],
                    },
                    ticks: {
                        maxTicksLimit: 10,
                        autoSkip: false,
                    },
                    stacked: true,
                    beginAtZero: true
                },
                x: {
                    grid: {
                        display: false
                    },
                    stacked: true
                }
            },
            plugins:{
                legend: {
                    display: showLegend
                }
            },
        }
    })
}

function renderLineChart(canvasElement, xData, yData, lineColor, maintainAspectRatio = false, tension=0.4){
    if(Chart.getChart(canvasElement.id)) {
        Chart.getChart(canvasElement.id)?.destroy()
    }
    new Chart(canvasElement, {
        type: 'line',
        data: {
            labels: yData,
            datasets: [{
                data: xData,
                borderColor: lineColor,
                tension: tension,
                fill: {
                    target: 'origin',
                    above: (context) => {
                        const {ctx, chartArea} = context.chart
                        let gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top)
                        gradient.addColorStop(0, lineColor+"00")
                        gradient.addColorStop(1, lineColor+"80")
                        return gradient
                    }
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: maintainAspectRatio,
            scales: {
                y: {
                    grid: {
                        color: "#E2E8F0",
                        borderDash: [8, 4],
                    },
                    ticks: {
                        maxTicksLimit: 8,
                        autoSkip: false,
                    },
                    beginAtZero: true
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins:{
                legend: {
                    display: false
                }
            },
        }
    })
}

function renderMultiLineChart(canvasElement, xData, datasets){
    if(Chart.getChart(canvasElement.id)) {
        Chart.getChart(canvasElement.id)?.destroy()
    }
    new Chart(canvasElement, {
        type: 'line',
        data: {
            labels: xData,
            datasets: datasets
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: {
                    grid: {
                        color: "#E2E8F0",
                        borderDash: [8, 4],
                    },
                    ticks: {
                        maxTicksLimit: 8,
                        autoSkip: false,
                    },
                    beginAtZero: true
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    })
}

function renderDoughnutChart(element, labels, data, colors, onClickFunc){
    if(Chart.getChart(element.id)) {
        Chart.getChart(element.id)?.destroy()
    }

    
    new Chart(element, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [
                {
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins:{
                legend: {
                    display: false
                },
            },
            onClick: onClickFunc,
            cutout: "55%"
        }
    })

    //render the labels for the pie chart
    const dataSum = data.reduce((a, b) => a + b, 0)
    const labelElement = element.parentNode.parentNode.children[2]
    const [labelColumn, valueColumn] = labelElement.children
    labelColumn.innerHTML = ""
    valueColumn.innerHTML = ""
    for (let i = 0; i < labels.length; i++){
        labelColumn.innerHTML += `
            <div style="display: flex;"> 
                <div class="label-color" style="background-color: ${colors[i]};"></div>
                <div class="label-name inter-semibold">${labels[i]}</div>
            </div>
        `

        valueColumn.innerHTML += `<div class="label-value inter-medium">${formatDecimals(data[i])} (${Math.round(data[i]/dataSum*100)}%)</div>`

    }
} 

function renderCircleProgressBar(element, currentValue, totalValue, chartSize, barColor, trackColor){
    const perc = currentValue/totalValue*100
    element.dataset.percent = perc
    element.innerText = `${Math.round(perc)}%`

    new EasyPieChart(element, {
        scaleLength: false,
        lineCap: "square",
        lineWidth: 10,
        size: chartSize,
        barColor: barColor,
        trackColor: trackColor
    });

    element.style.height = `${chartSize}px`
    element.style.width = `${chartSize}px`

    const labelDiv = element.parentNode.children[1]
    labelDiv.innerHTML = `<span style="color: ${barColor};">${formatDecimals(currentValue)}</span> / ${formatDecimals(totalValue)} kWh`
}

const monthPicker = document.getElementById("monthPicker")
const yearPicker = document.getElementById("yearPicker")
const cellTowerPicker = document.getElementById("cellTowerDropdown")
const yearErrorMessage = document.createElement("div"); // Create error message element

yearErrorMessage.style.color = "red";
yearErrorMessage.style.fontSize = "12px";
yearErrorMessage.style.marginTop = "4px";
yearErrorMessage.style.display = "none"; // Initially hidden
yearPicker.parentNode.insertBefore(yearErrorMessage, yearPicker.nextSibling); // Insert error message below year picker

function getFilters(){
    //get filters
    return {
        month: monthPicker.value || "all",
        year: yearPicker.value || "all",
        cellTower: cellTowerPicker.value
    }
}

async function loadData(){
    //get data
    const {month, year,cellTower} = getFilters()
    const response = await get(`Dashboard/Cell-Tower/Consumption/${cellTower}/${month}/${year}`)
    //check if the data exists
    if (response.status == 404){
        document.getElementById("noDataMessage").style.display = "block"
        document.getElementById("dashboard").style.display = "none"
        return
    }
    document.getElementById("noDataMessage").style.display = "none"
    document.getElementById("dashboard").style.display = "flex"
    const data = await response.json()
    //main stats
    document.getElementById("grid-type").innerText = data.grid_type
    document.getElementById("total-carbon-emission").innerText = `${formatDecimals(data.carbon_emission)} Tons`
    document.getElementById("total-energy").innerText = `${formatDecimals(data.total_energy)} kWh`

    //deal with trends
    const trendData = data.trends
    const carbonEmissionTrends = trendData.map(item => item.carbon_emission);
    const trendLabels = trendData.map(item => formatNum(item.num, month));
    //carbon emission
    renderLineChart(document.getElementById('carbonEmissionChart'), carbonEmissionTrends, trendLabels, "#4FD1C5")

    //energy breakdown
    const energyBreakdownColors = ["#263332","#485251","#4FD1C5","#95D1CB","#5BA79F"]
    const energyBreakdownLabels = ["Radio Equipment", "Cooling", "Backup Power", "Misc"]
    const energyBreakdownData = [data.radio_equipment_energy, data.cooling_energy, data.backup_power_energy, data.misc_energy]
    renderDoughnutChart(document.getElementById('energyBreakdownChart'), energyBreakdownLabels, energyBreakdownData, energyBreakdownColors, energyConsumptionClick)

    //renewable energy contribution
    renderCircleProgressBar(document.getElementById("renewable-energy-contribution-chart"), data.renewable_energy, data.total_energy, 115, "#4FD1C5", "#CAC9CA80")
}


async function onLoad() {
    //get all cell towers and add them to the dropdown options
    const cellTowers = await (await get("Dashboard/Cell-Towers")).json();
    const dropdown = document.getElementById("cellTowerDropdown");
    for (let i = 0; i < cellTowers.length; i++) {
        const cellTower = cellTowers[i];
        var option = document.createElement("option");
        option.text = cellTower.cell_tower_name;
        option.value = cellTower.id;
        dropdown.add(option);
    }

    const cellTowerIDs = cellTowers.map(x => x.id);

    //get url parameters
    const initialYear = getUrlParameter("year") || ""; 
    var initialMonth = getUrlParameter("month"); 
    var initialCellTowerID = getUrlParameter("cell_tower_id"); 

    //validate the parameters, default to "all" if invalid
    initialMonth = initialMonth && initialMonth >= 1 && initialMonth <= 12 ? initialMonth : ""; 
    initialCellTowerID = !isNaN(initialCellTowerID) && cellTowerIDs.includes(parseInt(initialCellTowerID)) ? initialCellTowerID : "all"; 

    //set the filters to the parameter value
    monthPicker.value = initialMonth; 
    yearPicker.value = initialYear; 
    document.getElementById("cellTowerDropdown").value = initialCellTowerID; 

    // Update date picker label based on URL parameters 
    updateDatePickerToggleLabel(); 

    // Load data based on initial parameters 
    loadData(); 
}

// Function to get URL parameters by name 
function getUrlParameter(name) { 
    const urlParams = new URLSearchParams(window.location.search); 
    return urlParams.get(name); 
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

// Event listener for the Apply button
document.getElementById("datePickerApply").addEventListener("click", function(event) {
    event.preventDefault();
    // Check if month is selected without a year
    if (monthPicker.value && !yearPicker.value) {
        yearErrorMessage.textContent = "Please select a year";
        yearErrorMessage.style.display = "block";
        return; // Stop fetch if month is selected without a year
    }
    yearErrorMessage.style.display = "none"; // Hide the error message if validation passes
    updateDatePickerToggleLabel(); // Update the label based on the selected month/year
    document.getElementById("datePickerContainer").style.display = "none";
    loadData()
});

// Event listener for the Clear button
document.getElementById("datePickerClear").addEventListener("click", function(event) {
    event.preventDefault();
    monthPicker.value = "";
    yearPicker.value = "";
    updateDatePickerToggleLabel(); // Reset the label to "All"
    document.getElementById("datePickerContainer").style.display = "none";
    yearErrorMessage.style.display = "none"; // Hide the error message if validation passes
    loadData()
});

monthPicker.addEventListener("change", () => {
})

onLoad()

/*
============================
Drill Down Chart
============================
*/

function hideDrillDown(){
    document.getElementById("drill-down").style.display = "none"
}

function showDrillDown(title){
    const drillDown = document.getElementById("drill-down")
    drillDown.style.display = "flex"
    document.querySelector("#drill-down #title").innerText = title
}

window.onclick = function(event) {
    if (event.target.id == "drill-down") hideDrillDown()
};

//energy consumption drilldowns
async function loadCellTowersEnergyConsumption(cat, month, year, color){
    const data = await (await get(`/Dashboard/Cell-Towers/Energy-Consumption/${cat}/${month}/${year}`)).json()
    const colors = Array(data.length).fill(color)
    const datasets = [{
        data: data.map(x => x.data),
        borderWidth: 1,
        barThickness: 60,
        borderColor: colors,
        backgroundColor: colors.map(x => x+"4D")
        }]
    renderBarChart(document.getElementById('drillDownChart'), data.map(x => x.cell_tower_name), datasets, false)
}

async function loadCellTowerEnergyConsumptionTrend(id, cat, month, year, color){
    const data = await (await get(`/Dashboard/Cell-Tower/Energy-Consumption-Trend/${id}/${cat}/${month}/${year}`)).json()
    console.log(data)
    renderLineChart(document.getElementById('drillDownChart'), data.map(x => x.data), data.map(x => formatNum(x.num, month)), color, true, 0.4)
}

function energyConsumptionClick(event, elements, chart){
    if (!elements[0]) return     
    const i = elements[0].index
    const label = chart.data.labels[i]
    const color = chart.data.datasets[0].backgroundColor[i]
    const {month, year, cellTower} = getFilters()

    //show breakdown based on cell tower
    if (cellTower == "all"){
        showDrillDown(`${label} - Energy Consumption (kWh)`) 
        loadCellTowersEnergyConsumption(label, month, year, color)

    } else{ //show trend for target cell tower
        const cellTowerName = document.getElementById("cellTowerDropdown").options[document.getElementById("cellTowerDropdown").selectedIndex ].text
        showDrillDown(`${label} - Cell Tower: ${cellTowerName} (kWh)`) 
        loadCellTowerEnergyConsumptionTrend(cellTower, label, month, year, color)
    }
}

async function loadCellTowersRenewableEnergy(month, year){
    const data = await (await get(`/Dashboard/Cell-Towers/Renewable-Energy/${month}/${year}`)).json()
    const colors1 = Array(data.length).fill("#4FD1C5")
    const colors2 = Array(data.length).fill("#929998")
    const datasets = [
        {
            label: 'Renewable Energy',
            data: data.map(x => x.renewable_energy),
            borderWidth: 1,
            barThickness: 60,
            borderColor: colors1,
            backgroundColor: colors1.map(x => x+"4D")
        },
        {
            label: 'Non-Renewable Energy',
            data: data.map(x => x.nonrenewable_energy),
            borderWidth: 1,
            barThickness: 60,
            borderColor: colors2,
            backgroundColor: colors2.map(x => x+"4D")
        }
    ]
    renderBarChart(document.getElementById('drillDownChart'), data.map(x => x.cell_tower_name), datasets, true)

}

async function loadCellTowerRenewableEnergyTrend(id, month, year){
    const data = await (await get(`/Dashboard/Cell-Tower/Renewable-Energy/${id}/${month}/${year}`)).json()
    const color1 = "#4FD1C5"
    const tension = 0.4
    const color2 = "#485251"
    const datasets = [
        {
            label: 'Renewable Energy',
            data: data.map(x => x.renewable_energy),
            borderColor: color1,
            tension: tension,
            fill: {
                target: 'origin',
                above: (context) => {
                    const {ctx, chartArea} = context.chart
                    let gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top)
                    gradient.addColorStop(0, color1+"00")
                    gradient.addColorStop(1, color1+"80")
                    return gradient
                }
            }
        },
        {
            label: 'Total Energy',
            data: data.map(x => x.total_energy),
            borderColor: color2,
            tension: tension,
            fill: {
                target: 'origin',
                above: (context) => {
                    const {ctx, chartArea} = context.chart
                    let gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top)
                    gradient.addColorStop(0, color2+"00")
                    gradient.addColorStop(1, color2+"80")
                    return gradient
                }
            }
        }
    ]

    renderMultiLineChart(document.getElementById('drillDownChart'), data.map(x => formatNum(x.num, month)), datasets)

}

//renewable energy contribution drill down
document.getElementById("renewable-energy-contribution-chart").addEventListener("click",() => {
    const {month, year, cellTower} = getFilters()
    if (cellTower == "all"){
        showDrillDown(`Renewable Energy Contribution (kWh)`) 
        loadCellTowersRenewableEnergy(month, year)

    } else{ //show trend for target cell tower
        const cellTowerName = document.getElementById("cellTowerDropdown").options[document.getElementById("cellTowerDropdown").selectedIndex ].text
        showDrillDown(`Renewable Energy Contribution - Cell Tower: ${cellTowerName} (kWh)`) 
        loadCellTowerRenewableEnergyTrend(cellTower, month, year)
    }
})

/*
============================
Tool tip
============================
*/


function hideTooltip(){
    document.getElementById("tooltip").style.display = "none"
}

function showTooltip(){
    const tooltip = document.getElementById("tooltip")
    tooltip.style.display = "flex"
    return tooltip
}

window.onclick = function(event) {
    if (event.target.id == "tooltip") hideTooltip()
};

document.getElementById("renewable-energy-contribution-tooltip").addEventListener("click", () => {
    const tooltip = showTooltip()
    document.querySelector("#tooltip #title").innerText = "Renewable Energy Contribution"
    document.querySelector("#tooltip p").innerText = "Renewable Energy Contribution refers to the percentage of the total energy consumption that comes from renewable energy sources.\
    \n\nUsing renewable energy helps decrease greenhouse gas emissions, lower operating costs and contribute to long-term energy security."
})
