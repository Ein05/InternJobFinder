import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────
// .env Loader (zero-dependency)
// ─────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    console.log('📝 Loading .env...');
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim().replace(/^['"]|['"]$/g, '');
        process.env[key] = val;
      }
    });
  }
}
loadEnv();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CX      = process.env.GOOGLE_CX; // Search Engine ID

// ─────────────────────────────────────────────
// Output paths
// ─────────────────────────────────────────────
const dataDir = path.join(__dirname, '../public/data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const JOBS_OUT = path.join(dataDir, 'facebook_jobs.json');
const COMPS_OUT = path.join(dataDir, 'facebook_competitions.json');

// ─────────────────────────────────────────────
// Fallback data (dùng khi scrape không ra gì)
// ─────────────────────────────────────────────
const FALLBACK_JOBS = [
  {
    id: "fallback-job-1",
    title: "Thực Tập Sinh Lập Trình Frontend (ReactJS)",
    company: "Rikkeisoft Hà Nội",
    logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80",
    location: "Hà Nội, Việt Nam",
    type: "Bán thời gian / Toàn thời gian",
    stipend: "6,000,000 - 8,000,000 VND / tháng",
    duration: "3 tháng",
    deadline: "2026-07-30",
    commitment: "Part-time",
    workplace: "Hybrid",
    tags: ["React", "CSS", "Frontend", "Hanoi"],
    description: "Tuyển dụng Thực tập sinh ReactJS tại Rikkeisoft Cầu Giấy. Được đào tạo bài bản và tham gia dự án thực tế.",
    requirements: [
      "Sinh viên năm 3, 4 chuyên ngành Công nghệ thông tin.",
      "Hiểu biết tốt về HTML, CSS, JavaScript (ES6) và ReactJS cơ bản.",
      "Có tinh thần học hỏi cao, cam kết thực tập tối thiểu 3 tháng."
    ],
    benefits: [
      "Trợ cấp thực tập hấp dẫn theo năng lực.",
      "Cơ hội trở thành nhân viên chính thức sau kỳ thực tập.",
      "Hỗ trợ đóng dấu báo cáo thực tập tốt nghiệp."
    ],
    industry: "Tech",
    experienceLevel: "Junior / Student",
    link: "https://ybox.vn/tuyen-dung/rikkeisoft-frontend-intern",
    scrapedFrom: "Fallback Data"
  },
  {
    id: "fallback-job-2",
    title: "Thực Tập Sinh Business Analyst",
    company: "OneMount Group",
    logoUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=120&q=80",
    location: "Hà Nội, Việt Nam",
    type: "Toàn thời gian (Full-time)",
    stipend: "8,000,000 VND / tháng",
    duration: "6 tháng",
    deadline: "2026-07-20",
    commitment: "Full-time",
    workplace: "On-site",
    tags: ["BA", "SQL", "Requirements", "Hanoi"],
    description: "OneMount Group tuyển dụng Intern BA hỗ trợ khảo sát nghiệp vụ và viết User Stories cho các dự án thương mại số.",
    requirements: [
      "Đang học năm cuối hoặc mới tốt nghiệp chuyên ngành Hệ thống thông tin, Kinh tế.",
      "Tư duy logic tốt, kỹ năng giao tiếp và tiếng Anh tốt.",
      "Đã làm quen với SQL là một lợi thế lớn."
    ],
    benefits: [
      "Làm việc tại văn phòng hạng A tại Hà Nội.",
      "Trợ cấp cạnh tranh.",
      "Môi trường Agile năng động."
    ],
    industry: "Business",
    experienceLevel: "Junior / Student",
    link: "https://itviec.com/jobs/ba-intern-onemount",
    scrapedFrom: "Fallback Data"
  },
  {
    id: "fallback-job-3",
    title: "Thực Tập Sinh Digital Marketing & Content Creator",
    company: "VCCorp (Kênh 14)",
    logoUrl: "https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=120&q=80",
    location: "Hà Nội, Việt Nam",
    type: "Bán thời gian (Part-time)",
    stipend: "5,000,000 VND / tháng",
    duration: "3 tháng",
    deadline: "2026-07-31",
    commitment: "Part-time",
    workplace: "Hybrid",
    tags: ["Marketing", "Content", "Canva", "Hanoi"],
    description: "Kênh 14 thuộc VCCorp Hà Nội tuyển dụng thực tập sinh viết bài, phát triển nội dung mạng xã hội.",
    requirements: [
      "Sinh viên các ngành Báo chí, Truyền thông, Marketing tại Hà Nội.",
      "Có khả năng viết lách tốt, bắt trend nhanh nhạy.",
      "Sử dụng cơ bản Canva, Photoshop hoặc CapCut."
    ],
    benefits: [
      "Trợ cấp nhuận bút hàng tháng theo năng suất.",
      "Đào tạo chuyên môn báo chí từ các anh chị đi trước.",
      "Môi trường làm việc trẻ trung, sáng tạo."
    ],
    industry: "Business",
    experienceLevel: "Junior / Student",
    link: "https://ybox.vn/tuyen-dung/vccorp-content-intern",
    scrapedFrom: "Fallback Data"
  },
  {
    id: "fallback-job-4",
    title: "Python AI & Data Engineer Intern",
    company: "Viettel AI",
    logoUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=120&q=80",
    location: "Hà Nội, Việt Nam",
    type: "Toàn thời gian (Full-time)",
    stipend: "10,000,000 VND / tháng",
    duration: "6 tháng",
    deadline: "2026-08-05",
    commitment: "Full-time",
    workplace: "On-site",
    tags: ["Python", "AI", "Machine Learning", "Hanoi"],
    description: "Viettel AI tuyển dụng thực tập sinh phát triển thuật toán AI và xử lý dữ liệu lớn tại Hà Nội.",
    requirements: [
      "Sinh viên ngành CNTT, Khoa học máy tính hoặc Toán tin.",
      "Thành thạo Python và kiến thức cơ bản về Machine Learning.",
      "Tư duy thuật toán tốt."
    ],
    benefits: [
      "Trợ cấp thực tập cao.",
      "Tham gia các dự án nghiên cứu quy mô quốc gia.",
      "Học hỏi từ các kỹ sư AI hàng đầu."
    ],
    industry: "Tech",
    experienceLevel: "Advanced Student",
    link: "https://ybox.vn/tuyen-dung/viettel-ai-python-intern",
    scrapedFrom: "Fallback Data"
  }
];

const FALLBACK_COMPS = [
  {
    id: "fallback-comp-1",
    title: "Hanoi Hackathon 2026: AI & Smart City",
    organizer: "Hội Sinh Viên ĐHQGHN & FPT Software",
    organizerType: "University",
    category: "Tech",
    imageUrl: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80",
    prizePool: "150,000,000 VND",
    deadline: "2026-07-30",
    startDate: "2026-08-08",
    location: "Trường Đại học Công nghệ, ĐHQGHN, Cầu Giấy, Hà Nội",
    tags: ["Hackathon", "AI", "Smart City", "Programming", "Hanoi"],
    description: "Cuộc thi lập trình Hackathon 24h tìm kiếm các ý tưởng ứng dụng AI để xây dựng đô thị thông minh tại Hà Nội.",
    rounds: [
      "Vòng 1: Đăng ký hồ sơ & Trình bày ý tưởng sơ bộ",
      "Vòng 2: Lập trình tập trung 24h tại ĐHQGHN",
      "Vòng 3: Demo & Pitching trước Ban Giám Khảo"
    ],
    prizes: [
      "Giải Nhất: 70,000,000 VND + Cúp lưu niệm",
      "Giải Nhì: 30,000,000 VND",
      "Giải Ba: 15,000,000 VND"
    ],
    capacity: 100,
    registered: 68,
    link: "https://ybox.vn/cuoc-thi/hanoi-hackathon-2026"
  },
  {
    id: "fallback-comp-2",
    title: "Kinh Doanh Số Trẻ - Digital Business Case 2026",
    organizer: "CLB Quản trị Kinh doanh Đại học Ngoại Thương (BA FTU)",
    organizerType: "Club",
    category: "Business",
    imageUrl: "https://images.unsplash.com/photo-1542744092-2ad48483b902?auto=format&fit=crop&w=800&q=80",
    prizePool: "100,000,000 VND",
    deadline: "2026-07-25",
    startDate: "2026-08-01",
    location: "Trường Đại học Ngoại Thương, Chùa Láng, Hà Nội",
    tags: ["Business Case", "Marketing", "Strategy", "Hanoi"],
    description: "Giải đấu phân tích tình huống kinh doanh thực tế dành cho sinh viên khối ngành kinh tế toàn quốc.",
    rounds: [
      "Vòng 1: Trắc nghiệm kiến thức và Giải Case sơ loại",
      "Vòng 2: Xây dựng đề án Marketing & Vận hành",
      "Vòng 3: Chung kết hùng biện tại FTU Hà Nội"
    ],
    prizes: [
      "Giải Quán Quân: 50,000,000 VND + Suất thực tập thẳng tại doanh nghiệp đối tác",
      "Giải Á Quân: 25,000,000 VND",
      "Giải Quý Quân: 10,000,000 VND"
    ],
    capacity: 120,
    registered: 82,
    link: "https://ybox.vn/cuoc-thi/digital-business-case-ftu-2026"
  }
];

// ─────────────────────────────────────────────
// SEARCH — Google Custom Search API (chính) hoặc DuckDuckGo (dự phòng)
// ─────────────────────────────────────────────
async function searchGoogle(query) {
  console.log(`🔍 [Google] Searching: "${query}"...`);
  const res = await axios.get('https://www.googleapis.com/customsearch/v1', {
    params: {
      key: GOOGLE_API_KEY,
      cx:  GOOGLE_CX,
      q:   query,
      num: 10,
      hl:  'vi',
      gl:  'vn',
      dateRestrict: 'm1',  // Chỉ lấy kết quả trong 1 tháng gần nhất
      sort: 'date',        // Sắp xếp mới nhất lên trước
    },
    timeout: 10000
  });
  const items = res.data.items || [];
  console.log(`   └─ Found ${items.length} results`);
  return items.map(item => ({
    title:      item.title,
    url:        item.link,
    snippet:    item.snippet || '',
    displayUrl: item.displayLink || ''
  }));
}

async function searchDuckDuckGo(query) {
  console.log(`🔍 [DDG Fallback] Searching: "${query}"...`);
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const res = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' },
    timeout: 10000
  });
  const $ = cheerio.load(res.data);
  const results = [];
  $('.result__body').each((_, el) => {
    const title = $(el).find('.result__title').text().trim();
    const snippet = $(el).find('.result__snippet').text().trim();
    let rawUrl = $(el).find('.result__url').attr('href') || '';
    if (rawUrl.includes('uddg=')) {
      try {
        const u = new URL('https://ddg.com' + rawUrl).searchParams.get('uddg');
        if (u) rawUrl = decodeURIComponent(u);
      } catch (_) {}
    }
    results.push({ title, url: rawUrl, snippet, displayUrl: rawUrl });
  });
  console.log(`   └─ Found ${results.length} results`);
  return results.slice(0, 8);
}

