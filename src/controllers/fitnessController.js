const axios = require('axios');
require('dotenv').config();

class FitnessController {
    static async redirectToStravaAuth(req, res) {
        const authUrl = `https://www.strava.com/oauth/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}&response_type=code&scope=activity:read_all`;
        res.redirect(authUrl);
    }

    static async handleStravaCallback(req, res) {
        const { code } = req.query;
        try {
            const response = await axios.post('https://www.strava.com/oauth/token', {
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                code: code,
                grant_type: 'authorization_code',
            });

            const accessToken = response.data.access_token;
            const athleteId = response.data.athlete.id;

            // Store access token and athlete ID in the session
            req.session.accessToken = accessToken;
            req.session.athleteId = athleteId;

            // Redirect to frontend without sensitive information in the URL
            res.redirect('/fitness.html');
        } catch (err) {
            console.error('Error exchanging code for token:', err);
            res.status(500).send('Authentication failed');
        }
    }

    static async getAthleteStats(req, res) {
        const accessToken = req.session.accessToken;
        const athleteId = req.session.athleteId;

        if (!accessToken || !athleteId) {
            return res.status(401).json({ error: 'Unauthorized: Missing session data' });
        }

        try {
            const response = await axios.get(`https://www.strava.com/api/v3/athletes/${athleteId}/stats`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            const totalRides = response.data.all_ride_totals.count;
            const totalTime = response.data.all_ride_totals.moving_time; // Total time in seconds
            const totalDistance = response.data.all_ride_totals.distance; // Total distance in meters

            res.json({
                totalRides,
                totalTime,
                totalDistance,
            });
        } catch (err) {
            console.error('Error fetching athlete stats:', err);
            res.status(500).send('Failed to fetch athlete stats');
        }
    }
}

module.exports = FitnessController;
