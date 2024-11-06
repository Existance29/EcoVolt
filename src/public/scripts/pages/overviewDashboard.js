document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch("/dashboard-overview");
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Dashboard Data:", data); // Log the data structure to see the received data

        // Update Overview Cards
        document.getElementById("cellTowerEnergyValue").textContent = `${data.cellTower.total_energy || 0} MWh`;
        document.getElementById("dataCenterEnergyValue").textContent = `${data.dataCenter.total_energy || 0} MWh`;
        document.getElementById("carbonEmissionsValue").textContent = `${data.carbonEmissions.total_co2_emissions || 0} Tons`;
        document.getElementById("renewableEnergyValue").textContent = `${data.renewableEnergy.avg_renewable_energy || 0}%`;

        // Energy Consumption Breakdown (Bar Chart)
        const energyBreakdown = data.dataCenter || {};
        const barCtx = document.getElementById("barChart").getContext("2d");
        new Chart(barCtx, {
            type: "bar",
            data: {
                labels: ["IT Equipment", "Cooling", "Backup Power", "Lighting"],
                datasets: [{
                    label: "Energy (MWh)",
                    data: [
                        data.energyBreakdown.it_energy || 0,
                        data.energyBreakdown.cooling_energy || 0,
                        data.energyBreakdown.backup_power || 0,
                        data.energyBreakdown.lighting_energy || 0
                    ],
                    backgroundColor: ["#4FD1C5", "#3498db", "#f39c12", "#e74c3c"]
                }]
            },
            options: { responsive: true }
        });

        const renewablePercentage = data.renewableEnergy.avg_renewable_energy || 0;
        const nonRenewablePercentage = 100 - renewablePercentage;

        // Log the values to check if they are correct
        console.log("Renewable Energy Percentage:", renewablePercentage);
        console.log("Non-Renewable Energy Percentage:", nonRenewablePercentage);

        // Renewable Energy Usage (Doughnut Chart)
        const doughnutCtx = document.getElementById("doughnutChart").getContext("2d");
        new Chart(doughnutCtx, {
            type: "doughnut",
            data: {
                labels: ["Renewable", "Non-Renewable"],
                datasets: [{
                    data: [
                        data.renewableEnergy.avg_renewable_energy || 0,
                        100 - (data.renewableEnergy.avg_renewable_energy || 0)
                    ],
                    backgroundColor: ["#4FD1C5", "#e74c3c"]
                }]
            },
            options: { 
                responsive: true,
                
            }
        });

    } catch (error) {
        console.error("Error fetching dashboard data:", error);
    }
});
