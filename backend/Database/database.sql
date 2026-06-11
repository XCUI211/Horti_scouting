CREATE TABLE users (
    uid             SERIAL      PRIMARY KEY,                                   -- unique user ID number
    username        VARCHAR(50) UNIQUE NOT NULL,                               -- username (unique to each user)
    password_hash   TEXT        NOT NULL,                                      -- hashed password
    role            VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'scout')),   -- 'admin' or 'scout'
	email           VARCHAR(50),                                               -- optional
    is_employed     BOOLEAN NOT NULL DEFAULT TRUE,                             -- if a user is fired/deleted, their reports should still exist
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,                       -- after admin resets scout password they NEED to change it
    language VARCHAR(10) NOT NULL DEFAULT 'nl'                                 -- user language (ISO code, e.g. 'en', 'nl')
);

CREATE TABLE maps (
    mid        SERIAL PRIMARY KEY,          -- unique map ID number
    name       VARCHAR(50) NOT NULL UNIQUE, -- name of the map
    location   VARCHAR(50) NOT NULL,        -- location of the map
    greenhouse VARCHAR(50) NOT NULL,        -- greenhouse associated with the map
    json_map   JSONB       NOT NULL         -- JSON representation of the map data; JSONB allows for JSON queries if needed);
);

CREATE TABLE user_maps (
    uid INT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    mid INT NOT NULL REFERENCES maps(mid) ON DELETE CASCADE,
    PRIMARY KEY (uid, mid)
);

CREATE TABLE floors (
    fid         SERIAL      PRIMARY KEY,                                        -- unique floor ID number
    mid         INT         NOT NULL REFERENCES maps(mid) ON DELETE CASCADE,    -- foreign key to maps table; one section has many floors
    name        VARCHAR(50) NOT NULL,                                          -- visible name of the floor/cell
    block_key   VARCHAR(150)                                                   -- stable map::name::row:col key for duplicate visible names
);

CREATE UNIQUE INDEX floors_mid_block_key_unique ON floors (mid, block_key) WHERE block_key IS NOT NULL;

CREATE TABLE floor_reports (
    rid             SERIAL      PRIMARY KEY,                                                             -- unique report ID number
    fid             INT         NOT NULL REFERENCES floors (fid) ON DELETE CASCADE,                      -- foreign key
    uid             INT         NOT NULL REFERENCES users (uid),                                         -- foreign key to users table; one user can have many reports

    plant_name  VARCHAR(50) NOT NULL,                                                                    -- name of the plant in the floor
    supplier    VARCHAR(100) NOT NULL,                                                                   -- supplier of the plant

    pests_found     BOOLEAN     NOT NULL,                                                                -- whether pests were found in the floor
    pest_types      TEXT[],                                                                              -- type of pest found (if applicable)
    pest_severity   INT,                                                                                 -- pest status of the plant (1-5) (if applicable)
    biology_used    BOOLEAN     NOT NULL,                                                                -- if biology is used
    biology_types   TEXT[],                                                                              -- type of biology used to treat plants (if applicable)
    chemicals_used  BOOLEAN     NOT NULL,                                                                -- if chemicals are used
    chemicals_types TEXT[],                                                                              -- type of chemicals used to treat plants (if applicable)
    behandelaar     VARCHAR(50),                                                                         -- name of the person who treated the plants (if applicable)

    potmaat         VARCHAR(50),                                                                         -- pot size
    oppotweek       INT,                                                                                 -- potting week
    teelduur_weeks  INT,                                                                                 -- cultivation duration in weeks

    trap_number     DATE,                                                                                -- trap number used for pest control (if applicable)
    bug_count       INT,                                                                                 -- number of bugs found in the trap (if applicable)

    report_time     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,                                      -- timestamp of the report
    approval_status VARCHAR(50) NOT NULL CHECK (approval_status IN ('pending', 'approved', 'rejected')), -- approval status of the report
    report_batch_id UUID,                                                                                -- shared ID for reports created together with multi-select
    reviewed_at     TIMESTAMP,                                                                           -- timestamp of when the report was reviewed (approved/rejected)
    comment         TEXT                                                                                 -- optional comment from the admin when approving/rejecting the report
);

-- index to group reports by multi-select
-- this is done to keep track of which reports belong to the same multi-select selection so that the admin
-- can batch approve/reject them together
CREATE INDEX floor_reports_report_batch_id_idx ON floor_reports (report_batch_id) WHERE report_batch_id IS NOT NULL;

CREATE TABLE climate_computer (
    ccid                 SERIAL         PRIMARY KEY,                                            -- unique climate computer ID number
    mid                  INT            NOT NULL UNIQUE REFERENCES maps(mid) ON DELETE CASCADE, -- foreign key to maps table; ONE map has ONE climate computer
    name                 VARCHAR(50)    NOT NULL,                                               -- name of the climate computer
    model                VARCHAR(50)    NOT NULL,                                               -- model of the climate computer
    hoogendoornnummer    VARCHAR(50)    NOT NULL,                                               -- Hoogendoorn identification number
    afdeling             VARCHAR(50)    NOT NULL,                                               -- department/section this climate computer belongs to
    inside_temperature   DECIMAL(10,2),                                                          -- inside temperature for this afdeling
    outside_temperature  DECIMAL(10,2),                                                          -- outside temperature
    humidity             DECIMAL(10,2),                                                          -- humidity for this afdeling
    light                DECIMAL(10,2),                                                          -- light level for this afdeling
    last_updated_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP                       -- time recorded
);

CREATE TABLE roof_painting (
    rpid             SERIAL      PRIMARY KEY,                                                                    -- unique roof painting entry ID number
    mid              INT         NOT NULL REFERENCES maps(mid) ON DELETE CASCADE,                                -- foreign key to maps table; one map can have multiple roof painting records
    activity         VARCHAR(50) NOT NULL CHECK (activity IN ('Painting', 'Cleaning', 'PaintingAndCleaning')),   -- kind of activity being done to the roof
    status           VARCHAR(20) NOT NULL CHECK (status IN ('Done', 'ToBeDone')),                                -- if the activity was completed or is scheduled
    activity_date    DATE        NOT NULL,                                                                       -- week number the roof was painted
    notes            TEXT,                                                                                       -- optional notes about the roof painting
    created_at       TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP                                              -- when the record was added
);
