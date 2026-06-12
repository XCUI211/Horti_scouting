const bcrypt = require('bcrypt');  // For password hashing
const express = require('express');  // Express framework allows server to respond to internet requests
const cors = require('cors');  // CORS (Cross-Origin Resource Sharing)
const crypto = require('crypto');
const { Pool } = require('pg');  // Imports PostgreSQL driver
const path = require('path');

require('dotenv').config({
    path: path.join(__dirname, '.env'),
    override: true
});

console.log('Environment check:', {
    cwd: process.cwd(),
    envPath: path.join(__dirname, '.env'),
    DB_DATABASE: process.env.DB_DATABASE,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_USER: process.env.DB_USER
}); // Looks for the .env file for the secrets to access the database

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
    // report_time remains the immutable submission timestamp.
    // entry_date stores the date selected by the scout and is used by history views.
    await pool.query(`
        ALTER TABLE floor_reports
        ADD COLUMN IF NOT EXISTS report_batch_id UUID
    `);

    await pool.query(`
        ALTER TABLE floor_reports
        ADD COLUMN IF NOT EXISTS entry_date DATE
    `);

    await pool.query(`
        UPDATE floor_reports
        SET entry_date = report_time::date
        WHERE entry_date IS NULL
    `);

    await pool.query(`
        ALTER TABLE floor_reports
        ALTER COLUMN entry_date SET DEFAULT CURRENT_DATE
    `);

    await pool.query(`
        ALTER TABLE floor_reports
        ALTER COLUMN entry_date SET NOT NULL
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS floor_reports_report_batch_id_idx
        ON floor_reports (report_batch_id)
        WHERE report_batch_id IS NOT NULL
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS floor_reports_entry_date_idx
        ON floor_reports (entry_date DESC)
    `);
};

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const getLocalDateString = (dateValue = new Date()) => {
    const year = dateValue.getFullYear();
    const month = String(dateValue.getMonth() + 1).padStart(2, '0');
    const day = String(dateValue.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

const isValidDateOnly = (value) => {
    if (
        typeof value !== 'string' ||
        !DATE_ONLY_PATTERN.test(value)
    ) {
        return false;
    }

    const [year, month, day] = value.split('-').map(Number);
    const dateValue = new Date(Date.UTC(year, month - 1, day));

    return (
        dateValue.getUTCFullYear() === year &&
        dateValue.getUTCMonth() === month - 1 &&
        dateValue.getUTCDate() === day
    );
};

const isNonEmptyString = (value) => (
    typeof value === 'string' &&
    value.trim().length > 0
);

const hasListValue = (value) => {
    if (Array.isArray(value)) {
        return value.some(
            (item) =>
                typeof item === 'string' &&
                item.trim().length > 0
        );
    }

    return isNonEmptyString(value);
};

const validateDateRangeQuery = (startDate, endDate) => {
    const errors = [];

    if (
        (startDate && !endDate) ||
        (!startDate && endDate)
    ) {
        errors.push(
            'start_date and end_date must be provided together'
        );
    }

    if (startDate && !isValidDateOnly(startDate)) {
        errors.push('start_date must use YYYY-MM-DD');
    }

    if (endDate && !isValidDateOnly(endDate)) {
        errors.push('end_date must use YYYY-MM-DD');
    }

    if (
        startDate &&
        endDate &&
        isValidDateOnly(startDate) &&
        isValidDateOnly(endDate) &&
        startDate > endDate
    ) {
        errors.push('start_date cannot be after end_date');
    }

    return errors;
};

// Simple confirmation that the server is working
// if localhost:5000 opens with this message, server is working
app.get('/', (req, res) => {
    res.send('Running the backend for Vireo');
});

// Use port from .env, otherwise use 5000
const PORT = process.env.PORT || 5000;

// POST request for logging in
app.post('/api/login', async (req, res) => {
    const { username, password, role } = req.body;

    try {
        // Looking for the username in the database
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        // If the user does not exist
        if (result.rows.length === 0) {
            return res.status(401).json({
                message: 'User not found'
            });
        }

        const user = result.rows[0];

        // Ensuring only authorized role access
        if (user.role !== role) {
            return res.status(403).json({
                message: `Access denied. You are not a(n) ${role}.`
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (isMatch) {
            return res.json({
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
        }

        return res.status(401).json({
            message: 'Incorrect password'
        });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: 'Server error'
        });
    }
});

// Get all scouts for the Admin dropdown list
app.get('/api/users/scouts', async (req, res) => {
    try {
        const result = await pool.query(
            `
                SELECT uid, username
                FROM users
                WHERE role = 'scout'
                ORDER BY username ASC
            `
        );

        return res.json(result.rows);
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: 'Server error fetching scouts'
        });
    }
});

// Get a specific user by UID
app.get('/api/users/:uid', async (req, res) => {
    const { uid } = req.params;

    try {
        const result = await pool.query(
            `
                SELECT
                    uid,
                    username,
                    role,
                    email,
                    language
                FROM users
                WHERE uid = $1
            `,
            [uid]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        return res.json(result.rows[0]);
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: 'Server error'
        });
    }
});

// Reports endpoint used by map cell colouring and the admin dashboard
// entry_date = date selected by the Scout
// report_time = actual system submission timestamp
app.get('/api/reports', async (req, res) => {
    const {
        map_id,
        cell_name,
        block_key,
        start_date,
        end_date,
        status
    } = req.query;

    const dateErrors = validateDateRangeQuery(
        start_date,
        end_date
    );

    if (dateErrors.length > 0) {
        return res.status(400).json({
            status: 'error',
            message: dateErrors.join('. ')
        });
    }

    try {
        const baseQuery = `
            SELECT
                fr.rid AS report_id,
                f.name AS cell_name,
                f.block_key AS block_key,
                fr.plant_name AS plant_name,
                fr.supplier AS supplier,
                m.name AS map_id,
                fr.pest_severity AS severity,
                fr.pest_types AS pest_types,

                to_char(
                    fr.entry_date,
                    'YYYY-MM-DD'
                ) AS entry_date,

                to_char(
                    fr.report_time,
                    'YYYY-MM-DD"T"HH24:MI:SS'
                ) AS created_at,

                fr.approval_status AS status,
                fr.pests_found AS pests_found,
                u.username AS reporter_name,
                fr.comment AS admin_comment,
                fr.report_batch_id AS report_batch_id,

                COUNT(*) OVER (
                    PARTITION BY COALESCE(
                        fr.report_batch_id::text,
                        fr.rid::text
                    )
                ) AS batch_count,

                ARRAY_AGG(f.name) OVER (
                    PARTITION BY COALESCE(
                        fr.report_batch_id::text,
                        fr.rid::text
                    )
                ) AS batch_cell_names

            FROM floor_reports fr
            JOIN floors f
                ON fr.fid = f.fid
            JOIN maps m
                ON f.mid = m.mid
            JOIN users u
                ON fr.uid = u.uid
        `;

        const conditions = [];
        const params = [];

        if (map_id) {
            params.push(map_id);
            conditions.push(
                `m.name = $${params.length}`
            );
        }

        if (cell_name) {
            params.push(cell_name);
            conditions.push(
                `f.name = $${params.length}`
            );
        }

        if (block_key) {
            params.push(block_key);
            conditions.push(
                `f.block_key = $${params.length}`
            );
        }

        if (start_date) {
            params.push(start_date);
            conditions.push(
                `fr.entry_date >= $${params.length}::date`
            );
        }

        if (end_date) {
            params.push(end_date);
            conditions.push(
                `fr.entry_date <= $${params.length}::date`
            );
        }

        if (status) {
            params.push(status);
            conditions.push(
                `fr.approval_status = $${params.length}`
            );
        }

        const whereClause = conditions.length > 0
            ? ` WHERE ${conditions.join(' AND ')}`
            : '';

        const orderByClause = `
            ORDER BY
                fr.entry_date DESC,
                fr.report_time DESC,
                fr.rid DESC
        `;

        const result = await pool.query(
            baseQuery + whereClause + orderByClause,
            params
        );

        return res.json({
            status: 'success',
            data: result.rows
        });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
});

// Resolve one floor ID from a map, cell name and optional block key
// This endpoint is used before submitting a report so that the frontend can
// convert a selected map cell into the corresponding floor ID.
app.get('/api/floors/resolve', async (req, res) => {
    const {
        map_name,
        cell_name,
        block_key
    } = req.query;

    if (!map_name || !cell_name) {
        return res.status(400).json({
            status: 'error',
            message: 'map_name and cell_name are required'
        });
    }

    const params = [map_name, cell_name];

    const blockKeyClause = block_key
        ? ' AND f.block_key = $3'
        : '';

    if (block_key) {
        params.push(block_key);
    }

    try {
        const result = await pool.query(
            `
                SELECT f.fid
                FROM floors f
                JOIN maps m
                    ON f.mid = m.mid
                WHERE m.name = $1
                  AND f.name = $2
                  ${blockKeyClause}
                ORDER BY f.fid
                LIMIT ${block_key ? 1 : 2}
            `,
            params
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                status: 'not_found',
                message: 'Floor not found'
            });
        }

        // Without block_key, two floors may have the same visible name.
        if (!block_key && result.rows.length > 1) {
            return res.status(409).json({
                status: 'ambiguous',
                message:
                    'Multiple floors match this map_name and cell_name; provide block_key'
            });
        }

        return res.json({
            status: 'success',
            fid: result.rows[0].fid
        });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
});

// Admin approves or rejects a report
app.put('/api/reports/:id/approve', async (req, res) => {
    const { id } = req.params;
    const {
        status,
        admin_comment
    } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({
            message: 'Invalid status'
        });
    }

    try {
        const result = await pool.query(
            `
                WITH target_report AS (
                    SELECT report_batch_id
                    FROM floor_reports
                    WHERE rid = $3
                )
                UPDATE floor_reports
                SET
                    approval_status = $1,
                    reviewed_at = CURRENT_TIMESTAMP,
                    comment = $2
                WHERE rid = $3
                   OR (
                       report_batch_id IS NOT NULL
                       AND report_batch_id = (
                           SELECT report_batch_id
                           FROM target_report
                       )
                   )
                RETURNING *
            `,
            [
                status,
                admin_comment || null,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Report not found'
            });
        }

        return res.json({
            status: 'success',
            data: result.rows[0],
            affected_count: result.rows.length
        });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
});

// Resolve multiple selected cells to floor IDs
// Used by ScoutReportModal.jsx when multiple map cells are selected.
app.post('/api/floors/resolve-many', async (req, res) => {
    const {
        map_name,
        cells
    } = req.body;

    if (
        !map_name ||
        !Array.isArray(cells) ||
        cells.length === 0
    ) {
        return res.status(400).json({
            status: 'error',
            message: 'map_name and cells are required'
        });
    }

    const blockKeys = cells
        .map((cell) => cell?.block_key)
        .filter(Boolean);

    if (blockKeys.length !== cells.length) {
        return res.status(400).json({
            status: 'error',
            message: 'Every cell must include block_key'
        });
    }

    try {
        const result = await pool.query(
            `
                SELECT
                    f.fid,
                    f.block_key
                FROM floors f
                JOIN maps m
                    ON f.mid = m.mid
                WHERE m.name = $1
                  AND f.block_key = ANY($2::text[])
            `,
            [
                map_name,
                blockKeys
            ]
        );

        const fidByBlockKey = new Map(
            result.rows.map((row) => [
                row.block_key,
                row.fid
            ])
        );

        const missingBlockKey = blockKeys.find(
            (blockKey) => !fidByBlockKey.has(blockKey)
        );

        if (missingBlockKey) {
            return res.status(404).json({
                status: 'not_found',
                message: `Floor not found for ${missingBlockKey}`
            });
        }

        return res.json({
            status: 'success',
            fids: blockKeys.map(
                (blockKey) => fidByBlockKey.get(blockKey)
            )
        });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
});

// Start the server
const startServer = async () => {
    try {
        await testDatabaseConnection();

        // Displays the database connection actually being used.
        const connectionInfo = await pool.query(`
            SELECT
                current_database() AS database,
                current_schema() AS schema,
                current_user AS username,
                inet_server_addr() AS host,
                inet_server_port() AS port
        `);

        console.log(
            'PostgreSQL connection:',
            connectionInfo.rows[0]
        );

        // Creates the report batch and entry date columns when missing.
        await ensureReportBatchColumn();

        app.listen(PORT, () => {
            console.log(
                `Server is running on http://localhost:${PORT}`
            );
        });
    } catch (err) {
        console.error(
            'Failed to start server:',
            err
        );
    }
};

// Do not start automatically when index.js is imported by Jest.
if (require.main === module) {
    startServer();
}

// Get all users
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM users ORDER BY uid'
        );

        return res.json(result.rows);
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: 'Server error'
        });
    }
});

