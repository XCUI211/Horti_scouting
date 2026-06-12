-- USERS
-- The HASHED password is the same as "1", so you can log in with username "admin" and password "1", or username "scout" and password "1"
INSERT INTO users (uid, username, password_hash, role, email)
VALUES
(1, 'admin', '$2b$10$5r/kRGpGjQ1gjV44TtTaPOap1V5/Dr6SWgV2tDSf9LsJOPjcz1WcC', 'admin', 'admin@example.com'),
(2, 'scout', '$2b$10$5r/kRGpGjQ1gjV44TtTaPOap1V5/Dr6SWgV2tDSf9LsJOPjcz1WcC', 'scout', 'scout1@example.com');

-- If accounts are MANUALLY added/removed, the sequence will be out of sync, so it needs to be reset to the
-- max uid + 1 to avoid conflicts when creating new accounts
SELECT setval(
    pg_get_serial_sequence('users', 'uid'),
    COALESCE((SELECT MAX(uid) FROM users), 1),
    EXISTS (SELECT 1 FROM users)
);
