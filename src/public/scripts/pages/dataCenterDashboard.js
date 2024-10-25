// Ensure the DOM is fully loaded before running the script
document.addEventListener("DOMContentLoaded", function() {
    // Set date to today
    const today = new Date(); // Create new Date object
    const year = today.getFullYear(); // Extract only the year
    document.getElementById('current-date').textContent = year; // Display only the year

    // temp storage of company id ***********************************************************************************************************************************************************************
    sessionStorage.setItem('company_id', 1);

    // Retrieve company ID from session storage
    const companyId = getCompanyId()

    // Fetch carbon emissions data (ensure backend includes data_center_name in the response)
    fetch(`/Dashboard/Data-Center/carbon-emissions/${companyId}/${year}`)
        .then(response => response.json())
        .then(data => {
            if (data) {
                document.getElementById('company-name').textContent = data[0].company_name;

                // Map the data center names for X-axis
                const dataCenterNames = data.map(item => item.data_center_name);
                // Map the carbon emissions data
                const carbonEmissionsData = data.map(item => item.co2_emissions_tons);

                // Get the chart context
                const ctx = document.getElementById('carbonEmissionsChart').getContext('2d');

                // Bar Chart Option with Data Center Names on the X-axis
                const carbonEmissionsChart = new Chart(ctx, {
                    type: 'bar', // Bar chart type
                    data: {
                        labels: dataCenterNames, // Use data center names for X-axis labels
                        datasets: [{
                            label: 'Carbon Emissions (tons)',
                            data: carbonEmissionsData,
                            backgroundColor: 'rgba(75, 192, 192, 0.6)', // Bars color
                            borderColor: 'rgba(75, 192, 192, 1)', // Borders around bars
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true // Ensure Y-axis starts at 0
                            }
                        }
                    }
                });

            } else {
                alert("No carbon emissions data found.");
            }
        })
        .catch(error => console.error("Error fetching carbon emissions data:", error));
});