// Create a Scout account
// Admin accounts should not be created through this endpoint.
app.post('/api/createaccount', async (req, res) => {
    const {
        username,
        email,
        password,
        mustChangePassword
    } = req.body;

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        if (result.rows.length > 0) {
            return res.status(409).json({
                message: 'Username already exists'
            });
        }

        const saltRounds = 10;

        const hashedPassword = await bcrypt.hash(
            password,
            saltRounds
        );

        await pool.query(
            `
                INSERT INTO users (
                    username,
                    email,
                    password_hash,
                    role,
                    must_change_password
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    'scout',
                    $4
                )
                RETURNING *
            `,
            [
                username,
                email,
                hashedPassword,
                mustChangePassword || false
            ]
        );

        return res.status(201).json({
            message: 'Account created successfully!'
        });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: 'Server error'
        });
    }
});

// Floor report insertion and validation

const FLOOR_REPORT_INSERT_SQL = `
    INSERT INTO floor_reports (
        fid,
        uid,
        plant_name,
        supplier,
        pests_found,
        pest_types,
        pest_severity,
        biology_used,
        biology_types,
        chemicals_used,
        chemicals_types,
        behandelaar,
        potmaat,
        oppotweek,
        teelduur_weeks,
        trap_number,
        bug_count,
        approval_status,
        report_batch_id,
        entry_date
    )
    VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14,
        $15,
        $16,
        $17,
        'pending',
        $18,
        $19
    )
    RETURNING *
`;

