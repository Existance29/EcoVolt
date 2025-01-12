const Report = require('../models/report');
const OpenAI = require('openai');
const puppeteer = require('puppeteer');
const moment = require('moment');
require('dotenv').config();
const path = require('path');

const openai = new OpenAI(process.env.OPENAI_API_KEY);

const getAllReport = async (company_id, year = null) => {
    try {
        const reports = await Report.getAllReport(company_id, year);
        return reports;
    } catch (error) {
        console.error("Error fetching all report data:", error);
        throw error;
    }
};

// Function to generate data analysis for Data Overview
async function generateDataAnalysis(monthlyEnergy, monthlyCO2, companyName) {
    const prompt = `Analyze the following energy and CO2 emission data for ${companyName}:
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

// Function to generate predictions using OpenAI
const generatePredictionToNetZero = async (req, res) => {
    console.log('Request params:', req.params);

    const { company_id } = req.params;
    const emissionFactor = 0.5; // Example emission factor (kg CO2e per kWh)

    if (!company_id) {
        return res.status(400).json({ error: 'Company ID is required in the route parameter.' });
    }

    try {
        const reports = await Report.getAllReport(company_id);

        if (reports.length === 0) {
            return res.status(404).json({ error: 'No report data found for the specified company.' });
        }

        const years = [];
        const yearlyEnergy = [];
        const yearlyCO2 = [];
        const yearlyCarbonEmissions = [];

        // Aggregate actual data by year
        reports.forEach(report => {
            const year = moment(report.date).format('YYYY');
            const yearIndex = years.indexOf(year);

            if (yearIndex === -1) {
                years.push(year);
                const energy = report.totalEnergyKWH || 0;
                const carbonEmissions = (energy * emissionFactor) / 1000; // Convert to tons
                yearlyEnergy.push(energy);
                yearlyCO2.push(report.co2EmissionsTons || 0);
                yearlyCarbonEmissions.push(carbonEmissions);
            } else {
                yearlyEnergy[yearIndex] += report.totalEnergyKWH || 0;
                yearlyCO2[yearIndex] += report.co2EmissionsTons || 0;
                yearlyCarbonEmissions[yearIndex] += (report.totalEnergyKWH || 0) * emissionFactor / 1000;
            }
        });

        // Format historical data for OpenAI
        const historicalData = years.map((year, index) => ({
            year,
            totalEnergyKWH: yearlyEnergy[index],
            co2EmissionsTons: yearlyCO2[index],
            carbonEmissionsTons: yearlyCarbonEmissions[index],
        }));

        // Send data to OpenAI for prediction
        const prompt = `
You are an AI trained in sustainability data analysis. Based on the following historical energy and carbon emission data, predict the yearly trend until the company reaches net-zero carbon emissions. Provide the results as an array of JSON objects with "year" and "predictedCarbonEmissionsTons".

Historical data:
${JSON.stringify(historicalData, null, 2)}

Ensure the carbon emissions reach near zero in the predictions and consider a gradual reduction rate.`;

        const aiResponse = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 1500,
        });

        const predictions = JSON.parse(aiResponse.choices[0].message.content);

        // Combine actual and predicted data
        const result = {
            actualYears: years,
            actualCarbonEmissions: yearlyCarbonEmissions,
            predictedYears: predictions.map(item => item.year),
            predictedCarbonEmissions: predictions.map(item => item.predictedCarbonEmissionsTons),
        };

        res.status(200).json(result);
    } catch (error) {
        console.error("Error generating prediction data:", error);
        res.status(500).json({ error: 'Failed to generate prediction data.' });
    }
};

// Generate report data with optional caching in session
const generateReportData = async (req, res) => {
    const { company_id } = req.params;
    const year = req.query.year;
    const currentTime = new Date();
    const oneHour = 60 * 60 * 1000;

    // Check for cached data
    if (req.session.reportData && req.session.reportData[year] && req.session.reportData[year].timestamp) {
        const reportAge = currentTime - new Date(req.session.reportData[year].timestamp);
        if (reportAge < oneHour) {
            console.log(`Serving cached report data for year ${year} from session.`);
            return res.status(200).json(req.session.reportData[year].data);
        }
    }

    try {
        // Fetch current year data
        const reports = await Report.getAllReport(company_id, year);
        if (!reports || reports.length === 0) {
            return res.status(404).json({ error: `No report data found for the year ${year}.` });
        }

        const previousYear = parseInt(year) - 1;
        let previousYearReports = [];
        let previousYearMetrics = {};

        try {
            previousYearReports = await Report.getAllReport(company_id, previousYear);
            if (previousYearReports.length > 0) {
                previousYearMetrics = await Report.getEfficiencyMetricsComparison(company_id, previousYear);
            }
        } catch (error) {
            console.warn(`No data available for the year ${previousYear}. Skipping comparison.`);
            previousYearReports = [];
            previousYearMetrics = {};
        }

        // Fetch efficiency metrics for the current year
        const currentYearMetrics = await Report.getEfficiencyMetricsComparison(company_id, year);
        
        if (previousYearReports.length === 0) {
            performanceSummary.totalEnergy.percentageChange = null;
            performanceSummary.co2Emissions.percentageChange = null;
        }
        
        // Process data
        const companyName = reports[0]?.companyName || 'Company';
        const months = [];
        const monthlyEnergy = [];
        const monthlyCO2 = [];
        let totalEnergy = 0;
        let totalCO2 = 0;

        reports.forEach(report => {
            const month = moment(report.date).format('MMM YYYY');
            const index = months.indexOf(month);
            if (index === -1) {
                months.push(month);
                monthlyEnergy.push(report.totalEnergyKWH || 0);
                monthlyCO2.push(report.co2EmissionsTons || 0);
            } else {
                monthlyEnergy[index] += report.totalEnergyKWH || 0;
                monthlyCO2[index] += report.co2EmissionsTons || 0;
            }
            totalEnergy += report.totalEnergyKWH || 0;
            totalCO2 += report.co2EmissionsTons || 0;
        });

        // Performance summary
        const performanceSummary = {
            totalEnergy: {
                current: totalEnergy,
                previous: previousYearReports.reduce((sum, r) => sum + (r.totalEnergyKWH || 0), 0),
                percentageChange: previousYearReports.length > 0
                    ? ((totalEnergy -
                        previousYearReports.reduce((sum, r) => sum + (r.totalEnergyKWH || 0), 0)) /
                        (previousYearReports.reduce((sum, r) => sum + (r.totalEnergyKWH || 0), 0) || 1)) *
                        100
                    : null,
            },
            co2Emissions: {
                current: totalCO2,
                previous: previousYearReports.reduce((sum, r) => sum + (r.co2EmissionsTons || 0), 0),
                percentageChange: previousYearReports.length > 0
                    ? ((totalCO2 -
                        previousYearReports.reduce((sum, r) => sum + (r.co2EmissionsTons || 0), 0)) /
                        (previousYearReports.reduce((sum, r) => sum + (r.co2EmissionsTons || 0), 0) || 1)) *
                        100
                    : null,
            },
            efficiencyMetrics: {
                PUE: {
                    current: currentYearMetrics.PUE || null,
                    previous: previousYearMetrics.PUE || null,
                    percentageChange: currentYearMetrics.PUE && previousYearMetrics.PUE
                        ? ((currentYearMetrics.PUE - previousYearMetrics.PUE) / previousYearMetrics.PUE) * 100
                        : null,
                },
                CUE: {
                    current: currentYearMetrics.CUE || null,
                    previous: previousYearMetrics.CUE || null,
                    percentageChange: currentYearMetrics.CUE && previousYearMetrics.CUE
                        ? ((currentYearMetrics.CUE - previousYearMetrics.CUE) / previousYearMetrics.CUE) * 100
                        : null,
                },
                WUE: {
                    current: currentYearMetrics.WUE || null,
                    previous: previousYearMetrics.WUE || null,
                    percentageChange: currentYearMetrics.WUE && previousYearMetrics.WUE
                        ? ((currentYearMetrics.WUE - previousYearMetrics.WUE) / previousYearMetrics.WUE) * 100
                        : null,
                },
            },
        };  
        console.log("Year:", year,performanceSummary)

        // Generate other sections
        const executiveSummary = await generateExecutiveSummary(totalEnergy, totalCO2, months, monthlyEnergy, monthlyCO2, companyName);
        const dataAnalysis = await generateDataAnalysis(monthlyEnergy, monthlyCO2, companyName);
        const recommendations = await getAllAIRecommendations({ totalEnergy, co2Emissions: totalCO2 });
        const conclusion = await generateConclusion(totalEnergy, totalCO2, recommendations);

        const reportData = {
            months,
            monthlyEnergy,
            monthlyCO2,
            totalEnergy,
            totalCO2,
            executiveSummary,
            dataAnalysis,
            recommendations,
            conclusion,
            performanceSummary,
            reportData: reports,
        };

        // Cache the data
        if (!req.session.reportData) req.session.reportData = {};
        req.session.reportData[year] = { data: reportData, timestamp: currentTime };

        res.status(200).json(reportData);
    } catch (error) {
        console.error("Error fetching report data:", error);
        res.status(500).json({ error: 'Failed to fetch report data.' });
    }
};


// Forcefully generate new report data
const forceGenerateReportData = async (req, res) => {
    await generateReportData(req, res);
};

// Generate PDF report
const generateReportPDF = async (req, res) => {
    const { company_id } = req.params;

    try {
        const reports = await Report.getAllReport(company_id);

        if (reports.length === 0) {
            return res.status(404).json({ error: 'No report data found for the specified company.' });
        }

        const companyName = reports[0].companyName;

        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        // Pass companyName as a query parameter to the report HTML path
        const reportHtmlPath = `file://${path.resolve(__dirname, '..', 'public', 'report.html')}?companyName=${encodeURIComponent(companyName)}`;

        await page.goto(reportHtmlPath, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
        });

        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${companyName}_Report.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).json({ error: 'Failed to generate PDF report' });
    }
};

