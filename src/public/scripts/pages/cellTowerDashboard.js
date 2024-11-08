Chart.defaults.font.size = 13
Chart.defaults.color = "#CAC9CA"
var hourArray = [10, 20, 30, 40, 50]
var honeyPerMin = [5,10,15,20, 13]

function renderLineChart(canvasElement, xData, yData, lineColor){
    // const parentElement = canvasElement.parentElement
    // const parentHeightPX = parentElement.offsetHeight
    // //convert from px to vh
    // const parentHeightVH = (100 * parentHeightPX / window.innerHeight)
    // console.log(parentHeightPX)
    // parentElement.style.maxHeight = `${parentHeightPX}px`
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
                    }
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

        valueColumn.innerHTML += `<div class="label-value inter-medium">${data[i]} (${Math.round(data[i]/dataSum*100)}%)</div>`

    }
}

renderLineChart(document.getElementById('carbonEmissionChart'), honeyPerMin, hourArray, "#4FD1C5")

const energyBreakdownColors = ["#263332","#485251","#4FD1C5","#95D1CB","#5BA79F"]
const energyBreakdownLabels = ["Radio Equipment", "Cooling", "Backup Power", "Misc"]
const energyBreakdownData = [1,2,3,4]
renderDoughnutChart(document.getElementById('energyBreakdownChart'), energyBreakdownLabels, energyBreakdownData, energyBreakdownColors)

const chartSize = 100
const renewableEnergyContributionChart = document.getElementById("renewable-energy-contribution-chart")
const perc = 50.2
renewableEnergyContributionChart.dataset.percent = perc
renewableEnergyContributionChart.innerText = `${Math.round(perc)}%`

new EasyPieChart(renewableEnergyContributionChart, {
    scaleLength: false,
    lineCap: "square",
    lineWidth: 7,
    size: chartSize,
    barColor: "#4FD1C5",
    trackColor: `#CAC9CA80`
});

renewableEnergyContributionChart.style.height = `${chartSize}px`
renewableEnergyContributionChart.style.width = `${chartSize}px`