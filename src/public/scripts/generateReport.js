document.addEventListener('DOMContentLoaded', async function () {
    const dataTableBody = document.querySelector('.data-table tbody');
    const generateReportBtn = document.getElementById('generateReportBtn');
    const statusMessage = document.getElementById('statusMessage');
    const yearSelector = document.getElementById('yearSelector');
    const reportTitle = document.getElementById('reportTitle');
    let reportChart = null;
    let predictionChart = null;
    let company_id = null;
    let reportData = null;

    const loadingScreen = document.getElementById('loading-screen');

    function showLoading() {
        loadingScreen.style.display = 'block';
        document.getElementById('reportContentWrapper').classList.add('hidden');
    }

    function hideLoading() {
        loadingScreen.style.display = 'none';
        document.getElementById('reportContentWrapper').classList.remove('hidden');
    }

    async function initializeCompanyId() {
        company_id = await getCompanyId();
        if (company_id) {
            console.log("Company ID:", company_id);
            fetchReportData();
            fetchPredictionData();
        } else {
            console.error("Company ID could not be initialized.");
            statusMessage.innerText = "Failed to load company information.";
        }
    }

    yearSelector.addEventListener('change', fetchReportData);

    async function fetchReportData() {
        if (!company_id) {
            console.error("Company ID is not available.");
            return;
        }

        const year = yearSelector.value || '2024';
        const url = `/reports/${company_id}/generate?year=${year}`;
        statusMessage.innerText = "Loading report data...";
        showLoading();

        try {
            const response = await fetch(url, { method: 'GET', headers: { 'Cache-Control': 'no-cache' } });
            const data = await response.json();
            reportData = data;

            reportTitle.innerText = `${data.reportData[0]?.companyName || 'Company'} Sustainability Report ${year}`;
            document.getElementById('executiveSummary').innerText = data.executiveSummary;
            document.getElementById('dataAnalysis').innerText = data.dataAnalysis;

            populateChart(data.months, data.monthlyEnergy, data.monthlyCO2);
            populateDataTable(data.reportData);
            populateRecommendations(data.recommendations);
            document.getElementById('conclusion').innerText = data.conclusion;

            statusMessage.innerText = "Report data loaded successfully.";
        } catch (error) {
            console.error('Error fetching report data:', error);
            statusMessage.innerText = "Failed to load report data.";
        } finally {
            hideLoading();
        }
    }

    async function fetchPredictionData() {
        if (!company_id) {
            console.error("Company ID is not available.");
            return;
        }

        const url = `/reports/${company_id}/predictNetZero`;
        statusMessage.innerText = "Loading prediction data...";
        showLoading();

        try {
            const response = await fetch(url, { method: 'GET', headers: { 'Cache-Control': 'no-cache' } });
            const data = await response.json();

            populatePredictionChart(data);
            statusMessage.innerText = "Prediction data loaded successfully.";
        } catch (error) {
            console.error('Error fetching prediction data:', error);
            statusMessage.innerText = "Failed to load prediction data.";
        } finally {
            hideLoading();
        }
    }

    await initializeCompanyId();

    generateReportBtn.addEventListener('click', function () {
        if (!reportData) {
            statusMessage.innerText = "No data available for generating PDF.";
            return;
        }

        statusMessage.innerText = "Generating PDF report...";
        showLoading();

        const element = document.getElementById('reportContent');
        const opt = {
            margin: 0,
            filename: `${reportData.reportData[0]?.companyName || 'Company'}_Report_${yearSelector.value || '2024'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
            pagebreak: { before: '.page-break' }
        };

        html2pdf().from(element).set(opt).save().then(() => {
            statusMessage.innerText = "PDF report generated successfully.";
        }).catch(error => {
            console.error('Error generating PDF:', error);
            statusMessage.innerText = "Failed to generate PDF report.";
        }).finally(() => {
            hideLoading();
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
                        title: { display: true, text: 'Total Energy (kWh)' }
                    },
                    y2: {
                        type: 'linear',
                        position: 'right',
                        title: { display: true, text: 'CO2 Emissions (tons)' },
                        grid: { drawOnChartArea: false }
                    }
                },
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    function populatePredictionChart(data) {
        const ctx = document.getElementById('predictionChart').getContext('2d');
        const chartLabels = [...data.actualYears, ...data.predictedYears];
        const chartActualEnergy = data.actualEnergy;
        const chartActualCO2 = data.actualCO2;
        const chartPredictedEnergy = Array(data.actualYears.length).fill(null).concat(data.predictedEnergy);
        const chartPredictedCO2 = Array(data.actualYears.length).fill(null).concat(data.predictedCO2);

        if (predictionChart) {
            predictionChart.destroy();
        }

        predictionChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartLabels,
                datasets: [
                    {
                        label: 'Actual Energy (kWh)',
                        data: chartActualEnergy,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        fill: false,
                        borderWidth: 2,
                    },
                    {
                        label: 'Predicted Energy (kWh)',
                        data: chartPredictedEnergy,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderDash: [5, 5],
                        fill: false,
                        borderWidth: 2,
                    },
                    {
                        label: 'Actual CO2 (tons)',
                        data: chartActualCO2,
                        borderColor: 'rgba(153, 102, 255, 1)',
                        fill: false,
                        borderWidth: 2,
                    },
                    {
                        label: 'Predicted CO2 (tons)',
                        data: chartPredictedCO2,
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderDash: [5, 5],
                        fill: false,
                        borderWidth: 2,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Actual and Predicted Energy/CO2 Emissions' },
                },
                scales: {
                    x: { title: { display: true, text: 'Years' } },
                    y: { beginAtZero: true, title: { display: true, text: 'Values (kWh / tons)' } }
                }
            }
        });
    }

    function populateDataTable(reportData = []) {
        dataTableBody.innerHTML = '';
        reportData.forEach((row, index) => {
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

    function populateRecommendations(recommendations) {
        const recommendationsSection = document.querySelector('.recommendations');
        recommendationsSection.innerHTML = '';
        recommendations.forEach((recommendation, index) => {
            const recDiv = document.createElement('div');
            recDiv.innerHTML = `
                <h3>Recommendation ${index + 1}:</h3>
                <p>${recommendation.recommendation}</p>
            `;
            recommendationsSection.appendChild(recDiv);
        });
    }
});