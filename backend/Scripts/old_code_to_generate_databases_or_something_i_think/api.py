import os
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, JSON, Date, Text, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import List, Optional
from datetime import date   
from fastapi.middleware.cors import CORSMiddleware

# Database Setup & Models

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DB_DIR = os.path.join(BASE_DIR, "Maps")
if not os.path.exists(DB_DIR):
    os.makedirs(DB_DIR)

db_path = os.path.join(DB_DIR, "horti_scouting.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_path}"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# GET /api/issue-types
class IssueType(Base):
    __tablename__ = "issue_types" 
    issue_id = Column(Integer, primary_key=True, index=True) 
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False) 
    marker_color = Column(String(10), nullable=False)

# GET /api/maps/:id
class Map(Base):
    __tablename__ = "maps"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    grid_data = Column(JSON) 

# POST/GET/PUT /api/reports
class ScoutingReport(Base):
    __tablename__ = "scouting_reports"
    
    report_id = Column(Integer, primary_key=True, index=True)
    map_id = Column(String(50), nullable=False) 
    cell_name = Column(String(50), nullable=False) 
    block_key = Column(String(100), nullable=True)
    issue_id = Column(Integer, ForeignKey("issue_types.issue_id")) 
    
    severity = Column(Integer)
    count = Column(Integer, default=0) 
    
    entry_date = Column(Date, default=date.today)
    status = Column(String(20), default='pending')
    
    reporter_name = Column(String(100))
    reporter_email = Column(String(100))
    reporter_phone = Column(String(20))
    
    admin_comment = Column(Text) 

# Create all database tables
Base.metadata.create_all(bind=engine)

def ensure_report_schema():
    """
    Keep existing SQLite databases compatible with the SQLAlchemy model.
    create_all() creates missing tables, but it does not add missing columns
    to tables that already exist.
    """
    with engine.begin() as connection:
        existing_columns = {
            row[1] for row in connection.execute(text("PRAGMA table_info(scouting_reports)"))
        }

        if "block_key" not in existing_columns:
            connection.execute(text("ALTER TABLE scouting_reports ADD COLUMN block_key VARCHAR(100)"))

ensure_report_schema()

# Pydantic Data Validation Models (Schemas)
# Validate JSON data sent from the front end via POST/PUT.
class ReportCreate(BaseModel):
    map_id: str
    cell_name: str
    block_key: Optional[str] = None
    issue_id: int
    severity: int
    count: int = 0
    reporter_name: str
    reporter_email: Optional[str] = None
    reporter_phone: Optional[str] = None


class ReportApprove(BaseModel):
    status: str # "approved" or "rejected"
    admin_comment: Optional[str] = None

# FastAPI Core Interface
app = FastAPI(title="Horti Scouting API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# DB session dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# API 1: Send a list of pests and their colors to the front end
@app.get("/api/issue-types")
def get_issue_types(db: Session = Depends(get_db)):
    issues = db.query(IssueType).all()
    return {"status": "success", "data": issues}


# API 2: Send the parsed 2D map grid data based on the ID
@app.get("/api/maps/{map_id}")
def get_map_data(map_id: int, db: Session = Depends(get_db)):
    map_data = db.query(Map).filter(Map.id == map_id).first()
    if not map_data:
        raise HTTPException(status_code=404, detail="Map not found")
    return {"status": "success", "data": map_data}


# API 3: Receive report data submitted and store it in the database
@app.post("/api/reports")
def create_report(report: ReportCreate, db: Session = Depends(get_db)):

    new_report = ScoutingReport(
    map_id=report.map_id,
    cell_name=report.cell_name,
    block_key=report.block_key,
    issue_id=report.issue_id,
    severity=report.severity,
    count=report.count,
    reporter_name=report.reporter_name,
    reporter_email=report.reporter_email,
    reporter_phone=report.reporter_phone,
    status="pending"
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return {"status": "success", "message": "Report submitted successfully", "data": new_report}


# API 4: Get report list of 7 days
@app.get("/api/reports")
def get_reports(days: int = 7, map_id: Optional[str] = None, db: Session = Depends(get_db)):
    cutoff = date.today() - timedelta(days=days)
    query = db.query(ScoutingReport).filter(ScoutingReport.entry_date >= cutoff)
    if map_id:
        query = query.filter(ScoutingReport.map_id == map_id)
    reports = query.all()
    
    return {
        "status": "success", 
        "filter": f"Last {days} days",
        "data": reports
    }


# API 5: Process administrator approval operations
@app.put("/api/reports/{report_id}/approve")
def approve_report(report_id: int, approval_data: ReportApprove, db: Session = Depends(get_db)):
    # Search the database for the report.
    report = db.query(ScoutingReport).filter(ScoutingReport.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Update status and comments
    if approval_data.status not in ["approved", "rejected"]:
         raise HTTPException(status_code=400, detail="Status must be 'approved' or 'rejected'")
            
    report.status = approval_data.status
    report.admin_comment = approval_data.admin_comment
    
    db.commit()
    db.refresh(report)
    
    return {"status": "success", "message": f"Report marked as {report.status}", "data": report}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)