async function search(query) {
  if (GOOGLE_API_KEY && GOOGLE_CX) {
    try {
      return await searchGoogle(query);
    } catch (err) {
      console.warn(`   └─ Google failed (${err.message}), falling back to DuckDuckGo...`);
    }
  } else {
    console.warn('⚠️  GOOGLE_API_KEY / GOOGLE_CX not set — using DuckDuckGo fallback');
  }
  return searchDuckDuckGo(query);
}

// ─────────────────────────────────────────────
// CRAWL — Tải nội dung trang (bỏ qua FB vì block)
// ─────────────────────────────────────────────
async function crawlPage(url, snippet) {
  // Facebook chặn crawl trực tiếp → dùng snippet từ Bing (chất lượng tốt hơn DDG)
  if (url.includes('facebook.com') || url.includes('fb.com')) {
    console.log(`🕷️  [FB] Using Bing snippet for: ${url.slice(0, 70)}...`);
    return snippet;
  }

  console.log(`🕷️  Crawling: ${url.slice(0, 70)}...`);
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8'
      },
      timeout: 8000
    });
    const $ = cheerio.load(res.data);
    $('script, style, nav, footer, header, noscript, iframe, .sidebar, .menu, .ads, .comments').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    console.log(`   └─ Crawled ${text.length} chars`);
    return text.slice(0, 5000);
  } catch (err) {
    console.warn(`   └─ Crawl failed (${err.message}), using snippet`);
    return snippet;
  }
}

