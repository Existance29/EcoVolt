const OpenAI = require('openai');
const stringSimilarity = require('string-similarity'); // Import the string-similarity library
const overviewDashboardController = require('./overviewDashboardController');

const openai = new OpenAI(process.env.OPENAI_API_KEY);

const handleChatbotMessage = async (req, res) => {
    const { userMessage, reportData } = req.body; // Expect reportData from the front end
    const companyId = req.headers['company-id'];
    let contextData = "";

    if (!companyId) {
        return res.status(400).json({ error: "Company ID is required" });
    }

    if (!reportData) {
        return res.status(400).json({ error: "Report data is required from the front end." });
    }

    try {
        // Fetch dashboard summary
        const dashboardSummary = await overviewDashboardController.getDashboardSummaryDataOnly(companyId);

        // Safely access reportData properties
        const totalCO2 = reportData.totalCO2 || "N/A";
        const totalEnergy = reportData.totalEnergy || "N/A";
        const recommendations = reportData.recommendations || [];
        const description = reportData.description || "No detailed energy breakdown available.";
        const renewableEnergy = reportData.performanceSummary?.renewableEnergy?.current || "N/A";

        const { highestDataCenter, highestCellTower } = dashboardSummary;

        // Predefined intent keywords and responses
        const intents = {
            "highest emission": () =>
                highestDataCenter && highestCellTower
                    ? `The highest-emitting data center is ${highestDataCenter.data_center_name} with ${highestDataCenter.co2_emissions_tons} tons, and the highest-emitting cell tower is ${highestCellTower.cell_tower_name} with ${highestCellTower.total_emissions} kg.`
                    : "I'm unable to retrieve the highest emission data at the moment.",
            "total emission": () =>
                `The total emissions for the year are ${totalCO2.toFixed(2)} tons, with a total energy consumption of ${totalEnergy.toLocaleString()} kWh.`,
            "energy breakdown": () => description,
            "recommendations": () =>
                recommendations.length > 0
                    ? `Here are the top recommendations for optimizing energy usage and reducing emissions:\n- ${recommendations.map((rec, idx) => `(${idx + 1}) ${rec.recommendation}`).join("\n- ")}`
                    : "Currently, there are no specific recommendations available.",
            "net zero": () => {
                // Calculate net zero progress
                const sustainabilityGoals = dashboardSummary.sustainabilityGoals || [];
                if (sustainabilityGoals.length === 0) {
                    return "There is no available data on sustainability goals at the moment.";
                }

                let weightedTotalProgress = 0;
                let totalWeight = 0;

                sustainabilityGoals.forEach((goal) => {
                    let progressPercentage = 0;

                    if (goal.goal_name === "Renewable Energy Usage") {
                        progressPercentage = goal.current_value >= goal.target_value
                            ? 100
                            : (goal.current_value / goal.target_value) * 100;
                    } else {
                        progressPercentage = goal.current_value <= goal.target_value
                            ? 100
                            : (goal.target_value / goal.current_value) * 100;
                    }

                    const weight = goal.weight || 1;
                    weightedTotalProgress += Math.min(progressPercentage, 100) * weight;
                    totalWeight += weight;
                });

                const averageProgress = (weightedTotalProgress / totalWeight).toFixed(1);
                return `The current progress towards net zero is at ${averageProgress}%.`;
            }
        };

        // Get user intent with fuzzy matching
        const intentKeys = Object.keys(intents);
        const matchedIntent = stringSimilarity.findBestMatch(
            userMessage.toLowerCase(),
            intentKeys
        );

        if (matchedIntent.bestMatch.rating >= 0.6) {
            // If confidence in the match is 60% or higher, use the matched intent
            contextData = intents[matchedIntent.bestMatch.target]();
        } else {
            // Default response for unmatched intents
            contextData = "I can provide insights on highest emissions, total emissions, energy breakdown, recommendations, or progress towards net-zero. Let me know what you'd like to learn more about!";
        }

        // Construct OpenAI Prompt
        const prompt = `User message: "${userMessage}"
        Context: ${contextData}
        Provide a clear, concise, and helpful response.`;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 200,
            temperature: 0.5,
        });

        const botReply = response.choices[0].message.content.trim();
        return res.json({ reply: botReply });
    } catch (error) {
        console.error("Error processing chatbot message:", error);
        return res.status(500).json({ error: "Failed to process chatbot message." });
    }
};

module.exports = {
    handleChatbotMessage,
};