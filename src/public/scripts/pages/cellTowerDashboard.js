Chart.defaults.font.size = 15
Chart.defaults.animation = true
Chart.defaults.color = "#CAC9CA"
var hourArray = [10, 20, 30, 40, 50]
var honeyPerMin = [5,10,15,20, 13]

const honeyPerMinCanvas = document.getElementById('honeyPerMinChart')
new Chart(honeyPerMinCanvas, {
    type: 'line',
    data: {
        labels: hourArray,
        datasets: [{
            data: honeyPerMin,
            borderColor: '#4FD1C5',
            tension: 0.4,
            fill: {
                target: 'origin',
                above: (context) => {
                    const {ctx, chartArea} = context.chart
                    let gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top)
                    gradient.addColorStop(0, 'rgba(79, 209, 197, 0)')
                    gradient.addColorStop(1, 'rgba(79, 209, 197, 0.5)')
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