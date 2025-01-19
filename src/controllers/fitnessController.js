const fitness = require("../models/fitness")
const axios = require('axios');
require('dotenv').config();

class FitnessController {

    static async redirectToStravaAuth(req, res) {
        const userId = req.user.userId; // Extract user ID from token (authenticateToken middleware)
        try {
            const state = encodeURIComponent(userId); // Include user ID in the state parameter
            const authUrl = `https://www.strava.com/oauth/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}&response_type=code&scope=activity:read_all&state=${state}`;
    
            res.status(200).json({ authUrl });
        } catch (error) {
            console.error("Error generating Strava auth URL:", error);
            res.status(500).send("Failed to generate Strava authentication URL.");
        }
    }
    

    static async handleStravaCallback(req, res) {
        const { code, state } = req.query; // Get code and state from query
        const userId = decodeURIComponent(state); // Decode the user ID from state
    
        try {
            const response = await axios.post('https://www.strava.com/oauth/token', {
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                code: code,
                grant_type: 'authorization_code',
            });
    
            const accessToken = response.data.access_token;
            const refreshToken = response.data.refresh_token;
            const tokenExpiry = new Date(response.data.expires_at * 1000); // Convert to Date
            const athleteId = response.data.athlete.id;

            // Check if the Strava account is already associated with another user
            const existingUser = await fitness.getUserByStravaAthleteId(athleteId);

            if (existingUser && existingUser.user_id !== userId) {
                return res.status(400).json({
                    message: "This Strava account is already linked to another EcoVolt user.",
                });
            }
    
            // Save the tokens in the database
            const success = await fitness.saveStravaToken(userId, athleteId, accessToken, refreshToken, tokenExpiry);
    
            if (!success) {
                throw new Error("Failed to save Strava tokens.");
            }
    
            res.redirect('/fitnessLogIn.html'); // Redirect back to the frontend
        } catch (error) {
            console.error("Error handling Strava callback:", error);
            res.status(500).send("Failed to handle Strava callback.");
        }
    }
    
    static async getAthleteStats(req, res) {
        const userId = req.user.userId; // Retrieve userId from authenticateToken middleware
    
        try {
            // Retrieve the user's Strava token and athlete ID from the database
            const tokenData = await fitness.getStravaToken(userId);
    
            if (!tokenData) {
                return res.status(401).json({ error: 'No Strava token found for this user' });
            }
    
            let { access_token: accessToken, strava_athlete_id: athleteId, token_expiry: tokenExpiry } = tokenData;
    
            // Check if the token has expired
            if (new Date() >= new Date(tokenExpiry)) {
                console.log('Access token expired. Refreshing token...');
                accessToken = await fitness.refreshStravaToken(userId); // Refresh the token and get the new accessToken
                if (!accessToken) {
                    return res.status(500).json({ error: 'Failed to refresh Strava token' });
                }
            }
    
            // Fetch athlete stats using the valid access token
            const response = await axios.get(`https://www.strava.com/api/v3/athletes/${athleteId}/stats`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
    
            const totalRides = response.data.all_ride_totals.count;
            const totalTime = response.data.all_ride_totals.moving_time; // Total time in seconds
            const totalDistance = response.data.all_ride_totals.distance; // Total distance in meters
            // const totalDistance = 5000000;
    
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
        const pointsMapping = {
            1: 1000,
            2: 500,
            3: 100,
        };
    
        try {
            // Check if today's date is the 16th
            const today = new Date();
            if (today.getDate() !== 16) {
                return res.status(400).json({ error: "Points can only be awarded on the 16th of the month." });
            }
    
            // Get the leaderboard data
            const leaderboard = await fitness.displayLeaderboard(); 
            if (!leaderboard || leaderboard.length < 3) {
                return res.status(400).json({ error: "Not enough participants to award points." });
            }
    
            // Loop through the top 3 winners and award points
            for (let i = 0; i < 3; i++) {
                const winner = leaderboard[i];
                const userId = winner.user_id;
                const points = pointsMapping[i + 1]; // Points based on rank (1, 2, 3)
                
                // check if user has been awarded for the month
                const checkActivityPoints = await fitness.checkActivityPoints(userId);
                if (checkActivityPoints) {
                    return res.status(400).json({ error: "User has already been awarded points for this month." });
                }

                // Check if user exists in the rewards table
                const userInRewards = await fitness.getUserInRewardTable(userId);
                if (!userInRewards) {
                    // User does not exist, insert into rewards table
                    const success = await fitness.createUserInRewardsTable(userId, points);
                    if (!success) {
                        console.error(`Failed to create rewards entry for user ${userId}`);
                        continue; // Skip to the next user
                    }
                } else {
                    // User exists, update their points
                    const success = await fitness.updateUserRewardPoints(userId, points);
                    if (!success) {
                        console.error(`Failed to update points for user ${userId}`);
                        continue; // Skip to the next user
                    }
                }
    
                // Log activity in the activity_points table
                const activityLogged = await fitness.addActivityPoints(userId, null, "Leaderboard Reward", points);
                if (!activityLogged) {
                    console.error(`Failed to log activity for user ${userId}`);
                }
            }
    
            return res.status(200).json({ message: "Points successfully awarded to the top 3 winners." });
        } catch (error) {
            console.error("Error awarding points:", error);
            res.status(500).json({ error: "An error occurred while awarding points." });
        }
    }
    
}

module.exports = FitnessController;
