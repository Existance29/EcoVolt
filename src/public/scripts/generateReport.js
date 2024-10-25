document.addEventListener('DOMContentLoaded', function () {
    const generateReportBtn = document.getElementById('generateReportBtn');

    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', function () {
            // Fetch the PDF report from the backend
            fetch('/reports/pdf', {
                method: 'GET'
            })
            .then(response => {
                if (response.ok) {
                    return response.blob(); // Convert the response to a Blob (binary large object)
                } else {
                    throw new Error('Failed to generate report');
                }
            })
            .then(blob => {
                // Create a download link for the PDF
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'Singtel_Report.pdf'); // Set the filename
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            })
            .catch(error => {
                console.error('Error generating report:', error);
            });
        });
    }
});
