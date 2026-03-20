import os
from sqlalchemy import text
from api import engine, SessionLocal
print("🚀 Script is starting...") # Add this at the very top
def run_sql_file(filename='schema.sql'):
    """
    Reads the SQL schema file and executes it against the SQLite database.
    This initializes tables and seeds initial data.
    """
    # Get the directory where this script is located (backend/Scripts/)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Construct the path to schema.sql in backend/Database/
    # Going up one level to 'backend', then into 'Database'
    sql_path = os.path.join(script_dir, '..', 'Database', filename) 
    
    if not os.path.exists(sql_path):
        print(f"❌ Error: SQL file not found at: {sql_path}")
        return

    print(f"📖 Reading SQL file: {sql_path}")
    
    # 3. Read the SQL content
    try:
        with open(sql_path, 'r', encoding='utf-8') as f:
            sql_commands = f.read()
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return

    # Connect to the database and execute the script
    # We use engine.raw_connection() because SQLite's default execute() 
    # often doesn't support running multiple SQL statements at once.
    db = SessionLocal()
    try:
        connection = engine.raw_connection()
        cursor = connection.cursor()
        
        # Use the standard way to handle multi-line SQL in SQLite
        cursor.executescript(sql_commands)
        
        connection.commit()
        print("✅ SQL script executed successfully. Database initialized and seeded!")
    except Exception as e:
        print(f"❌ Execution failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_sql_file()