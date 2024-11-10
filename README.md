# Ecovolt
## Project Setup

**Before proceeding, cd into the /src directory**
### Installing node modules
run ``npm install``

### Database configuration

Create src/database/dbConfig.js with the following content: <br />
```js
module.exports = {
    user: "your-username-here", 
    password: "your-password-here", 
    server: "localhost",
    database: "database-name-here",
    trustServerCertificate: true,
    options: {
      port: 1433, 
      connectionTimeout: 60000, 
    },
  }
```
You can change the content of the file to match your settings or set up the sql server to match its content

### .env setup
Create src/.env with the following content: <br>
```js
ACCESS_TOKEN_SECRET=any-string-here
```

### Database setup
run ``npm run seed`` <br />
You can also rerun this command to reset the database to its seeded form <br />
The sql to seed the database can be found in src/database/seedScript.js <br />

### Starting server
``npm start`` (for nodemon) <br />
or <br />
``node app.js``

