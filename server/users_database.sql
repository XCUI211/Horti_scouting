CREATE TABLE users (
    uid SERIAL PRIMARY KEY,           -- unique user ID number
    username VARCHAR(50) UNIQUE NOT NULL, -- username (unique to each user)
    password_hash TEXT NOT NULL,      -- hashed password
    role VARCHAR(20) NOT NULL,        -- 'admin' or 'scout'
	name VARCHAR(50) NOT NULL,        -- full name of the user
	email VARCHAR(50)                 -- optional
);