import os
import json
import time
import urllib.parse
from datetime import datetime
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# Load env variables from root .env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../.env'))

GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY')
GOOGLE_CX = os.environ.get('GOOGLE_CX')
AZURE_STORAGE_CONN = os.environ.get('AZURE_STORAGE_CONNECTION_STRING')
AZURE_CONTAINER = os.environ.get('AZURE_CONTAINER_NAME', 'bronze-data-lake')

def search_google(query):
    print(f"🔍 [Google] Searching: '{query}'...")
    url = "https://www.googleapis.com/customsearch/v1"
    params = {
        'key': GOOGLE_API_KEY,
        'cx': GOOGLE_CX,
        'q': query,
        'num': 10,
        'hl': 'vi',
        'gl': 'vn',
        'dateRestrict': 'm1',
        'sort': 'date'
    }
    try:
        res = requests.get(url, params=params, timeout=10)
        res.raise_for_status()
        items = res.json().get('items', [])
        print(f"   └─ Found {len(items)} results")
        return [{
            'title': item['title'],
            'url': item['link'],
            'snippet': item.get('snippet', ''),
            'displayUrl': item.get('displayLink', '')
        } for item in items]
    except Exception as e:
        print(f"   ❌ Google Search failed: {e}")
        raise e

def search_duckduckgo(query):
    print(f"🔍 [DDG Fallback] Searching: '{query}'...")
    url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(query)}"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    try:
        res = requests.get(url, headers=headers, timeout=10)
        res.raise_for_status()
        soup = BeautifulSoup(res.text, 'html.parser')
        results = []
        for body in soup.find_all('div', class_='result__body'):
            title_tag = body.find('a', class_='result__title')
            snippet_tag = body.find('a', class_='result__snippet')
            if not title_tag:
                continue
            
            title = title_tag.get_text().strip()
            snippet = snippet_tag.get_text().strip() if snippet_tag else ""
            raw_url = title_tag.get('href', '')
            
            # Extract actual URL if it goes through DDG redirection
            parsed_url = urllib.parse.urlparse(raw_url)
            query_params = urllib.parse.parse_qs(parsed_url.query)
            if 'uddg' in query_params:
                url = query_params['uddg'][0]
            else:
                url = raw_url
                
            results.append({
                'title': title,
                'url': url,
                'snippet': snippet,
                'displayUrl': url
            })
        print(f"   └─ Found {len(results)} results")
        return results[:8]
    except Exception as e:
        print(f"   ❌ DuckDuckGo search failed: {e}")
        return []

def search(query):
    if GOOGLE_API_KEY and GOOGLE_CX:
        try:
            return search_google(query)
        except Exception:
            print("   ⚠️ Falling back to DuckDuckGo...")
    else:
        print("   ⚠️ GOOGLE_API_KEY/GOOGLE_CX not configured. Using DuckDuckGo...")
    return search_duckduckgo(query)

def crawl_page(url, snippet):
    if 'facebook.com' in url or 'fb.com' in url:
        print(f"🕷️  [FB] Using Google/DDG snippet for Facebook: {url[:60]}...")
        return snippet
        
    print(f"🕷️  Crawling: {url[:60]}...")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8'
    }
    try:
        res = requests.get(url, headers=headers, timeout=8)
        res.raise_for_status()
        soup = BeautifulSoup(res.text, 'html.parser')
        
        # Remove script and style elements
        for element in soup(["script", "style", "nav", "footer", "header", "noscript", "iframe", "sidebar"]):
            element.extract()
            
        text = soup.get_text()
        # Clean up whitespace
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        clean_text = " ".join(chunk for chunk in chunks if chunk)
        
        print(f"   └─ Crawled {len(clean_text)} characters.")
        return clean_text[:5000]
    except Exception as e:
        print(f"   ⚠️ Crawling failed for {url[:40]} ({e}). Using snippet as fallback.")
        return snippet

