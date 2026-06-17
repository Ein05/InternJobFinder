import os
import re
import json
import hashlib
from datetime import datetime, date
import psycopg2
from psycopg2.extras import execute_values
from rapidfuzz import fuzz
from dotenv import load_dotenv

# Load env variables from root .env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../.env'))

DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_PORT = os.environ.get('DB_PORT', '5432')
DB_USER = os.environ.get('DB_USER', 'postgres')
DB_PASSWORD = os.environ.get('DB_PASSWORD', 'postgres')
DB_NAME = os.environ.get('DB_NAME', 'internjobfinder')

# Heuristics keywords
TECH_KW = ['lập trình', 'software', 'developer', 'python', 'javascript', 'typescript', 'react', 'vue', 'angular', 'java ', 'nodejs', 'c++', 'golang', 'rust', 'ai', 'machine learning', 'deep learning', 'data', 'cloud', 'devops', 'backend', 'frontend', 'fullstack', 'mobile', 'android', 'ios', 'flutter', 'cntt', 'công nghệ thông tin', 'khoa học máy tính', 'cyber', 'network', 'database', 'sql', 'nosql']
BIZ_KW  = ['marketing', 'kinh doanh', 'business', 'kế toán', 'tài chính', 'nhân sự', 'hr', 'truyền thông', 'content', 'sales', 'thương mại', 'quản trị', 'logistics', 'supply chain', 'báo chí', 'digital marketing', 'seo', 'social media', 'pr', 'event']
JOB_KW  = ['thực tập', 'intern', 'tuyển dụng', 'tuyển thực', 'thực tập sinh', 'fresher', 'trainee']
COMP_KW = ['cuộc thi', 'hackathon', 'contest', 'competition', 'pitching', 'startup', 'challenge', 'olympic', 'giải đấu', 'chung kết', 'vô địch', 'giải thưởng', 'thi đấu', 'cuộc thi lập trình']

# Standard Fallback Data
FALLBACK_JOBS_FILE = os.path.join(os.path.dirname(__file__), 'fallback_jobs.json') # Placeholder fallback to copy if database is empty

def get_connection():
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )

def gen_id(prefix, seed):
    h = hashlib.md5(seed.encode('utf-8')).hexdigest()[:8]
    return f"{prefix}-{h}"

def detect_industry(text):
    lower_text = text.lower()
    tech_count = sum(1 for kw in TECH_KW if kw in lower_text)
    biz_count = sum(1 for kw in BIZ_KW if kw in lower_text)
    return 'Tech' if tech_count >= biz_count else 'Business'

def classify_type(title, content):
    text = (title + " " + content).lower()
    job_score = sum(1 for kw in JOB_KW if kw in text)
    comp_score = sum(1 for kw in COMP_KW if kw in text)
    if job_score == 0 and comp_score == 0:
        return None
    return 'competition' if comp_score > job_score else 'job'

def extract_stipend(content):
    match = re.search(r'([\d]+[\d,.]*)[\s]*[-–~][\s]*([\d]+[\d,.]*)\s*(triệu|tr\b|VND|đồng|đ\b)|([\d]+[\d,.]*)\s*(triệu|tr\b|VND|đồng|đ\b)', content, re.IGNORECASE)
    if match:
        raw = match.group(0).strip()
        # Clean double spaces
        raw = re.sub(r'\s+', ' ', raw)
        return raw if 'VND' in raw.upper() else f"{raw} VND / tháng"
    return 'Thỏa thuận'

def extract_deadline(content):
    pats = [
        r'\b(\d{1,2})[\/\-](\d{1,2})[\/\-](202\d)\b',
        r'\b(202\d)[\/\-](\d{2})[\/\-](\d{2})\b',
        r'ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})(?:\s+năm\s+(202\d))?'
    ]
    for pat in pats:
        match = re.search(pat, content, re.IGNORECASE)
        if not match:
            continue
        try:
            if match.group(0).startswith('202'):
                year, month, day = match.group(1), match.group(2), match.group(3)
            elif match.group(0).lower().startswith('ngày'):
                day = match.group(1)
                month = match.group(2)
                year = match.group(3) if match.group(3) else '2026'
            else:
                day, month, year = match.group(1), match.group(2), match.group(3)
                
            d = datetime(int(year), int(month), int(day))
            return d.strftime('%Y-%m-%d')
        except Exception:
            continue
            
    # Default: current date + 30 days
    from datetime import timedelta
    default_d = datetime.now() + timedelta(days=30)
    return default_d.strftime('%Y-%m-%d')

