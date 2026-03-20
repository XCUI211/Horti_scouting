
-- Issue Types
CREATE TABLE IF NOT EXISTS issue_types (
    issue_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,     
    category VARCHAR(50) NOT NULL, 
    marker_color VARCHAR(10) NOT NULL
);

-- Scouting Reports
CREATE TABLE IF NOT EXISTS scouting_reports (
    report_id SERIAL PRIMARY KEY,
    map_id VARCHAR(50) NOT NULL,     
    cell_name VARCHAR(50) NOT NULL, 
    issue_id INT REFERENCES issue_types(issue_id), 
    
    -- Data
    severity INT CHECK (severity BETWEEN 1 AND 5), 
    count INT DEFAULT 0,                          
    
    -- Date and situation
    entry_date DATE DEFAULT CURRENT_DATE,       
    status VARCHAR(20) DEFAULT 'pending',        
    
    -- report
    reporter_name VARCHAR(100),
    reporter_email VARCHAR(100),
    reporter_phone VARCHAR(20),
    
    -- Feedback
    admin_comment TEXT
);

-- Maps
CREATE TABLE IF NOT EXISTS maps (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    grid_data JSON NOT NULL 
);

-- Seed Data
INSERT INTO issue_types (name, category, marker_color) VALUES
('Spint (Spider mite)', 'Pest', '#FF0000'),        
('Trips (Thrips)', 'Pest', '#800080'),             
('Rups (Caterpillar)', 'Pest', '#B8860B'),          
('Groene luis (Green aphid)', 'Pest', '#008000'),  
('Zwarte luis (Black aphid)', 'Pest', '#0000FF'), 
('Wolluis (Mealybug)', 'Pest', '#808080'),          
('Pythium', 'Disease', '#000000'),                
('Mijt (Mite)', 'Pest', '#8B4513'),               
('Cycade (Cicada)', 'Pest', '#FFFFE0'),            
('Onkruid (Weeds)', 'Maintenance', '#B5D045');