// ─────────────────────────────────────────────
// EXTRACT — Phân tích & cấu trúc hóa (không dùng LLM)
// ─────────────────────────────────────────────

const TECH_KW = ['lập trình', 'software', 'developer', 'python', 'javascript', 'typescript', 'react', 'vue', 'angular', 'java', 'nodejs', 'c++', 'golang', 'rust', 'ai', 'machine learning', 'deep learning', 'data', 'cloud', 'devops', 'backend', 'frontend', 'fullstack', 'mobile', 'android', 'ios', 'flutter', 'cntt', 'công nghệ thông tin', 'khoa học máy tính', 'cyber', 'network', 'database', 'sql', 'nosql'];
const BIZ_KW  = ['marketing', 'kinh doanh', 'business', 'kế toán', 'tài chính', 'nhân sự', 'hr', 'truyền thông', 'content', 'sales', 'thương mại', 'quản trị', 'logistics', 'supply chain', 'báo chí', 'digital marketing', 'seo', 'social media', 'pr', 'event'];
const JOB_KW  = ['thực tập', 'intern', 'tuyển dụng', 'tuyển thực', 'thực tập sinh', 'fresher', 'trainee'];
const COMP_KW = ['cuộc thi', 'hackathon', 'contest', 'competition', 'pitching', 'startup', 'challenge', 'olympic', 'giải đấu', 'chung kết', 'vô địch', 'giải thưởng', 'thi đấu', 'cuộc thi lập trình'];

