const express = require('express');  // Express framework allows server to respond to internet requests
const cors = require('cors');  // CORS (Cross-Origin Resource Sharing)
const { Pool } = require('pg');  // Imports PostgreSQL driver
require('dotenv').config();  // Looks for the .env file for the secrets to access the database

const app = express();  // initialize the app

app.use(cors());  // allow the React app to talk to the server
app.use(express.json());  // allow the server to read JSON data sent from the frontend

// Connecting the database; uses data from .env file
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Testing the database connection
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error acquiring client', err.stack);
    }
    console.log('Successfully connected to PostgreSQL');  // if connection is working
    release();
});

// Simple confirmation that the server is working
// if the localhost5000 opens with this message, server is working
// if site not reachable, server is not working or something is wrong
app.get('/', (req, res) => {
    res.send('Running the backend for Vireo');
});

// Starting the server
const PORT = process.env.PORT || 5000;  // use port from .env file, or use port 5000 if the other one is unavailable

// Matching the axios address used in the frontend
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;  // get data from the frontend

    try {
        // Looking for the username in the database
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        // If the user doesn't exist
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Otherwise choosing the user
        const user = result.rows[0];

        // Checking if the password matches (for now plain text, needs to be hashed later!!!)
        if (user.password_hash === password) {
            // If correct; sending back the user info (without the password)
            res.json({
                message: 'Login successful!',
                user: {
                    id: user.uid,
                    username: user.username,
                    role: user.role,
                    name: user.name
                }
            });
        } else {
            // If wrong password
            res.status(401).json({ message: 'Incorrect password' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
app.listen(PORT, () => {  // start the server
    console.log(`Server is running on http://localhost:${PORT}`);
});