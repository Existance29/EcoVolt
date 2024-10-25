// Ensure the DOM is fully loaded before running the script
document.addEventListener("DOMContentLoaded", function() {
    // Set date to today
    const today = new Date(); // Create new Date object
    const year = today.getFullYear(); // Extract only the year
    document.getElementById('current-date').textContent = year; // Display only the year

    // Temp storage of company id
    sessionStorage.setItem('company_id', 1);

    // Retrieve company ID from session storage
    const companyId = sessionStorage.getItem('company_id'); // the company_id is stored in session storage

    // Fetch carbon emissions and renewable energy data (ensure backend includes renewable_energy_percentage in the response)
    fetch(`/Dashboard/Data-Center/carbon-emissions/${companyId}/${year}`)
        .then(response => response.json())
        .then(data => {
            if (data) {
                document.getElementById('company-name').textContent = data[0].company_name;

                // Map the data center names for X-axis
                const dataCenterNames = data.map(item => item.data_center_name);
                // Map the carbon emissions data
                const carbonEmissionsData = data.map(item => item.co2_emissions_tons);
                // Map the renewable energy percentage data
                const renewableEnergyData = data.map(item => item.renewable_energy_percentage);

                // Get the chart context
                const ctx = document.getElementById('carbonEmissionsChart').getContext('2d');

                // Bar Chart with Carbon Emissions and Renewable Energy Data
                const carbonEmissionsChart = new Chart(ctx, {
                    type: 'bar', // Bar chart type
                    data: {
                        labels: dataCenterNames, // Use data center names for X-axis labels
                        datasets: [
                            {
                                label: 'Carbon Emissions (tons)',
                                data: carbonEmissionsData,
                                backgroundColor: 'rgba(75, 192, 192, 0.6)', // Bars color for Carbon Emissions
                                borderColor: 'rgba(75, 192, 192, 1)', // Borders around bars
                                borderWidth: 1,
                                yAxisID: 'y1', // Associate with first Y-axis (Carbon Emissions)
                            },
                            {
                                label: 'Renewable Energy (%)',
                                data: renewableEnergyData,
                                backgroundColor: 'rgba(153, 102, 255, 0.6)', // Bars color for Renewable Energy
                                borderColor: 'rgba(153, 102, 255, 1)', // Borders around bars
                                borderWidth: 1,
                                yAxisID: 'y2', // Associate with second Y-axis (Renewable Energy)
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y1: {
                                beginAtZero: true,
                                type: 'linear',
                                position: 'left',
                                title: {
                                    display: true,
                                    text: 'Carbon Emissions (tons)'
                                }
                            },
                            y2: {
                                beginAtZero: true,
                                type: 'linear',
                                position: 'right',
                                title: {
                                    display: true,
                                    text: 'Renewable Energy (%)'
                                },
                                grid: {
                                    drawOnChartArea: false // Prevent grid lines from overlapping
                                }
                            }
                        }
                    }
                });

            } else {
                alert("No carbon emissions or renewable energy data found.");
            }
        })
        .catch(error => console.error("Error fetching carbon emissions and renewable energy data:", error));
});
