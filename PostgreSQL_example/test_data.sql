-- USERS
INSERT INTO users (username, password_hash, role, email)
VALUES 
('admin1', '1234', 'admin', 'admin@example.com'),
('scout1', '1234', 'scout', 'scout1@example.com');

-- MAP
INSERT INTO maps (name, location, greenhouse, json_map)
VALUES (
    'Greenhouse A',
    'Campus North',
    'GH-1',
    '{"sections": ["S1", "S2", "S3", "S4"]}'
);

-- SECTIONS (assuming map id = 1)
INSERT INTO sections (mid, name, plant_name)
VALUES
(1, 'Section 1', 'Tomato'),
(1, 'Section 2', 'Cucumber');

-- SECTION REPORT
INSERT INTO section_reports (sid, uid, pests_found, pest_type, pest_severity, approval_status, floor)
VALUES
(1, 2, TRUE, 'thrips', 3, 'pending', 'Floor 1');

-- CHECK DATA
SELECT * FROM users;
SELECT * FROM maps;
SELECT * FROM sections;
SELECT * FROM section_reports;