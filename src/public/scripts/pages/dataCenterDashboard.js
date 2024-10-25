// Set date to today
const today = new Date().toISOString().slice(0, 10); // Format: YYYY-MM-DD
document.getElementById('current-date').textContent = today;

// Retrieve company ID from session storage
//const companyId = getCompanyId()
//temporary
const companyId = 1

// Populate the company name (just for display, you can modify based on your data structure)
document.getElementById('company-name').textContent = `Company ${companyId}`;





// Fetch carbon emissions data
fetch(`/Dashboard/Data-Center/carbon-emissions/${companyId}/${today}`)
    .then(response => response.json())
    .then(data => {
        if (data) {
            // Corrected the mapping for emissions and dates
            const carbonEmissionsData = data.map(item => item.co2_emissions_tons);
            const emissionDates = data.map(item => item.date);

            // Create the chart
            const ctx = document.getElementById('carbonEmissionsChart').getContext('2d');
            // console.log(data);
            const carbonEmissionsChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: emissionDates,
                    datasets: [{
                        label: 'Carbon Emissions (tons)',
                        data: carbonEmissionsData,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        } else {
            alert("No carbon emissions data found.");
        }
    })
    .catch(error => console.error("Error fetching carbon emissions data:", error));