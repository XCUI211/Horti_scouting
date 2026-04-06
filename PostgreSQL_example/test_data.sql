-- USERS
INSERT INTO users (uid, username, password_hash, role, email)
VALUES
(1, 'admin1', '1234', 'admin', 'admin@example.com'),
(2, 'scout1', '1234', 'scout', 'scout1@example.com');

-- MAP
INSERT INTO maps (mid, name, location, greenhouse, json_map)
VALUES (
    1,
    'Greenhouse A',
    'Campus North',
    'GH-1',
    '{"floors": ["S1", "S2", "S3", "S4"]}'
);

-- FLOORS
INSERT INTO floors (fid, mid, name, plant_name)
VALUES
(1, 1, 'Floor 1', 'Tomato'),
(2, 1, 'Floor 2', 'Cucumber');

-- FLOOR REPORT
INSERT INTO floor_reports (
    fid, uid, pests_found, pest_types, pest_severity,
    biology_used, chemicals_used, approval_status
)
VALUES
(1, 2, TRUE, ARRAY['thrips'], 3, FALSE, FALSE, 'pending');

-- CHECK DATA
SELECT * FROM users;
SELECT * FROM maps;
SELECT * FROM floors;
SELECT * FROM floor_reports;