let allData = []; // Personal devices for real-time filtering
let companyData = []; // Company devices for real-time filtering
let filteredDCData = []; // Filtered personal devices for the selected data center
let companyFilteredDCData = []; // Filtered company devices for the selected data center
let isAll = true; // Flag to track if "All" is selected
const company_id = getCompanyId(); // Get company ID dynamically
let isPersonal;


async function populateTable() {
    try {
        if (!company_id) {
            throw new Error('Company ID not found');
        }

        const response = await fetch(`/recycle/personal/recycled/${company_id}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.status}`);
        }

        const data = await response.json();
        allData = data; // Cache the personal devices data
        renderTable(allData); // Render personal devices in the table
    } catch (error) {
        console.error('Error populating personal devices table:', error);
    }
}

async function populateCompanyTable() {
    try {
        if (!company_id) {
            throw new Error('Company ID not found');
        }

        const response = await fetch(`/recycle/company/recycled/${company_id}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.status}`);
        }

        const data = await response.json();
        companyData = data; // Cache the company devices data
        renderCompanyTable(companyData); // Render company devices in the table
    } catch (error) {
        console.error('Error populating company devices table:', error);
    }
}



// Render the table with data
function renderTable(data) {
    const tableBody = document.querySelector('#equipment-table-1 tbody');
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

        // Add event listener to handle row click
        row.addEventListener('click', () => {
            isPersonal = true
            const serialNumber = row.querySelector('td:nth-child(5)').textContent; // Get serial number
            openModal(serialNumber); // Open the modal with the serial number
        });
        console.log("help", data);

        const formattedDate = new Date(item.created_at).toLocaleString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
          });          
          console.log(item);
        row.innerHTML = `
            <td>${item.name || 'N/A'}</td>
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

function renderCompanyTable(data) {
    const tableBody = document.querySelector('#equipment-table-2 tbody');
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

        // Add event listener to handle row click
        row.addEventListener('click', () => {
            isPersonal = false
            const serialNumber = row.querySelector('td:nth-child(4)').textContent; // Get serial number
            openModal(serialNumber); // Open the modal with the serial number
        });       
        row.innerHTML = `
            <td>${item.device_type || 'N/A'}</td>
            <td>${item.brand || 'N/A'}</td>
            <td>${item.model || 'N/A'}</td>
            <td>${item.serial_number || 'N/A'}</td>
            <td>${item.device_age_years || 'N/A'}</td>
            <td>${item.total_device_co2_emissions_tons ? item.total_device_co2_emissions_tons.toFixed(2) : 'N/A'}</td>
            <td>${item.total_device_energy_mwh ? item.total_device_energy_mwh.toFixed(2) : 'N/A'}</td>
            <td>${item.status || 'N/A'}</td>
        `;
        tableBody.appendChild(row);
    });
}

function filterTable() {
    const searchTerm = document.querySelector('#search-input').value.trim().toLowerCase();

    // Determine active datasets based on the selected category
    const activePersonalData = isAll ? allData : filteredDCData;
    const activeCompanyData = isAll ? companyData : companyFilteredDCData;

    // Filter personal devices
    const filteredPersonalData = activePersonalData.filter(item =>
        (item.name && item.name.toLowerCase().includes(searchTerm)) ||
        (item.brand && item.brand.toLowerCase().includes(searchTerm)) ||
        (item.device_type && item.device_type.toLowerCase().includes(searchTerm)) ||
        (item.model && item.model.toLowerCase().includes(searchTerm)) ||
        (item.serial_number && item.serial_number.toLowerCase().includes(searchTerm)) ||
        (item.status && item.status.toLowerCase().includes(searchTerm))
    );

    // Filter company devices
    const filteredCompanyData = activeCompanyData.filter(item =>
        (item.device_type && item.device_type.toLowerCase().includes(searchTerm)) ||
        (item.brand && item.brand.toLowerCase().includes(searchTerm)) ||
        (item.model && item.model.toLowerCase().includes(searchTerm)) ||
        (item.serial_number && item.serial_number.toLowerCase().includes(searchTerm)) ||
        (item.total_device_co2_emissions_tons && item.total_device_co2_emissions_tons.toString().includes(searchTerm)) ||
        (item.total_device_energy_mwh && item.total_device_energy_mwh.toString().includes(searchTerm)) ||
        (item.status && item.status.toLowerCase().includes(searchTerm))
    );

    // Render filtered data for both tables
    renderTable(filteredPersonalData);
    renderCompanyTable(filteredCompanyData);
}

// Set the active class on the clicked button
function setActiveButton(centerId) {
    const buttons = document.querySelectorAll('.filter-buttons button');
    buttons.forEach(button => {
        button.classList.remove('active'); // Remove active class from all buttons
    });

    const activeButton = document.querySelector(`.filter-buttons button[data-center-id="${centerId}"]`);
    if (activeButton) {
        activeButton.classList.add('active'); // Add active class to the clicked button
    }

    // Update the dataset based on the selected category
    filterByCategory(centerId);
}

async function filterByCategory(dataCenterId) {
    try {
        if (!company_id) {
            throw new Error('Company ID not found');
        }

        if (dataCenterId === "All") {
            // Reset both datasets to "All"
            isAll = true;
            filteredDCData = [];
            companyFilteredDCData = [];
            document.querySelector('#search-input').value = ''; // Clear the search input
            renderTable(allData); // Render all personal data
            renderCompanyTable(companyData); // Render all company data
            return;
        }

        // Set the flag to a specific data center
        isAll = false;

        // Fetch filtered data for personal devices
        const personalResponse = await fetch(`/recycle/personal/recycled-DC/${dataCenterId}`);
        if (!personalResponse.ok) {
            if (personalResponse.status === 404) {
                console.log(`No personal data found for Data Center ${dataCenterId}`);
                filteredDCData = []; // Clear the filtered data if 404
                renderTable([]); // Render empty table for personal devices
            } else {
                throw new Error(`Failed to fetch personal data for Data Center ${dataCenterId}: ${personalResponse.status}`);
            }
        } else {
            filteredDCData = await personalResponse.json();
            if (filteredDCData.length === 0) {
                console.log(`No personal data found for Data Center ${dataCenterId}`);
                renderTable([]); // Render empty table for personal devices
            } else {
                renderTable(filteredDCData); // Render the filtered personal data
            }
        }

        // Fetch filtered data for company devices
        const companyResponse = await fetch(`/recycle/company/recycled-DC/${dataCenterId}`);
        if (!companyResponse.ok) {
            if (companyResponse.status === 404) {
                console.log(`No company data found for Data Center ${dataCenterId}`);
                companyFilteredDCData = []; // Clear the filtered data if 404
                renderCompanyTable([]); // Render empty table for company devices
            } else {
                throw new Error(`Failed to fetch company data for Data Center ${dataCenterId}: ${companyResponse.status}`);
            }
        } else {
            companyFilteredDCData = await companyResponse.json();
            if (companyFilteredDCData.length === 0) {
                console.log(`No company data found for Data Center ${dataCenterId}`);
                renderCompanyTable([]); // Render empty table for company devices
            } else {
                renderCompanyTable(companyFilteredDCData); // Render the filtered company data
            }
        }

        // Clear the search input after filtering
        document.querySelector('#search-input').value = ''; // Clear the search input
    } catch (error) {
        console.error('Error filtering data by category:', error);
    }
}


function openModal(serialNumber) {
    const modal = document.getElementById('details-modal');
    const iframe = document.getElementById('modal-iframe');
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
    document.querySelector('#search-input').addEventListener('input', filterTable);
    setActiveButton('All');
    populateTable(); // Populate the table initially
    populateCompanyTable();
});