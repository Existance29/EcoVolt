const OpenAI = require('openai');
const Report = require('../models/report');
const puppeteer = require('puppeteer');
const moment = require('moment');
require('dotenv').config();

const openai = new OpenAI(process.env.OPENAI_API_KEY);

// Function to generate data analysis for Data Overview
async function generateDataAnalysis(monthlyEnergy, monthlyCO2) {
    const prompt = `Analyze the following energy and CO2 emission data for Singtel:
    - Monthly Energy Consumption: ${monthlyEnergy.join(", ")} kWh
    - Monthly CO2 Emissions: ${monthlyCO2.join(", ")} tons
    
    Provide a brief overview summarizing the trend in energy consumption and emissions.`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 150,
            temperature: 0.7
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error("Error generating data analysis:", error);
        throw error;
    }
}

// Generate report data with optional caching in session
const generateReportData = async (req, res) => {
    const sessionData = req.session.reportData;
    const oneHour = 60 * 60 * 1000;
    const currentTime = new Date();

    if (sessionData && sessionData.timestamp && (currentTime - new Date(sessionData.timestamp) < oneHour) && !req.query.force) {
        console.log("Serving cached report data from session.");
        return res.status(200).json(sessionData.data);
    }

    console.log("Generating new report data...");
    try {
        const reports = await Report.getAllReport();
        const singtelReports = reports.filter(report => report.companyName === 'Singapore Telecommunications Limited');

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

        const dataAnalysis = await generateDataAnalysis(monthlyEnergy, monthlyCO2);
        const recommendations = await getAllAIRecommendations({
            totalEnergy: totalEnergy,
            co2Emissions: totalCO2,
            currentProgress: (totalCO2 / (totalEnergy * 0.2)) * 100
        });

        const conclusion = await generateConclusion(totalEnergy, totalCO2);

        const reportData = {
            months,
            monthlyEnergy,
            monthlyCO2,
            totalEnergy,
            totalCO2,
            dataAnalysis,  // Include generated analysis in report data
            recommendations,
            conclusion,
            reportData: singtelReports,
        };

        req.session.reportData = { data: reportData, timestamp: currentTime };

        res.status(200).json(reportData);
    } catch (error) {
        console.error("Error fetching report data:", error);
        res.status(500).json({ error: 'Failed to fetch report data' });
    }
};

// Forcefully generate new report data
const forceGenerateReportData = async (req, res) => {
    console.log("Force generating new report data...");
    await generateReportData(req, res);
};

const generateReportPDF = async (req, res) => {
    console.log("Generating PDF with Puppeteer...");
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        // Load the report HTML and wait for it to be fully loaded
        const reportHtmlPath = `file://${path.resolve(__dirname, '..', 'public', 'report.html')}`;
        await page.goto(reportHtmlPath, { waitUntil: 'networkidle0' });

        // Generate the PDF with specified formatting
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
        });

        await browser.close();

        // Send the PDF as a response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="Singtel_Report.pdf"');
        res.send(pdfBuffer);
    } catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).json({ error: 'Failed to generate PDF report' });
    }
};

// Helper function to get all AI recommendations
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

// Helper function to generate AI recommendations for each category
async function generateAIRecommendations(data, category) {
    const prompt = `Based on the following data for Singtel:
    - Total Energy Consumption: ${data.totalEnergy} MWh
    - Total CO2 Emissions: ${data.co2Emissions} Tons
    - Current Progress: ${data.currentProgress}%
    
    Provide two specific recommendations for ${category} with actionable steps.`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
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

// Helper function to generate a conclusion
async function generateConclusion(totalEnergy, totalCO2) {
    const prompt = `Given the total energy consumption of ${totalEnergy} MWh and CO2 emissions of ${totalCO2} tons, provide a conclusion on Singtel’s sustainability progress and suggest predictive actions for further reducing emissions.`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 150,
            temperature: 0.7
        });
        return response.choices[0].message.content;
    } catch (error) {
        console.error("Error generating conclusion:", error);
        throw error;
    }
}

module.exports = {
    generateReportData,
    forceGenerateReportData,
    generateReportPDF,
};