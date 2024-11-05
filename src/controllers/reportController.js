const OpenAI = require('openai');
const Report = require('../models/report');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const moment = require('moment');
require('dotenv').config(); // Load environment variables

const openai = new OpenAI(process.env.OPENAI_API_KEY);
const reportFilePath = path.join(__dirname, '..', 'reports', 'Singtel_Report.pdf');
let lastGeneratedTimestamp = null;
let reportBuffer = null;

// Function to draw a table in the PDF
function drawTable(doc, headers, rows, options = {}) {
    const { startX = 50, startY = doc.y, headerHeight = 25, rowHeight = 15, colWidths = [80, 90, 90, 90, 90, 90], fontSize = 8 } = options;
    const cellPadding = 3;
    doc.fontSize(fontSize);
    headers.forEach((header, index) => {
        const xPos = startX + colWidths.slice(0, index).reduce((a, b) => a + b, 0);
        doc.rect(xPos, startY, colWidths[index], headerHeight).stroke().text(header, xPos + cellPadding, startY + cellPadding, { width: colWidths[index] - 2 * cellPadding, align: 'left' });
    });
    rows.forEach((row, rowIndex) => {
        row.forEach((cell, cellIndex) => {
            const xPos = startX + colWidths.slice(0, cellIndex).reduce((a, b) => a + b, 0);
            const yPos = startY + headerHeight + rowIndex * rowHeight;
            doc.rect(xPos, yPos, colWidths[cellIndex], rowHeight).stroke().text(cell ?? 'N/A', xPos + cellPadding, yPos + cellPadding, { width: colWidths[cellIndex] - 2 * cellPadding, align: 'left' });
        });
    });
}

// Function to get all reports and respond as JSON
const getAllReport = async (req, res) => {
    try {
        const reports = await Report.getAllReport();
        res.status(200).json(reports);
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
};

// Function to generate recommendations using OpenAI API
async function generateAIRecommendations(data, category) {
    const prompt = `Based on the following data for Singtel:
    - Total Energy Consumption: ${data.totalEnergy} MWh
    - Total CO2 Emissions: ${data.co2Emissions} Tons
    - Current Progress: ${data.currentProgress}%
    
    Provide two specific recommendations for ${category} with actionable steps.`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 150,
            temperature: 0.7
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error(`Error fetching ${category} recommendations:`, error);
        throw error;
    }
}

// Function to get all recommendations and combine them
async function getAllAIRecommendations(data) {
    const categories = [
        "Energy Efficiency Improvements",
        "CO2 Emission Reduction Strategies",
        "Renewable Energy Investments",
        "Sustainable Cooling Technologies",
        "Monitoring and Reporting Practices"
    ];

    const recommendations = await Promise.all(
        categories.map(category => generateAIRecommendations(data, category))
    );

    return recommendations.join("\n\n");
}

// Function to generate the PDF report
async function createPDFReport(reports) {
    const singtelReports = reports.filter(report => report.companyName === 'Singapore Telecommunications Limited');

    // Prepare summary data
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

    // Generate AI recommendations and conclusion
    const recommendations = await getAllAIRecommendations({
        totalEnergy: totalEnergy,
        co2Emissions: totalCO2,
        currentProgress: (totalCO2 / (totalEnergy * 0.2)) * 100
    });

    const conclusionPrompt = `Given the total energy consumption of ${totalEnergy} MWh and CO2 emissions of ${totalCO2} tons, provide a conclusion on Singtel’s sustainability progress and suggest predictive actions for further reducing emissions.`;
    const conclusionResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: conclusionPrompt }],
        max_tokens: 150,
        temperature: 0.7
    });
    const conclusion = conclusionResponse.choices[0].message.content;

    // Generate chart with distinct colors
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

    // Create PDF document in memory
    const doc = new PDFDocument({ autoFirstPage: false });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
        reportBuffer = Buffer.concat(chunks);
        lastGeneratedTimestamp = new Date();
    });

    // First Page: Executive Summary
    doc.addPage();
    doc.fontSize(20).text('Singtel Sustainability Report 2024', { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).text('Executive Summary', { align: 'left' });
    doc.fontSize(12).text(`In 2024, Singtel's energy consumption reached a total of ${totalEnergy.toLocaleString()} kWh, while carbon emissions amounted to ${totalCO2.toFixed(2)} tons. This report provides an overview of Singtel’s energy use and environmental impact, highlighting key trends in consumption and emissions.`);
    doc.moveDown(2);

    // Data Overview (Bar Chart)
    doc.fontSize(16).text('Data Overview', { align: 'left' });
    doc.image(chartImage, { fit: [500, 300], align: 'center', valign: 'center' });
    doc.moveDown(2);

    // Data Insights Table
    doc.addPage();
    doc.fontSize(16).text('Data Insights', { align: 'left' });
    doc.moveDown();

    // Energy Consumption Data Table
    const tableHeaders = ['Date', 'Radio Equipment Energy (kWh)', 'Cooling Energy (kWh)', 'Backup Power Energy (kWh)', 'Misc Energy (kWh)', 'CO2 Emissions (tons)'];
    const tableData = singtelReports.map(report => [
        moment(report.date).format('MMM YYYY'),
        report.radioEquipmentEnergy ? report.radioEquipmentEnergy.toFixed(2) : 'N/A',
        report.coolingEnergy ? report.coolingEnergy.toFixed(2) : 'N/A',
        report.backupEnergy ? report.backupEnergy.toFixed(2) : 'N/A',
        report.miscEnergy ? report.miscEnergy.toFixed(2) : 'N/A',
        report.co2EmissionsTons ? report.co2EmissionsTons.toFixed(2) : 'N/A',
    ]);

    drawTable(doc, tableHeaders, tableData, { rowHeight: 12, colWidths: [70, 70, 70, 70, 70, 90], fontSize: 8 });

    // Recommendations Section
    doc.addPage();
    doc.fontSize(16).text('Recommendations', { align: 'left' });
    doc.fontSize(12).text(recommendations);
    doc.moveDown();

    // Conclusion Section
    doc.fontSize(16).text('Conclusion', { align: 'left' });
    doc.fontSize(12).text(conclusion);

    // Finalize PDF
    doc.end();
}

// Check if the report is up-to-date (within the last 1 hour), then serve it
const generateReportPDF = async (req, res) => {
    const currentTime = new Date();
    const oneHour = 60 * 60 * 1000;

    if (reportBuffer && lastGeneratedTimestamp && currentTime - lastGeneratedTimestamp < oneHour) {
        console.log("Serving report from memory (cached).");
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="Singtel_Report.pdf"');
        return res.send(reportBuffer);
    }

    console.log("Generating a new report.");
    try {
        // Fetch all reports and generate a new PDF if the cached report is outdated
        const reports = await Report.getAllReport();
        await createPDFReport(reports);

        // Serve the newly generated report
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="Singtel_Report.pdf"');
        res.send(reportBuffer);
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
};

module.exports = {
    getAllReport,
    generateReportPDF,
};