// function to get exactly 5 AI recommendations, one from each category
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
                return detailedRecommendation || `Recommendation for ${category} is unavailable.`;
            })
        );

        return recommendations;
    } catch (error) {
        console.error("Error generating recommendations:", error);
        return [];
    }
};

// function to generate a detailed AI recommendation for each category
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

// function to generate a conclusion
async function generateConclusion(totalEnergy, totalCO2, recommendations) {
    let conclusion = '';
    let retries = 0;

    while (conclusion.length < 300 && retries < 3) { // Ensure minimum length and limit retries
        try {
            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: `
                    Provide a final, structured conclusion for the Singtel Sustainability Report, including:
                    - Total energy consumption ${totalEnergy.toLocaleString()} kWh and CO2 emissions ${totalCO2.toFixed(2)} tons
                    - Highlights of recommendations and their intended impact.
                    - Predictive actions to achieve net-zero goals by adopting renewables, enhancing energy efficiency, and reducing emissions.
                ` }],
                max_tokens: 250,
                temperature: 0.7
            });
            
            conclusion = response.choices[0].message.content;
            retries++;
        } catch (error) {
            console.error("Error generating conclusion, retrying...", error);
        }
    }

    if (!conclusion) {
        throw new Error("Failed to generate a complete conclusion after multiple attempts.");
    }

    return conclusion;
}