def upload_to_azure_blob(file_path, blob_name):
    if not AZURE_STORAGE_CONN:
        print("   ℹ️ AZURE_STORAGE_CONNECTION_STRING is not set. Skipping Azure upload.")
        return False
        
    try:
        from azure.storage.blob import BlobServiceClient
        print(f"☁️ Uploading {blob_name} to Azure Blob Storage...")
        blob_service_client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONN)
        container_client = blob_service_client.get_container_client(AZURE_CONTAINER)
        
        # Create container if not exists
        if not container_client.exists():
            container_client.create_container()
            
        blob_client = container_client.get_blob_client(blob_name)
        with open(file_path, "rb") as data:
            blob_client.upload_blob(data, overwrite=True)
        print("   ✅ Upload successful.")
        return True
    except Exception as e:
        print(f"   ❌ Azure Blob Storage upload failed: {e}")
        return False

def run_ingestion():
    print("\n=============================================")
    # Queries to fetch data
    queries = [
        # === INTERNSHIP ===
        '"thực tập sinh" "Hà Nội" tuyển dụng site:facebook.com',
        '"thực tập" "Hà Nội" 2026 (lập trình OR marketing OR data OR BA)',
        'tuyển thực tập intern "Hà Nội" site:itviec.com OR site:topcv.vn',
        'thực tập sinh hà nội mới nhất site:ybox.vn',

        # === COMPETITION ===
        '"cuộc thi" "sinh viên" "Hà Nội" 2026 site:facebook.com',
        '"hackathon" OR "pitching" OR "startup" "Hà Nội" sinh viên 2026',
        'cuộc thi lập trình kinh doanh "Hà Nội" mới nhất site:ybox.vn',
        '"giải thưởng" OR "học bổng" sinh viên công nghệ "Hà Nội" 2026',
    ]

    all_results = []
    for q in queries:
        all_results.extend(search(q))
        time.sleep(1.2) # Friendly rate limiting

    # Deduplicate by URL and skip FB Groups
    seen_urls = set()
    deduped_results = []
    for r in all_results:
        url = r.get('url', '')
        if not url or url in seen_urls:
            continue
        if 'facebook.com/groups/' in url or 'fb.com/groups/' in url:
            print(f"   ⏭️  Skip FB Group URL: {url[:50]}")
            continue
        seen_urls.add(url)
        deduped_results.append(r)

    print(f"\n🔎 Total unique URLs found: {len(deduped_results)}")

    # Crawl the top 25 results
    crawled_data = []
    for item in deduped_results[:25]:
        content = crawl_page(item['url'], item['snippet'])
        crawled_data.append({
            'title': item['title'],
            'url': item['url'],
            'content': content,
            'ingested_at': datetime.utcnow().isoformat()
        })
        time.sleep(1.0)

    # Save to local Bronze Layer (Data Lake)
    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    local_data_dir = os.path.join(os.path.dirname(__file__), '../data/raw')
    os.makedirs(local_data_dir, exist_ok=True)
    
    local_file_name = f"raw_jobs_comps_{timestamp}.json"
    local_file_path = os.path.join(local_data_dir, local_file_name)
    
    with open(local_file_path, "w", encoding="utf-8") as f:
        json.dump(crawled_data, f, ensure_ascii=False, indent=2)
        
    print(f"💾 Raw data stored locally at: {local_file_path}")

    # Upload to Azure Blob Storage (Optional Data Lake Bronze)
    blob_name = f"bronze/jobs_comps/{datetime.utcnow().strftime('%Y/%m/%d')}/{local_file_name}"
    upload_to_azure_blob(local_file_path, blob_name)
    
    # Save a static reference for downstream ETL task
    ref_path = os.path.join(local_data_dir, "latest_ingest.json")
    with open(ref_path, "w", encoding="utf-8") as f:
        json.dump({'file_path': local_file_path, 'blob_name': blob_name, 'timestamp': timestamp}, f, indent=2)
        
    print("🎉 Ingestion Pipeline Completed Successfully!\n")

if __name__ == "__main__":
    run_ingestion()