def extract_company(title, content):
    title_parts = re.split(r'\s*[-|–]\s*', title)
    if len(title_parts) >= 2:
        candidate = title_parts[-1].strip()
        if 2 < len(candidate) < 60:
            return candidate
            
    pats = [
        r'(?:công ty|tập đoàn|tổ chức)\s+([^\n,.(]{3,50})',
        r'([A-Z][a-zA-Z\s]+(?:Corp|Group|JSC|Co\.|Ltd|Vietnam|Software|Tech|Digital|Solutions))'
    ]
    for p in pats:
        match = re.search(p, content, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return 'Doanh nghiệp tại Hà Nội'

def extract_organizer(title, content):
    pats = [
        r'(?:tổ chức bởi|ban tổ chức|chủ trì)[:\-]?\s*([^\n,.(]{3,60})',
        r'(?:clb|câu lạc bộ)\s+([^\n,.(]{3,50})',
        r'([A-Z][a-zA-Z\s]+(?:University|Club|Association|Foundation|Hội|CLB))'
    ]
    for p in pats:
        match = re.search(p, content, re.IGNORECASE)
        if match:
            return match.group(1).strip()
            
    title_parts = re.split(r'\s*[-|–]\s*', title)
    if len(title_parts) >= 2:
        candidate = title_parts[-1].strip()
        if 2 < len(candidate) < 60:
            return candidate
    return 'Ban Tổ Chức'

def extract_prize_pool(content):
    match = re.search(r'([\d]+[\d,.]*)[\s]*(triệu|tỷ|VND)\b', content, re.IGNORECASE)
    if match:
        unit = match.group(2).lower()
        if unit == 'tỷ':
            return f"{match.group(1)},000,000,000 VND"
        return f"{match.group(1)} {match.group(2).upper()}"
    return 'Đang cập nhật'

def extract_tags(title, content, industry):
    combined = (title + " " + content).lower()
    tag_map = {
        'react': 'React', 'vue': 'Vue', 'angular': 'Angular',
        'python': 'Python', 'java ': 'Java', 'javascript': 'JavaScript',
        'typescript': 'TypeScript', 'nodejs': 'NodeJS',
        'ai': 'AI', 'machine learning': 'Machine Learning', 'data': 'Data',
        'devops': 'DevOps', 'cloud': 'Cloud', 'mobile': 'Mobile',
        'android': 'Android', 'ios': 'iOS', 'flutter': 'Flutter',
        'marketing': 'Marketing', 'content': 'Content', 'seo': 'SEO',
        'social media': 'Social Media',
        'business analyst': 'Business Analyst', 'kế toán': 'Kế Toán',
        'tài chính': 'Tài Chỉn', 'nhân sự': 'Nhân Sự',
        'hackathon': 'Hackathon', 'startup': 'Startup', 'pitching': 'Pitching',
    }
    tags = ['Hà Nội', industry]
    for pattern, label in tag_map.items():
        if pattern in combined:
            tags.append(label)
    return list(set(tags))[:7]

def clean_and_transform():
    print("🚀 ETL Pipeline: Loading raw data...")
    raw_dir = os.path.join(os.path.dirname(__file__), '../data/raw')
    ref_path = os.path.join(raw_dir, "latest_ingest.json")
    
    if not os.path.exists(ref_path):
        print("   ❌ Error: latest_ingest.json not found. Run scripts/ingest.py first.")
        return
        
    with open(ref_path, "r", encoding="utf-8") as f:
        ref_data = json.load(f)
        
    raw_file_path = ref_data['file_path']
    if not os.path.exists(raw_file_path):
        print(f"   ❌ Error: Raw file {raw_file_path} not found.")
        return
        
    with open(raw_file_path, "r", encoding="utf-8") as f:
        raw_items = json.load(f)
        
    print(f"   └─ Loaded {len(raw_items)} raw crawled items.")

    jobs = []
    competitions = []
    
    today_str = date.today().isoformat()

    # 1. Transform and parse items
    for item in raw_items:
        title = item.get('title', '')
        content = item.get('content', '')
        url = item.get('url', '')
        
        # Check if Hanoi is in title/content
        is_hanoi = any(kw in (title + " " + content).lower() for kw in ['hà nội', 'hanoi', 'cầu giấy', 'hoàn kiếm', 'đống đa', 'ba đình', 'tây hồ', 'thanh xuân'])
        if not is_hanoi:
            continue
            
        item_type = classify_type(title, content)
        if not item_type:
            continue
            
        try:
            if item_type == 'job':
                industry = detect_industry(title + " " + content)
                company = extract_company(title, content)
                stipend = extract_stipend(content)
                deadline = extract_deadline(content)
                tags = extract_tags(title, content, industry)
                is_full = any(kw in content.lower() for kw in ['toàn thời gian', 'full time', 'fulltime'])
                is_remote = 'remote' in content.lower() or 'từ xa' in content.lower()
                is_hybrid = 'hybrid' in content.lower() or 'linh hoạt' in content.lower()
                
                # Data Quality Check: Title and Company must be valid
                if not title.strip() or len(company) < 2:
                    continue
                    
                jobs.append({
                    'id': gen_id('job', url + title),
                    'title': title.split('-')[0].split('|')[0].strip()[:80],
                    'company': company[:100],
                    'logoUrl': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
                    'location': 'Hà Nội, Việt Nam',
                    'type': 'Toàn thời gian (Full-time)' if is_full else 'Bán thời gian (Part-time)',
                    'stipend': stipend,
                    'duration': '3 - 6 tháng',
                    'deadline': deadline,
                    'commitment': 'Full-time' if is_full else 'Part-time',
                    'workplace': 'Remote' if is_remote else 'Hybrid' if is_hybrid else 'On-site',
                    'tags': tags,
                    'description': content[:400].strip() + '...',
                    'requirements': [
                        'Sinh viên năm 3, 4 hoặc mới tốt nghiệp chuyên ngành phù hợp.',
                        'Có kiến thức cơ bản liên quan đến vị trí ứng tuyển.',
                        'Năng động, có tinh thần học hỏi cao.'
                    ],
                    'benefits': [
                        'Hỗ trợ dấu thực tập và báo cáo tốt nghiệp.',
                        'Được đào tạo và hướng dẫn từ các anh chị đi trước.',
                        'Môi trường làm việc thoải mái, linh hoạt.'
                    ],
                    'industry': industry,
                    'experienceLevel': 'Junior / Student',
                    'link': url,
                    'scrapedFrom': 'Facebook' if 'facebook.com' in url else 'Website'
                })
            else:
                category = detect_industry(title + " " + content)
                organizer = extract_organizer(title, content)
                prize_pool = extract_prize_pool(content)
                deadline = extract_deadline(content)
                tags = extract_tags(title, content, category)
                is_online = 'online' in content.lower() or 'trực tuyến' in content.lower()
                
                # DQ Check: Title and Organizer must be valid
                if not title.strip() or len(organizer) < 2:
                    continue
                    
                competitions.append({
                    'id': gen_id('comp', url + title),
                    'title': title.split('-')[0].split('|')[0].strip()[:80],
                    'organizer': organizer[:100],
                    'organizerType': 'Club' if 'clb' in organizer.lower() or 'câu lạc bộ' in organizer.lower() else 'University',
                    'category': category,
                    'imageUrl': 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80',
                    'prizePool': prize_pool,
                    'deadline': deadline,
                    'startDate': deadline, # Default starts when application closes
                    'location': 'Trực tuyến (Online)' if is_online else 'Hà Nội, Việt Nam',
                    'tags': tags,
                    'description': content[:400].strip() + '...',
                    'rounds': [
                        'Vòng 1: Đăng ký và nộp đề án sơ bộ',
                        'Vòng 2: Huấn luyện & Phát triển giải pháp',
                        'Vòng 3: Chung kết và Pitching trước BGK'
                    ],
                    'prizes': [f"Giải Nhất/Đặc biệt: {prize_pool}"],
                    'capacity': 100,
                    'registered': 15,
                    'link': url
                })
        except Exception as e:
            print(f"   ❌ Formatting record failed: {e}")

    # 2. Fuzzy Deduplication using rapidfuzz
    jobs = deduplicate_records(jobs, 'title', 'company')
    competitions = deduplicate_records(competitions, 'title', 'organizer')

    print(f"   └─ Transformed: {len(jobs)} jobs, {len(competitions)} competitions (deduplicated).")

    # 3. Load into PostgreSQL (UPSERT)
    load_to_postgres(jobs, competitions)

    # 4. Write to public/data directory for backwards compatibility with the current frontend
    web_data_dir = os.path.join(os.path.dirname(__file__), '../public/data')
    os.makedirs(web_data_dir, exist_ok=True)
    with open(os.path.join(web_data_dir, 'facebook_jobs.json'), 'w', encoding='utf-8') as f:
        json.dump(jobs, f, ensure_ascii=False, indent=2)
    with open(os.path.join(web_data_dir, 'facebook_competitions.json'), 'w', encoding='utf-8') as f:
        json.dump(competitions, f, ensure_ascii=False, indent=2)
    print("   ✅ Exported clean fallback JSON files to public/data.")

def deduplicate_records(records, title_field, entity_field):
    unique_records = []
    for r in records:
        is_dup = False
        for u in unique_records:
            # Check fuzzy similarity on titles and entities
            title_sim = fuzz.token_sort_ratio(r[title_field].lower(), u[title_field].lower())
            entity_sim = fuzz.token_sort_ratio(r[entity_field].lower(), u[entity_field].lower())
            if title_sim > 85 and entity_sim > 85:
                is_dup = True
                break
        if not is_dup:
            unique_records.append(r)
    return unique_records

def load_to_postgres(jobs, competitions):
    print("💾 Loading cleaned data into PostgreSQL database...")
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Load Jobs (UPSERT)
        for job in jobs:
            cursor.execute("""
                INSERT INTO jobs (
                    id, title, company, logo_url, location, type, stipend, 
                    duration, deadline, commitment, workplace, description, 
                    requirements, benefits, tags, industry, experience_level, 
                    link, scraped_from
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    title = EXCLUDED.title,
                    company = EXCLUDED.company,
                    stipend = EXCLUDED.stipend,
                    deadline = EXCLUDED.deadline,
                    workplace = EXCLUDED.workplace,
                    tags = EXCLUDED.tags,
                    link = EXCLUDED.link;
            """, (
                job['id'], job['title'], job['company'], job['logoUrl'], job['location'],
                job['type'], job['stipend'], job['duration'], job['deadline'],
                job['commitment'], job['workplace'], job['description'],
                json.dumps(job['requirements']), json.dumps(job['benefits']),
                json.dumps(job['tags']), job['industry'], job['experienceLevel'],
                job['link'], job['scrapedFrom']
            ))

        # Load Competitions (UPSERT)
        for comp in competitions:
            cursor.execute("""
                INSERT INTO competitions (
                    id, title, organizer, organizer_type, category, image_url, 
                    prize_pool, deadline, start_date, location, tags, description, 
                    rounds, prizes, capacity, registered, link
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    title = EXCLUDED.title,
                    organizer = EXCLUDED.organizer,
                    prize_pool = EXCLUDED.prize_pool,
                    deadline = EXCLUDED.deadline,
                    tags = EXCLUDED.tags,
                    link = EXCLUDED.link;
            """, (
                comp['id'], comp['title'], comp['organizer'], comp['organizerType'],
                comp['category'], comp['imageUrl'], comp['prizePool'], comp['deadline'],
                comp['startDate'], comp['location'], json.dumps(comp['tags']),
                comp['description'], json.dumps(comp['rounds']), json.dumps(comp['prizes']),
                comp['capacity'], comp['registered'], comp['link']
            ))

        conn.commit()
        cursor.close()
        conn.close()
        print(f"   ✅ Successfully loaded {len(jobs)} jobs and {len(competitions)} competitions into Postgres database.")
    except Exception as e:
        print(f"   ❌ PostgreSQL Loading Failed: {e}")

if __name__ == "__main__":
    clean_and_transform()