function detectIndustry(text) {
  const lower = text.toLowerCase();
  const tech = TECH_KW.filter(k => lower.includes(k)).length;
  const biz  = BIZ_KW.filter(k => lower.includes(k)).length;
  return tech >= biz ? 'Tech' : 'Business';
}

function classifyType(title, content) {
  const text = (title + ' ' + content).toLowerCase();
  const jobScore  = JOB_KW.filter(k => text.includes(k)).length;
  const compScore = COMP_KW.filter(k => text.includes(k)).length;
  if (jobScore === 0 && compScore === 0) return null;
  if (compScore > jobScore) return 'competition';
  return 'job';
}

function genId(prefix, seed) {
  return `${prefix}-${crypto.createHash('md5').update(seed).digest('hex').slice(0, 8)}`;
}

function extractStipend(text) {
  const m = text.match(/([\d]+[\d,.]*)[\s]*[-–~][\s]*([\d]+[\d,.]*)\s*(triệu|tr\b|VND|đồng|đ\b)|([\d]+[\d,.]*)\s*(triệu|tr\b|VND|đồng|đ\b)/i);
  if (m) {
    const raw = m[0].replace(/\s+/g, ' ').trim();
    return raw.includes('VND') ? raw + ' / tháng' : raw + ' VND / tháng';
  }
  return 'Thỏa thuận';
}

function extractDeadline(text) {
  const pats = [
    /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](202\d)\b/,
    /\b(202\d)[\/\-](\d{2})[\/\-](\d{2})\b/,
    /ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})(?:\s+năm\s+(202\d))?/i
  ];
  for (const pat of pats) {
    const m = text.match(pat);
    if (!m) continue;
    let day, month, year;
    if (m[0].startsWith('202')) {
      [year, month, day] = [m[1], m[2], m[3]];
    } else if (m[0].toLowerCase().startsWith('ngày')) {
      day = m[1]; month = m[2]; year = m[3] || '2026';
    } else {
      [day, month, year] = [m[1], m[2], m[3]];
    }
    const d = new Date(`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`);
    if (!isNaN(d)) return d.toISOString().split('T')[0];
  }
  const def = new Date();
  def.setDate(def.getDate() + 42);
  return def.toISOString().split('T')[0];
}

