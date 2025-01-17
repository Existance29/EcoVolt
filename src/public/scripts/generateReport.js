pageRequireSignIn()
pageRequireAdmin()
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
        try {
            company_id = await getCompanyId();
            if (!company_id) {
                throw new Error("Company ID could not be initialized.");
            }
            console.log("Company ID:", company_id);
    
            // Fetch available years after initializing company_id
            await fetchAvailableYears();
        } catch (error) {
            console.error(error);
            statusMessage.innerText = "Failed to load company information.";
        }
    }

    yearSelector.addEventListener('change', fetchReportData);


    async function fetchAvailableYears() {
        if (!company_id) {
            console.error("Company ID is not available.");
            return;
        }
    
        try {
            const response = await fetch(`/reports/${company_id}/years`);
            const years = await response.json();
    
            yearSelector.innerHTML = '';
            years.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearSelector.appendChild(option);
            });
    
            if (years.length > 0) {
                yearSelector.value = years[0];
                // Ensure report data is fetched after years are populated
                await fetchReportData();
            }
        } catch (error) {
            console.error('Error fetching available years:', error);
        }
    }

    async function fetchReportData() {
        const year = yearSelector.value || '2024';
        const url = `/reports/${company_id}/generate?year=${year}`;
        statusMessage.innerText = "Loading report data...";
        showLoading();
        
        try {
            const response = await fetch(url, { method: 'GET', headers: { 'Cache-Control': 'no-cache' } });
            const data = await response.json();
            
            if (!data || !data.reportData || data.reportData.length === 0) {
                console.error("No report data returned from the server.");
                statusMessage.innerText = "No data available for the selected year.";
                return;
            }
    
            reportData = data; // Assign the fetched data to the global variable
            console.log("Updated global reportData:", reportData);
    
            // Update the UI with the data
            reportTitle.innerText = `${data.reportData[0]?.companyName || 'Company'} Sustainability Report ${year}`;
            document.getElementById('executiveSummary').innerText = data.executiveSummary;
            document.getElementById('dataAnalysis').innerText = data.dataAnalysis;
    
            populateChart(data.months, data.monthlyEnergy, data.monthlyCO2);
            populateRecommendations(data.recommendations);
            populatePerformanceSummaryAndMetrics(data.performanceSummary);
            document.getElementById('conclusion').innerText = data.conclusion;
            await fetchPredictionData(data);
    
            // Identify the month with the highest energy consumption
            const highestEnergyIndex = data.monthlyEnergy.indexOf(Math.max(...data.monthlyEnergy));
            const highestCO2Index = data.monthlyCO2.indexOf(Math.max(...data.monthlyCO2));
            const highestMonthIndex = highestEnergyIndex; // Or replace with highestCO2Index if needed
    
            // Identify the month with the highest energy consumption
            const highestEnergyMonth = data.monthlyEnergy.reduce((prev, current) => {
                return current.totalEnergy > prev.totalEnergy ? current : prev;
            }, data.monthlyEnergy[0]); // Start with the first entry
            
            const highestCO2Month = data.monthlyCO2.reduce((prev, current) => {
                return current.totalCO2 > prev.totalCO2 ? current : prev;
            }, data.monthlyCO2[0]); // Start with the first entry
            
            // Use highestEnergyMonth or highestCO2Month as needed
            const highestMonth = highestEnergyMonth.month; // Or replace with `highestCO2Month.month` if needed
            
            console.log(`Month with highest energy consumption: ${highestMonth}`);
            
            // Fetch the energy breakdown for the highest month
            if (highestMonth) {
                const [year, month] = highestMonth.split("-");
                await fetchEnergyBreakdown(year, parseInt(month, 10));
            }
        } catch (error) {
            console.error('Error fetching report data:', error);
            statusMessage.innerText = "Failed to load report data.";
        } finally {
            hideLoading();
        }
    }
    
    async function fetchEnergyBreakdown(year, month) {
        if (!company_id || !year || !month) {
            console.error("Company ID, year, and month are required to fetch energy breakdown.");
            return;
        }
    
        const url = `/reports/${company_id}/energy-breakdown?year=${year}&month=${month}`;
        statusMessage.innerText = "Loading energy breakdown...";
        showLoading();
    
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch energy breakdown: ${response.statusText}`);
            }
    
            const breakdownData = await response.json();
            renderPieChart(breakdownData, year, month);
        } catch (error) {
            console.error("Error fetching energy breakdown:", error);
            statusMessage.innerText = "Failed to load energy breakdown.";
        } finally {
            hideLoading();
        }
    }
    
    function renderPieChart(data, year, month) {
        const labels = ["Radio Equipment", "Cooling", "Backup Power", "Misc"];
        const values = [
            data.radioEquipment || 0,
            data.cooling || 0,
            data.backupPower || 0,
            data.misc || 0,
        ];
        const colors = ["#003366", "#0099CC", "#66CCCC", "#99CCFF"]; // Updated colors
        const dataSum = values.reduce((a, b) => a + b, 0);

       // Convert numeric month to full month name
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const fullMonthName = monthNames[month - 1];

        // Update the title dynamically
        const nameElement = document.getElementById('name');
        nameElement.innerText = `${fullMonthName} ${year}`;

        
        const ctx = document.getElementById('energyPieChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                }],
            },
            options: {
                plugins: {
                    legend: { display: false },
                },
            },
        });
    
        // Render legend with enhanced styling
        const labelElement = document.getElementById('energyLabels');
        const [labelColumn, valueColumn] = labelElement.children;
    
        labelColumn.innerHTML = '';
        valueColumn.innerHTML = '';
    
        for (let i = 0; i < labels.length; i++) {
            const percentage = ((values[i] / dataSum) * 100).toFixed(2);
            labelColumn.innerHTML += `
                <div class="label-name">
                    <div class="label-color" style="background-color: ${colors[i]};"></div>
                    ${labels[i]}
                </div>
            `;
            valueColumn.innerHTML += `
                <div class="label-value">
                    ${values[i].toLocaleString()} kWh (${percentage}%)
                </div>
            `;
        }
    }
    
    
    
    async function fetchPredictionData() {
        const forecastPeriod = 4;
    
        try {
            const allYears = Array.from(yearSelector.options).map(option => parseInt(option.value, 10));
            const recentYears = allYears.slice(0, 4).reverse(); // Take the latest 4 years and reverse them
    
            if (recentYears.length === 0) {
                throw new Error("No years available for prediction.");
            }
    
            let historicalCO2 = [];
    
            // Function to fetch data for missing years
            async function fetchMissingYears(yearsToFetch) {
                const results = [];
                for (const year of yearsToFetch) {
                    try {
                        const response = await fetch(`/reports/${company_id}/generate?year=${year}`);
                        const report = await response.json();
                        if (report.totalCO2) {
                            console.log(`Fetched data for year ${year}:`, report);
                            results.push({ year, totalCO2: report.totalCO2 });
                        } else {
                            console.warn(`No CO2 data available for year ${year}`);
                        }
                    } catch (error) {
                        console.error(`Error fetching data for year ${year}:`, error);
                    }
                }
                return results;
            }
    
            // Retry mechanism to ensure all years' data is fetched
            while (historicalCO2.length < recentYears.length) {
                const missingYears = recentYears.filter(
                    year => !historicalCO2.some(data => data.year === year)
                );    
                if (missingYears.length === 0) break;
    
                const fetchedData = await fetchMissingYears(missingYears);
                historicalCO2 = historicalCO2.concat(fetchedData);
            }
    
            if (historicalCO2.length < 2) {
                throw new Error("Insufficient data for prediction.");
            }
    
            // Sort data by year (in ascending order)
            historicalCO2.sort((a, b) => a.year - b.year);
    
            console.log("Cleaned Historical CO₂ data for prediction:", historicalCO2);
    
            // Extract CO2 values for prediction
            const historicalCO2Values = historicalCO2.map(data => data.totalCO2);
    
            // Fetch forecast data
            const response = await post(`/Dashboard/Forecast/holt-linear/${forecastPeriod}`, {
                data: JSON.stringify(historicalCO2Values),
            });
            const carbonEmissionPredictionData = await response.json();
            console.log("Forecast Data:", carbonEmissionPredictionData);
    
            // Generate labels for the chart
            let allLabels = historicalCO2.map(data => data.year.toString());
            const lastHistoricalYear = parseInt(allLabels[allLabels.length - 1], 10);
    
            for (let i = 1; i <= forecastPeriod; i++) {
                allLabels.push((lastHistoricalYear + i).toString());
            }
    
            renderForecastLineChart(
                document.getElementById('predictionChart'),
                historicalCO2Values,
                carbonEmissionPredictionData,
                allLabels,
                "#4FD1C5",
                "#AE85FF"
            );
    
            statusMessage.innerText = "Prediction data loaded successfully.";
        } catch (error) {
            console.error("Error fetching prediction data:", error);
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

    function populateChart(labels, energyData, emissionsData, title = "Yearly Data Overview", emissionsLabel = "CO2 Emissions (tons)") {
        if (reportChart) {
            reportChart.destroy();
        }
    
        // Extract the total CO2 for each month
        const totalCO2Data = emissionsData.map(item => ({
            month: item.month,
            totalCO2: item.dataCenterCO2 + item.cellTowerCO2
        }));
    
        const co2Data = totalCO2Data.map(item => item.totalCO2); // Total CO2 for the chart

        const totalEnergyData = energyData.map(item => ({
            month: item.month,
            totalEnergy: item.dataCenterEnergy + item.cellTowerEnergy
        }));

        const EnergyData = totalEnergyData.map(item => item.totalEnergy);
    
        const ctx = document.getElementById('dataChart').getContext('2d');
        reportChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Total Energy (kWh)',
                        data: EnergyData,
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                        yAxisID: 'y1',
                    },
                    {
                        label: 'CO2 Emissions (tons)',
                        data: co2Data,
                        backgroundColor: 'rgba(153, 102, 255, 0.6)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 1,
                        yAxisID: 'y2',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Allows the height to be respected
                scales: {
                    y1: {
                        type: 'linear',
                        position: 'left',
                        title: { display: true, text: 'Total Energy (kWh)' },
                        ticks: {
                            callback: function (value) {
                                return value.toLocaleString(); // Format with commas
                            },
                            min: 0,
                            suggestedMax: Math.max(...energyData) * 1.1 // Add padding for visibility
                        }
                    },
                    y2: {
                        type: 'linear',
                        position: 'right',
                        title: { display: true, text: emissionsLabel },
                        grid: { drawOnChartArea: false },
                        ticks: {
                            callback: function (value) {
                                return value.toLocaleString(); // Format with commas
                            },
                            min: 0,
                            suggestedMax: Math.max(...co2Data) * 1.1 // Add padding for visibility
                        }
                    }
                },
                plugins: {
                    datalabels: {
                        display: false,
                        anchor: 'middle',
                        align: 'top',
                        color: '#000000', // Text color for labels
                        font: {
                            size: 12 // Increase font size for better visibility
                        },
                        formatter: (value) => value.toLocaleString() // Format with commas
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const value = context.raw;
                                return `${context.dataset.label}: ${value.toLocaleString()} ${context.dataset.label.includes('Energy') ? 'kWh' : 'tons'}`;
                            }
                        }
                    },
                    legend: {
                        labels: {
                            font: {
                                size: 14,
                                weight: 'bold',
                            },
                        },
                    },
                },
            },
            plugins: [ChartDataLabels]
        });
    }


    function renderForecastLineChart(canvasElement, originalData, forecastData, labels, color1, color2, yTickUnit = "") {
        // Validate canvas element
        if (!canvasElement || !canvasElement.getContext) {
            console.error("Invalid canvas element provided:", canvasElement);
            return;
        }
    
        // Validate data
        if (!originalData.length || !forecastData.length || !labels.length) {
            console.error("Data arrays are empty or invalid:", { originalData, forecastData, labels });
            return;
        }
    
        // Clear existing chart
        if (Chart.getChart(canvasElement.id)) {
            Chart.getChart(canvasElement.id)?.destroy();
        }
    
        // Prepare datasets
        const datasets = [
            {
                label: '',
                data: originalData.concat(forecastData),
                segment: {
                    borderColor: ctx => ctx.p0.parsed.x < originalData.length - 1 ? color1 : color2,
                    borderDash: ctx => ctx.p0.parsed.x < originalData.length - 1 ? undefined : [4, 4],
                    backgroundColor: ctx => {
                        const canvasContext = canvasElement.getContext("2d");
                        const gradient = canvasContext.createLinearGradient(0, 0, 0, canvasElement.height);
                        if (ctx.p0.parsed.x < originalData.length - 1) {
                            gradient.addColorStop(0, color1 + "80");
                            gradient.addColorStop(1, color1 + "00");
                            return gradient;
                        } else {
                            gradient.addColorStop(0, color2 + "80");
                            gradient.addColorStop(1, color2 + "00");
                            return gradient;
                        }
                    },
                },
                pointBorderColor: ctx => ctx.dataIndex < originalData.length ? color1 : color2,
                tension: 0.4,
                fill: true,
            }
        ];
    
        // Create the chart
        new Chart(canvasElement, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets,
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
                            callback: (value) => `${value}${yTickUnit}`,
                        },
                        beginAtZero: true,
                    },
                    x: {
                        grid: {
                            color: "#E2E8F0",
                            borderDash: [8, 4],
                        },
                    },
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                },
            },
        });
    }

    function populateDataTable(reportData = [], emissions = { dataCenterEmissions: [], cellTowerEmissions: [] }) {
        console.log(reportData);
        console.log(emissions);
        dataTableBody.innerHTML = ''; // Clear the table body before populating
    
        if (reportData.length === 0) {
            dataTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center;">No data available for this year</td></tr>`;
            return;
        }
        
        // Map emissions by date for easy lookup
        const emissionMap = {};
        emissions.dataCenterEmissions.forEach((emission) => {
            const dateKey = new Date(emission.date).toISOString().split('T')[0];
            if (!emissionMap[dateKey]) emissionMap[dateKey] = { dataCenterCO2: 0, cellTowerCO2: 0 };
            emissionMap[dateKey].dataCenterCO2 += emission.co2Emissions;
        });
    
        emissions.cellTowerEmissions.forEach((emission) => {
            const dateKey = new Date(emission.date).toISOString().split('T')[0];
            if (!emissionMap[dateKey]) emissionMap[dateKey] = { dataCenterCO2: 0, cellTowerCO2: 0 };
            emissionMap[dateKey].cellTowerCO2 += emission.co2Emissions;
        });
    
        reportData.forEach((row) => {
            const date = new Date(row.date);
            const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
                .toString()
                .padStart(2, '0')}/${date.getFullYear()}`;
    
            const dateKey = date.toISOString().split('T')[0];
            const dataCenterCO2 = emissionMap[dateKey]?.dataCenterCO2 || 0;
            const cellTowerCO2 = emissionMap[dateKey]?.cellTowerCO2 || 0;
    
            // Dynamically assign the 'Name' field based on dataCenterId or cellTowerId
            const name = row.dataCenterId
                ? `Data Center ${row.dataCenterId}`
                : row.cellTowerId
                ? `Cell Tower ${row.cellTowerId}`
                : 'Unknown';
    
            const tableRow = document.createElement('tr');
            tableRow.innerHTML = `
                <td>${name}</td>
                <td>${formattedDate}</td>
                <td>${row.radioEquipmentEnergy ? row.radioEquipmentEnergy.toLocaleString() : 'N/A'} kWh</td>
                <td>${row.coolingEnergy ? row.coolingEnergy.toLocaleString() : 'N/A'} kWh</td>
                <td>${row.backupEnergy ? row.backupEnergy.toLocaleString() : 'N/A'} kWh</td>
                <td>${row.miscEnergy ? row.miscEnergy.toLocaleString() : 'N/A'} kWh</td>
                <td>${(dataCenterCO2 + cellTowerCO2).toFixed(2)} tons</td>
            `;
            dataTableBody.appendChild(tableRow);
        });
    }

    function populatePerformanceSummaryAndMetrics(summary) {
        const performanceSummarySection = document.getElementById('performanceSummary');
        
        // Clear old data to prevent duplication
        performanceSummarySection.innerHTML = '';
        
        if (!summary) {
            performanceSummarySection.innerHTML = '<p>No performance summary available for this year.</p>';
            return;
        }
        
        // Handle "Not Applicable" values or valid percentage changes
        const formatChange = (change) => {
            if (change === "Not Applicable") {
                return "Not Applicable";
            }
            return `${change > 0 ? '+' : ''}${change.toFixed(2)}% from last year`;
        };
    
        // Generate the HTML for Total Energy
        const totalEnergyHtml = `
            <div class="performance-card">
                <i class="fas fa-bolt icon"></i>
                <h3>Total Energy Consumption</h3>
                <p><strong>${summary.totalEnergy.current.toLocaleString()} kWh</strong></p>
                <p class="stat-change ${summary.totalEnergy.percentageChange > 0 ? 'increase' : 'decrease'}">
                    ${formatChange(summary.totalEnergy.percentageChange)}
                </p>
            </div>`;
    
        // Generate the HTML for CO2 Emissions
        const co2EmissionsHtml = `
            <div class="performance-card">
                <i class="fas fa-cloud icon"></i>
                <h3>CO₂ Emissions</h3>
                <p><strong>${summary.co2Emissions.current.toFixed(2)} tons</strong></p>
                <p class="stat-change ${summary.co2Emissions.percentageChange > 0 ? 'increase' : 'decrease'}">
                    ${formatChange(summary.co2Emissions.percentageChange)}
                </p>
            </div>`;
    
        // Generate the HTML for PUE
        const pueHtml = `
            <div class="performance-card">
                <i class="fas fa-cogs icon"></i>
                <h3>PUE</h3>
                <p><strong>${summary.efficiencyMetrics.PUE.current || 'N/A'}</strong></p>
                <p class="stat-change ${summary.efficiencyMetrics.PUE.percentageChange < 0 ? 'decrease' : 'increase'}">
                    ${formatChange(summary.efficiencyMetrics.PUE.percentageChange)}
                </p>
            </div>`;
    
        // Generate the HTML for CUE
        const cueHtml = `
            <div class="performance-card">
                <i class="fas fa-industry icon"></i>
                <h3>CUE</h3>
                <p><strong>${summary.efficiencyMetrics.CUE.current || 'N/A'}</strong></p>
                <p class="stat-change ${summary.efficiencyMetrics.CUE.percentageChange < 0 ? 'decrease' : 'increase'}">
                    ${formatChange(summary.efficiencyMetrics.CUE.percentageChange)}
                </p>
            </div>`;
    
        // Generate the HTML for WUE
        const wueHtml = `
            <div class="performance-card">
                <i class="fas fa-tint icon"></i>
                <h3>WUE</h3>
                <p><strong>${summary.efficiencyMetrics.WUE.current || 'N/A'}</strong></p>
                <p class="stat-change ${summary.efficiencyMetrics.WUE.percentageChange < 0 ? 'decrease' : 'increase'}">
                    ${formatChange(summary.efficiencyMetrics.WUE.percentageChange)}
                </p>
            </div>`;
    
        // Append all cards to the performance summary section
        performanceSummarySection.innerHTML = `
            ${totalEnergyHtml}
            ${co2EmissionsHtml}
            ${pueHtml}
            ${cueHtml}
            ${wueHtml}
        `;
    }

    function populateRecommendations(recommendations) {
        const recommendationsSection = document.querySelector('.recommendations');
        recommendationsSection.innerHTML = '';

        recommendations.forEach((recommendation, index) => {
            const recDiv = document.createElement('div');
            recDiv.classList.add('recommendation');

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
            recommendationsSection.appendChild(recDiv);

            if ((index + 1) % 2 === 0 && index !== recommendations.length - 1) {
                const pageBreak = document.createElement('div');
                pageBreak.classList.add('page-break');
                recommendationsSection.appendChild(pageBreak);
            }
        });
    }
});