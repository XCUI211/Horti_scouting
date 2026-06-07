const bcrypt = require('bcrypt');  // For password hashing
const express = require('express');  // Express framework allows server to respond to internet requests
const cors = require('cors');  // CORS (Cross-Origin Resource Sharing)
const crypto = require('crypto');
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

const ensureReportBatchColumn = async () => {
    await pool.query(`
        ALTER TABLE floor_reports
        ADD COLUMN IF NOT EXISTS report_batch_id UUID
    `);
    await pool.query(`
        CREATE INDEX IF NOT EXISTS floor_reports_report_batch_id_idx
        ON floor_reports (report_batch_id)
        WHERE report_batch_id IS NOT NULL
    `);
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

// ---------- Reports endpoints (used by map cell coloring + admin dashboard) ----------
// Returns floor reports joined with floor / map / user info, shaped for the frontend map components.
app.get('/api/reports', async (req, res) => {
    const { map_id, cell_name, block_key } = req.query;
    try {
        const baseQuery = `
            SELECT fr.rid              AS report_id,
                   f.name              AS cell_name,
                   f.block_key         AS block_key,
                   fr.plant_name       AS plant_name,
                   fr.supplier         AS supplier,
                   m.name              AS map_id,
                   fr.pest_severity    AS severity,
                   fr.pest_types       AS pest_types,
                   to_char(fr.report_time, 'YYYY-MM-DD') AS entry_date,
                   fr.approval_status  AS status,
                   u.username          AS reporter_name,
                   fr.comment          AS admin_comment,
                   fr.report_batch_id  AS report_batch_id,
                   COUNT(*) OVER (
                       PARTITION BY COALESCE(fr.report_batch_id::text, fr.rid::text)
                   )                   AS batch_count,
                   ARRAY_AGG(f.name) OVER (
                       PARTITION BY COALESCE(fr.report_batch_id::text, fr.rid::text)
                   )                   AS batch_cell_names
            FROM floor_reports fr
            JOIN floors f ON fr.fid = f.fid
            JOIN maps m   ON f.mid  = m.mid
            JOIN users u  ON fr.uid = u.uid
        `;
        const conditions = [];
        const params = [];
        if (map_id) { params.push(map_id); conditions.push(`m.name = $${params.length}`); }
        if (cell_name) { params.push(cell_name); conditions.push(`f.name = $${params.length}`); }
        if (block_key) { params.push(block_key); conditions.push(`f.block_key = $${params.length}`); }
        const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
        const result = await pool.query(baseQuery + where + ' ORDER BY fr.report_time DESC', params);
        res.json({ status: 'success', data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Here, the frontend can send a map name and cell name, and the backend will return the corresponding floor ID (fid)
// if it exists. This is used when submitting a new report to link it to the correct floor. Said query joins the floors
// and maps tables to find the matching floor based on the provided map and cell names.
app.get('/api/floors/resolve', async (req, res) => {
    const { map_name, cell_name, block_key } = req.query;

    if (!map_name || !cell_name) {return res.status(400).json({ status: 'error', message: 'map_name and cell_name are required' });}

    const params = [map_name, cell_name];
    const blockKeyClause = block_key ? ` AND f.block_key = $3` : '';
    if (block_key) params.push(block_key);

    try {const result = await pool.query(
            `SELECT f.fid
             FROM floors f
             JOIN maps m ON f.mid = m.mid
             WHERE m.name = $1 AND f.name = $2${blockKeyClause}
             ORDER BY f.fid
             LIMIT ${block_key ? 1 : 2}`,
            params);

        if (result.rows.length === 0) {return res.status(404).json({ status: 'not_found', message: 'Floor not found' });}
        if (!block_key && result.rows.length > 1) {
            return res.status(409).json({
                status: 'ambiguous',
                message: 'Multiple floors match this map_name and cell_name; provide block_key'
            });
        }
            res.json({ status: 'success', fid: result.rows[0].fid })}
        catch (err) {console.error(err);
                    res.status(500).json({ status: 'error', message: err.message })}
    });

// Admin approves or rejects a report.
app.put('/api/reports/:id/approve', async (req, res) => {
    const { id } = req.params;
    const { status, admin_comment } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }
    try {
        const result = await pool.query(
            `WITH target_report AS (
                 SELECT report_batch_id
                 FROM floor_reports
                 WHERE rid = $3
             )
             UPDATE floor_reports
             SET approval_status = $1,
                 reviewed_at = CURRENT_TIMESTAMP,
                 comment = $2
             WHERE rid = $3
                OR (
                    report_batch_id IS NOT NULL
                    AND report_batch_id = (SELECT report_batch_id FROM target_report)
                )
             RETURNING *`,
            [status, admin_comment || null, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Report not found' });
        }
        res.json({ status: 'success', data: result.rows[0], affected_count: result.rows.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// POST request to allow for multi-selection of floors. Does so by accepting an array of floors (sent by frontend, from
// ScoutReportModal.jsx), after which it makes sure all floors actually exist, and then returns an array of their fID's.
// Note, this is only used when the multi-select mode is used and multiple fID's are sent here to backend.
app.post('/api/floors/resolve-many', async (req, res) => {
    const { map_name, cells } = req.body;

    if (!map_name || !Array.isArray(cells) || cells.length === 0) {
        return res.status(400).json({ status: 'error', message: 'map_name and cells are required' });
    }

    const blockKeys = cells.map((cell) => cell?.block_key).filter(Boolean);
    if (blockKeys.length !== cells.length) {
        return res.status(400).json({ status: 'error', message: 'Every cell must include block_key' });
    }

    try {
        const result = await pool.query(
            `SELECT f.fid, f.block_key
             FROM floors f
             JOIN maps m ON f.mid = m.mid
             WHERE m.name = $1 AND f.block_key = ANY($2::text[])`,
            [map_name, blockKeys]
        );

        const fidByBlockKey = new Map(result.rows.map((row) => [row.block_key, row.fid]));
        const missingBlockKey = blockKeys.find((blockKey) => !fidByBlockKey.has(blockKey));
        if (missingBlockKey) {
            return res.status(404).json({
                status: 'not_found',
                message: `Floor not found for ${missingBlockKey}`
            });
        }

        res.json({
            status: 'success',
            fids: blockKeys.map((blockKey) => fidByBlockKey.get(blockKey))
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Start the server
const startServer = async () => {
    await testDatabaseConnection();
    await ensureReportBatchColumn();

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


const FLOOR_REPORT_INSERT_SQL = `INSERT INTO floor_reports
    (fid, uid, plant_name, supplier, pests_found, pest_types, pest_severity, biology_used, biology_types, chemicals_used, chemicals_types, behandelaar, potmaat, oppotweek, teelduur_weeks, trap_number, bug_count, approval_status, report_batch_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'pending', $18)
    RETURNING *`;

const normalizeStringArray = (value) => {
    if (Array.isArray(value)) {
        return value.filter((item) => typeof item === 'string' && item !== '');
    }
    if (typeof value === 'string' && value !== '') return [value];
    return null;
};

// Function used to correctly order floor properties, based on an input fID, to match the SQL query for the insertion
// of a new floor report. This is then used in the insertFloorReport function below, which is called when a user submits
// a new floor report (either a single floor, or multiple in multi-select mode).
const buildFloorReportParams = (fid, data) => [
    fid,
    data.uid,
    data.plant_name || '',
    data.supplier || '',
    data.pests_found,
    data.pest_types || null,
    data.pest_severity ?? null,
    data.biology_used,
    normalizeStringArray(data.biology_types),
    data.chemicals_used,
    normalizeStringArray(data.chemicals_types),
    data.behandelaar || null,
    data.potmaat || null,
    data.oppotweek ?? null,
    data.teelduur_weeks ?? null,
    data.trap_number || null,
    data.bug_count ?? null,
    data.report_batch_id || null,
];

const insertFloorReport = (fid, data) =>
    pool.query(FLOOR_REPORT_INSERT_SQL, buildFloorReportParams(fid, data));

app.post('/api/floorreports', async (req, res) => {
    const { fid } = req.body;  // get data from the frontend

    try {
        await insertFloorReport(fid, req.body);

        // Sends success message back to frontend
        res.status(201).json({
            message: 'Floor report created successfully!'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST request for actually creating multiple floor reports as one, based on an input array of multiple fID's.
app.post('/api/floorreports/bulk', async (req, res) => {
    const { fids } = req.body;

    if (!Array.isArray(fids) || fids.length === 0) {
        return res.status(400).json({ message: 'fids are required' });
    }

    try {
        const reportBatchId = crypto.randomUUID();
        await Promise.all(fids.map((fid) => insertFloorReport(fid, {
            ...req.body,
            report_batch_id: reportBatchId,
        })));

        res.status(201).json({
            message: 'Floor reports created successfully!',
            count: fids.length,
            report_batch_id: reportBatchId
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

// GET request to fetch all maps including their JSON layout
app.get('/api/maps', async (req, res) => {
    try {const result = await pool.query('SELECT mid, name, location, greenhouse, json_map FROM maps ORDER BY name ASC');
        res.json(result.rows);}
    catch (err) {console.error(err);
                res.status(500).json({ message: 'Server error fetching maps' })}
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
          await client.query(`INSERT INTO user_maps (uid, mid) SELECT $1, unnest($2::int[])`, [scoutUid, mapIds]);
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

// GET request to fetch pest history for a selectable period
// period can be: week, month, year, all
// GET request to fetch pest history for a selectable period and optional map
// period can be: week, month, year, all
// map_id can be: all, HW 15, HW 10.15, etc.
app.get('/api/analytics/pest-history', async (req, res) => {
    try {
        const period = (req.query.period || 'month').toLowerCase();
        const mapId = req.query.map_id || 'all';

        const periodMap = {
            week: "INTERVAL '7 days'",
            month: "INTERVAL '1 month'",
            year: "INTERVAL '1 year'"
        };

        const intervalSql = periodMap[period] || null;
        const periodClause = intervalSql
            ? `AND fr.report_time >= NOW() - ${intervalSql}`
            : '';

        const params = [];
        let mapClause = '';

        if (mapId && mapId !== 'all') {
            params.push(mapId);
            mapClause = `AND m.name = $${params.length}`;
        }

        const sql = `
            SELECT pest_type, COUNT(*) AS count
            FROM (
                SELECT UNNEST(fr.pest_types) AS pest_type
                FROM floor_reports fr
                JOIN floors f ON fr.fid = f.fid
                JOIN maps m ON f.mid = m.mid
                WHERE fr.pests_found = true
                  AND fr.pest_types IS NOT NULL
                  AND fr.approval_status = 'approved'
                  ${periodClause}
                  ${mapClause}
            ) AS expanded_pests
            GROUP BY pest_type
            ORDER BY count DESC, pest_type ASC
        `;

        const result = await pool.query(sql, params);

        res.json({
            status: 'success',
            data: result.rows,
            period,
            map_id: mapId
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
});

// GET request to fetch detailed information for one specific pest type in a selectable period
// GET request to fetch detailed information for one specific pest type in a selectable period and optional map
app.get('/api/analytics/pest-history-details', async (req, res) => {
    try {
        const { pest_type } = req.query;
        const period = (req.query.period || 'month').toLowerCase();
        const mapId = req.query.map_id || 'all';

        if (!pest_type) {
            return res.status(400).json({
                status: 'error',
                message: 'pest_type is required'
            });
        }

        const periodMap = {
            week: "INTERVAL '7 days'",
            month: "INTERVAL '1 month'",
            year: "INTERVAL '1 year'"
        };

        const intervalSql = periodMap[period] || null;
        const periodClause = intervalSql
            ? `AND fr.report_time >= NOW() - ${intervalSql}`
            : '';

        const params = [pest_type];
        let mapClause = '';

        if (mapId && mapId !== 'all') {
            params.push(mapId);
            mapClause = `AND m.name = $${params.length}`;
        }

        const historyQuery = `
            SELECT
                fr.rid AS report_id,
                f.name AS cell_name,
                fr.plant_name AS plant_name,
                fr.supplier AS supplier,
                m.name AS map_id,
                fr.pest_severity AS severity,
                fr.pest_types AS pest_types,
                to_char(fr.report_time, 'YYYY-MM-DD') AS entry_date,
                fr.approval_status AS status,
                u.username AS reporter_name,
                fr.biology_used AS biology_used,
                fr.biology_types AS biology_types,
                fr.chemicals_used AS chemicals_used,
                fr.chemicals_types AS chemicals_types
            FROM floor_reports fr
            JOIN floors f ON fr.fid = f.fid
            JOIN maps m ON f.mid = m.mid
            JOIN users u ON fr.uid = u.uid
            WHERE fr.pests_found = true
              AND fr.approval_status = 'approved'
              AND fr.pest_types IS NOT NULL
              AND $1 = ANY(fr.pest_types)
              ${periodClause}
              ${mapClause}
            ORDER BY fr.report_time DESC
        `;

        const historyResult = await pool.query(historyQuery, params);

        res.json({
            status: 'success',
            data: {
                pestType: pest_type,
                history: historyResult.rows,
                historyCount: historyResult.rows.length
            },
            period,
            map_id: mapId
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
});

// GET request to compare approved pest reports between this week and last week
// Optional map_id filter: all, HW 15, HW 10.15, etc.
app.get('/api/analytics/pest-week-comparison', async (req, res) => {
    try {
        const mapId = req.query.map_id || 'all';

        const params = [];
        let mapClause = '';

        if (mapId && mapId !== 'all') {
            params.push(mapId);
            mapClause = `AND m.name = $${params.length}`;
        }

        const sql = `
            WITH expanded_reports AS (
                SELECT
                    m.name AS map_id,
                    f.name AS cell_name,
                    UNNEST(fr.pest_types) AS pest_type,
                    fr.pest_severity,
                    fr.bug_count,
                    fr.biology_used,
                    fr.chemicals_used,
                    CASE
                        WHEN fr.report_time >= date_trunc('week', NOW())
                        THEN 'current'
                        ELSE 'previous'
                    END AS week_bucket
                FROM floor_reports fr
                JOIN floors f ON fr.fid = f.fid
                JOIN maps m ON f.mid = m.mid
                WHERE fr.pests_found = true
                  AND fr.pest_types IS NOT NULL
                  AND fr.approval_status = 'approved'
                  AND fr.report_time >= date_trunc('week', NOW()) - INTERVAL '7 days'
                  AND fr.report_time < date_trunc('week', NOW()) + INTERVAL '7 days'
                  ${mapClause}
            )
            SELECT
                map_id,
                cell_name,
                pest_type,

                COUNT(*) FILTER (WHERE week_bucket = 'previous') AS previous_reports,
                COUNT(*) FILTER (WHERE week_bucket = 'current') AS current_reports,

                COALESCE(SUM(bug_count) FILTER (WHERE week_bucket = 'previous'), 0) AS previous_bug_count,
                COALESCE(SUM(bug_count) FILTER (WHERE week_bucket = 'current'), 0) AS current_bug_count,

                ROUND((AVG(pest_severity) FILTER (WHERE week_bucket = 'previous'))::numeric, 1) AS previous_avg_severity,
                ROUND((AVG(pest_severity) FILTER (WHERE week_bucket = 'current'))::numeric, 1) AS current_avg_severity,

                COALESCE(
                    BOOL_OR(COALESCE(biology_used, false) OR COALESCE(chemicals_used, false))
                    FILTER (WHERE week_bucket = 'previous'),
                    false
                ) AS previous_treatment_used,

                COALESCE(
                    BOOL_OR(COALESCE(biology_used, false) OR COALESCE(chemicals_used, false))
                    FILTER (WHERE week_bucket = 'current'),
                    false
                ) AS current_treatment_used

            FROM expanded_reports
            GROUP BY map_id, cell_name, pest_type
            ORDER BY map_id ASC, cell_name ASC, pest_type ASC
        `;

        const result = await pool.query(sql, params);

        const rows = result.rows.map((row) => {
            const previousReports = Number(row.previous_reports || 0);
            const currentReports = Number(row.current_reports || 0);
            const previousBugCount = Number(row.previous_bug_count || 0);
            const currentBugCount = Number(row.current_bug_count || 0);

            const reportDifference = currentReports - previousReports;
            const bugCountDifference = currentBugCount - previousBugCount;

            let status = 'no_change';

            if (previousReports === 0 && currentReports > 0) {
                status = 'new_issue';
            } else if (previousReports > 0 && currentReports === 0) {
                status = 'improved';
            } else if (currentReports < previousReports) {
                status = 'improved';
            } else if (currentReports > previousReports) {
                status = 'worse';
            }

            let treatmentEffect = 'No treatment recorded last week';

            if (row.previous_treatment_used) {
                if (status === 'improved') {
                    treatmentEffect = 'Treatment may have worked';
                } else if (status === 'worse') {
                    treatmentEffect = 'Treatment did not reduce reports';
                } else if (status === 'no_change') {
                    treatmentEffect = 'Treatment result unclear';
                } else if (status === 'new_issue') {
                    treatmentEffect = 'New issue this week';
                }
            }

            return {
                map_id: row.map_id,
                cell_name: row.cell_name,
                pest_type: row.pest_type,

                previous_reports: previousReports,
                current_reports: currentReports,
                report_difference: reportDifference,

                previous_bug_count: previousBugCount,
                current_bug_count: currentBugCount,
                bug_count_difference: bugCountDifference,

                previous_avg_severity: row.previous_avg_severity,
                current_avg_severity: row.current_avg_severity,

                previous_treatment_used: row.previous_treatment_used,
                current_treatment_used: row.current_treatment_used,

                status,
                treatment_effect: treatmentEffect
            };
        });

        res.json({
            status: 'success',
            map_id: mapId,
            current_week_start: null,
            previous_week_start: null,
            data: rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
});

// GET request to fetch scouts and their recent report history for the scout overview page
app.get('/api/admin/scouts-reports-summary', async (req, res) => {
    try {
        const query = `
            SELECT
                u.uid,
                u.username,
                (
                    SELECT json_agg(report_sub)
                    FROM (
                        SELECT
                            fr.rid,
                            m.name as map_name,
                            f.name as section_name,
                            to_char(fr.report_time, 'DD/MM/YYYY HH24:MI') as formatted_date,
                            fr.approval_status as status
                        FROM floor_reports fr
                        JOIN floors f ON fr.fid = f.fid
                        JOIN maps m ON f.mid = m.mid
                        WHERE fr.uid = u.uid
                        ORDER BY fr.report_time DESC
                        LIMIT 4
                    ) report_sub
                ) as recent_reports
            FROM users u
            WHERE u.role = 'scout' AND u.is_employed = true
            ORDER BY u.username ASC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching scouts reports summary' });
    }
});

// GET request to get specific scout's report history
app.get('/api/scout/tasks/:uid', async (req, res) => {
    const { uid } = req.params;
    try {
        const result = await pool.query(`
            SELECT
                fr.rid,
                fr.approval_status as status,
                fr.comment,
                f.name as section_name,
                fr.plant_name as plant_name,
                fr.supplier as supplier,
                m.name as map_name,
                m.mid,
                f.fid
            FROM floor_reports fr
            JOIN floors f ON fr.fid = f.fid
            JOIN maps m ON f.mid = m.mid
            WHERE fr.uid = $1
            ORDER BY fr.report_time DESC
        `,[uid]);

        res.json(result.rows);
    } catch (err) {
        console.error("DATABASE ERROR:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Export so test files can import Express app without starting server.
module.exports = {
    app,
    pool,
    startServer,
    testDatabaseConnection,
    ensureReportBatchColumn
};