const normalizeStringArray = (value) => {
    if (Array.isArray(value)) {
        const cleanedValues = value
            .filter(
                (item) => typeof item === 'string'
            )
            .map(
                (item) => item.trim()
            )
            .filter(Boolean);

        return cleanedValues.length > 0
            ? cleanedValues
            : null;
    }

    if (
        typeof value === 'string' &&
        value.trim() !== ''
    ) {
        return [value.trim()];
    }

    return null;
};

const validateFloorReportData = (data) => {
    const errors = [];

    const uid = Number(data.uid);

    if (
        !Number.isInteger(uid) ||
        uid <= 0
    ) {
        errors.push(
            'A valid scout uid is required'
        );
    }

    if (!isValidDateOnly(data.entry_date)) {
        errors.push(
            'entry_date is required and must use YYYY-MM-DD'
        );
    } else if (
        data.entry_date > getLocalDateString()
    ) {
        errors.push(
            'entry_date cannot be in the future'
        );
    }

    if (!isNonEmptyString(data.plant_name)) {
        errors.push(
            'plant_name is required'
        );
    }

    if (!isNonEmptyString(data.supplier)) {
        errors.push(
            'supplier is required'
        );
    }

    if (typeof data.pests_found !== 'boolean') {
        errors.push(
            'pests_found must be true or false'
        );
    }

    // Conditional fields are required only when pests were found.
    if (data.pests_found === true) {
        if (!hasListValue(data.pest_types)) {
            errors.push(
                'At least one pest type is required when pests are found'
            );
        }

        const severity = Number(
            data.pest_severity
        );

        if (
            !Number.isInteger(severity) ||
            severity < 1 ||
            severity > 5
        ) {
            errors.push(
                'pest_severity must be an integer from 1 to 5 when pests are found'
            );
        }

        if (
            typeof data.biology_used !== 'boolean'
        ) {
            errors.push(
                'biology_used must be true or false'
            );
        }

        if (
            typeof data.chemicals_used !== 'boolean'
        ) {
            errors.push(
                'chemicals_used must be true or false'
            );
        }

        if (
            data.biology_used === true &&
            !hasListValue(data.biology_types)
        ) {
            errors.push(
                'biology_types is required when biology is used'
            );
        }

        if (
            data.chemicals_used === true &&
            !hasListValue(data.chemicals_types)
        ) {
            errors.push(
                'chemicals_types is required when chemicals are used'
            );
        }

        if (
            (
                data.biology_used === true ||
                data.chemicals_used === true
            ) &&
            !isNonEmptyString(data.behandelaar)
        ) {
            errors.push(
                'behandelaar is required when treatment is used'
            );
        }
    }

    if (
        data.oppotweek !== null &&
        data.oppotweek !== undefined &&
        data.oppotweek !== ''
    ) {
        const week = Number(data.oppotweek);

        if (
            !Number.isInteger(week) ||
            week < 1 ||
            week > 53
        ) {
            errors.push(
                'oppotweek must be an integer from 1 to 53'
            );
        }
    }

    if (
        data.teelduur_weeks !== null &&
        data.teelduur_weeks !== undefined &&
        data.teelduur_weeks !== ''
    ) {
        const weeks = Number(
            data.teelduur_weeks
        );

        if (
            !Number.isFinite(weeks) ||
            weeks < 0
        ) {
            errors.push(
                'teelduur_weeks cannot be negative'
            );
        }
    }

    if (
        data.bug_count !== null &&
        data.bug_count !== undefined &&
        data.bug_count !== ''
    ) {
        const count = Number(
            data.bug_count
        );

        if (
            !Number.isInteger(count) ||
            count < 0
        ) {
            errors.push(
                'bug_count must be a non-negative integer'
            );
        }
    }

    return errors;
};

