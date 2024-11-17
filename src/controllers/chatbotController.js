const OpenAI = require('openai');
const overviewDashboardController = require('./overviewDashboardController');

const openai = new OpenAI(process.env.OPENAI_API_KEY);

const handleChatbotMessage = async (req, res) => {
    const { userMessage } = req.body;
    const companyId = req.headers['company-id'];
    let contextData = "";

    if (!companyId) {
        return res.status(400).json({ error: "Company ID is required" });
    }

    try {
        // Fetch dashboard summary data for selective answers
        const dashboardSummary = await overviewDashboardController.getDashboardSummaryDataOnly(companyId);

        if (dashboardSummary) {
            const { highestDataCenter, highestCellTower, sustainabilityGoals, totalDataCenterEmissions, totalCellTowerEmissions, overallTotal } = dashboardSummary;

            // Intent handling
            if (/highest\s?emission/i.test(userMessage)) {
                contextData = highestDataCenter && highestCellTower
                    ? `The highest-emitting data center is ${highestDataCenter.data_center_name} with ${highestDataCenter.co2_emissions_tons} tons, and the highest-emitting cell tower is ${highestCellTower.cell_tower_name} with ${highestCellTower.total_emissions} kg.`
                    : "I'm unable to retrieve the highest emission data at the moment.";

            } else if (/total\s?emission/i.test(userMessage)) {
                contextData = `The total emissions are ${totalDataCenterEmissions || 0} tons for data centers and ${totalCellTowerEmissions || 0} kWh for cell towers, with an overall total of ${overallTotal || 0} tons/kWh.`;

            } else if (/net zero|sustainability|progress/i.test(userMessage)) {
                // Calculate net zero progress using the updated method
                let weightedTotalProgress = 0;
                let totalWeight = 0;

                sustainabilityGoals.forEach(goal => {
                    let progressPercentage = 0;

                    if (goal.goal_name === "Renewable Energy Usage") {
                        // Higher current value means better progress
                        progressPercentage = goal.current_value >= goal.target_value
                            ? 100
                            : (goal.current_value / goal.target_value) * 100;
                    } else {
                        // Lower current value means better progress
                        progressPercentage = goal.current_value <= goal.target_value
                            ? 100
                            : (goal.target_value / goal.current_value) * 100;
                    }

                    // Calculate weighted contribution
                    const weight = goal.weight || 1; // Default weight is 1
                    weightedTotalProgress += Math.min(progressPercentage, 100) * weight;
                    totalWeight += weight;
                });

                const averageProgress = (weightedTotalProgress / totalWeight).toFixed(1);
                contextData = `The current progress towards net zero is at ${averageProgress}%.`;

            } else if (/fix|solution|improve/i.test(userMessage)) {
                // Generate specific improvement suggestions for sustainability goals
                const suggestions = sustainabilityGoals.map(goal => {
                    const goalType = goal.goal_name.toLowerCase();
                    if (goalType.includes("renewable energy")) {
                        return `To improve ${goal.goal_name}, consider investing in solar or wind energy sources, optimizing energy usage during peak hours, or implementing energy-efficient equipment.`;
                    } else if (goalType.includes("carbon reduction")) {
                        return `For ${goal.goal_name}, focus on reducing emissions by transitioning to cleaner energy, enhancing equipment efficiency, or considering carbon offset programs.`;
                    } else if (goalType.includes("water usage")) {
                        return `To address ${goal.goal_name}, adopt water recycling methods, monitor water usage more closely, and consider alternative cooling systems that require less water.`;
                    }
                    return `For ${goal.goal_name}, continue monitoring progress and adjusting strategies to stay aligned with the target.`;
                });
                contextData = `Here are detailed solutions to help improve your sustainability goals:\n- ${suggestions.join("\n- ")}`;

            } else {
                // Default response if intent is unclear
                contextData = "I can provide insights on highest emissions, total emissions, net zero progress, or solutions to improve sustainability. Let me know what you would like to learn more about!";
            }
        } else {
            contextData = "I'm currently unable to retrieve the dashboard data. Please check back later.";
        }

        // Construct the prompt with context data
        const prompt = `User message: "${userMessage}"
        Context: ${contextData}
        Provide a clear, helpful response.`;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 150,
            temperature: 0.5,
        });

        const botReply = response.choices[0].message.content.trim();
        return res.json({ reply: botReply });

    } catch (error) {
        console.error("Error processing chatbot message:", error);
        return res.status(500).json({ error: 'Failed to generate chatbot response' });
    }
};

module.exports = {
    handleChatbotMessage,
};