// Function to generate an executive summary
async function generateExecutiveSummary(totalEnergy, totalCO2, months, monthlyEnergy, monthlyCO2, companyName) {
    const prompt = `Generate a concise executive summary for ${companyName}'s energy consumption and CO2 emissions report based on the following data:
    - Total Energy Consumption: ${totalEnergy.toLocaleString()} kWh
    - Total CO2 Emissions: ${totalCO2.toFixed(2)} tons
    - Monthly Energy Consumption: ${monthlyEnergy.join(", ")} kWh for months ${months.join(", ")}
    - Monthly CO2 Emissions: ${monthlyCO2.join(", ")} tons for months ${months.join(", ")}

    The summary should highlight any notable trends or changes over time, with insights on how ${companyName}'s energy consumption and emissions have evolved.`;

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


const getAvailableYears = async (req, res) => {
    try {
        const { company_id } = req.params;

        if (!company_id) {
            return res.status(400).json({ error: 'Company ID is required in the route parameter.' });
        }

        const years = await Report.getDistinctYears(company_id); // Ensure Report.getDistinctYears is implemented correctly
        res.status(200).json(years);
    } catch (error) {
        console.error("Error fetching available years:", error);
        res.status(500).json({ error: 'Failed to fetch available years.' });
    }
};




module.exports = {
    getAllReport,
    generateReportData,
    forceGenerateReportData,
    generateReportPDF,
    generatePredictionToNetZero,
    getAvailableYears,
};