// Converts frontend report data into the exact SQL parameter order.
const buildFloorReportParams = (fid, data) => {
    const pestsFound =
        data.pests_found === true;

    const biologyUsed =
        pestsFound &&
        data.biology_used === true;

    const chemicalsUsed =
        pestsFound &&
        data.chemicals_used === true;

    return [
        fid,
        Number(data.uid),

        data.plant_name.trim(),
        data.supplier.trim(),

        pestsFound,

        pestsFound
            ? normalizeStringArray(
                data.pest_types
            )
            : null,

        pestsFound
            ? Number(data.pest_severity)
            : null,

        biologyUsed,

        biologyUsed
            ? normalizeStringArray(
                data.biology_types
            )
            : null,

        chemicalsUsed,

        chemicalsUsed
            ? normalizeStringArray(
                data.chemicals_types
            )
            : null,

        biologyUsed || chemicalsUsed
            ? data.behandelaar.trim()
            : null,

        isNonEmptyString(data.potmaat)
            ? data.potmaat.trim()
            : null,

        data.oppotweek === '' ||
        data.oppotweek == null
            ? null
            : Number(data.oppotweek),

        data.teelduur_weeks === '' ||
        data.teelduur_weeks == null
            ? null
            : Number(data.teelduur_weeks),

        isNonEmptyString(data.trap_number)
            ? data.trap_number.trim()
            : null,

        data.bug_count === '' ||
        data.bug_count == null
            ? null
            : Number(data.bug_count),

        data.report_batch_id || null,

        data.entry_date
    ];
};

const insertFloorReport = (fid, data) => (
    pool.query(
        FLOOR_REPORT_INSERT_SQL,
        buildFloorReportParams(fid, data)
    )
);

// Submit one floor report
app.post('/api/floorreports', async (req, res) => {
    const fid = Number(req.body.fid);

    const errors = validateFloorReportData(
        req.body
    );

    if (
        !Number.isInteger(fid) ||
        fid <= 0
    ) {
        errors.unshift(
            'A valid fid is required'
        );
    }

    if (errors.length > 0) {
        return res.status(400).json({
            message: 'Invalid report data',
            errors
        });
    }

    try {
        await insertFloorReport(
            fid,
            req.body
        );

        return res.status(201).json({
            message:
                'Floor report created successfully!'
        });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: 'Server error'
        });
    }
});

// Submit the same report for multiple selected floors
app.post('/api/floorreports/bulk', async (req, res) => {
    const { fids } = req.body;

    if (
        !Array.isArray(fids) ||
        fids.length === 0
    ) {
        return res.status(400).json({
            message: 'fids are required'
        });
    }

    // Remove repeated floor IDs before inserting reports.
    const numericFids = [
        ...new Set(
            fids.map(Number)
        )
    ];

    const errors = validateFloorReportData(
        req.body
    );

    if (
        numericFids.some(
            (fid) =>
                !Number.isInteger(fid) ||
                fid <= 0
        )
    ) {
        errors.unshift(
            'Every fid must be a positive integer'
        );
    }

    if (errors.length > 0) {
        return res.status(400).json({
            message: 'Invalid report data',
            errors
        });
    }

    try {
        const reportBatchId =
            crypto.randomUUID();

        await Promise.all(
            numericFids.map(
                (fid) => insertFloorReport(
                    fid,
                    {
                        ...req.body,
                        report_batch_id:
                            reportBatchId
                    }
                )
            )
        );

        return res.status(201).json({
            message:
                'Floor reports created successfully!',
            count: numericFids.length,
            report_batch_id: reportBatchId
        });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: 'Server error'
        });
    }
});

// Change user password
app.post('/api/users/change-password', async (req, res) => {
    const {
        uid,
        currentPassword,
        newPassword
    } = req.body;

    try {
        const userResult = await pool.query(
            'SELECT * FROM users WHERE uid = $1',
            [uid]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        const user = userResult.rows[0];

        const isMatch = await bcrypt.compare(
            currentPassword,
            user.password_hash
        );

        if (!isMatch) {
            return res.status(401).json({
                message: 'Current password incorrect'
            });
        }

        const saltRounds = 10;

        const newHashedPassword = await bcrypt.hash(
            newPassword,
            saltRounds
        );

        await pool.query(
            `
                UPDATE users
                SET password_hash = $1
                WHERE uid = $2
            `,
            [
                newHashedPassword,
                uid
            ]
        );

        return res.status(200).json({
            message: 'Password updated successfully'
        });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: 'Server error'
        });
    }
});

// Change user email
app.post('/api/users/change-email', async (req, res) => {
    const {
        uid,
        password,
        newEmail
    } = req.body;

    try {
        const userResult = await pool.query(
            'SELECT * FROM users WHERE uid = $1',
            [uid]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        const user = userResult.rows[0];

        const isMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!isMatch) {
            return res.status(401).json({
                message: 'Incorrect password'
            });
        }

        await pool.query(
            `
                UPDATE users
                SET email = $1
                WHERE uid = $2
            `,
            [
                newEmail,
                uid
            ]
        );

        return res.status(200).json({
            message: 'Email updated successfully'
        });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: 'Server error'
        });
    }
});

// Change user language
app.post('/api/users/change-language', async (req, res) => {
    const {
        uid,
        newLanguage
    } = req.body;

    try {
        const userResult = await pool.query(
            'SELECT * FROM users WHERE uid = $1',
            [uid]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        await pool.query(
            `
                UPDATE users
                SET language = $1
                WHERE uid = $2
            `,
            [
                newLanguage,
                uid
            ]
        );

        return res.status(200).json({
            message: 'Language updated successfully'
        });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: 'Server error'
        });
    }
});

// Admin resets a Scout password
app.post('/api/admin/reset-scout-password', async (req, res) => {
    const {
        scoutUid,
        newPassword
    } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(
            newPassword,
            10
        );

        await pool.query(
            `
                UPDATE users
                SET
                    password_hash = $1,
                    must_change_password = true
                WHERE uid = $2
            `,
            [
                hashedPassword,
                scoutUid
            ]
        );

        return res.status(200).json({
            message:
                'Password reset and flag set successfully'
        });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: 'Failed to reset password'
        });
    }
});

