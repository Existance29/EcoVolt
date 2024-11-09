document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Fetch data from the server
        const response = await fetch("/dashboard-overview");
        if (!response.ok) throw new Error(`Failed to fetch data: ${response.statusText}`);

        const data = await response.json();
        console.log("Dashboard Data:", data); // Log the data structure for reference

        console.log("Data for Top 3 Companies:", data.top3Companies);
        console.log("Data for Yearly Energy Consumption:", data.yearlyEnergyConsumption);

        // Display Highest Emission Data Center
        const highestDataCenter = data.highestDataCenter;
        document.getElementById("highestDataCenterName").textContent = `${highestDataCenter.data_center_name}`;
        document.getElementById("highestDataCenterEmissions").textContent = `Highest CO₂ Emissions: ${highestDataCenter.co2_emissions_tons} Tons`;

        // Display Highest Emission Cell Tower
        const highestCellTower = data.highestCellTower;
        document.getElementById("highestCellTowerName").textContent = `Company ID ${highestCellTower.company_id}`;
        document.getElementById("highestCellTowerEmissions").textContent = `Highest Emissions: ${highestCellTower.total_emissions} kWh`;

        // Display Total Emissions
        document.getElementById("totalDataCenterEmissions").textContent = `${data.totalDataCenterEmissions} Tons`;
        document.getElementById("totalCellTowerEmissions").textContent = `${data.totalCellTowerEmissions} kWh`;
        document.getElementById("overallTotalEmissions").textContent = `${data.overallTotal} Tons/kWh`;

        displaySustainabilityGoals(data.sustainabilityGoals);

// Function to display the Sustainability Goals Slideshow
function displaySustainabilityGoals(goals) {
    const sustainabilityGoalsContainer = document.getElementById("sustainabilityGoalsContainer");
    const toggleGoalsButton = document.getElementById("toggleGoalsButton");
    const goalsContainer = document.getElementById("goalsWrapper");

    let isGoalsVisible = false;
    function toggleGoals() {
        isGoalsVisible = !isGoalsVisible;
        sustainabilityGoalsContainer.style.display = isGoalsVisible ? "block" : "none";
        toggleGoalsButton.textContent = isGoalsVisible ? "View Less" : "View More";
    }
    window.toggleGoals = toggleGoals;

    // Render goals in a paginated way
    let currentPage = 0;
    const goalsPerPage = 2;

    function renderGoals() {
        goalsContainer.innerHTML = "";
        const currentGoals = goals.slice(currentPage * goalsPerPage, (currentPage + 1) * goalsPerPage);

        currentGoals.forEach(goal => {
            const progressPercentage = Math.min((goal.current_value / goal.target_value) * 100, 100);
            const color = progressPercentage < 30 ? '#e74c3c' : (progressPercentage < 50 ? '#f1c40f' : '#4FD1C5');

            const goalCard = document.createElement("div");
            goalCard.classList.add("goal-card");
            goalCard.innerHTML = `
                <h4>${goal.goal_name}</h4>
                <p>Target Value: ${goal.target_value}</p>
                <p>Current Value: ${goal.current_value}</p>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${progressPercentage}%; background-color: ${color};"></div>
                </div>
                <p>${progressPercentage.toFixed(1)}% Complete</p>
            `;
            goalsContainer.appendChild(goalCard);
        });

        document.getElementById("paginationIndicator").textContent = `${currentPage + 1} / ${Math.ceil(goals.length / goalsPerPage)}`;
    }

    window.nextSlide = function () {
        if ((currentPage + 1) * goalsPerPage < goals.length) {
            currentPage++;
            renderGoals();
        }
    };

    window.prevSlide = function () {
        if (currentPage > 0) {
            currentPage--;
            renderGoals();
        }
    };

    renderGoals();
}

        // Display Top 3 Companies Chart
        const top3Companies = data.top3Companies;
        if (top3Companies && top3Companies.length) {
            const companyNames = top3Companies.map(company => company.company_name);
            const emissionsData = top3Companies.map(company => company.total_emissions);

            const ctx = document.getElementById("top3EmissionsChart").getContext("2d");
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: companyNames,
                    datasets: [{
                        label: 'Total CO₂ Emissions (tons)',
                        data: emissionsData,
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.5)',  // Red
                            'rgba(75, 192, 192, 0.5)',  // Green
                            'rgba(255, 159, 64, 0.5)'   // Orange
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',    // Red
                            'rgba(75, 192, 192, 1)',    // Green
                            'rgba(255, 159, 64, 1)'     // Orange
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                font: { size: 12 }
                            }
                        },
                        x: {
                            ticks: {
                                font: { size: 12 },
                                maxRotation: 0,
                                minRotation: 0
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: {
                                font: { size: 12 }
                            }
                        }
                    }
                }
            });
        } else {
            console.warn("No data available for top 3 data centers.");
        }

        // Display Yearly Energy Consumption in Doughnut Chart
        const yearlyEnergyConsumption = data.yearlyEnergyConsumption;
        const totalCellTowerEmissions = data.totalCellTowerEmissions;

        // Identify the year with the highest energy consumption
        if (yearlyEnergyConsumption && yearlyEnergyConsumption.length > 0 && totalCellTowerEmissions) {
            const highestYearData = yearlyEnergyConsumption.reduce((max, item) => 
                item.total_energy_kwh > max.total_energy_kwh ? item : max, yearlyEnergyConsumption[0]);

            const ctx = document.getElementById("yearlyEnergyChart").getContext("2d");

            // Create a doughnut chart comparing the highest yearly energy consumption with total cell tower emissions
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: [`${highestYearData.year} Energy Consumption`, 'Total Cell Tower Emissions'],
                    datasets: [{
                        label: 'Energy & Emissions Comparison',
                        data: [highestYearData.total_energy_kwh, totalCellTowerEmissions],
                        backgroundColor: [
                            'rgba(54, 162, 235, 0.6)',  // Blue for yearly energy consumption
                            'rgba(255, 99, 132, 0.6)'   // Red for total cell tower emissions
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            top: 20,
                            bottom: 20
                        }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'bottom',
                            labels: {
                                font: { size: 10 },
                                padding: 20 // Moves the legend further down
                            }
                        }
                    }
                },
                plugins: [{
                    // Plugin to display the highest year's total energy consumption in the center of the chart
                    afterDraw: function(chart) {
                        const { width, height, ctx } = chart;
                        ctx.restore();
                        
                        // Adjust the divisor to control the font size (e.g., 160 makes it smaller)
                        const fontSize = (height / 160).toFixed(2);
                        
                        ctx.font = `${fontSize}em sans-serif`;
                        ctx.textBaseline = "middle";
                        ctx.textAlign = "center";
                    
                        // Check if `total_energy_kwh` exists and is a number
                        const totalEnergyText = highestYearData.total_energy_kwh 
                            ? `Total: ${highestYearData.total_energy_kwh.toLocaleString()} kWh` 
                            : 'No Data';
                    
                        const textX = width / 2;
                        const textY = height / 2;
                    
                        ctx.fillText(totalEnergyText, textX, textY);
                        ctx.save();
                    }
                    
                }]
            });
        } else {
            console.warn("No data available for energy and emissions comparison.");
        }

    } catch (error) {
        console.error("Error fetching dashboard data:", error);
    }
});
