import os
import datetime
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.pool import ThreadedConnectionPool
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Load env variables from root .env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../.env'))

app = FastAPI(title="UniHub Intern Job Finder API", version="1.0.0")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to SWA URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_PORT = os.environ.get('DB_PORT', '5432')
DB_USER = os.environ.get('DB_USER', 'postgres')
DB_PASSWORD = os.environ.get('DB_PASSWORD', 'postgres')
DB_NAME = os.environ.get('DB_NAME', 'internjobfinder')

# Initialize Threaded Connection Pool for optimized performance and concurrency
try:
    db_pool = ThreadedConnectionPool(
        minconn=2,
        maxconn=20,
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )
    print("✅ PostgreSQL database connection pool initialized.")
except Exception as e:
    print(f"❌ Failed to initialize database connection pool: {e}")
    db_pool = None

def get_db_connection():
    if not db_pool:
        raise HTTPException(status_code=500, detail="Database connection pool is offline")
    try:
        return db_pool.getconn()
    except Exception as e:
        print(f"❌ Failed to fetch connection from pool: {e}")
        raise HTTPException(status_code=500, detail="Database connection pool exhausted")

def release_db_connection(conn):
    if db_pool and conn:
        db_pool.putconn(conn)

@app.get("/")
def read_root():
    return {"message": "Welcome to UniHub Job Finder API!", "status": "healthy"}

@app.get("/api/jobs")
def get_jobs(
    industry: str = Query(None, description="Filter by industry"),
    commitment: str = Query(None, description="Filter by commitment type"),
    workplace: str = Query(None, description="Filter by workplace type"),
    include_expired: bool = Query(False, description="Include expired jobs")
):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        query = "SELECT * FROM jobs WHERE 1=1"
        params = []
        
        if not include_expired:
            query += " AND deadline >= %s"
            params.append(datetime.date.today())
            
        if industry and industry != 'All':
            query += " AND industry = %s"
            params.append(industry)
            
        if commitment and commitment != 'All':
            query += " AND commitment = %s"
            params.append(commitment)
            
        if workplace and workplace != 'All':
            query += " AND workplace = %s"
            params.append(workplace)
            
        query += " ORDER BY deadline ASC"
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        # Transform snake_case columns to camelCase expected by the React frontend
        formatted_jobs = []
        for r in rows:
            formatted_jobs.append({
                'id': r['id'],
                'title': r['title'],
                'company': r['company'],
                'logoUrl': r['logo_url'],
                'location': r['location'],
                'type': r['type'],
                'stipend': r['stipend'],
                'duration': r['duration'],
                'deadline': r['deadline'].isoformat() if r['deadline'] else None,
                'commitment': r['commitment'],
                'workplace': r['workplace'],
                'description': r['description'],
                'requirements': r['requirements'],
                'benefits': r['benefits'],
                'tags': r['tags'],
                'industry': r['industry'],
                'experienceLevel': r['experience_level'],
                'link': r['link'],
                'scrapedFrom': r['scraped_from']
            })
            
        return formatted_jobs
    except Exception as e:
        print(f"Error querying jobs: {e}")
        raise HTTPException(status_code=500, detail="Database query error")
    finally:
        if cursor:
            cursor.close()
        if conn:
            release_db_connection(conn)

@app.get("/api/competitions")
def get_competitions(
    category: str = Query(None, description="Filter by competition category"),
    organizer_type: str = Query(None, description="Filter by organizer type"),
    include_expired: bool = Query(False, description="Include expired competitions")
):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        query = "SELECT * FROM competitions WHERE 1=1"
        params = []
        
        if not include_expired:
            query += " AND deadline >= %s"
            params.append(datetime.date.today())
            
        if category and category != 'All':
            query += " AND category = %s"
            params.append(category)
            
        if organizer_type and organizer_type != 'All':
            query += " AND organizer_type = %s"
            params.append(organizer_type)
            
        query += " ORDER BY deadline ASC"
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        # Transform snake_case columns to camelCase expected by the React frontend
        formatted_comps = []
        for r in rows:
            formatted_comps.append({
                'id': r['id'],
                'title': r['title'],
                'organizer': r['organizer'],
                'organizerType': r['organizer_type'],
                'category': r['category'],
                'imageUrl': r['image_url'],
                'prizePool': r['prize_pool'],
                'deadline': r['deadline'].isoformat() if r['deadline'] else None,
                'startDate': r['start_date'].isoformat() if r['start_date'] else None,
                'location': r['location'],
                'tags': r['tags'],
                'description': r['description'],
                'rounds': r['rounds'],
                'prizes': r['prizes'],
                'capacity': r['capacity'],
                'registered': r['registered'],
                'link': r['link']
            })
            
        return formatted_comps
    except Exception as e:
        print(f"Error querying competitions: {e}")
        raise HTTPException(status_code=500, detail="Database query error")
    finally:
        if cursor:
            cursor.close()
        if conn:
            release_db_connection(conn)

if __name__ == "__main__":
    import uvicorn
    # Set default host and port for local API dev
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
