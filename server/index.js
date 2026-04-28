const bcrypt = require('bcrypt');  // For password hashing
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
const testDatabaseConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('Successfully connected to PostgreSQL');
        client.release();
    } catch (err) {
        console.error('Error acquiring client', err.stack);
    }
};

// Simple confirmation that the server is working
// if the localhost5000 opens with this message, server is working
// if site not reachable, server is not working or something is wrong
app.get('/', (req, res) => {
    res.send('Running the backend for Vireo');
});

// Starting the server
const PORT = process.env.PORT || 5000;  // use port from .env file, or use port 5000 if the other one is unavailable

// POST request for logging in
app.post('/api/login', async (req, res) => {
    const { username, password, role } = req.body;  // get data from the frontend

    try {
        // Looking for the username in the database
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        // If the user doesn't exist
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Otherwise choosing the user
        const user = result.rows[0];

        // Ensuring only authorized access
        if (user.role !== role) {
            return res.status(403).json({ message: `Access denied. You are not a(n) ${role}.` });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);  // compare password to hashed password

        if (isMatch) {
            // If correct; sending back the user info (without the password)
            res.json({
                message: 'Login successful!',
                user: {
                    uid: user.uid,
                    username: user.username,
                    role: user.role,
                    email: user.email,
                    mustChangePassword: user.must_change_password,
                    language: user.language
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


// Get all scouts (for the Admin's dropdown list)
app.get('/api/users/scouts', async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT uid, username FROM users WHERE role = 'scout' ORDER BY username ASC"
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching scouts' });
    }
});


// Get a specific user by UID
app.get('/api/users/:uid', async (req, res) => {
    const { uid } = req.params;
    try {
        const result = await pool.query(
            'SELECT uid, username, role, email, language  FROM users WHERE uid = $1',
            [uid]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Start the server
const startServer = async () => {
    await testDatabaseConnection();

    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
};

// Only start the server when run with node index.js
// Server does not start automatically when importing this file (for testing)
if (require.main === module) {
    startServer();
}

// GET request from database to get all users
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users ORDER BY uid');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});


// POST request for creating a new account; checks if the username already exists, and if not, creates a new user
// with the "Scout" role (admin accounts should NOT be created this way)
app.post('/api/createaccount', async (req, res) => {
    const { username, email, password, mustChangePassword } = req.body;  // get data from the frontend

    try {
        // Get all usernames
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        // Throw error if the user already exist
        if (result.rows.length > 0) {
            return res.status(409).json({ message: 'Username already exists' });
        }

        // Hashing the password before inserting it into the database
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Creating new user; ALWAYS hardcode "Scout" role; admin accounts should NOT be created this way
        await pool.query(
            "INSERT INTO users (username, email, password_hash, role, must_change_password) VALUES ($1, $2, $3, 'scout', $4) RETURNING *",
            [username, email, hashedPassword, mustChangePassword || false]
        );

        // Sends success message back to frontend
        res.status(201).json({
            message: 'Account created successfully!'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});


app.post('/api/floorreports', async (req, res) => {
    const {fid, uid,
           pests_found, pest_types, pest_severity,
           biology_used, biology_types,
           chemicals_used, chemicals_types,
           behandelaar,
           potmaat, oppotweek, teelduur_weeks,
           trap_number, bug_count
          } = req.body;  // get data from the frontend

    try {const newReport = await pool.query(
            `INSERT INTO floor_reports
            (fid, uid, pests_found, pest_types, pest_severity, biology_used, biology_types, chemicals_used, chemicals_types, behandelaar, potmaat, oppotweek, teelduur_weeks, trap_number, bug_count, approval_status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'pending')
            RETURNING *`,
            [fid, uid,
                pests_found,
                pest_types || null,
                pest_severity ?? null,
                biology_used,
                biology_types || null,
                chemicals_used,
                chemicals_types || null,
                behandelaar || null,
                potmaat || null,
                oppotweek ?? null,
                teelduur_weeks ?? null,
                trap_number || null,
                bug_count ?? null]);

        // Sends success message back to frontend
        res.status(201).json({
            message: 'Floor report created successfully!'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});


// POST request for changing user password (if the user remembers the old one!)
app.post('/api/users/change-password', async (req, res) => {
    const { uid, currentPassword, newPassword } = req.body;

    try {
        // Finding the user
        const userResult = await pool.query('SELECT * FROM users WHERE uid = $1', [uid]);
        if (userResult.rows.length === 0) return res.status(404).json({ message: 'User not found' });

        const user = userResult.rows[0];

        // Verifying current password
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) return res.status(401).json({ message: 'Current password incorrect' });

        // Hashing the new password and updating it in the database
        const saltRounds = 10;
        const newHashedPassword = await bcrypt.hash(newPassword, saltRounds);

        await pool.query('UPDATE users SET password_hash = $1 WHERE uid = $2', [newHashedPassword, uid]);

        res.status(200).json({
            message: 'Password updated successfully'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});


// POST request for changing user email
app.post('/api/users/change-email', async (req, res) => {
    const { uid, password, newEmail } = req.body;

    try {
        const userResult = await pool.query('SELECT * FROM users WHERE uid = $1', [uid]);
        if (userResult.rows.length === 0) return res.status(404).json({ message: 'User not found' });

        const user = userResult.rows[0];

        // Verifying password to ensure the person changing the email is the owner
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ message: 'Incorrect password' });

        // Updating the email (new email can be empty for the Scout)
        await pool.query('UPDATE users SET email = $1 WHERE uid = $2', [newEmail, uid]);

        res.status(200).json({
            message: 'Email updated successfully'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST request for changing user language
app.post('/api/users/change-language', async (req, res) => {
    const { uid, password, newLanguage } = req.body;

    try {
        const userResult = await pool.query('SELECT * FROM users WHERE uid = $1', [uid]);
        if (userResult.rows.length === 0) return res.status(404).json({ message: 'User not found' });

        // Updating the language
        await pool.query('UPDATE users SET language  = $1 WHERE uid = $2', [newLanguage, uid]);

        res.status(200).json({
            message: 'Language updated successfully'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST request to reset a scout's password (Admin only)
app.post('/api/admin/reset-scout-password', async (req, res) => {
    const { scoutUid, newPassword } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        // Updating the password and setting the flag to true
        await pool.query(
            "UPDATE users SET password_hash = $1, must_change_password = true WHERE uid = $2",
            [hashedPassword, scoutUid]
        );

        res.status(200).json({
            message: 'Password reset and flag set successfully'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to reset password' });
    }
});

// POST request to complete the force change (Scout finishing the reset)
app.post('/api/users/complete-force-change', async (req, res) => {
    const { uid, newPassword } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        // Updating the password and clearing the flag
        await pool.query(
            "UPDATE users SET password_hash = $1, must_change_password = false WHERE uid = $2",
            [hashedPassword, uid]
        );
        res.status(200).json({
            message: 'Password updated successfully'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET request to from the database to get all available maps
app.get('/api/maps', async (req, res) => {
    try {
        const result = await pool.query('SELECT mid, name, location, greenhouse FROM maps ORDER BY name ASC');  // alphabetically sorted by name
        res.json(result.rows);  // sends the rows found in the database as json array
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching maps' });
    }
});

// GET request to get maps currently assigned to a specific scout
// Uses a dynamic parameter uid
app.get('/api/users/:uid/maps', async (req, res) => {
    const { uid } = req.params;  // extracts uid from the url
    try {
        const result = await pool.query(
            'SELECT mid FROM user_maps WHERE uid = $1',
            [uid]
        );
        // Returns just an array of map IDs
        res.json(result.rows.map(row => row.mid));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching user maps' });
    }
});

// POST request to update map assignment for a scout
app.post('/api/admin/assign-maps', async (req, res) => {
    const { scoutUid, mapIds } = req.body;  // gets scout ID and an array of map IDs assigned to them
    const client = await pool.connect();  // manually grabbing a connection to start a transaction

    try {
        await client.query('BEGIN');  // starts SQL transaction

        // Removes all current scout-maps assignments
        await client.query('DELETE FROM user_maps WHERE uid = $1', [scoutUid]);

        // Inserts new assignments (this includes old map assignments that haven't been deleted) if any are selected
        if (mapIds && mapIds.length > 0) {
            const insertValues = mapIds.map(mid => `(${scoutUid}, ${mid})`).join(',');
            await client.query(`INSERT INTO user_maps (uid, mid) VALUES ${insertValues}`);
        }

        await client.query('COMMIT');  // saves the transaction
        res.json({ message: 'Maps assigned successfully' });
    } catch (err) {
        await client.query('ROLLBACK');  // if error occurs, undoes any changes to prevent loss of data
        console.error(err);
        res.status(500).json({ message: 'Failed to assign maps' });
    } finally {
        client.release();  // gives the connection back
    }
});


// GET request to get all scouts and their assigned maps in one overview
app.get('/api/admin/scouts-maps-overview', async (req, res) => {
    try {  // json aggregate collects multiple maps into a single json array for each scout
        const query = `
            SELECT
                u.uid,
                u.username,
                u.email,
                COALESCE(json_agg(m.*) FILTER (WHERE m.mid IS NOT NULL), '[]') as assigned_maps
            FROM users u
            LEFT JOIN user_maps um ON u.uid = um.uid
            LEFT JOIN maps m ON um.mid = m.mid
            WHERE u.role = 'scout' AND u.is_employed = true
            GROUP BY u.uid, u.username, u.email
            ORDER BY u.username ASC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching overview' });
    }
});

// Export so test files can import Express app without starting server.
module.exports = {
    app,
    pool,
    startServer,
    testDatabaseConnection
};