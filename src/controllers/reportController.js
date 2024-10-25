const Report = require('../models/report');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const moment = require('moment');

function drawTable(doc, headers, rows, options = {}) {
    const {
        startX = 50, // X-coordinate start position
        startY = doc.y, // Y-coordinate start position
        headerHeight = 25, // Larger height for the header row
        rowHeight = 15, // Normal row height
        colWidths = [80, 90, 90, 90, 90, 90], 
        fontSize = 8, 
        rowsPerPage = 25, 
    } = options;
    const cellPadding = 3;

    doc.fontSize(fontSize);

    // Adjust column widths to avoid overlap issues
    const adjustedColWidths = [...colWidths];
    if (headers.length > colWidths.length) {
        const defaultWidth = 70;
        while (adjustedColWidths.length < headers.length) {
            adjustedColWidths.push(defaultWidth);
        }
    }

    // Draw headers with increased height
    headers.forEach((header, index) => {
        const xPos = startX + adjustedColWidths.slice(0, index).reduce((a, b) => a + b, 0);
        const yPos = startY;
        const colWidth = adjustedColWidths[index];

        if (!isNaN(xPos) && !isNaN(yPos) && !isNaN(colWidth) && !isNaN(headerHeight)) {
            doc
                .rect(xPos, yPos, colWidth, headerHeight)  // Increased height for header
                .stroke()
                .text(header || 'N/A', xPos + cellPadding, yPos + cellPadding, {
                    width: colWidth - 2 * cellPadding,
                    align: 'left',  // Align header to the left
                });
        }
    });

    // Draw rows immediately after the headers, without extra gap
    rows.forEach((row, rowIndex) => {
        row.forEach((cell, cellIndex) => {
            const x = startX + adjustedColWidths.slice(0, cellIndex).reduce((a, b) => a + b, 0);
            const y = startY + headerHeight + rowIndex * rowHeight; // Corrected row position to remove gap
            const colWidth = adjustedColWidths[cellIndex];
            const cellValue = (cell !== undefined && cell !== null) ? cell : 'N/A';

            if (!isNaN(x) && !isNaN(y) && !isNaN(colWidth) && !isNaN(rowHeight)) {
                doc
                    .rect(x, y, colWidth, rowHeight)
                    .stroke()
                    .text(cellValue, x + cellPadding, y + cellPadding, {
                        width: colWidth - 2 * cellPadding,
                        align: 'left',  // Align rows to the left as well
                    });
            }
        });
    });
}

