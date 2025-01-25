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
        // Fetch yearly energy breakdown to determine highestEnergyType
        const energyData = await Report.getYearlyEnergyBreakdown(company_id, year);

        const totalEnergyByType = energyData.reduce(
            (totals, monthData) => {
                totals.radioEquipment += monthData.radioEquipment || 0;
                totals.cooling += monthData.cooling || 0;
                totals.backupPower += monthData.backupPower || 0;
                totals.misc += monthData.misc || 0;
                return totals;
            },
            { radioEquipment: 0, cooling: 0, backupPower: 0, misc: 0 }
        );

        const highestEnergyType = Object.keys(totalEnergyByType).reduce((a, b) =>
            totalEnergyByType[a] > totalEnergyByType[b] ? a : b
        );

        // Fetch monthly CO2 emissions for the year
        const emissions = await Report.getMonthlyCarbonEmissions(company_id, year);
        const monthlyCO2 = emissions.map((entry) => ({
            month: `${entry.year}-${entry.month.toString().padStart(2, '0')}`,
            dataCenterCO2: entry.dataCenterCO2Emissions,
            cellTowerCO2: entry.cellTowerCO2Emissions,
            totalCO2: entry.dataCenterCO2Emissions + entry.cellTowerCO2Emissions,
        }));

        // Fetch monthly energy consumption for the year
        const Monthlyenergy = await Report.getMonthlyEnergyConsumption(company_id, year);
        const monthlyEnergy = Monthlyenergy.map((entry) => ({
            month: `${entry.year}-${entry.month.toString().padStart(2, '0')}`,
            dataCenterEnergy: entry.dataCenterEnergyConsumption,
            cellTowerEnergy: entry.cellTowerEnergyConsumption,
            totalEnergy: entry.dataCenterEnergyConsumption + entry.cellTowerEnergyConsumption,
        }));

        // Calculate total energy consumption
        const totalEnergy = monthlyEnergy.reduce((sum, entry) => sum + entry.totalEnergy, 0);
        // Initialize unique months
        const months = monthlyEnergy.map((entry) => entry.month);

        // Fetch efficiency metrics for the current year
        const currentYearMetrics = await Report.getEfficiencyMetricsComparison(company_id, year);
        const totalRenewableEnergy = await Report.getTotalRenewableEnergy(company_id, year);

        // Fetch previous year data for comparison
        const previousYear = parseInt(year) - 1;
        const previousYearReports = await Report.getAllReport(company_id, previousYear).catch(() => []);
        const previousYearMetrics = previousYearReports.length > 0
            ? await Report.getEfficiencyMetricsComparison(company_id, previousYear)
            : {};

        const totalPreviousYearCO2 = previousYearReports.length > 0
            ? await Report.getTotalCarbonEmissions(company_id, previousYear)
            : { totalCO2Emissions: 0 };

        const totalPreviousYearEnergy = previousYearReports.length > 0
            ? await Report.getTotalEnergyConsumption(company_id, previousYear)
            : { totalEnergyConsumption: 0 };

        const totalPreviousYearRenewableEnergy = previousYearReports.length > 0
            ? await Report.getTotalRenewableEnergy(company_id, previousYear)
            : { totalRenewableEnergy: 0 };
        // Performance summary
        const performanceSummary = {
            totalEnergy: {
                current: totalEnergy,
                previous: totalPreviousYearEnergy.totalEnergyConsumption || 0,
                percentageChange: totalPreviousYearEnergy.totalEnergyConsumption
                    ? ((totalEnergy - totalPreviousYearEnergy.totalEnergyConsumption) / totalPreviousYearEnergy.totalEnergyConsumption) * 100
                    : "Not Applicable",
            },
            co2Emissions: {
                current: monthlyCO2.reduce((sum, item) => sum + item.totalCO2, 0),
                previous: totalPreviousYearCO2.totalCO2Emissions || 0,
                percentageChange: totalPreviousYearCO2.totalCO2Emissions
                    ? ((monthlyCO2.reduce((sum, item) => sum + item.totalCO2, 0) - totalPreviousYearCO2.totalCO2Emissions) /
                        totalPreviousYearCO2.totalCO2Emissions) * 100
                    : "Not Applicable",
            },
            renewableEnergy: {
                current: totalRenewableEnergy.totalRenewableEnergy || 0,
                previous: totalPreviousYearRenewableEnergy.totalRenewableEnergy || 0,
                percentageChange: totalPreviousYearRenewableEnergy.totalRenewableEnergy
                    ? ((totalRenewableEnergy.totalRenewableEnergy - totalPreviousYearRenewableEnergy.totalRenewableEnergy) / totalPreviousYearRenewableEnergy.totalRenewableEnergy) * 100
                    : "Not Applicable",
            },
            efficiencyMetrics: {
                PUE: {
                    current: currentYearMetrics.PUE || null,
                    previous: previousYearMetrics.PUE || null,
                    percentageChange: currentYearMetrics.PUE && previousYearMetrics.PUE
                        ? ((currentYearMetrics.PUE - previousYearMetrics.PUE) / previousYearMetrics.PUE) * 100
                        : "Not Applicable",
                },
                CUE: {
                    current: currentYearMetrics.CUE || null,
                    previous: previousYearMetrics.CUE || null,
                    percentageChange: currentYearMetrics.CUE && previousYearMetrics.CUE
                        ? ((currentYearMetrics.CUE - previousYearMetrics.CUE) / previousYearMetrics.CUE) * 100
                        : "Not Applicable",
                },
                WUE: {
                    current: currentYearMetrics.WUE || null,
                    previous: previousYearMetrics.WUE || null,
                    percentageChange: currentYearMetrics.WUE && previousYearMetrics.WUE
                        ? ((currentYearMetrics.WUE - previousYearMetrics.WUE) / previousYearMetrics.WUE) * 100
                        : "Not Applicable",
                },
            },
        };

        // Generate other sections
        const companyName = reports[0]?.companyName || "Company";
        const executiveSummary = await generateExecutiveSummary(
            totalEnergy,
            performanceSummary.co2Emissions.current,
            months,
            monthlyEnergy.map((item) => item.totalEnergy),
            monthlyCO2.map((item) => item.totalCO2),
            companyName
        );
        const dataAnalysis = await generateDataAnalysis(
            monthlyEnergy.map((item) => item.totalEnergy),
            monthlyCO2.map((item) => item.totalCO2),
            companyName
        );
        const recommendations = await getAllAIRecommendations(
            {
                totalEnergy: totalEnergy,
                co2Emissions: monthlyCO2.reduce((sum, item) => sum + item.totalCO2, 0),
            },
            highestEnergyType // Pass the top energy contributor
        );
        const description = await generateDescription(highestEnergyType, year);

        const monthlyEnergyBreakdown = await Report.getYearlyEnergyBreakdown(company_id, year);


        const conclusion = await generateConclusion(
            totalEnergy,
            performanceSummary.co2Emissions.current,
            recommendations
        );

        const reportData = {
            year,
            months,
            monthlyEnergy,
            monthlyCO2,
            monthlyEnergyBreakdown,
            totalEnergy,
            totalCO2: performanceSummary.co2Emissions.current,
            executiveSummary,
            dataAnalysis,
            recommendations,
            conclusion,
            performanceSummary,
            reportData: reports,
            emissions,
            description
        };

        // Cache the data
        if (!req.session.reportData) req.session.reportData = {};
        req.session.reportData[year] = { data: reportData, timestamp: currentTime };

        res.status(200).json(reportData);
    } catch (error) {
        console.error("Error fetching report data:", error);
        res.status(500).json({ error: "Failed to fetch report data." });
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

// Function to get exactly 5 AI recommendations, one from each category
const getAllAIRecommendations = async (data, highestEnergyType) => {
    const categories = [
        `Advanced Efficiency Improvements for ${highestEnergyType}`,
        `Innovative Technology Upgrades for ${highestEnergyType}`,
        `Future-Oriented Sustainability Strategies for ${highestEnergyType}`,
        `Behavioral and Operational Changes for ${highestEnergyType}`,
        `Data-Driven Monitoring and Optimization of ${highestEnergyType}`,
    ];

    try {
        const recommendations = await Promise.all(
            categories.map(async (category, index) => {
                await new Promise((resolve) => setTimeout(resolve, index * 1000)); // Delay to avoid rate limiting
                const detailedRecommendation = await generateAIRecommendations(data, category, highestEnergyType);
                return detailedRecommendation || `Recommendation for ${category} is unavailable.`;
            })
        );

        return recommendations;
    } catch (error) {
        console.error("Error generating recommendations:", error);
        return [];
    }
};

function sanitizeJSON(input) {
    try {
        // Remove trailing commas inside objects or arrays
        const sanitizedInput = input.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

        // Validate JSON syntax
        JSON.parse(sanitizedInput);
        return sanitizedInput;
    } catch (error) {
        console.error("Error sanitizing JSON:", error);
        throw new Error("Invalid JSON format");
    }
}

// Function to generate a detailed AI recommendation for each category
async function generateAIRecommendations(data, category, highestEnergyType) {
    const prompt = `The company, having already implemented standard solutions, seeks cutting-edge recommendations. Based on the following data:
    - Top Energy Contributor: ${highestEnergyType}
    - Total Energy Consumption: ${data.totalEnergy} MWh
    - Total CO2 Emissions: ${data.co2Emissions} Tons

    Provide a detailed recommendation for the category: "${category}" specific to optimizing ${highestEnergyType} operations. 
    Recommendations should include:
    1. Focus on innovative solutions or emerging technologies.
    2. Assume that basic energy efficiency measures are already in place.
    3. Leverage trends in AI, automation, or renewable integration to enhance outcomes.

    Format the response as a JSON object with:
    {
        "recommendation": "<summary of the recommendation>",
        "actions": [
            {
                "description": "<specific action>",
                "explanation": "<how this action impacts energy or CO2 reduction and why it is effective>"
            }
        ],
        "intendedImpact": "<overall impact of the recommendation>"
    }`;

    let rawContent = "";

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 400,
            temperature: 0.7,
        });

        rawContent = response.choices[0].message.content;

        // Sanitize and parse JSON
        const sanitizedContent = sanitizeJSON(rawContent);
        return JSON.parse(sanitizedContent);
    } catch (error) {
        console.error(`Error parsing JSON for ${category} recommendations:`, error);
        console.error("Raw Response:", rawContent || "No raw content available");

        // Provide a fallback recommendation in case of failure
        return {
            recommendation: `Unable to generate a recommendation for "${category}" due to an error.`,
            actions: [],
            intendedImpact: "No impact data available",
        };
    }
}
// function to generate a conclusion
async function generateConclusion(totalEnergy, totalCO2, recommendations, sustainabilityContext = true) {
    let conclusion = '';
    let retries = 0;

    while (conclusion.length < 300 && retries < 3) {
        try {
            const prompt = `
                Provide a structured conclusion for the Singtel Sustainability Report, including:
                - Total energy consumption: ${totalEnergy.toLocaleString()} kWh
                - CO2 emissions: ${totalCO2.toFixed(2)} tons
                - Highlights of recommendations and their intended impact.
                ${sustainabilityContext ? `
                - Add a paragraph to include sustainability context:
                    - Highlight how reducing energy consumption aligns with sustainability goals.
                    - Link energy and emissions reductions to broader climate targets, such as:
                        "This aligns with Singtel’s commitment to supporting the UN’s Sustainable Development Goals (Goal 13: Climate Action)."
                ` : ''}
                - Predictive actions to achieve net-zero goals by adopting renewables, enhancing energy efficiency, and reducing emissions.
            `;

            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 300,
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

    The summary should highlight any notable trends or changes over time, with insights on how ${companyName}'s energy consumption and emissions have evolved.

    Additionally, include a note on how this report aligns with the Sustainability Accounting Standards Board (SASB) framework, focusing on energy consumption, renewable energy, and CO2 emissions reduction. Emphasize ${companyName}'s commitment to global climate action goals, including the UN Sustainable Development Goal 13: Climate Action.`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 250,
            temperature: 0.7
        });

        let summary = response.choices[0].message.content;

        // Remove "Executive Summary:" if present
        if (summary.startsWith("Executive Summary:")) {
            summary = summary.replace("Executive Summary:", "").trim();
        }

        return summary;
    } catch (error) {
        console.error("Error generating executive summary:", error);
        throw error;
    }
}

