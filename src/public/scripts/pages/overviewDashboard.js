document.addEventListener("DOMContentLoaded", async () => {
    await pageRequireSignIn(); // Ensure the user is signed in

    const company_id = sessionStorage.getItem("company_id") || localStorage.getItem("company_id");

    try {
        // Fetch data from the server with company_id in headers
        const response = await fetch("/dashboard-overview", {
            headers: {
                "Authorization": `Bearer ${sessionStorage.accessToken || localStorage.accessToken}`,
                "Company-ID": company_id // Pass the company ID to the server
            }
        });

        if (!response.ok) throw new Error(`Failed to fetch data: ${response.statusText}`);

        const data = await response.json();
        console.log("Dashboard Data:", data);

        // Display data and render charts
        displayHighestEmissions(data);
        displayTotalEmissions(data);
        displaySustainabilityGoals(data.sustainabilityGoals);
        renderTop3YearsChart(data.top3Companies);
        renderYearlyEnergyChart(data.yearlyEnergyConsumption, data.totalCellTowerEmissions);
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
    }
});

// Function to display the highest emissions data center and cell tower
function displayHighestEmissions(data) {
    const highestDataCenter = data.highestDataCenter;
    document.getElementById("highestDataCenterName").textContent = `${highestDataCenter.data_center_name}`;
    document.getElementById("highestDataCenterEmissions").textContent = `Highest CO₂ Emissions: ${highestDataCenter.co2_emissions_tons} Tons`;

    const highestCellTower = data.highestCellTower;
    document.getElementById("highestCellTowerName").textContent = ` ${highestCellTower.cell_tower_name}`;
    document.getElementById("highestCellTowerEmissions").textContent = `Highest Emissions: ${highestCellTower.total_emissions} kWh`;
}

// Function to display total emissions
function displayTotalEmissions(data) {
    document.getElementById("totalDataCenterEmissions").textContent = `${data.totalDataCenterEmissions} Tons`;
    document.getElementById("totalCellTowerEmissions").textContent = `${data.totalCellTowerEmissions} kWh`;
    document.getElementById("overallTotalEmissions").textContent = `${data.overallTotal} Tons/kWh`;
}

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

// Function to render the Top 3 Years Chart
function renderTop3YearsChart(top3Years) {
    if (top3Years && top3Years.length) {
        const years = [];
        const emissionsData = [];

        // Populate years and emissionsData arrays
        for (let i = 0; i < top3Years.length; i++) {
            years.push(top3Years[i].year); // Assuming the data has a 'year' field
            emissionsData.push(top3Years[i].total_emissions);
        }

        const ctx = document.getElementById("top3EmissionsChart").getContext("2d");
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: years, // Label the x-axis with years
                datasets: [{
                    label: 'Total CO₂ Emissions (tons)',
                    data: emissionsData,
                    backgroundColor: ['rgba(255, 99, 132, 0.5)', 'rgba(75, 192, 192, 0.5)', 'rgba(255, 159, 64, 0.5)'],
                    borderColor: ['rgba(255, 99, 132, 1)', 'rgba(75, 192, 192, 1)', 'rgba(255, 159, 64, 1)'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, ticks: { font: { size: 12 } } },
                    x: { ticks: { font: { size: 12 }, maxRotation: 0, minRotation: 0 } }
                },
                plugins: {
                    legend: { labels: { font: { size: 12 } } }
                }
            }
        });
    } else {
        console.warn("No data available for top 3 years of emissions.");
    }
}

// Function to render the Yearly Energy Consumption Doughnut Chart
function renderYearlyEnergyChart(yearlyEnergyConsumption, totalCellTowerEmissions) {
    if (yearlyEnergyConsumption && yearlyEnergyConsumption.length > 0 && totalCellTowerEmissions) {
        // Find the year with the highest energy consumption
        const highestYearData = yearlyEnergyConsumption.reduce((max, item) => 
            item.total_emissions > max.total_emissions ? item : max, yearlyEnergyConsumption[0]);

        const ctx = document.getElementById("yearlyEnergyChart").getContext("2d");

        // Destroy the previous chart instance if it exists to prevent overlap
        if (window.yearlyEnergyChartInstance) {
            window.yearlyEnergyChartInstance.destroy();
        }

        // Create a new chart instance
        window.yearlyEnergyChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [`${highestYearData.year} Energy Consumption`, 'Total Cell Tower Emissions'],
                datasets: [{
                    label: 'Energy & Emissions Comparison',
                    data: [highestYearData.total_emissions, totalCellTowerEmissions],
                    backgroundColor: ['rgba(54, 162, 235, 0.6)', 'rgba(255, 99, 132, 0.6)'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { top: 20, bottom: 20 } },
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: { font: { size: 10 }, padding: 20 }
                    }
                }
            },
            plugins: [{
                afterDraw: function(chart) {
                    const { width, height, ctx } = chart;
                    ctx.restore();
                    const fontSize = (height / 300).toFixed(2);
                    ctx.font = `${fontSize}em sans-serif`;
                    ctx.textBaseline = "middle";
                    ctx.textAlign = "center";
                    const totalEnergyText = highestYearData.total_emissions 
                        ? `${highestYearData.total_emissions.toLocaleString()} kWh` 
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
}
