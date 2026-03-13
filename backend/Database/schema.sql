-- Table for Pest and Biological Control types
CREATE TABLE IF NOT EXISTS IssueTypes (
    type_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,          -- Name of pest/bio-control, e.g., 'Trips', 'Spint'
    category VARCHAR(50),                -- Category: 'Pest' or 'Bio'
    marker_color VARCHAR(7) DEFAULT '#FF0000' -- HEX color code for map visualization
);

-- Table for Scouting Reports (Core Business Table)
CREATE TABLE IF NOT EXISTS ScoutingReports (
    report_id SERIAL PRIMARY KEY,
    map_id VARCHAR(50) NOT NULL,          -- Identifier for the map, e.g., 'HW10.1_1100'
    cell_name VARCHAR(50) NOT NULL,       -- Grid location clicked, e.g., 'Baan 14'
    issue_type_id INT REFERENCES IssueTypes(type_id), -- Linked issue type
    severity INT CHECK (severity BETWEEN 1 AND 5),    -- Severity level from 1 to 5
    report_date DATE DEFAULT CURRENT_DATE, -- Date of observation (supports backlogging)
    status VARCHAR(20) DEFAULT 'pending',  -- Status: 'pending' or 'approved'
    
    -- Placeholder fields for reporter information (for future account system)
    reporter_name VARCHAR(100) DEFAULT 'Mock Scout',
    reporter_email VARCHAR(100),
    reporter_phone VARCHAR(20),
    
    -- Admin feedback/feedback
    admin_comment TEXT
);

-- ======================================================
-- Initial Mock Data for Testing
-- ======================================================

INSERT INTO IssueTypes (name, category, marker_color) VALUES 
('Trips', 'Pest', '#0000FF'),   
('Spint', 'Pest', '#FF0000'),  
('Phyto', 'Bio', '#00FF00');     

-- Insert an initial pending report for demo purposes
INSERT INTO ScoutingReports 
(map_id, cell_name, issue_type_id, severity, report_date, reporter_email, reporter_phone) 
VALUES 
('HW10.1_1100', 'Baan 14', 1, 4, CURRENT_DATE, 'scout@vireo.nl', '06-12345678');