async function generateDescription(highestEnergyType, year) {
    const prompt = `Generate a short description for a report saying "${highestEnergyType}" is the highest contributor to energy consumption in the worst month of ${year}. Provide a concise analysis of its trend over the course of the year.`;
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 100,
            temperature: 0.7,
        });
        return response.choices[0].message.content;
    } catch (error) {
        console.error("Error generating description:", error);
        return `No description available for ${highestEnergyType}.`;
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

const getEnergyBreakdown = async (req, res) => {
    const { company_id } = req.params;
    const { year } = req.query;

    if (!company_id || !year ) {
        return res.status(400).json({ error: 'Company ID, year are required parameters.' });
    }

    try {
        const data = await Report.getMonthlyEnergyBreakdown(company_id, year);
        if (!data) {
            return res.status(404).json({ error: `No data found for ${year}.` });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error("Error fetching energy breakdown:", error);
        res.status(500).json({ error: 'Failed to fetch energy breakdown for the specified month.' });
    }
};

const getYearlyEnergyBreakdown = async (req, res) => {
    const { company_id } = req.params;
    const { year } = req.query;

    if (!company_id || !year) {
        return res.status(400).json({ error: "Company ID and year are required parameters." });
    }

    try {
        const energyData = await Report.getYearlyEnergyBreakdown(company_id, year);

        // Identify the highest energy type for the entire year
        const totalEnergyByType = energyData.reduce(
            (totals, monthData) => {
                totals.radioEquipment += monthData.radioEquipment;
                totals.cooling += monthData.cooling;
                totals.backupPower += monthData.backupPower;
                totals.misc += monthData.misc;
                return totals;
            },
            { radioEquipment: 0, cooling: 0, backupPower: 0, misc: 0 }
        );

        const highestEnergyType = Object.keys(totalEnergyByType).reduce((a, b) =>
            totalEnergyByType[a] > totalEnergyByType[b] ? a : b
        );

        // Return data filtered for the highest energy type
        const filteredData = energyData.map((monthData) => ({
            month: monthData.month,
            totalEnergy: monthData[highestEnergyType],
        }));

        res.status(200).json({ highestEnergyType, data: filteredData });
    } catch (error) {
        console.error("Error fetching yearly energy breakdown:", error);
        res.status(500).json({ error: "Failed to fetch yearly energy breakdown." });
    }
};



module.exports = {
    getAllReport,
    generateReportData,
    forceGenerateReportData,
    generateReportPDF,
    getAvailableYears,
    getEnergyBreakdown,
    getYearlyEnergyBreakdown,
    generateDescription
};