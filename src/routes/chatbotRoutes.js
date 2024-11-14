const chatbotController = require('../controllers/chatbotController.js');

const chatbotRoute = (app) => {
    app.post('/chatbot', chatbotController.handleChatbotMessage); // General chatbot endpoint
    app.post('/chatbot/report', chatbotController.handleChatbotMessage); // Specific for report data
    app.post('/chatbot/dashboard-summary', chatbotController.handleChatbotMessage); // Specific for dashboard summary
};

module.exports = chatbotRoute;