// Complete forced password change
app.post('/api/users/complete-force-change', async (req, res) => {
    const {
        uid,
        newPassword
    } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(
            newPassword,
            10
        );

        await pool.query(
            `
                UPDATE users
                SET
                    password_hash = $1,
                    must_change_password = false
                WHERE uid = $2
            `,
            [
                hashedPassword,
                uid
            ]
        );

        return res.status(200).json({
            message: 'Password updated successfully'
        });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: 'Server error'
        });
    }
});

// Get all maps
// This endpoint currently returns all maps.
// Full server-side Scout map authorization is not implemented.
app.get('/api/maps', async (req, res) => {
    try {
        const result = await pool.query(
            `
                SELECT
                    mid,
                    name,
                    location,
                    greenhouse,
                    json_map
                FROM maps
                ORDER BY name ASC
            `
        );

        return res.json(result.rows);
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: 'Server error fetching maps'
        });
    }
});

// Get maps assigned to a Scout
app.get('/api/users/:uid/maps', async (req, res) => {
    const { uid } = req.params;

    try {
        const result = await pool.query(
            `
                SELECT mid
                FROM user_maps
                WHERE uid = $1
            `,
            [uid]
        );

        return res.json(
            result.rows.map((row) => row.mid)
        );
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: 'Server error fetching user maps'
        });
    }
});

// Assign maps to a Scout
app.post('/api/admin/assign-maps', async (req, res) => {
    const {
        scoutUid,
        mapIds
    } = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        await client.query(
            `
                DELETE FROM user_maps
                WHERE uid = $1
            `,
            [scoutUid]
        );

        if (
            Array.isArray(mapIds) &&
            mapIds.length > 0
        ) {
            await client.query(
                `
                    INSERT INTO user_maps (
                        uid,
                        mid
                    )
                    SELECT
                        $1,
                        unnest($2::int[])
                `,
                [
                    scoutUid,
                    mapIds
                ]
            );
        }

        await client.query('COMMIT');

        return res.json({
            message: 'Maps assigned successfully'
        });
    } catch (err) {
        await client.query('ROLLBACK');

        console.error(err);

        return res.status(500).json({
            message: 'Failed to assign maps'
        });
    } finally {
        client.release();
    }
});

// Get Scouts with assigned maps
app.get('/api/admin/scouts-maps-overview', async (req, res) => {
    try {
        const query = `
            SELECT
                u.uid,
                u.username,
                u.email,

                COALESCE(
                    json_agg(m.*)
                    FILTER (
                        WHERE m.mid IS NOT NULL
                    ),
                    '[]'
                ) AS assigned_maps

            FROM users u

            LEFT JOIN user_maps um
                ON u.uid = um.uid

            LEFT JOIN maps m
                ON um.mid = m.mid

            WHERE u.role = 'scout'
              AND u.is_employed = true

            GROUP BY
                u.uid,
                u.username,
                u.email

            ORDER BY u.username ASC
        `;

        const result = await pool.query(query);

        return res.json(result.rows);
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: 'Server error fetching overview'
        });
    }
});

// Pest History summary
// Supported periods: day, week, month, year and all.
//
// When start_date and end_date are provided, those dates take priority over
// the period value.
//
// Pest History uses entry_date, which is the date selected by the Scout.
app.get('/api/analytics/pest-history', async (req, res) => {
    try {
        const period = (
            req.query.period || 'month'
        ).toLowerCase();

        const mapId =
            req.query.map_id || 'all';

        const startDate =
            req.query.start_date;

        const endDate =
            req.query.end_date;

        const dateErrors = validateDateRangeQuery(
            startDate,
            endDate
        );

        if (dateErrors.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: dateErrors.join('. ')
            });
        }

        const params = [];
        const clauses = [];

        if (startDate && endDate) {
            params.push(startDate);

            clauses.push(
                `fr.entry_date >= $${params.length}::date`
            );

            params.push(endDate);

            clauses.push(
                `fr.entry_date <= $${params.length}::date`
            );
        } else {
            const periodClauses = {
                day:
                    'fr.entry_date = CURRENT_DATE',

                week:
                    "fr.entry_date >= CURRENT_DATE - INTERVAL '6 days'",

                month:
                    "fr.entry_date >= CURRENT_DATE - INTERVAL '1 month'",

                year:
                    "fr.entry_date >= CURRENT_DATE - INTERVAL '1 year'"
            };

            if (periodClauses[period]) {
                clauses.push(
                    periodClauses[period]
                );
            }
        }

        if (
            mapId &&
            mapId !== 'all'
        ) {
            params.push(mapId);

            clauses.push(
                `m.name = $${params.length}`
            );
        }

        const extraWhere =
            clauses.length > 0
                ? `AND ${clauses.join(' AND ')}`
                : '';

        const sql = `
            SELECT
                pest_type,
                COUNT(*) AS count

            FROM (
                SELECT
                    UNNEST(fr.pest_types) AS pest_type

                FROM floor_reports fr

                JOIN floors f
                    ON fr.fid = f.fid

                JOIN maps m
                    ON f.mid = m.mid

                WHERE fr.pests_found = true
                  AND fr.pest_types IS NOT NULL
                  AND fr.approval_status = 'approved'

                  ${extraWhere}
            ) AS expanded_pests

            GROUP BY pest_type

            ORDER BY
                count DESC,
                pest_type ASC
        `;

        const result = await pool.query(
            sql,
            params
        );

        return res.json({
            status: 'success',
            data: result.rows,
            period,
            map_id: mapId,
            start_date: startDate || null,
            end_date: endDate || null
        });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
});

