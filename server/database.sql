CREATE TABLE users (
    uid             SERIAL      PRIMARY KEY,                                   -- unique user ID number
    username        VARCHAR(50) UNIQUE NOT NULL,                               -- username (unique to each user)
    password_hash   TEXT        NOT NULL,                                      -- hashed password
    role            VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'scout')),   -- 'admin' or 'scout'
	email           VARCHAR(50),                                               -- optional
    is_employed     BOOLEAN NOT NULL DEFAULT TRUE                              -- if a user is fired/deleted, their reports should still exist
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE                        -- after admin resets scout password they NEED to change it
);

CREATE TABLE maps (
    mid         SERIAL      PRIMARY KEY,   -- unique map ID number
    name        VARCHAR(50) NOT NULL,      -- name of the map
    location    VARCHAR(50) NOT NULL,      -- location of the map
    greenhouse  VARCHAR(50) NOT NULL,      -- greenhouse associated with the map
    json_map    JSONB       NOT NULL       -- JSON representation of the map data; JSONB allows for JSON queries if needed
);

CREATE TABLE sections (
    sid         SERIAL      PRIMARY KEY,                                        -- unique section ID number
    mid         INT         NOT NULL REFERENCES maps(mid) ON DELETE CASCADE,    -- foreign key to maps table; one map has many sections
    name        VARCHAR(50) NOT NULL,                                           -- name of the section
    plant_name  VARCHAR(50) NOT NULL                                            -- name of the plant in the section
);

CREATE TABLE section_reports (
    rid             SERIAL      PRIMARY KEY,                                                             -- unique report ID number
    sid             INT         NOT NULL REFERENCES sections (sid) ON DELETE CASCADE,                    -- foreign key
    uid             INT         NOT NULL REFERENCES users (uid),                                         -- foreign key to users table; one user can have many reports

    floor           VARCHAR(50) NOT NULL,                                                                -- floor of the section
    pests_found     BOOLEAN     NOT NULL,                                                                -- whether pests were found in the section
    pest_type       VARCHAR(50),                                                                         -- type of pest found (if applicable)
    pest_severity   INT,                                                                                 -- pest status of the plant (1-5) (if applicable)
    biology         TEXT,                                                                                -- biology used to treat plants (if applicable)

    trap_number     VARCHAR(50),                                                                         -- trap number used for pest control (if applicable)
    bug_count       INT,                                                                                 -- number of bugs found in the trap (if applicable)

    report_time     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,                                      -- timestamp of the report
    approval_status VARCHAR(50) NOT NULL CHECK (approval_status IN ('pending', 'approved', 'rejected')), -- approval status of the report
    reviewed_at     TIMESTAMP                                                                            -- timestamp of when the report was reviewed (approved/rejected)
);