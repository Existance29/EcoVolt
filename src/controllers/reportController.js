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


// // Generate report data with optional caching in session
// const generateReportData = async (req, res) => {
//     const { company_id } = req.params;
//     const year = req.query.year;
//     const currentTime = new Date();
//     const oneHour = 60 * 60 * 1000;

//     // Check for cached data
//     if (req.session.reportData && req.session.reportData[year] && req.session.reportData[year].timestamp) {
//         const reportAge = currentTime - new Date(req.session.reportData[year].timestamp);
//         if (reportAge < oneHour) {
//             console.log(`Serving cached report data for year ${year} from session.`);
//             return res.status(200).json(req.session.reportData[year].data);
//         }
//     }

//     try {
//         // Fetch current year data
//         const reports = await Report.getAllReport(company_id, year);
//         if (!reports || reports.length === 0) {
//             return res.status(404).json({ error: `No report data found for the year ${year}.` });
//         }

//         // Fetch monthly CO2 emissions for the year
//         const emissions = await Report.getMonthlyCarbonEmissions(company_id, year);
//         const monthlyCO2 = emissions.map((entry) => ({
//             month: `${entry.year}-${entry.month.toString().padStart(2, '0')}`,
//             dataCenterCO2: entry.dataCenterCO2Emissions,
//             cellTowerCO2: entry.cellTowerCO2Emissions,
//             totalCO2: entry.dataCenterCO2Emissions + entry.cellTowerCO2Emissions,
//         }));

//         const energy = await Report.getMonthlyEnergyConsumption(company_id, year);
//         const monthlyEnergy = energy.map((entry) => ({
//             month: `${entry.year}-${entry.month.toString().padStart(2, '0')}`,
//             dataCenterEnergy: entry.dataCenterEnergyConsumption,
//             cellTowerEnergy: entry.cellTowerEnergyConsumption,
//             totalEnergy: entry.dataCenterEnergyConsumption + entry.cellTowerEnergyConsumption
//         }))

//         // Initialize totals
//         const companyName = reports[0]?.companyName || 'Company';
//         const months = [];
        

//         reports.forEach((report) => {
//             const month = moment(report.date).format('MMM YYYY');
//             const index = months.indexOf(month);
//             if (index === -1) {
//                 months.push(month);
//             } 
//         });

//         // Fetch efficiency metrics for the current year
//         const currentYearMetrics = await Report.getEfficiencyMetricsComparison(company_id, year);

//         // Fetch previous year data for comparison
//         const previousYear = parseInt(year) - 1;
//         const previousYearReports = await Report.getAllReport(company_id, previousYear).catch(() => []);
//         const previousYearMetrics = previousYearReports.length > 0
//             ? await Report.getEfficiencyMetricsComparison(company_id, previousYear)
//             : {};

//         const totalPreviousYearEnergy = previousYearReports.reduce((sum, report) => sum + (report.totalEnergyKWH || 0), 0);
//         const totalPreviousYearCO2 = previousYearReports.length > 0
//             ? await Report.getTotalCarbonEmissions(company_id, previousYear)
//             : { totalCO2Emissions: 0 };

//         // Performance summary
//         const performanceSummary = {
//             totalEnergy: {
//                 current: monthlyCO2.reduce((sum, item) => sum + item.totalEnergy, 0),
//                 previous: totalPreviousYearEnergy,
//                 percentageChange: totalPreviousYearEnergy
//                     ? ((monthlyEnergy.reduce((sum, item) => sum + item.totalEnergy, 0) - totalPreviousYearEnergy) / totalPreviousYearEnergy) * 100
//                     : "Not Applicable",
//             },
//             co2Emissions: {
//                 current: monthlyCO2.reduce((sum, item) => sum + item.totalCO2, 0),
//                 previous: totalPreviousYearCO2.totalCO2Emissions || 0,
//                 percentageChange: totalPreviousYearCO2.totalCO2Emissions
//                     ? ((monthlyCO2.reduce((sum, item) => sum + item.totalCO2, 0) - totalPreviousYearCO2.totalCO2Emissions) /
//                         totalPreviousYearCO2.totalCO2Emissions) * 100
//                     : "Not Applicable",
//             },
//             efficiencyMetrics: {
//                 PUE: {
//                     current: currentYearMetrics.PUE || null,
//                     previous: previousYearMetrics.PUE || null,
//                     percentageChange: currentYearMetrics.PUE && previousYearMetrics.PUE
//                         ? ((currentYearMetrics.PUE - previousYearMetrics.PUE) / previousYearMetrics.PUE) * 100
//                         : "Not Applicable",
//                 },
//                 CUE: {
//                     current: currentYearMetrics.CUE || null,
//                     previous: previousYearMetrics.CUE || null,
//                     percentageChange: currentYearMetrics.CUE && previousYearMetrics.CUE
//                         ? ((currentYearMetrics.CUE - previousYearMetrics.CUE) / previousYearMetrics.CUE) * 100
//                         : "Not Applicable",
//                 },
//                 WUE: {
//                     current: currentYearMetrics.WUE || null,
//                     previous: previousYearMetrics.WUE || null,
//                     percentageChange: currentYearMetrics.WUE && previousYearMetrics.WUE
//                         ? ((currentYearMetrics.WUE - previousYearMetrics.WUE) / previousYearMetrics.WUE) * 100
//                         : "Not Applicable",
//                 },
//             },
//         };

