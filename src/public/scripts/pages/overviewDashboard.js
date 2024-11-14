async function initializeDashboard() {
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
        console.log("Highest Emissions Data:", data.highestDataCenter, data.highestCellTower);
console.log("Total Emissions Data:", data.totalDataCenterEmissions, data.totalCellTowerEmissions);
console.log("Top 3 Avoided Emissions Data:", data.avoidedemission);  // <-- Focus on this

        

        // Display data and render charts
        displayHighestEmissions(data);
        displayTotalEmissions(data);
        displayOverallProgress(data.sustainabilityGoals);
        displaySustainabilityGoals(data.sustainabilityGoals);
        renderTop3YearsChart(data.top3Companies);
        renderTop3CellTowersByAvoidedEmissionsChart(data.avoidedCemission);

        // Add event listener for redirection on specific elements
        addRedirectionListeners(data);
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
    }
}

// Function to display the highest emissions data center and cell tower
function displayHighestEmissions(data) {
    const highestDataCenter = data.highestDataCenter;
    const highestCellTower = data.highestCellTower;
    const highestDataCenterElement = document.getElementById("highestDataCenter");
    const highestCellTowerElement = document.getElementById("highestCellTower");

    if (highestDataCenter && highestDataCenterElement) {
        highestDataCenterElement.setAttribute("data-center-id", highestDataCenter.id);
        document.getElementById("highestDataCenterName").textContent = highestDataCenter.data_center_name;
        document.getElementById("highestDataCenterEmissions").textContent = `CO₂ Emissions: ${highestDataCenter.co2_emissions_tons} Tons`;

        highestDataCenterElement.addEventListener("click", () => {
            const dataCenterId = highestDataCenter.id;
            window.location.href = `dataCenterDashboard.html?data_center_id=${dataCenterId}`;
        });
    }

    if (highestCellTower && highestCellTowerElement) {
        highestCellTowerElement.setAttribute("data-tower-id", highestCellTower.id);
        document.getElementById("highestCellTowerName").textContent = highestCellTower.cell_tower_name;
        document.getElementById("highestCellTowerEmissions").textContent = `CO₂ Emissions: ${highestCellTower.total_emissions} Tons`;

        highestCellTowerElement.addEventListener("click", () => {
            const cellTowerId = highestCellTower.id;
            window.location.href = `cellTowerDashboard.html?cell_tower_id=${cellTowerId}`;
        });
    }
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
            let progressPercentage = 0;
            let displayText = "";
        
            if (goal.goal_name === 'Renewable Energy Usage') { 
                // Case 2: Higher current value means progress is better
                if (goal.current_value >= goal.target_value) {
                    progressPercentage = 100;
                    displayText = "Target achieved!";
                } else {
                    const progressTowardTarget = (goal.current_value / goal.target_value) * 100;
                    progressPercentage = Math.min(progressTowardTarget, 100);
                    displayText = `${(100 - progressTowardTarget).toFixed(1)}% to reach target`;
                }
            } else { 
                // Case 1: Lower current value means progress is better
                if (goal.current_value <= goal.target_value) {
                    progressPercentage = 100;
                    displayText = "Target achieved!";
                } else {
                    const reductionRequired = goal.current_value - goal.target_value;
                    const progressTowardTarget = (reductionRequired / goal.current_value) * 100;
                    progressPercentage = Math.max(100 - progressTowardTarget, 0);
                    displayText = `${progressTowardTarget.toFixed(1)}% to reach target`;
                }
            }
        
            const color = progressPercentage < 30 ? '#e74c3c' : (progressPercentage < 50 ? '#f1c40f' : '#4FD1C5');
        
            const goalCard = document.createElement("div");
            goalCard.classList.add("goal-card");
            goalCard.innerHTML = `
                <h4>${goal.goal_name}</h4>
                <p>Target Value: ${goal.target_value}</p>
                <p>Current Value: ${goal.current_value}</p>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${Math.max(progressPercentage, 5)}%; background-color: ${color} !important; min-width: 5px;"></div>
                </div>
                <p>${displayText}</p>
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

// Function to display overall progress towards net zero by 2050
function displayOverallProgress(goals) {
    const overallProgressBar = document.getElementById("overallProgressBar");
    const overallProgressText = document.getElementById("overallProgressText");

    let totalProgress = 0;
    goals.forEach(goal => {
        if (goal.current_value > goal.target_value) {
            const reductionRequired = goal.current_value - goal.target_value;
            const progressTowardTarget = ((goal.current_value - goal.target_value) / goal.current_value) * 100;
            totalProgress += Math.min(progressTowardTarget, 100);
        } else {
            totalProgress += 100;
        }
    });

    const averageProgress = totalProgress / goals.length;
    overallProgressText.textContent = `${averageProgress.toFixed(1)}% progress towards Net Zero by 2050`;
    overallProgressBar.style.width = `${averageProgress}%`;
    overallProgressBar.style.backgroundColor = averageProgress < 30 ? '#e74c3c' : (averageProgress < 50 ? '#f1c40f' : '#4FD1C5');
}

// Function to render the Top 3 Years Chart
function renderTop3YearsChart(top3Years) {
    if (top3Years && top3Years.length) {
        const years = [];
        const emissionsData = [];

        for (let i = 0; i < top3Years.length; i++) {
            years.push(top3Years[i].year);
            emissionsData.push(top3Years[i].total_emissions);
        }

        const ctx = document.getElementById("top3EmissionsChart").getContext("2d");
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: years,
                datasets: [
                    {
                        label: 'Total CO₂ Emissions (tons)',
                        data: emissionsData,
                        backgroundColor: ['rgba(255, 99, 132, 0.5)', 'rgba(75, 192, 192, 0.5)', 'rgba(255, 159, 64, 0.5)'],
                        borderColor: ['rgba(255, 99, 132, 1)', 'rgba(75, 192, 192, 1)', 'rgba(255, 159, 64, 1)'],
                        borderWidth: 1
                    },
                    {
                        label: 'Emission Trend',
                        data: emissionsData,
                        type: 'line',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 3
                    }
                ]
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
                },
                onClick: (e, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const selectedYear = years[index];
                        window.location.href = `dataCenterDashboard.html?year=${selectedYear}`;
                    }
                }
            }
        });
    } else {
        console.warn("No data available for top 3 years of emissions.");
    }
}

function renderTop3CellTowersByAvoidedEmissionsChart(data) {
    if (data && data.length > 0) {
        const labels = data.map(item => item.cell_tower_name); // Cell tower names
        const avoidedEmissions = data.map(item => item.avoided_emissions);

        const ctx = document.getElementById("avoidedEmissionsChart").getContext("2d");

        // Destroy previous chart instance if it exists
        if (window.avoidedEmissionsChartInstance) {
            window.avoidedEmissionsChartInstance.destroy();
        }

        // Create a new line chart with smooth curves and filled area
        window.avoidedEmissionsChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Avoided CO₂ Emissions (kg)',
                    data: avoidedEmissions,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)', // Light fill color
                    fill: true, // Fill the area under the line
                    tension: 0.4, // Smoothness of the line (curve effect)
                    pointRadius: 4, // Size of the data points
                    pointBackgroundColor: 'rgba(75, 192, 192, 1)', // Point color
                    borderWidth: 2 // Thickness of the line
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Avoided CO₂ Emissions (kg)',
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Cell Towers',
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            font: { size: 12 },
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Avoided Emissions: ${context.raw.toFixed(2)} kg`;
                            }
                        }
                    }
                }
            }
        });
    } else {
        console.warn("No data available for top 3 cell towers by avoided emissions.");
    }
}




