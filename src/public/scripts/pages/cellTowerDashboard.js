Chart.defaults.font.size = 13
Chart.defaults.color = "#CAC9CA"
var hourArray = [10, 20, 30, 40, 50]
var honeyPerMin = [5,10,15,20, 13]

//round the decimals and add commas
function formatDecimals(n){
    return Math.round(n).toLocaleString()
}   

function renderLineChart(canvasElement, xData, yData, lineColor){
    // const parentElement = canvasElement.parentElement
    // const parentHeightPX = parentElement.offsetHeight
    // //convert from px to vh
    // const parentHeightVH = (100 * parentHeightPX / window.innerHeight)
    // console.log(parentHeightPX)
    // parentElement.style.maxHeight = `${parentHeightPX}px`
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
                tension: 0.4,
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
            maintainAspectRatio: false,
            scales: {
                y: {
                    grid: {
                        color: "#E2E8F0",
                        borderDash: [8, 4],
                    },
                    ticks: {
                        maxTicksLimit: 6,
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

function renderDoughnutChart(element, labels, data, colors){
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
                    borderWidth: 0,
                    borderRadius: 0
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
            cutout: "65%"
        }
    })
    //render the labels for the pie chart
    const dataSum = data.reduce((a, b) => a + b, 0)
    const labelElement = element.parentNode.parentNode.childNodes[3]
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
        lineWidth: 7,
        size: chartSize,
        barColor: barColor,
        trackColor: trackColor
    });

    element.style.height = `${chartSize}px`
    element.style.width = `${chartSize}px`

    const labelDiv = element.parentNode.children[1]
    labelDiv.innerHTML = `<span style="color: ${barColor};">${formatDecimals(currentValue)}</span> / ${formatDecimals(totalValue)} MWh`
}

async function loadData(){
    //get filters
    const month = document.getElementById("monthDropdown").value
    const year = document.getElementById("yearPicker").value
    const cellTower = document.getElementById("cellTowerDropdown").value

    const data = await (await get("Dashboard/Cell-Tower/Consumption/all/all/all")).json()
    //main stats
    document.getElementById("grid-type").innerText = data.grid_type
    document.getElementById("total-carbon-emission").innerText = `${formatDecimals(data.carbon_emission)} Tons`
    document.getElementById("total-energy").innerText = `${formatDecimals(data.total_energy)} MWh`

    //deal with trends
    const trendData = data.trends
    const carbonEmissionTrends = trendData.map(item => item.carbon_emission);
    const trendLabels = trendData.map(item => item.num);
    //carbon emission
    renderLineChart(document.getElementById('carbonEmissionChart'), carbonEmissionTrends, trendLabels, "#4FD1C5")

    //energy breakdown
    const energyBreakdownColors = ["#5BA79F","#95D1CB","#4FD1C5","#485251","#263332"]
    const energyBreakdownLabels = ["Radio Equipment", "Cooling", "Backup Power", "Misc"]
    const energyBreakdownData = [data.radio_equipment_energy, data.cooling_energy, data.backup_power_energy, data.misc_energy]
    renderDoughnutChart(document.getElementById('energyBreakdownChart'), energyBreakdownLabels, energyBreakdownData, energyBreakdownColors)

    //renewable energy contribution
    renderCircleProgressBar(document.getElementById("renewable-energy-contribution-chart"), data.renewable_energy, data.total_energy, 100, "#4FD1C5", "#CAC9CA80")
}

//get all cell towers and add them to the dropdown options
async function loadCellTowerDropdown(){
    const cellTowers = await (await get("Dashboard/Cell-Towers")).json()
    const dropdown = document.getElementById("cellTowerDropdown")
    for (let i = 0; i < cellTowers.length; i++){
        const cellTower = cellTowers[i]
        var option = document.createElement("option");
        option.text = cellTower.cell_tower_name;
        option.value = cellTower.id
        dropdown.add(option);
    }
}
loadCellTowerDropdown()
//load data
loadData()