// Required dependencies
const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI(process.env.OPENAI_API_KEY);

const handleChatbotMessage = async (req, res) => {
    const { userMessage } = req.body;

    // Formulate the prompt for OpenAI
    const prompt = `User message: "${userMessage}"
    Provide a concise and helpful response to the user's inquiry.`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 150,
            temperature: 0.5,
        });

        // Extract and send back the response
        const botReply = response.choices[0].message.content.trim();
        res.json({ reply: botReply });
    } catch (error) {
        console.error("Error generating chatbot response:", error);
        res.status(500).json({ error: 'Failed to generate chatbot response' });
    }
};

module.exports = {
    handleChatbotMessage,
};  