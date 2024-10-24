const Report = require('../models/report');

const getAllReport = async (req, res) => {
    try {
        const reports = await Report.getAllReport();
        res.status(200).json(reports);
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
}

module.exports = {
    getAllReport
};