function extractCompany(title, text) {
  const titleParts = title.split(/\s*[-|–|]\s*/);
  if (titleParts.length >= 2) {
    const candidate = titleParts[titleParts.length - 1].trim();
    if (candidate.length > 2 && candidate.length < 60) return candidate;
  }
  const pats = [
    /(?:công ty|tập đoàn|tổ chức)\s+([^\n,.(]{3,50})/i,
    /([A-Z][a-zA-Z\s]+(?:Corp|Group|JSC|Co\.|Ltd|Vietnam|Software|Tech|Digital|Solutions))/
  ];
  for (const p of pats) {
    const m = text.match(p);
    if (m) return m[1].trim().slice(0, 50);
  }
  return 'Công ty tại Hà Nội';
}

function extractOrganizer(title, text) {
  const pats = [
    /(?:tổ chức bởi|ban tổ chức|chủ trì)[:\-]?\s*([^\n,.(]{3,60})/i,
    /(?:clb|câu lạc bộ)\s+([^\n,.(]{3,50})/i,
    /([A-Z][a-zA-Z\s]+(?:University|Club|Association|Foundation|Hội|CLB))/
  ];
  for (const p of pats) {
    const m = text.match(p);
    if (m) return m[1].trim().slice(0, 60);
  }
  const parts = title.split(/\s*[-|–|]\s*/);
  if (parts.length >= 2) {
    const c = parts[parts.length - 1].trim();
    if (c.length > 2 && c.length < 60) return c;
  }
  return 'Ban Tổ Chức';
}

function extractPrize(text) {
  const m = text.match(/([\d]+[\d,.]*)[\s]*(triệu|tỷ|VND)\b/i);
  if (m) {
    const unit = m[2].toLowerCase();
    if (unit === 'tỷ') return `${m[1]},000,000,000 VND`;
    return `${m[1]} ${m[2].toUpperCase()}`;
  }
  return 'Đang cập nhật';
}

function extractTags(title, text, industry) {
  const combined = (title + ' ' + text).toLowerCase();
  const tagMap = {
    'react': 'React', 'vue': 'Vue', 'angular': 'Angular',
    'python': 'Python', 'java ': 'Java', 'javascript': 'JavaScript',
    'typescript': 'TypeScript', 'nodejs': 'NodeJS',
    'ai': 'AI', 'machine learning': 'Machine Learning', 'data': 'Data',
    'devops': 'DevOps', 'cloud': 'Cloud', 'mobile': 'Mobile',
    'android': 'Android', 'ios': 'iOS', 'flutter': 'Flutter',
    'marketing': 'Marketing', 'content': 'Content', 'seo': 'SEO',
    'social media': 'Social Media',
    'business analyst': 'Business Analyst', 'kế toán': 'Kế Toán',
    'tài chính': 'Tài Chính', 'nhân sự': 'Nhân Sự',
    'hackathon': 'Hackathon', 'startup': 'Startup', 'pitching': 'Pitching',
  };
  const tags = ['Hà Nội', industry];
  for (const [pattern, label] of Object.entries(tagMap)) {
    if (new RegExp(pattern, 'i').test(combined)) tags.push(label);
  }
  return [...new Set(tags)].slice(0, 7);
}

const LOGO_MAP = [
  { re: /viettel/i,        url: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=120&q=80' },
  { re: /fpt/i,            url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=120&q=80' },
  { re: /vng/i,            url: 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?auto=format&fit=crop&w=120&q=80' },
  { re: /vinai|vingroup/i, url: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?auto=format&fit=crop&w=120&q=80' },
  { re: /marketing|media|content/i, url: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=120&q=80' },
  { re: /data|ai|ml|tech/i, url: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=120&q=80' },
];
const DEFAULT_LOGOS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=120&q=80',
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=120&q=80',
];
const COMP_IMAGES = [
  'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1542744092-2ad48483b902?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
];

function getLogoUrl(nameOrIndustry) {
  for (const { re, url } of LOGO_MAP) {
    if (re.test(nameOrIndustry)) return url;
  }
  return DEFAULT_LOGOS[(nameOrIndustry.charCodeAt(0) || 0) % DEFAULT_LOGOS.length];
}

function buildJob(item) {
  const { title, url, content } = item;
  const industry = detectIndustry(title + ' ' + content);
  const company  = extractCompany(title, content);
  const stipend  = extractStipend(content);
  const deadline = extractDeadline(content);
  const tags     = extractTags(title, content, industry);
  const isFull   = /toàn thời gian|full.?time/i.test(content);
  const isRemote = /remote|từ xa/i.test(content);
  const isHybrid = /hybrid|linh hoạt/i.test(content);

  const source = url.includes('facebook.com') ? 'Facebook (Bing Index)'
    : url.includes('ybox')   ? 'Ybox.vn'
    : url.includes('itviec') ? 'ITviec.com'
    : url.includes('topcv')  ? 'TopCV.vn'
    : new URL(url).hostname;

  return {
    id: genId('bing-job', url + title),
    title: title.split(/\s*[-|–]\s*/)[0].trim().slice(0, 80),
    company,
    logoUrl: getLogoUrl(company + ' ' + industry),
    location: 'Hà Nội, Việt Nam',
    type: isFull ? 'Toàn thời gian (Full-time)' : 'Bán thời gian (Part-time)',
    stipend,
    duration: '3 - 6 tháng',
    deadline,
    commitment: isFull ? 'Full-time' : 'Part-time',
    workplace: isRemote ? 'Remote' : isHybrid ? 'Hybrid' : 'On-site',
    tags,
    description: (content.slice(0, 400).trim() + '...').replace(/\s+/g, ' '),
    requirements: [
      'Sinh viên năm 3, 4 hoặc mới tốt nghiệp chuyên ngành phù hợp.',
      'Có kiến thức cơ bản liên quan đến vị trí ứng tuyển.',
      'Có tinh thần học hỏi, chủ động và có trách nhiệm.'
    ],
    benefits: [
      'Trợ cấp thực tập hấp dẫn theo năng lực.',
      'Môi trường làm việc chuyên nghiệp, năng động.',
      'Cơ hội trở thành nhân viên chính thức sau thực tập.'
    ],
    industry,
    experienceLevel: 'Junior / Student',
    link: url,
    scrapedFrom: source
  };
}

function buildCompetition(item) {
  const { title, url, content } = item;
  const category     = detectIndustry(title + ' ' + content);
  const organizer    = extractOrganizer(title, content);
  const prizePool    = extractPrize(content);
  const deadline     = extractDeadline(content);
  const tags         = extractTags(title, content, category);
  const isClub       = /clb|câu lạc bộ|club/i.test(organizer + content);
  const isEnterprise = /tập đoàn|công ty|corp|group|enterprise/i.test(organizer + content);
  const organizerType = isClub ? 'Club' : isEnterprise ? 'Enterprise' : 'University';
  const isOnline     = /online|trực tuyến/i.test(content);

  const dl = new Date(deadline);
  dl.setDate(dl.getDate() + 7);
  const startDate = dl.toISOString().split('T')[0];

  const imgIdx = (organizer.charCodeAt(0) || 0) % COMP_IMAGES.length;

  return {
    id: genId('bing-comp', url + title),
    title: title.split(/\s*[-|–]\s*/)[0].trim().slice(0, 80),
    organizer,
    organizerType,
    category,
    imageUrl: COMP_IMAGES[imgIdx],
    prizePool,
    deadline,
    startDate,
    location: isOnline ? 'Online / Trực tuyến' : 'Hà Nội, Việt Nam',
    tags,
    description: (content.slice(0, 400).trim() + '...').replace(/\s+/g, ' '),
    rounds: [
      'Vòng 1: Đăng ký hồ sơ & Nộp bài dự thi',
      'Vòng 2: Thi đấu vòng loại',
      'Vòng 3: Chung kết & Trao giải'
    ],
    prizes: [`Tổng giải thưởng: ${prizePool}`],
    capacity: 100,
    registered: Math.floor(Math.random() * 60) + 10,
    link: url
  };
}

function extractStructured(crawledData) {
  const today   = new Date();
  today.setHours(0, 0, 0, 0);

  const jobs  = [];
  const comps = [];
  const seenIds = new Set();

  for (const item of crawledData) {
    const isHanoi = /hà nội|hanoi|cầu giấy|hoàn kiếm|đống đa|ba đình|tây hồ/i.test(item.title + item.content);
    if (!isHanoi) {
      console.log(`   ⏭️  Skip (not Hanoi): ${item.title.slice(0, 50)}`);
      continue;
    }

    const type = classifyType(item.title, item.content);
    if (!type) {
      console.log(`   ⏭️  Skip (unclassified): ${item.title.slice(0, 50)}`);
      continue;
    }

    try {
      if (type === 'job') {
        const job = buildJob(item);
        // Bỏ qua nếu hết hạn
        if (new Date(job.deadline) < today) {
          console.log(`   ⏰  Skip (expired ${job.deadline}): ${job.title.slice(0, 50)}`);
          continue;
        }
        if (!seenIds.has(job.id)) {
          seenIds.add(job.id);
          jobs.push(job);
          console.log(`   ✅ Job: ${job.title.slice(0, 50)} @ ${job.company}`);
        }
      } else {
        const comp = buildCompetition(item);
        // Bỏ qua nếu hết hạn
        if (new Date(comp.deadline) < today) {
          console.log(`   ⏰  Skip (expired ${comp.deadline}): ${comp.title.slice(0, 50)}`);
          continue;
        }
        if (!seenIds.has(comp.id)) {
          seenIds.add(comp.id);
          comps.push(comp);
          console.log(`   ✅ Comp: ${comp.title.slice(0, 50)}`);
        }
      }
    } catch (err) {
      console.warn(`   ❌ Extract failed: "${item.title.slice(0, 40)}" — ${err.message}`);
    }
  }

  return { jobs, comps };
}

// ─────────────────────────────────────────────
// PIPELINE
// ─────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function runPipeline() {
  console.log('\n════════════════════════════════════════════');
  console.log('   BING SEARCH PIPELINE — InternJobFinder   ');
  console.log('════════════════════════════════════════════');
  console.log(`Search engine: ${GOOGLE_API_KEY && GOOGLE_CX ? '✅ Google Custom Search API' : '⚠️  DuckDuckGo (no GOOGLE_API_KEY/GOOGLE_CX)'}\n`);

  // Queries được tối ưu:
  // - Dùng quotes để match chính xác
  // - site: để target nguồn uy tín
  // - after: để lọc kết quả mới (Google tự lọc thêm vào dateRestrict)
  // - Tổng 8 queries = 8 API calls (trong giới hạn 100/ngày)
  const queries = [
    // === INTERNSHIP ===
    '"thực tập sinh" "Hà Nội" tuyển dụng site:facebook.com',
    '"thực tập" "Hà Nội" 2026 (lập trình OR marketing OR data OR BA)',
    'tuyển thực tập intern "Hà Nội" site:itviec.com OR site:topcv.vn',
    'thực tập sinh hà nội mới nhất site:ybox.vn',

    // === COMPETITION ===
    '"cuộc thi" "sinh viên" "Hà Nội" 2026 site:facebook.com',
    '"hackathon" OR "pitching" OR "startup" "Hà Nội" sinh viên 2026',
    'cuộc thi lập trình kinh doanh "Hà Nội" mới nhất site:ybox.vn',
    '"giải thưởng" OR "học bổng" sinh viên công nghệ "Hà Nội" 2026',
  ];

  // 1. Search
  const allResults = [];
  for (const q of queries) {
    try {
      const results = await search(q);
      allResults.push(...results);
    } catch (err) {
      console.error(`Search error for "${q}": ${err.message}`);
    }
    await sleep(1200);
  }

  // Dedup theo URL và lọc bỏ link nhóm kín Facebook (groups)
  const seen = new Set();
  const deduped = allResults.filter(r => {
    if (!r.url || seen.has(r.url)) return false;
    if (r.url.includes('facebook.com/groups/') || r.url.includes('fb.com/groups/')) {
      console.log(`   ⏭️  Skip FB Group URL: ${r.url}`);
      return false;
    }
    seen.add(r.url);
    return true;
  });
  console.log(`\n🔎 Unique URLs found: ${deduped.length}`);

  // 2. Crawl (tối đa 25 trang)
  console.log('\n🕷️  Crawling pages...');
  const crawled = [];
  for (const item of deduped.slice(0, 25)) {
    const content = await crawlPage(item.url, item.snippet);
    crawled.push({ title: item.title, url: item.url, content });
    await sleep(1000);
  }

  // 3. Extract — không cần LLM
  console.log('\n🔬 Extracting structured data (regex)...');
  const { jobs, comps } = extractStructured(crawled);
  console.log(`\n📊 Results: ${jobs.length} jobs, ${comps.length} competitions`);

  // 4. Merge với fallback nếu không có kết quả
  const finalJobs  = jobs.length  > 0 ? jobs  : FALLBACK_JOBS;
  const finalComps = comps.length > 0 ? comps : FALLBACK_COMPS;
  if (jobs.length  === 0) console.warn('⚠️  No jobs extracted — using fallback data');
  if (comps.length === 0) console.warn('⚠️  No competitions extracted — using fallback data');

  // 5. Ghi file
  fs.writeFileSync(JOBS_OUT,  JSON.stringify(finalJobs,  null, 2), 'utf-8');
  fs.writeFileSync(COMPS_OUT, JSON.stringify(finalComps, null, 2), 'utf-8');
  console.log(`\n💾 Saved: ${JOBS_OUT}`);
  console.log(`💾 Saved: ${COMPS_OUT}`);
  console.log('\n════════════ PIPELINE COMPLETE ════════════\n');
}

runPipeline().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
