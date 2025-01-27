//import
const express = require("express");
const session = require("express-session");  // Import session
const app = express()
const cors = require('cors');
const port = process.env.PORT || 3000
const dbConfig = require("./database/dbConfig")
const sql = require("mssql")
const route = require("./routes/routes")
// const route = require("./routes/routes")
const bodyParser = require("body-parser");
const overviewDashboardRoute = require("./routes/overviewRoutes");
const path = require("path");

app.use(cors());

//load frontend
const staticMiddleware = express.static("public")
app.use(staticMiddleware)

// Use session middleware before setting up routes
app.use(session({
    secret: 'secret-key', // Replace with a secure key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Change to true if using HTTPS
}));

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use('/uploads/profile-pictures', express.static(path.join(__dirname, 'uploads/profile-pictures')));
app.use('/uploads/device-pictures', express.static(path.join(__dirname, 'uploads/device-pictures')));

//setup routes
route(app);



app.listen(port, async () => {
  try {
    // Connect to the database
    await sql.connect(dbConfig)
    console.log("Connected to database successfully")
  } catch (err) {
    console.error("Database connection error:", err)
    // Terminate app
    process.exit(1)
  }

  console.log(`Server listening on port ${port}`);
});

// Close the connection pool on SIGINT signal
process.on("SIGINT", async () => {
  console.log("Server is shutting down")
  await sql.close()
  console.log("Database connection closed")
  process.exit(0) 
});