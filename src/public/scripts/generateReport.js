document.addEventListener('DOMContentLoaded', function () {
    const dataTableBody = document.querySelector('.data-table tbody');
    const generateReportBtn = document.getElementById('generateReportBtn');
    const statusMessage = document.getElementById('statusMessage');
    let reportChart = null;

    fetchReportData();

    // Function to fetch report data
    function fetchReportData(force = false) {
        const url = force ? '/reports/generate' : '/reports';
        statusMessage.innerText = "Loading report data...";

        fetch(url, {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('executiveSummary').innerText = data.executiveSummary;
            document.getElementById('dataAnalysis').innerText = data.dataAnalysis;
            populateChart(data.months, data.monthlyEnergy, data.monthlyCO2);
            populateDataTable(data.reportData);
            populateRecommendations(data.recommendations);
            document.getElementById('conclusion').innerText = data.conclusion;
            statusMessage.innerText = "Report data loaded successfully.";
        })
        .catch(error => {
            console.error('Error fetching report data:', error);
            statusMessage.innerText = "Failed to load report data.";
        });
    }

    // Event listener to trigger PDF generation
    generateReportBtn.addEventListener('click', function () {
        statusMessage.innerText = "Generating PDF report...";

        const chartCanvas = document.getElementById('dataChart');
        const chartContainer = document.getElementById('chart-container');
        const chartImage = new Image();
        chartImage.src = chartCanvas.toDataURL('image/png');
        chartImage.style.width = chartCanvas.style.width;
        chartImage.style.height = chartCanvas.style.height;
        chartContainer.replaceChild(chartImage, chartCanvas);

        const element = document.getElementById('reportContent');
        const opt = {
            margin: 0,
            filename: 'Singtel_Report.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().from(element).set(opt).save().then(() => {
            chartContainer.replaceChild(chartCanvas, chartImage);
            statusMessage.innerText = "PDF report generated successfully.";
        }).catch(error => {
            console.error('Error generating PDF:', error);
            statusMessage.innerText = "Failed to generate PDF report.";
        });
    });

    // Function to populate chart with fetched data
    function populateChart(labels, energyData, emissionsData) {
        if (reportChart) {
            reportChart.destroy();
        }
        const ctx = document.getElementById('dataChart').getContext('2d');
        reportChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Total Energy (kWh)',
                        data: energyData,
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                        yAxisID: 'y1'
                    },
                    {
                        label: 'CO2 Emissions (tons)',
                        data: emissionsData,
                        backgroundColor: 'rgba(153, 102, 255, 0.6)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 1,
                        yAxisID: 'y2'
                    }
                ]
            },
            options: {
                scales: {
                    y1: {
                        type: 'linear',
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Total Energy (kWh)'
                        }
                    },
                    y2: {
                        type: 'linear',
                        position: 'right',
                        title: {
                            display: true,
                            text: 'CO2 Emissions (tons)'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                },
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    // Function to populate the data table
    function populateDataTable(reportData) {
        dataTableBody.innerHTML = '';
        reportData.forEach(row => {
            const date = new Date(row.date);
            const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${
                (date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    
            const tableRow = document.createElement('tr');
            tableRow.innerHTML = `
                <td>${formattedDate}</td>
                <td>${row.radioEquipmentEnergy || 'N/A'}</td>
                <td>${row.coolingEnergy || 'N/A'}</td>
                <td>${row.backupEnergy || 'N/A'}</td>
                <td>${row.miscEnergy || 'N/A'}</td>
                <td>${row.co2EmissionsTons || 'N/A'}</td>
            `;
            dataTableBody.appendChild(tableRow);
        });
    }

    // Function to populate recommendations
    function populateRecommendations(recommendations) {
        const recommendationsSection = document.querySelector('.recommendations');
        recommendationsSection.innerHTML = ''; // Clear existing content
    
        recommendations.forEach((recommendation, index) => {
            if (index % 2 === 0) {
                // Create a container for every two recommendations
                const pageContainer = document.createElement('div');
                pageContainer.classList.add('page-break-container');
                recommendationsSection.appendChild(pageContainer);
            }
    
            const recDiv = document.createElement('div');
            recDiv.classList.add('recommendation');
    
            // Format recommendation with structured data
            recDiv.innerHTML = `
                <h3>Recommendation ${index + 1}:</h3>
                <p><strong>Recommendation:</strong> ${recommendation.recommendation}</p>
                <ol>
                    ${recommendation.actions.map(action => `
                        <li>
                            <strong>Action:</strong> ${action.description}<br>
                            <strong>Explanation:</strong> ${action.explanation}
                        </li>
                    `).join('')}
                </ol>
                <p class="intended-impact"><strong>Intended Impact:</strong> ${recommendation.intendedImpact}</p>
            `;
    
            // Append recommendation to the current page container
            const currentContainer = recommendationsSection.lastChild;
            currentContainer.appendChild(recDiv);
        });
    }
});