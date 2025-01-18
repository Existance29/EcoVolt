document.getElementById('uploadButton').addEventListener('click', function () {
    document.getElementById('fileInput').click();
  });
  
  document.getElementById('fileInput').addEventListener('change', function (event) {
    const fileName = event.target.files[0] ? event.target.files[0].name : 'No file chosen';
    document.getElementById('fileName').value = fileName;
  });

  document.querySelector('.submit-button').addEventListener('click', async function (event) {
    event.preventDefault(); // Prevent default form submission behavior

    // Get input values
    const deviceType = document.querySelector('input[placeholder="E.g. smartphone, tablet, smartwatch"]').value.trim();
    const brand = document.querySelector('input[placeholder="E.g. Apple, Samsung, LG"]').value.trim();
    const model = document.querySelector('input[placeholder="E.g. iPhone 13, Galaxy S21, V60 ThinQ"]').value.trim();
    const serialNumber = document.querySelector('input[placeholder="Enter IMEI/MEID or serial number"]').value.trim();
    const fileInput = document.getElementById('fileInput').files[0];

    // Validate fields
    if (!deviceType || !brand || !model || !serialNumber) {
        alert('Please fill out all fields before submitting.');
        return;
    }

    if (!fileInput) {
        alert('Please upload an image.');
        return;
    }

    // Convert the file to Base64
    const toBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });

    try {
        const base64Image = await toBase64(fileInput);

        // Prepare JSON data
        const jsonData = {
            device_type: deviceType,
            brand: brand,
            model: model,
            serial_number: serialNumber,
            image: base64Image // Include the image as a Base64 string
        };

        // Use the helper function to send the data
        const response = await post(`/recycle/personal-device/${getCompanyId()}`, jsonData);

        if (!response.ok) {
            const errorMessage = await response.json();
            throw new Error(`Failed to submit form: ${errorMessage.message}`);
        }

        // Handle successful response
        const result = await response.json();
        alert('Your device has been submitted successfully!');
        console.log('Submission response:', result);
    } catch (error) {
        console.error('Error submitting form:', error);
        alert('There was an error submitting your device. Please try again.');
    }
});