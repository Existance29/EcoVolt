const OpenAI = require("openai");
const stringSimilarity = require("string-similarity");
const overviewDashboardController = require("./overviewDashboardController");
const intentsData = require("../database/intents.json"); // Import intents JSON

const openai = new OpenAI(process.env.OPENAI_API_KEY);

const handleChatbotMessage = async (req, res) => {
    const { userMessage, reportData } = req.body; // User message and company data
    const companyId = req.headers["company-id"];
    let contextData = "";

    if (!companyId) {
        return res.status(400).json({ error: "Company ID is required" });
    }

    if (!reportData) {
        return res.status(400).json({ error: "Report data is required from the front end." });
    }

    try {
        const dashboardSummary = await overviewDashboardController.getDashboardSummaryDataOnly(companyId);
        // Safely access reportData properties
        const totalCO2 = reportData.totalCO2 || "N/A";
        const totalEnergy = reportData.totalEnergy || "N/A";
        const recommendations = reportData.recommendations || [];
        const description = reportData.description || "No detailed energy breakdown available.";
        const renewableEnergy = reportData.performanceSummary?.renewableEnergy?.current || "N/A";
        const monthlyEnergyBreakdown = reportData.monthlyEnergyBreakdown || [];
        const totalDataCenterCO2 = reportData.totalDataCenterCO2 || "N/A";
        const totalCellTowerCO2 = reportData.totalCellTowerCO2 || "N/A";
        const totalDataCenterEnergy = reportData.totalDataCenterEnergy || "N/A";
        const totalCellTowerEnergy = reportData.totalCellTowerEnergy || "N/A";
        // Calculate total energy breakdown
        const totalEnergyBreakdown = monthlyEnergyBreakdown.reduce(
            (totals, monthData) => {
                totals.radioEquipment += monthData.radioEquipment || 0;
                totals.cooling += monthData.cooling || 0;
                totals.backupPower += monthData.backupPower || 0;
                totals.misc += monthData.misc || 0;
                return totals;
            },
            { radioEquipment: 0, cooling: 0, backupPower: 0, misc: 0 }
        );

        const totalEnergyBreakdownText = `
            Total Energy Breakdown for this year:
            - Radio Equipment: ${totalEnergyBreakdown.radioEquipment.toFixed(2)} kWh
            - Cooling: ${totalEnergyBreakdown.cooling.toFixed(2)} kWh
            - Backup Power: ${totalEnergyBreakdown.backupPower.toFixed(2)} kWh
            - Miscellaneous: ${totalEnergyBreakdown.misc.toFixed(2)} kWh
        `;

        // Create the monthly energy breakdown text with explicit "NEW PARAGRAPH" markers
        const monthlyEnergyBreakdownText = monthlyEnergyBreakdown
            .map(
                (monthData) => `
                    NEW PARAGRAPH
                    Month: ${monthData.month}
                    - Radio Equipment: ${monthData.radioEquipment.toFixed(2)} kWh
                    - Cooling: ${monthData.cooling.toFixed(2)} kWh
                    - Backup Power: ${monthData.backupPower.toFixed(2)} kWh
                    - Miscellaneous: ${monthData.misc.toFixed(2)} kWh`
            )
            .join("");

        // Dynamic values for response placeholders
        const dynamicValues = {
            highestDataCenterName: dashboardSummary.highestDataCenter?.data_center_name || "N/A",
            highestDataCenterCO2: dashboardSummary.highestDataCenter?.co2_emissions_tons || "N/A",
            highestCellTowerName: dashboardSummary.highestCellTower?.cell_tower_name || "N/A",
            highestCellTowerCO2: dashboardSummary.highestCellTower?.total_emissions || "N/A",
            totalCO2: totalCO2.toFixed(2),
            totalEnergy: totalEnergy.toLocaleString(),
            description,
            recommendationsList: recommendations
                .map((rec, idx) => `(${idx + 1}) ${rec.recommendation}`)
                .join("\n- "),
            netZeroProgress: calculateNetZeroProgress(dashboardSummary),
            totalEnergyBreakdown: totalEnergyBreakdownText,
            monthlyEnergyBreakdown: monthlyEnergyBreakdownText,
            totalrenewableEnergy: renewableEnergy,
            totalDataCenterCO2: totalDataCenterCO2,
            totalCellTowerCO2: totalCellTowerCO2,
            totalDataCenterEnergy: totalDataCenterEnergy,
            totalCellTowerEnergy: totalCellTowerEnergy
        };

        // Parse intents from JSON
        const intents = intentsData.intents;

        // Match user intent with fuzzy matching
        const intentKeys = Object.keys(intents);
        const matchedIntent = stringSimilarity.findBestMatch(
            userMessage.toLowerCase(),
            intentKeys
        );

        if (matchedIntent.bestMatch.rating >= 0.5) {
            const matchedKey = matchedIntent.bestMatch.target;
            const intent = intents[matchedKey];

            // Handle specific keywords in user input
            if (matchedKey === "energy breakdown") {
                contextData = `Here is the total energy breakdown for the specified period:\n\n${dynamicValues.totalEnergyBreakdown}`;
            } else if (matchedKey === "monthly energy breakdown") {
                contextData = `Here is the detailed monthly energy breakdown:\n\n${dynamicValues.monthlyEnergyBreakdown}`;
            } else {
                const isCompanySpecific = /company|our/.test(userMessage.toLowerCase());
                if (isCompanySpecific && intent.contextualResponses?.company) {
                    contextData = replacePlaceholders(intent.contextualResponses.company, dynamicValues);
                } else {
                    contextData = replacePlaceholders(intent.response, dynamicValues);
                }
            }
        } else {
            contextData = intents["default"].response;
        }

        // Construct OpenAI Prompt
        const prompt = `User message: "${userMessage}"
        Context: ${contextData}
        Provide a clear, concise, and well-formatted response.`;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 400, // Increased for detailed responses
            temperature: 0.5,
        });

        const botReply = response.choices[0].message.content.trim();
        return res.json({ reply: botReply });
    } catch (error) {
        console.error("Error processing chatbot message:", error);
        return res.status(500).json({ error: "Failed to process chatbot message." });
    }
};