// Function to add redirection event listeners
function addRedirectionListeners(data) {
    const totalDataCenterElement = document.getElementById("totalDataCenter");
    if (totalDataCenterElement) {
        totalDataCenterElement.addEventListener("click", () => {
            window.location.href = "dataCenterDashboard.html";
        });
    }

    const totalCellTowerElement = document.getElementById("totalCellTower"); 
    if (totalCellTowerElement) { 
        totalCellTowerElement.addEventListener("click", () => { 
            window.location.href = "cellTowerDashboard.html";
        }); 
    } 

    const yearlyEnergyContainer = document.querySelector(".yearly-energy-container"); 
    if (yearlyEnergyContainer && data.yearlyEnergyConsumption.length > 0) { 
        const highestYear = data.yearlyEnergyConsumption[0].year;
        yearlyEnergyContainer.addEventListener("click", () => { 
            window.location.href = `cellTowerDashboard.html?year=${highestYear}`;
        });
    }
}

// Initialize the dashboard when the page loads
document.addEventListener("DOMContentLoaded", initializeDashboard);



 // view more for the chart dc 



// For Data Center Modal
// const modalDc = document.getElementById("additionalContentModal");
// const viewMoreBtnDc = document.getElementById("viewMoreBtnDc");
// const closeModalBtnDc = document.getElementById("closeModalBtn");
// const geminiSuggestionDc = document.getElementById("geminiSuggestionDc"); // Element to display suggestions