// Pest History detailed records for one pest type
app.get('/api/analytics/pest-history-details', async (req, res) => {
    try {
        const { pest_type } = req.query;

        const period = (
            req.query.period || 'month'
        ).toLowerCase();

        const mapId =
            req.query.map_id || 'all';

        const startDate =
            req.query.start_date;

        const endDate =
            req.query.end_date;

        if (!pest_type) {
            return res.status(400).json({
                status: 'error',
                message: 'pest_type is required'
            });
        }

        const dateErrors = validateDateRangeQuery(
            startDate,
            endDate
        );

        if (dateErrors.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: dateErrors.join('. ')
            });
        }

        const params = [pest_type];
        const clauses = [];

        if (startDate && endDate) {
            params.push(startDate);

            clauses.push(
                `fr.entry_date >= $${params.length}::date`
            );

            params.push(endDate);

            clauses.push(
                `fr.entry_date <= $${params.length}::date`
            );
        } else {
            const periodClauses = {
                day:
                    'fr.entry_date = CURRENT_DATE',

                week:
                    "fr.entry_date >= CURRENT_DATE - INTERVAL '6 days'",

                month:
                    "fr.entry_date >= CURRENT_DATE - INTERVAL '1 month'",

                year:
                    "fr.entry_date >= CURRENT_DATE - INTERVAL '1 year'"
            };

            if (periodClauses[period]) {
                clauses.push(
                    periodClauses[period]
                );
            }
        }

        if (
            mapId &&
            mapId !== 'all'
        ) {
            params.push(mapId);

            clauses.push(
                `m.name = $${params.length}`
            );
        }

        const extraWhere =
            clauses.length > 0
                ? `AND ${clauses.join(' AND ')}`
                : '';

        const historyQuery = `
            SELECT
                fr.rid AS report_id,
                f.name AS cell_name,
                fr.plant_name AS plant_name,
                fr.supplier AS supplier,
                m.name AS map_id,
                fr.pest_severity AS severity,
                fr.pest_types AS pest_types,

                to_char(
                    fr.entry_date,
                    'YYYY-MM-DD'
                ) AS entry_date,

                to_char(
                    fr.report_time,
                    'YYYY-MM-DD"T"HH24:MI:SS'
                ) AS created_at,

                fr.approval_status AS status,
                u.username AS reporter_name,
                fr.biology_used AS biology_used,
                fr.biology_types AS biology_types,
                fr.chemicals_used AS chemicals_used,
                fr.chemicals_types AS chemicals_types

            FROM floor_reports fr

            JOIN floors f
                ON fr.fid = f.fid

            JOIN maps m
                ON f.mid = m.mid

            JOIN users u
                ON fr.uid = u.uid

            WHERE fr.pests_found = true
              AND fr.approval_status = 'approved'
              AND fr.pest_types IS NOT NULL
              AND $1 = ANY(fr.pest_types)

              ${extraWhere}

            ORDER BY
                fr.entry_date DESC,
                fr.report_time DESC,
                fr.rid DESC
        `;

        const historyResult = await pool.query(
            historyQuery,
            params
        );

        return res.json({
            status: 'success',

            data: {
                pestType: pest_type,
                history: historyResult.rows,
                historyCount:
                    historyResult.rows.length
            },

            period,
            map_id: mapId,
            start_date: startDate || null,
            end_date: endDate || null
        });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
});

// Date helpers for week comparison
const addDaysToDateString = (dateString, numberOfDays) => {
    const dateValue = new Date(
        `${dateString}T00:00:00Z`
    );

    dateValue.setUTCDate(
        dateValue.getUTCDate() + numberOfDays
    );

    return dateValue
        .toISOString()
        .slice(0, 10);
};

const getMondayDateString = (dateString) => {
    const dateValue = new Date(
        `${dateString}T00:00:00Z`
    );

    const dayOfWeek =
        dateValue.getUTCDay();

    // JavaScript: Sunday = 0, Monday = 1.
    const differenceToMonday =
        dayOfWeek === 0
            ? -6
            : 1 - dayOfWeek;

    dateValue.setUTCDate(
        dateValue.getUTCDate() +
        differenceToMonday
    );

    return dateValue
        .toISOString()
        .slice(0, 10);
};