//         // Generate other sections
//         const executiveSummary = await generateExecutiveSummary(
//             monthlyEnergy.map((item) => item.totalEnergy),
//             performanceSummary.co2Emissions.current,
//             months,
//             monthlyEnergy,
//             monthlyCO2.map((item) => item.totalCO2),
//             companyName
//         );
//         const dataAnalysis = await generateDataAnalysis(
//             monthlyEnergy,
//             monthlyCO2.map((item) => item.totalCO2),
//             companyName
//         );
//         const recommendations = await getAllAIRecommendations({
//             totalEnergy: monthlyEnergy.map((item) => item.totalEnergy),
//             co2Emissions: performanceSummary.co2Emissions.current,
//         });
//         const conclusion = await generateConclusion(
//             monthlyEnergy.map((item) => item.totalEnergy),
//             performanceSummary.co2Emissions.current,
//             recommendations
//         );

//         const reportData = {
//             year,
//             months,
//             monthlyEnergy,
//             monthlyCO2,
//             totalEnergy: performanceSummary.totalEnergy.current,
//             totalCO2: performanceSummary.co2Emissions.current,
//             executiveSummary,
//             dataAnalysis,
//             recommendations,
//             conclusion,
//             performanceSummary,
//             reportData: reports,
//             emissions,
//         };

//         // Cache the data
//         if (!req.session.reportData) req.session.reportData = {};
//         req.session.reportData[year] = { data: reportData, timestamp: currentTime };

//         res.status(200).json(reportData);
//     } catch (error) {
//         console.error("Error fetching report data:", error);
//         res.status(500).json({ error: 'Failed to fetch report data.' });
//     }
// };

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

        // Fetch monthly CO2 emissions for the year
        const emissions = await Report.getMonthlyCarbonEmissions(company_id, year);
        const monthlyCO2 = emissions.map((entry) => ({
            month: `${entry.year}-${entry.month.toString().padStart(2, '0')}`,
            dataCenterCO2: entry.dataCenterCO2Emissions,
            cellTowerCO2: entry.cellTowerCO2Emissions,
            totalCO2: entry.dataCenterCO2Emissions + entry.cellTowerCO2Emissions,
        }));

        // Fetch monthly energy consumption for the year
        const energy = await Report.getMonthlyEnergyConsumption(company_id, year);
        const monthlyEnergy = energy.map((entry) => ({
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
            monthlyEnergy.map((item) => item.totalEnergy),
            performanceSummary.co2Emissions.current,
            months,
            monthlyEnergy,
            monthlyCO2.map((item) => item.totalCO2),
            companyName
        );
        const dataAnalysis = await generateDataAnalysis(
            monthlyEnergy,
            monthlyCO2.map((item) => item.totalCO2),
            companyName
        );
        const recommendations = await getAllAIRecommendations({
            totalEnergy: monthlyEnergy.map((item) => item.totalEnergy),
            co2Emissions: performanceSummary.co2Emissions.current,
        });
        const conclusion = await generateConclusion(
            monthlyEnergy.map((item) => item.totalEnergy),
            performanceSummary.co2Emissions.current,
            recommendations
        );

        const reportData = {
            year,
            months,
            monthlyEnergy,
            monthlyCO2,
            totalEnergy,
            totalCO2: performanceSummary.co2Emissions.current,
            executiveSummary,
            dataAnalysis,
            recommendations,
            conclusion,
            performanceSummary,
            reportData: reports,
            emissions,
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

const getEnergyBreakdown = async (req, res) => {
    const { company_id } = req.params;
    const { year, month } = req.query;

    if (!company_id || !year || !month) {
        return res.status(400).json({ error: 'Company ID, year, and month are required parameters.' });
    }

    try {
        const data = await Report.getMonthlyEnergyBreakdown(company_id, year, month);
        if (!data) {
            return res.status(404).json({ error: `No data found for ${month}-${year}.` });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error("Error fetching energy breakdown:", error);
        res.status(500).json({ error: 'Failed to fetch energy breakdown for the specified month.' });
    }
};


module.exports = {
    getAllReport,
    generateReportData,
    forceGenerateReportData,
    generateReportPDF,
    getAvailableYears,
    getEnergyBreakdown
};