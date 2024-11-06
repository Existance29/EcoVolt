document.addEventListener('DOMContentLoaded', function () {
    const reportFrame = document.getElementById('reportFrame');
    const downloadReportBtn = document.getElementById('downloadReportBtn');

    // Load the PDF into the iframe for viewing
    fetch('/reports/pdf', {
        method: 'GET'
    })
    .then(response => {
        if (response.ok) {
            return response.blob(); // Convert to Blob for iframe
        } else {
            throw new Error('Failed to load report');
        }
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        reportFrame.src = url; // Set iframe source to the Blob URL
    })
    .catch(error => {
        console.error('Error loading report:', error);
    });

    // Download the report PDF on button click
    downloadReportBtn.addEventListener('click', function () {
        fetch('/reports/pdf', {
            method: 'GET'
        })
        .then(response => {
            if (response.ok) {
                return response.blob(); // Convert the response to a Blob
            } else {
                throw new Error('Failed to generate report');
            }
        })
        .then(blob => {
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
});