// Compare approved pest reports between one selected week and the week before
// reference_date can be any valid YYYY-MM-DD date.
// The backend compares the Monday-Sunday week containing that date with the
// immediately preceding Monday-Sunday week.
// The comparison uses entry_date rather than report_time.
app.get('/api/analytics/pest-week-comparison', async (req, res) => {
    try {
        const mapId =
            req.query.map_id || 'all';

        const referenceDate =
            req.query.reference_date ||
            getLocalDateString();

        if (!isValidDateOnly(referenceDate)) {
            return res.status(400).json({
                status: 'error',
                message:
                    'reference_date must use YYYY-MM-DD'
            });
        }

        const currentWeekStart =
            getMondayDateString(referenceDate);

        const previousWeekStart =
            addDaysToDateString(
                currentWeekStart,
                -7
            );

        const nextWeekStart =
            addDaysToDateString(
                currentWeekStart,
                7
            );

        const params = [
            previousWeekStart,
            currentWeekStart,
            nextWeekStart
        ];

        let mapClause = '';

        if (
            mapId &&
            mapId !== 'all'
        ) {
            params.push(mapId);

            mapClause = `
                AND m.name = $${params.length}
            `;
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
                        WHEN fr.entry_date >= $2::date
                         AND fr.entry_date < $3::date
                        THEN 'current'

                        WHEN fr.entry_date >= $1::date
                         AND fr.entry_date < $2::date
                        THEN 'previous'
                    END AS week_bucket

                FROM floor_reports fr

                JOIN floors f
                    ON fr.fid = f.fid

                JOIN maps m
                    ON f.mid = m.mid

                WHERE fr.pests_found = true
                  AND fr.pest_types IS NOT NULL
                  AND fr.approval_status = 'approved'

                  AND fr.entry_date >= $1::date
                  AND fr.entry_date < $3::date

                  ${mapClause}
            )

            SELECT
                map_id,
                cell_name,
                pest_type,

                COUNT(*) FILTER (
                    WHERE week_bucket = 'previous'
                ) AS previous_reports,

                COUNT(*) FILTER (
                    WHERE week_bucket = 'current'
                ) AS current_reports,

                COALESCE(
                    SUM(bug_count) FILTER (
                        WHERE week_bucket = 'previous'
                    ),
                    0
                ) AS previous_bug_count,

                COALESCE(
                    SUM(bug_count) FILTER (
                        WHERE week_bucket = 'current'
                    ),
                    0
                ) AS current_bug_count,

                ROUND(
                    (
                        AVG(pest_severity) FILTER (
                            WHERE week_bucket = 'previous'
                        )
                    )::numeric,
                    1
                ) AS previous_avg_severity,

                ROUND(
                    (
                        AVG(pest_severity) FILTER (
                            WHERE week_bucket = 'current'
                        )
                    )::numeric,
                    1
                ) AS current_avg_severity,

                COALESCE(
                    BOOL_OR(
                        COALESCE(
                            biology_used,
                            false
                        )
                        OR
                        COALESCE(
                            chemicals_used,
                            false
                        )
                    )
                    FILTER (
                        WHERE week_bucket = 'previous'
                    ),
                    false
                ) AS previous_treatment_used,

                COALESCE(
                    BOOL_OR(
                        COALESCE(
                            biology_used,
                            false
                        )
                        OR
                        COALESCE(
                            chemicals_used,
                            false
                        )
                    )
                    FILTER (
                        WHERE week_bucket = 'current'
                    ),
                    false
                ) AS current_treatment_used

            FROM expanded_reports

            GROUP BY
                map_id,
                cell_name,
                pest_type

            ORDER BY
                map_id ASC,
                cell_name ASC,
                pest_type ASC
        `;

        const result = await pool.query(
            sql,
            params
        );

        const rows = result.rows.map((row) => {
            const previousReports = Number(
                row.previous_reports || 0
            );

            const currentReports = Number(
                row.current_reports || 0
            );

            const previousBugCount = Number(
                row.previous_bug_count || 0
            );

            const currentBugCount = Number(
                row.current_bug_count || 0
            );

            const reportDifference =
                currentReports -
                previousReports;

            const bugCountDifference =
                currentBugCount -
                previousBugCount;

            let status = 'no_change';

            if (
                previousReports === 0 &&
                currentReports > 0
            ) {
                status = 'new_issue';
            } else if (
                previousReports > 0 &&
                currentReports === 0
            ) {
                status = 'improved';
            } else if (
                currentReports <
                previousReports
            ) {
                status = 'improved';
            } else if (
                currentReports >
                previousReports
            ) {
                status = 'worse';
            }

            let treatmentEffect =
                'No treatment recorded last week';

            if (row.previous_treatment_used) {
                if (status === 'improved') {
                    treatmentEffect =
                        'Treatment may have worked';
                } else if (status === 'worse') {
                    treatmentEffect =
                        'Treatment did not reduce reports';
                } else if (
                    status === 'no_change'
                ) {
                    treatmentEffect =
                        'Treatment result unclear';
                } else if (
                    status === 'new_issue'
                ) {
                    treatmentEffect =
                        'New issue this week';
                }
            }

            return {
                map_id: row.map_id,
                cell_name: row.cell_name,
                pest_type: row.pest_type,

                previous_reports:
                    previousReports,

                current_reports:
                    currentReports,

                report_difference:
                    reportDifference,

                previous_bug_count:
                    previousBugCount,

                current_bug_count:
                    currentBugCount,

                bug_count_difference:
                    bugCountDifference,

                previous_avg_severity:
                    row.previous_avg_severity,

                current_avg_severity:
                    row.current_avg_severity,

                previous_treatment_used:
                    row.previous_treatment_used,

                current_treatment_used:
                    row.current_treatment_used,

                status,

                treatment_effect:
                    treatmentEffect
            };
        });

        return res.json({
            status: 'success',
            map_id: mapId,
            reference_date: referenceDate,
            current_week_start:
                currentWeekStart,
            previous_week_start:
                previousWeekStart,
            data: rows
        });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
});

// Fetch Scouts and their recent reports for the Admin overview
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
                            m.name AS map_name,
                            f.name AS section_name,

                            to_char(
                                fr.entry_date,
                                'DD/MM/YYYY'
                            ) AS entry_date,

                            to_char(
                                fr.report_time,
                                'DD/MM/YYYY HH24:MI'
                            ) AS formatted_date,

                            fr.approval_status
                                AS status

                        FROM floor_reports fr

                        JOIN floors f
                            ON fr.fid = f.fid

                        JOIN maps m
                            ON f.mid = m.mid

                        WHERE fr.uid = u.uid

                        ORDER BY
                            fr.entry_date DESC,
                            fr.report_time DESC,
                            fr.rid DESC

                        LIMIT 4
                    ) report_sub
                ) AS recent_reports

            FROM users u

            WHERE u.role = 'scout'
              AND u.is_employed = true

            ORDER BY u.username ASC
        `;

        const result = await pool.query(query);

        return res.json(result.rows);
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message:
                'Server error fetching scouts reports summary'
        });
    }
});

// Get one Scout's report/task history
app.get('/api/scout/tasks/:uid', async (req, res) => {
    const { uid } = req.params;

    try {
        const result = await pool.query(
            `
                SELECT
                    fr.rid,

                    fr.approval_status
                        AS status,

                    fr.comment,

                    f.name
                        AS section_name,

                    fr.plant_name,
                    fr.supplier,

                    m.name
                        AS map_name,

                    m.mid,
                    f.fid,

                    to_char(
                        fr.entry_date,
                        'YYYY-MM-DD'
                    ) AS entry_date,

                    to_char(
                        fr.report_time,
                        'YYYY-MM-DD"T"HH24:MI:SS'
                    ) AS created_at

                FROM floor_reports fr

                JOIN floors f
                    ON fr.fid = f.fid

                JOIN maps m
                    ON f.mid = m.mid

                WHERE fr.uid = $1

                ORDER BY
                    fr.entry_date DESC,
                    fr.report_time DESC,
                    fr.rid DESC
            `,
            [uid]
        );

        return res.json(result.rows);
    } catch (err) {
        console.error(
            'DATABASE ERROR:',
            err.message
        );

        return res.status(500).json({
            error: err.message
        });
    }
});

