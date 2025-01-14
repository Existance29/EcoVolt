const fitness = require("../models/fitness")
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


    static async saveUserStats(req, res) {
        const data = req.body;
        const userid = parseInt(req.user.userId);
        // console.log("Data received for saving user stats:", userid, data);
        try {
            const checkUser = await fitness.getUserStats(userid);
            let success;
            if (checkUser) {
                success = await fitness.updateUserStats(userid, data);
            }
            else {
                success = await fitness.saveUserStats(userid, data);
            }
            if (!success) {
                return res.status(400).json({ error: "Failed to save user's stats" });
            }
            res.status(200).json({ message: "Saved user's stats successfully" });
        } catch (error) {
            console.error("Error saving user stats:", error);
            res.status(500).json({ error: "Error saving user's records" });
        }
    }
       
    
    static async displayLeaderboard(req, res) {
        try {
            const data = await fitness.displayLeaderboard();
            if (!data) {
                return res.status(404).send("No records available");
            }
            res.json(data);
        } catch (error) {
            console.error(error)
            res.status(500).send("Error retrieving users' records")
        }
    }



    static async getUserRank(req, res) {
        const userid = parseInt(req.user.userId);
        try {
            const data = await fitness.getUserRank(userid);
            if (!data) {
                return res.status(404).send("No records available");
            }
    
            const { rank, total_users } = data;
    
            // Calculate percentage
            const percentage = total_users > 1 
                ? ((total_users - rank) / (total_users - 1)) * 100 
                : 0;
    
            res.json({
                rank,
                totalUsers: total_users,
                percentage: percentage.toFixed(2), // Ensure 2 decimal places
            });
        } catch (error) {
            console.error(error);
            res.status(500).send("Error retrieving user's rank and percentage");
        }
    }


    static async addPoints(req, res) {
        const userid = parseInt(req.body.userId);
        const points = parseInt(req.body.points);
        try {
            const checkUser = await fitness.checkUserInRewardsTable(userid);
            let success;
            if (!checkUser) {
                success = await fitness.addPointsInsert(userid, points,1); // not sure why user_reward table needed company id. need to remove
            }
            else {
                success = await fitness.addPoints(userid, points);
            }
            if (!success) {
                return res.status(400).json({ error: "Failed to add points" });
            }
            res.status(200).json({ message: "Points added successfully" });
        } catch (error) {
            console.error("Error adding points:", error);
            res.status(500).json({ error: "Error adding points" });
        }
    }
}

module.exports = FitnessController;
