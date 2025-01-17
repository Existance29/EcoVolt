//tab switching
var currentDashboard;
const dashboardTabs = Array.from(document.getElementById("dashboard-tabs").children)
function getDashboardByTabId(tabID){
    return document.getElementById(`${tabID.split("-")[0]}-dashboard`)
}

function dashboardTabClicked(tabEle){
    dashboardTabs.forEach(y => {
        y.classList.remove("active")
        getDashboardByTabId(y.id).style.display = "none"
    })
    tabEle.classList.add("active")
    currentDashboard = getDashboardByTabId(tabEle.id)
    currentDashboard.style.display = "flex"
}
dashboardTabs.forEach(x => x.addEventListener("click", ()=> dashboardTabClicked(x)))
dashboardTabClicked(document.getElementById("review-tab-btn"))
document.getElementById("forecast-period").value = 5

function renderForecastLineChart(canvasElement, originalData, forecastData, labels, color1, color2, yTickUnit=""){
    if(Chart.getChart(canvasElement.id)) {
        Chart.getChart(canvasElement.id)?.destroy()
    }

    const datasets = [
        {
            label: '',
            data: originalData.concat(forecastData),
            segment: {
                borderColor: ctx => ctx.p0.parsed.x < originalData.length-1 ? color1 : color2,
                borderDash: ctx => ctx.p0.parsed.x < originalData.length-1 ? undefined : [4,4],
                backgroundColor: ctx => {
                    let canvasContext = canvasElement.getContext("2d")
                    let gradient = canvasContext.createLinearGradient(0, 0, 0, canvasElement.height)
                    if (ctx.p0.parsed.x < originalData.length-1){
                        gradient.addColorStop(0, color1+"80")
                        gradient.addColorStop(1, color1+"00")
                        return gradient
                    }else{
                        gradient.addColorStop(0, color2+"80")
                        gradient.addColorStop(1, color2+"00")
                        return gradient
                    }
                },
            }, 
            pointBorderColor: (ctx) => ctx.dataIndex < originalData.length ? color1 : color2,
            tension: 0.4,
            fill: true

        }
    ]

    new Chart(canvasElement, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
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
                        callback: (value, index, values) => `${value}${yTickUnit}`
                    },
                    beginAtZero: true
                },
                x: {
                    grid: {
                        color: "#E2E8F0",
                        borderDash: [8, 4],
                    },

                    
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