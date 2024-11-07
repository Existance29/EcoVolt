// document.addEventListener('DOMContentLoaded', function () {
//     const reportFrame = document.getElementById('reportFrame');
//     const downloadReportBtn = document.getElementById('downloadReportBtn');

//     // Load the PDF into the iframe for viewing
//     fetch('/reports/pdf', {
//         method: 'GET'
//     })
//     .then(response => {
//         if (response.ok) {
//             return response.blob(); // Convert to Blob for iframe
//         } else {
//             throw new Error('Failed to load report');
//         }
//     })
//     .then(blob => {
//         const url = window.URL.createObjectURL(blob);
//         reportFrame.src = url; // Set iframe source to the Blob URL
//     })
//     .catch(error => {
//         console.error('Error loading report:', error);
//     });

//     // Download the report PDF on button click
//     downloadReportBtn.addEventListener('click', function () {
//         fetch('/reports/pdf', {
//             method: 'GET'
//         })
//         .then(response => {
//             if (response.ok) {
//                 return response.blob(); // Convert the response to a Blob
//             } else {
//                 throw new Error('Failed to generate report');
//             }
//         })
//         .then(blob => {
//             const url = window.URL.createObjectURL(blob);
//             const link = document.createElement('a');
//             link.href = url;
//             link.setAttribute('download', 'Singtel_Report.pdf'); // Set the filename
//             document.body.appendChild(link);
//             link.click();
//             document.body.removeChild(link);
//         })
//         .catch(error => {
//             console.error('Error generating report:', error);
//         });
//     });
// });



document.addEventListener('DOMContentLoaded', function () {
    const dataTableBody = document.querySelector('.data-table tbody');
    const generateReportBtn = document.getElementById('generateReportBtn');
    const statusMessage = document.getElementById('statusMessage');
    let reportChart = null;

    // Fetch report data on page load
    fetchReportData();

    function fetchReportData(force = false) {
        const url = force ? '/reports/generate' : '/reports';
        statusMessage.innerText = "Loading report data...";

        fetch(url)
            .then(response => response.json())
            .then(data => {
                document.getElementById('executiveSummary').innerText = `In 2024, Singtel's total energy consumption reached ${data.totalEnergy.toLocaleString()} kWh, with carbon emissions totaling ${data.totalCO2.toFixed(2)} tons.`;
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

    generateReportBtn.addEventListener('click', function () {
        statusMessage.innerText = "Generating PDF report...";

        // Temporarily replace chart canvas with an image to prevent layout change
        const chartCanvas = document.getElementById('dataChart');
        const chartContainer = document.getElementById('chart-container');
        const chartImage = new Image();
        chartImage.src = chartCanvas.toDataURL('image/png');
        chartImage.style.width = chartCanvas.style.width;
        chartImage.style.height = chartCanvas.style.height;
        chartContainer.replaceChild(chartImage, chartCanvas);

        // Generate the PDF using html2pdf
        const element = document.getElementById('reportContent');
        const opt = {
            margin: 0,
            filename: 'Singtel_Report.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().from(element).set(opt).save().then(() => {
            // Restore original chart canvas after PDF is generated
            chartContainer.replaceChild(chartCanvas, chartImage);
            statusMessage.innerText = "PDF report generated successfully.";
        }).catch(error => {
            console.error('Error generating PDF:', error);
            statusMessage.innerText = "Failed to generate PDF report.";
        });
    });

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

    function populateDataTable(reportData) {
        dataTableBody.innerHTML = '';
        reportData.forEach(row => {
            const tableRow = document.createElement('tr');
            const formattedDate = new Date(row.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
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

    function populateRecommendations(recommendations) {
        const recommendationsSection = document.querySelector('.recommendations');
        recommendationsSection.innerHTML = '';
        recommendations.split('\n\n').forEach((recommendation, index) => {
            const recDiv = document.createElement('div');
            recDiv.classList.add('recommendation');
            recDiv.innerHTML = `
                <h3>Recommendation ${index + 1}:</h3>
                <p>${recommendation}</p>
            `;
            recommendationsSection.appendChild(recDiv);
        });
    }
});