// Helper Function: Replace Placeholders
const replacePlaceholders = (responseTemplate, dynamicValues) =>
    responseTemplate.replace(/{{(.*?)}}/g, (_, key) => dynamicValues[key] || "N/A");

// Helper Function: Calculate Net Zero Progress
const calculateNetZeroProgress = (reportData) => {
    const sustainabilityGoals = reportData.sustainabilityGoals || [];

    if (sustainabilityGoals.length === 0) {
        return "No data available";
    }

    let weightedTotalProgress = 0;
    let totalWeight = 0;

    sustainabilityGoals.forEach((goal) => {
        let progressPercentage = 0;

        // Ensure target_value and current_value are properly defined
        if (goal.target_value && goal.current_value) {
            if (goal.goal_name === "Renewable Energy Usage") {
                progressPercentage =
                    goal.current_value >= goal.target_value
                        ? 100
                        : (goal.current_value / goal.target_value) * 100;
            } else {
                progressPercentage =
                    goal.current_value <= goal.target_value
                        ? 100
                        : (goal.target_value / goal.current_value) * 100;
            }
        } else {
            console.warn(`Goal "${goal.goal_name}" has missing values for target or current.`);
        }

        const weight = goal.weight || 1; // Default weight is 1 if undefined
        weightedTotalProgress += Math.min(progressPercentage, 100) * weight;
        totalWeight += weight;
    });

    if (totalWeight === 0) {
        console.warn("No valid weights found for sustainability goals.");
        return "No data available";
    }

    // Calculate the weighted average progress
    const averageProgress = (weightedTotalProgress / totalWeight).toFixed(1);
    return `${averageProgress}%`;
};

module.exports = {
    handleChatbotMessage,
};