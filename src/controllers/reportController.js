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
    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
    const currentTime = new Date();

    if (req.session.reportData && req.session.reportData.timestamp) {
        const reportAge = currentTime - new Date(req.session.reportData.timestamp);
        if (reportAge < oneHour) {
            console.log("Serving cached report data from session.");
            return res.status(200).json(req.session.reportData.data); // Serve cached data
        }
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

        const executiveSummary = await generateExecutiveSummary(totalEnergy, totalCO2, months, monthlyEnergy, monthlyCO2);
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
            executiveSummary,
            totalCO2,
            dataAnalysis,
            recommendations, // Pass recommendations directly here
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

// Helper function to get exactly 5 AI recommendations, one from each category
const getAllAIRecommendations = async (data) => {
    const categories = [
        "Energy Efficiency Improvements",
        "CO2 Emission Reduction Strategies",
        "Renewable Energy Investments",
        "Sustainable Cooling Technologies",
        "Monitoring and Reporting Practices"
    ];

    try {
        const recommendations = await Promise.all(
            categories.map(async (category, index) => {
                await new Promise(resolve => setTimeout(resolve, index * 1000)); // Delay to avoid rate limiting
                const detailedRecommendation = await generateAIRecommendations(data, category);
                console.log(`Generated Recommendation for ${category}:`, detailedRecommendation);
                return detailedRecommendation || `Recommendation for ${category} is unavailable.`;
            })
        );

        return recommendations;
    } catch (error) {
        console.error("Error generating recommendations:", error);
        return [];
    }
};

// Helper function to generate a detailed AI recommendation for each category
async function generateAIRecommendations(data, category) {
    const prompt = `Based on the following data for Singtel:
    - Total Energy Consumption: ${data.totalEnergy} MWh
    - Total CO2 Emissions: ${data.co2Emissions} Tons
    - Current Progress: ${data.currentProgress}%
    
    Provide a specific recommendation for ${category} as a JSON object with the following structure:
    {
        "recommendation": "<summary of the recommendation>",
        "actions": [
            {
                "description": "<first action step>",
                "explanation": "<why this action is effective>"
            },
            {
                "description": "<second action step>",
                "explanation": "<why this action is effective>"
            },
            ...
        ],
        "intendedImpact": "<overall impact>"
    }`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 300,
            temperature: 0.7
        });

        return JSON.parse(response.choices[0].message.content);
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

// Function to generate an executive summary
async function generateExecutiveSummary(totalEnergy, totalCO2, months, monthlyEnergy, monthlyCO2) {
    const prompt = `Generate a concise executive summary for Singtel’s energy consumption and CO2 emissions report based on the following data:
    - Total Energy Consumption: ${totalEnergy.toLocaleString()} kWh
    - Total CO2 Emissions: ${totalCO2.toFixed(2)} tons
    - Monthly Energy Consumption: ${monthlyEnergy.join(", ")} kWh for months ${months.join(", ")}
    - Monthly CO2 Emissions: ${monthlyCO2.join(", ")} tons for months ${months.join(", ")}

    The summary should highlight any notable trends or changes over time, with insights on how Singtel’s energy consumption and emissions have evolved.`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 200,
            temperature: 0.7
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error("Error generating executive summary:", error);
        throw error;
    }
}

module.exports = {
    generateReportData,
    forceGenerateReportData,
    generateReportPDF,
};