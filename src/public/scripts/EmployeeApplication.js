let allDataTable1 = []; // Cache data for Table 1
let allDataTable2 = []; // Cache data for Table 2
const company_id = getCompanyId(); // Get company ID dynamically

// Fetch and populate both tables initially
async function populateTables() {
    try {
        if (!company_id) {
            throw new Error('Company ID not found');
        }

        // Fetch and populate Table 1 (Employee Applications)
        allDataTable1 = await fetchTableData(`/recycle/employee-application/${company_id}`);
        renderTable(allDataTable1, '#equipment-table-1 tbody', 'Table1');

        // Fetch and populate Table 2 (Rejected Applications)
        allDataTable2 = await fetchTableData(`/recycle/employee-application-Rejected/${company_id}`);
        renderTable(allDataTable2, '#equipment-table-2 tbody', 'Table2');
    } catch (error) {
        console.error('Error populating tables:', error);
    }
}

// Helper function to fetch data from a given URL
async function fetchTableData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
    }
    return response.json();
}

// Render a table with data
function renderTable(data, tableSelector, tableSource) {
    const tableBody = document.querySelector(tableSelector);
    tableBody.innerHTML = ''; // Clear existing rows

    if (data.length === 0) {
        // Display "No items found" if the data array is empty
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = `
            <td colspan="7" style="text-align: center;">No items found</td>
        `;
        tableBody.appendChild(noDataRow);
        return;
    }

    // Populate the table with data
    data.forEach(item => {
        const row = document.createElement('tr');

        // Add event listener to handle row click (if needed)
        row.addEventListener('click', () => {
            const serialNumber = item.serial_number; // Get serial number
            openModal(serialNumber, tableSource); // Pass table source
        });

        const formattedDate = new Date(item.created_at).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        row.innerHTML = `
            <td>${item.user_name || 'N/A'}</td>
            <td>${item.device_type || 'N/A'}</td>
            <td>${item.brand || 'N/A'}</td>
            <td>${item.model || 'N/A'}</td>
            <td>${item.serial_number || 'N/A'}</td>
            <td>${formattedDate || 'N/A'}</td>
            <td>${item.status || 'N/A'}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Open modal logic remains unchanged
function openModal(serialNumber, tableSource) {
    const modal = document.getElementById('details-modal');
    const iframe = document.getElementById('modal-iframe');
    const isPersonal = true;
    const approveButton = modal.querySelector('.modal-Placeholder');
    const rejectButton = modal.querySelector('.modal-Cancel');
    const closeButton = modal.querySelector('.modal-Close'); // Select the Close button

    if (tableSource === 'Table2') {
        approveButton.style.display = 'none'; // Hide the Approve button
        rejectButton.style.display = 'none'; // Hide the Reject button
        closeButton.classList.remove('hidden'); // Show the Close button
    } else {
        approveButton.style.display = '';    // Show the Approve button
        rejectButton.style.display = '';    // Show the Reject button
        closeButton.classList.add('hidden'); // Hide the Close button
    }
    
    modal.setAttribute('data-serial-number', serialNumber);
    iframe.src = `ConfirmRecycle.html?SN=${serialNumber}&isPersonal=${isPersonal}`;
    modal.classList.remove('hidden'); // Show the modal
    document.body.classList.add('modal-open'); // Disable scrolling on the background
}

function closeModal() {
    const modal = document.getElementById('details-modal');
    const iframe = document.getElementById('modal-iframe');
    iframe.src = ''; // Clear the iframe content
    modal.classList.add('hidden'); // Hide the modal
    document.body.classList.remove('modal-open'); // Re-enable scrolling on the background
}

// Attach the input event listener to the search field
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#search-input').addEventListener('input', filterTables);
    populateTables(); // Populate both tables initially
});

// Search and filter both tables
function filterTables() {
    const searchTerm = document.querySelector('#search-input').value.trim().toLowerCase();

    // Filter Table 1
    const filteredDataTable1 = allDataTable1.filter(item =>
        (item.user_name && item.user_name.toLowerCase().includes(searchTerm)) ||
        (item.brand && item.brand.toLowerCase().includes(searchTerm)) ||
        (item.device_type && item.device_type.toLowerCase().includes(searchTerm)) ||
        (item.model && item.model.toLowerCase().includes(searchTerm)) ||
        (item.serial_number && item.serial_number.toLowerCase().includes(searchTerm)) ||
        (item.status && item.status.toLowerCase().includes(searchTerm))
    );
    renderTable(filteredDataTable1, '#equipment-table-1 tbody');

    // Filter Table 2
    const filteredDataTable2 = allDataTable2.filter(item =>
        (item.user_name && item.user_name.toLowerCase().includes(searchTerm)) ||
        (item.brand && item.brand.toLowerCase().includes(searchTerm)) ||
        (item.device_type && item.device_type.toLowerCase().includes(searchTerm)) ||
        (item.model && item.model.toLowerCase().includes(searchTerm)) ||
        (item.serial_number && item.serial_number.toLowerCase().includes(searchTerm)) ||
        (item.status && item.status.toLowerCase().includes(searchTerm))
    );
    renderTable(filteredDataTable2, '#equipment-table-2 tbody');
}


async function approveDevice() {
    // Fetch serial number from the modal or context
    const serialNumber = document.querySelector('#details-modal').getAttribute('data-serial-number');
    const status = "Pending Pick Up"; // Define the new status

    try {
        const response = await fetch('/recycle/personal/status?SN=' + encodeURIComponent(serialNumber), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status }),
        });        

        if (response.ok) {
            alert('Device status updated successfully.');
            closeModal(); // Close the modal on success
            location.reload(); // Reload the page to reflect changes
        } else {
            const errorText = await response.text();
            alert('Failed to update status: ' + errorText);
        }
    } catch (error) {
        console.error('Error updating device status:', error);
        alert('An unexpected error occurred. Please try again.');
    }
}

async function rejectDevice() {
    // Fetch serial number from the modal or context
    const serialNumber = document.querySelector('#details-modal').getAttribute('data-serial-number');
    const status = "Rejected"; // Define the new status

    try {
        const response = await fetch('/recycle/personal/status?SN=' + encodeURIComponent(serialNumber), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status }),
        });

        if (response.ok) {
            alert('Device has been rejected successfully.');
            closeModal(); // Close the modal on success
            location.reload(); // Reload the page to reflect changes
        } else {
            const errorText = await response.text();
            alert('Failed to reject the device: ' + errorText);
        }
    } catch (error) {
        console.error('Error rejecting device:', error);
        alert('An unexpected error occurred. Please try again.');
    }
}