// Get all reports and respond as JSON
const getAllReport = async (req, res) => {
    try {
        const reports = await Report.getAllReport();
        res.status(200).json(reports);
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
};

// Function to generate PDF report
const generateReportPDF = async (req, res) => {
    try {
        const reports = await Report.getAllReport();

        const singtelReports = reports.filter(report => report.companyName === 'Singapore Telecommunications Limited');
        if (singtelReports.length === 0) {
            throw new Error('No report data available for Singtel');
        }

        const months = [];
        const monthlyEnergy = [];
        const monthlyCO2 = [];
        let totalEnergy = 0;
        let totalCO2 = 0;

        singtelReports.forEach(report => {
            const month = moment(report.date).format('MMM YYYY');
            const monthIndex = months.indexOf(month);

            if (monthIndex === -1) {
                months.push(month);
                monthlyEnergy.push(report.totalEnergyKWH || 0);
                monthlyCO2.push(report.co2EmissionsTons || 0);
            } else {
                monthlyEnergy[monthIndex] += (report.totalEnergyKWH || 0);
                monthlyCO2[monthIndex] += (report.co2EmissionsTons || 0);
            }

            totalEnergy += report.totalEnergyKWH || 0;
            totalCO2 += report.co2EmissionsTons || 0;
        });

        const chartCanvas = new ChartJSNodeCanvas({ width: 1200, height: 800 });
        const energyChartData = {
            labels: months,
            datasets: [
                {
                    label: 'Total Energy (kWh)',
                    data: monthlyEnergy,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                    yAxisID: 'y1',
                },
                {
                    label: 'CO2 Emissions (tons)',
                    data: monthlyCO2,
                    backgroundColor: 'rgba(153, 102, 255, 0.6)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1,
                    yAxisID: 'y2',
                },
            ],
        };

        const chartImage = await chartCanvas.renderToBuffer({
            type: 'bar',
            data: energyChartData,
            options: {
                scales: {
                    y1: { type: 'linear', position: 'left', title: { display: true, text: 'Total Energy (kWh)' } },
                    y2: { type: 'linear', position: 'right', title: { display: true, text: 'CO2 Emissions (tons)' }, grid: { drawOnChartArea: false } },
                },
            },
        });

        // Create PDF document
        const doc = new PDFDocument({ autoFirstPage: false });
        const filePath = path.join(__dirname, '..', 'reports', 'Singtel_Report.pdf');
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        // 1. Add the First Page with Executive Summary
        doc.addPage();
        doc.fontSize(20).text('Singtel Sustainability Report 2024', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text('Executive Summary', { align: 'left' });
        doc.fontSize(12).text(`In 2024, Singtel's energy consumption reached a total of ${totalEnergy.toLocaleString()} kWh, while carbon emissions amounted to ${totalCO2.toFixed(2)} tons. This report provides an overview of Singtel’s energy use and environmental impact, highlighting key trends in consumption and emissions.`);
        doc.moveDown(2);

        // 2. Data Overview (Bar Chart)
        doc.fontSize(16).text('Data Overview', { align: 'left' });
        doc.image(chartImage, { fit: [500, 300], align: 'center', valign: 'center' });
        doc.moveDown(2);

        // 3. Data Insights Title
        doc.addPage();
        doc.fontSize(16).text('Data Insights', { align: 'left' });
        doc.moveDown();

        // 4. Data Insights Table (Cell Towers)
        doc.fontSize(14).text('Cell Tower Energy Consumption Data', { align: 'left' });
        const cellTowerHeaders = ['Date', 'Radio Equipment Energy (kWh)', 'Cooling Energy (kWh)', 'Backup Power Energy (kWh)', 'Misc Energy (kWh)', 'CO2 Emissions (tons)'];
        const cellTowerData = singtelReports.filter(report => report.totalEnergyKWH < 1000000).map(report => [
            moment(report.date).format('MMM YYYY'),
            (report.radioEquipmentEnergy != null) ? report.radioEquipmentEnergy.toFixed(2) : 'N/A',
            (report.coolingEnergy != null) ? report.coolingEnergy.toFixed(2) : 'N/A',
            (report.backupEnergy != null) ? report.backupEnergy.toFixed(2) : 'N/A',
            (report.miscEnergy != null) ? report.miscEnergy.toFixed(2) : 'N/A',
            (report.co2EmissionsTons != null) ? report.co2EmissionsTons.toFixed(2) : 'N/A',
        ]);

        drawTable(doc, cellTowerHeaders, cellTowerData, { rowHeight: 12, colWidths: [70, 70, 70, 70, 70, 90], fontSize: 8 });

        doc.moveDown(3);

        // 5. Data Insights Table (Data Centers)
        doc.fontSize(14).text('Data Center Energy Consumption Data', { align: 'left' , indent: -335 });
        const dataCenterHeaders = ['Date', 'Data Center ID', 'IT Energy (kWh)', 'Cooling Energy (kWh)', 'Backup Power Energy (kWh)', 'Lighting Energy (kWh)', 'CO2 Emissions (tons)'];
        const dataCenterData = singtelReports.filter(report => report.totalEnergyKWH >= 1000000).map(report => [
            moment(report.date).format('MMM YYYY'),
            report.dataCenterId || 'Singtel DC-1',
            (report.radioEquipmentEnergy != null) ? report.radioEquipmentEnergy.toFixed(2) : 'N/A',
            (report.coolingEnergy != null) ? report.coolingEnergy.toFixed(2) : 'N/A',
            (report.backupEnergy != null) ? report.backupEnergy.toFixed(2) : 'N/A',
            (report.miscEnergy != null) ? report.miscEnergy.toFixed(2) : 'N/A',
            (report.co2EmissionsTons != null) ? report.co2EmissionsTons.toFixed(2) : 'N/A',
        ]);

        drawTable(doc, dataCenterHeaders, dataCenterData, { rowHeight: 12, colWidths: [70, 70, 70, 70, 70, 90], fontSize: 8 });

        // 6. Recommendations Section
        doc.addPage(); 
        doc.fontSize(16).text('Recommendations', { align: 'left'});
        doc.fontSize(12).text(`To reduce energy consumption and carbon emissions, Singtel should consider increasing investments in renewable energy sources, improving energy efficiency in data centers, and implementing sustainable cooling technologies.`);
        doc.moveDown();

        // 7. Conclusion Section
        doc.fontSize(16).text('Conclusion', { align: 'left' });
        doc.fontSize(12).text(`Singtel’s energy consumption and carbon emissions remain significant, but there are several opportunities for improvement. By investing in renewable energy and improving energy efficiency, Singtel can reduce its environmental footprint while continuing to grow.`);

        // Finalize PDF
        doc.end();

        writeStream.on('finish', () => {
            res.download(filePath);
        });

    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
};

module.exports = {
    getAllReport,
    generateReportPDF,
};