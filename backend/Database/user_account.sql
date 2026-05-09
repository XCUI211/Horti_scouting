-- USERS
-- The HASHED password is the same as "1", so you can log in with username "admin" and password "1", or username "scout" and password "1"
INSERT INTO users (uid, username, password_hash, role, email)
VALUES
(1, 'admin', '$2b$10$5r/kRGpGjQ1gjV44TtTaPOap1V5/Dr6SWgV2tDSf9LsJOPjcz1WcC', 'admin', 'admin@example.com'),
(2, 'scout', '$2b$10$5r/kRGpGjQ1gjV44TtTaPOap1V5/Dr6SWgV2tDSf9LsJOPjcz1WcC', 'scout', 'scout1@example.com');

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