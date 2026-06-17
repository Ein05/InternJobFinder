import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from dotenv import load_dotenv

# Load env variables from root .env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../.env'))

DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_PORT = os.environ.get('DB_PORT', '5432')
DB_USER = os.environ.get('DB_USER', 'postgres')
DB_PASSWORD = os.environ.get('DB_PASSWORD', 'postgres')
DB_NAME = os.environ.get('DB_NAME', 'internjobfinder')

def get_connection():
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )

def setup_database():
    print("🚀 Initializing PostgreSQL Database Schema...")
    
    # Connect to PostgreSQL
    conn = get_connection()
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()

    # 1. Create table jobs
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS jobs (
            id VARCHAR(50) PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            company VARCHAR(255) NOT NULL,
            logo_url TEXT,
            location VARCHAR(255),
            type VARCHAR(100),
            stipend VARCHAR(100),
            duration VARCHAR(100),
            deadline DATE,
            commitment VARCHAR(100),
            workplace VARCHAR(100),
            description TEXT,
            requirements JSONB,
            benefits JSONB,
            tags JSONB,
            industry VARCHAR(100),
            experience_level VARCHAR(100),
            link TEXT,
            scraped_from VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    print("   ✅ Table 'jobs' initialized.")

    # Create index for jobs search and filter
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_jobs_industry ON jobs(industry);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_jobs_commitment ON jobs(commitment);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_jobs_workplace ON jobs(workplace);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_jobs_deadline ON jobs(deadline);")

    # 2. Create table competitions
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS competitions (
            id VARCHAR(50) PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            organizer VARCHAR(255) NOT NULL,
            organizer_type VARCHAR(100),
            category VARCHAR(100),
            image_url TEXT,
            prize_pool VARCHAR(255),
            deadline DATE,
            start_date DATE,
            location VARCHAR(255),
            tags JSONB,
            description TEXT,
            rounds JSONB,
            prizes JSONB,
            capacity INTEGER,
            registered INTEGER,
            link TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    print("   ✅ Table 'competitions' initialized.")

    # Create index for competitions search and filter
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_comps_category ON competitions(category);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_comps_organizer_type ON competitions(organizer_type);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_comps_deadline ON competitions(deadline);")

    cursor.close()
    conn.close()
    print("🎉 Database Schema Setup Complete!")

if __name__ == "__main__":
    setup_database()