// viewMoreBtnDc.addEventListener("click", async function() {
//     try {
//         const response = await fetch("/dashboard-overview", {
//             headers: {
//                 "Authorization": `Bearer ${sessionStorage.accessToken || localStorage.accessToken}`,
//                 "Company-ID": sessionStorage.getItem("company_id") || localStorage.getItem("company_id")
//             }
//         });

//         if (response.ok) {
//             const data = await response.json();
//             geminiSuggestionDc.textContent = data.suggestions || "No suggestions available for data centers.";
//         } else {
//             geminiSuggestionDc.textContent = "Failed to load suggestions for data centers.";
//         }

//         modalDc.style.display = "flex"; // Show modal
//     } catch (error) {
//         geminiSuggestionDc.textContent = "Error fetching suggestions.";
//         console.error("Error fetching suggestions:", error);
//     }
// });

// closeModalBtnDc.addEventListener("click", function() {
//     modalDc.style.display = "none";
// });

// window.addEventListener("click", function(event) {
//     if (event.target === modalDc) {
//         modalDc.style.display = "none";
//     }
// });

// // For Cell Tower Modal
// const modalCt = document.getElementById("popupOverlay");
// const viewMoreBtnCt = document.getElementById("viewMoreBtnCt");
// const closeModalBtnCt = document.getElementById("closePopupBtn");
// const geminiSuggestionCt = document.getElementById("geminiSuggestionCt"); // Element to display suggestions

// viewMoreBtnCt.addEventListener("click", async function() {
//     try {
//         const response = await fetch("/dashboard-overview", {
//             headers: {
//                 "Authorization": `Bearer ${sessionStorage.accessToken || localStorage.accessToken}`,
//                 "Company-ID": sessionStorage.getItem("company_id") || localStorage.getItem("company_id")
//             }
//         });

//         if (response.ok) {
//             const data = await response.json();
//             geminiSuggestionCt.textContent = data.suggestions || "No suggestions available for cell towers.";
//         } else {
//             geminiSuggestionCt.textContent = "Failed to load suggestions for cell towers.";
//         }

//         modalCt.style.display = "flex"; // Show modal
//     } catch (error) {
//         geminiSuggestionCt.textContent = "Error fetching suggestions.";
//         console.error("Error fetching suggestions:", error);
//     }
// });

// closeModalBtnCt.addEventListener("click", function() {
//     modalCt.style.display = "none";
// });

// window.addEventListener("click", function(event) {
//     if (event.target === modalCt) {
//         modalCt.style.display = "none";
//     }
// });