// Change a user's employment status
app.post('/api/users/:uid/employment', async (req, res) => {
    const { uid } = req.params;
    const { is_employed } = req.body;

    try {
        const result = await pool.query(
            `
                UPDATE users
                SET is_employed = $1
                WHERE uid = $2
                RETURNING
                    uid,
                    username,
                    is_employed
            `,
            [
                is_employed,
                uid
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        return res.json({
            message:
                'Employment status updated successfully',
            user: result.rows[0]
        });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message:
                'Server error updating employment status'
        });
    }
});

// Get filtered roof status reports
app.get('/api/reports/roof', async (req, res) => {
    const { location } = req.query;

    try {
        let query = `
            SELECT
                rp.rpid AS id,
                m.name AS location,
                rp.activity,
                rp.status,

                to_char(
                    rp.activity_date,
                    'YYYY-MM-DD'
                ) AS date,

                rp.notes AS description

            FROM roof_painting rp

            JOIN maps m
                ON rp.mid = m.mid
        `;

        const params = [];

        if (
            location &&
            location !== 'All'
        ) {
            params.push(location);

            query += `
                WHERE m.name = $1
            `;
        }

        query += `
            ORDER BY rp.created_at DESC
            LIMIT 5
        `;

        const result = await pool.query(
            query,
            params
        );

        return res.json(result.rows);
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message:
                'Server error fetching roof reports'
        });
    }
});

// Submit a new roof report
app.post('/api/reports/roof', async (req, res) => {
    const {
        location,
        activity,
        status,
        date,
        description
    } = req.body;

    try {
        const mapResult = await pool.query(
            `
                SELECT mid
                FROM maps
                WHERE name = $1
            `,
            [location]
        );

        if (mapResult.rows.length === 0) {
            return res.status(404).json({
                message:
                    'Greenhouse location map not found'
            });
        }

        const mid =
            mapResult.rows[0].mid;

        const insertQuery = `
            INSERT INTO roof_painting (
                mid,
                activity,
                status,
                activity_date,
                notes
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5
            )
            RETURNING
                rpid AS id,
                activity,
                status,

                to_char(
                    activity_date,
                    'YYYY-MM-DD'
                ) AS date,

                notes AS description
        `;

        const finalDate =
            date ||
            getLocalDateString();

        const result = await pool.query(
            insertQuery,
            [
                mid,
                activity,
                status,
                finalDate,
                description || ''
            ]
        );

        return res.status(201).json({
            message:
                'Roof report created successfully!',

            report: {
                ...result.rows[0],
                location
            }
        });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message:
                'Server error saving roof report'
        });
    }
});

// Get climate computer reports
app.get('/api/reports/climate', async (req, res) => {
    const { location } = req.query;

    try {
        let query = `
            SELECT
                cc.ccid AS id,
                m.name AS nursery,
                cc.name AS computer_name,
                cc.model,
                cc.hoogendoornnummer,
                cc.afdeling,
                cc.inside_temperature,
                cc.outside_temperature,
                cc.humidity,
                cc.light,

                to_char(
                    cc.last_updated_at,
                    'YYYY-MM-DD HH24:MI'
                ) AS date

            FROM climate_computer cc

            JOIN maps m
                ON cc.mid = m.mid
        `;

        const params = [];

        if (
            location &&
            location !== 'All'
        ) {
            params.push(location);

            query += `
                WHERE m.name = $1
            `;
        }

        query += `
            ORDER BY
                cc.last_updated_at DESC
        `;

        const result = await pool.query(
            query,
            params
        );

        return res.json(result.rows);
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message:
                'Server error fetching climate reports'
        });
    }
});

// Submit or update climate computer data
app.post('/api/reports/climate', async (req, res) => {
    const {
        nursery,
        hoogendoornnummer,
        afdeling,
        inside_temperature,
        outside_temperature,
        humidity,
        light
    } = req.body;

    try {
        const mapResult = await pool.query(
            `
                SELECT mid
                FROM maps
                WHERE name = $1
            `,
            [nursery]
        );

        if (mapResult.rows.length === 0) {
            return res.status(404).json({
                message:
                    'Greenhouse location map not found'
            });
        }

        const mid =
            mapResult.rows[0].mid;

        const defaultName =
            `Comp-${nursery}`;

        const defaultModel =
            'Hoogendoorn iSii';

        const upsertQuery = `
            INSERT INTO climate_computer (
                mid,
                name,
                model,
                hoogendoornnummer,
                afdeling,
                inside_temperature,
                outside_temperature,
                humidity,
                light,
                last_updated_at
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9,
                CURRENT_TIMESTAMP
            )

            ON CONFLICT (mid)
            DO UPDATE SET
                hoogendoornnummer =
                    EXCLUDED.hoogendoornnummer,

                afdeling =
                    EXCLUDED.afdeling,

                inside_temperature =
                    EXCLUDED.inside_temperature,

                outside_temperature =
                    EXCLUDED.outside_temperature,

                humidity =
                    EXCLUDED.humidity,

                light =
                    EXCLUDED.light,

                last_updated_at =
                    CURRENT_TIMESTAMP

            RETURNING
                ccid AS id,
                name,
                model,
                hoogendoornnummer,
                afdeling,
                inside_temperature,
                outside_temperature,
                humidity,
                light,

                to_char(
                    last_updated_at,
                    'YYYY-MM-DD HH24:MI'
                ) AS date
        `;

        const result = await pool.query(
            upsertQuery,
            [
                mid,
                defaultName,
                defaultModel,
                hoogendoornnummer,
                afdeling,
                inside_temperature,
                outside_temperature,
                humidity,
                light
            ]
        );

        return res.status(201).json({
            message:
                'Climate report synchronized successfully!',

            report: {
                ...result.rows[0],
                nursery
            }
        });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message:
                'Server error saving climate report'
        });
    }
});

// Exports used by Jest
module.exports = {
    app,
    pool,
    startServer,
    testDatabaseConnection,
    ensureReportBatchColumn,

    // Exported mainly to make validation easier to unit-test.
    validateFloorReportData,
    validateDateRangeQuery,
    isValidDateOnly,
    getLocalDateString,
    getMondayDateString,
    addDaysToDateString
};