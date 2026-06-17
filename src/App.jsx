import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import SidebarFilters from './components/SidebarFilters';
import CardGrid from './components/CardGrid';

const INITIAL_FILTERS = {
  internshipIndustry: 'All',
  internshipCommitment: 'All', 
  internshipWorkplace: 'All',  
  internshipStipend: 'All',
  competitionCategory: 'All',      
  competitionOrganizerType: 'All',  
};

export default function App() {
  const [activeTab, setActiveTab] = useState('explore');
  const [currentCategory, setCurrentCategory] = useState('internships');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  // Lọc hết hạn
  const isNotExpired = (item) => {
    if (!item.deadline) return true;
    return new Date(item.deadline) >= new Date(new Date().toDateString());
  };

  const [internships, setInternships] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);

  // Load scraped JSON từ public/data/ hoặc từ API nếu khả dụng
  useEffect(() => {
    const loadScrapedData = async () => {
      try {
        setIsLoadingFeed(true);
        const base = import.meta.env.BASE_URL || '/';
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        
        let jobsData = [];
        let compsData = [];
        
        try {
          // Thử lấy dữ liệu từ API PostgreSQL
          const [jobsRes, compsRes] = await Promise.all([
            fetch(`${apiUrl}/api/jobs`).then(r => r.ok ? r.json() : Promise.reject()),
            fetch(`${apiUrl}/api/competitions`).then(r => r.ok ? r.json() : Promise.reject())
          ]);
          jobsData = jobsRes;
          compsData = compsRes;
          console.log("⚡ Loaded live data from FastAPI PostgreSQL database");
        } catch (apiErr) {
          // Fallback về file tĩnh
          console.warn("⚠️ API unavailable, falling back to static files:", apiErr);
          const [jobsRes, compsRes] = await Promise.all([
            fetch(`${base}data/facebook_jobs.json`).then(r => r.ok ? r.json() : []),
            fetch(`${base}data/facebook_competitions.json`).then(r => r.ok ? r.json() : [])
          ]);
          jobsData = jobsRes;
          compsData = compsRes;
        }

        setInternships((jobsData || []).filter(isNotExpired));
        setCompetitions((compsData || []).filter(isNotExpired));
      } catch (err) {
        console.error('Failed to load scraped data:', err);
      } finally {
        setIsLoadingFeed(false);
      }
    };
    loadScrapedData();
  }, []);

  // Saved items (bookmark) — lưu vào localStorage
  const [savedItems, setSavedItems] = useState([]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('unihub_saved');
      if (saved) setSavedItems(JSON.parse(saved));
    } catch (e) {}
  }, []);
  useEffect(() => {
    localStorage.setItem('unihub_saved', JSON.stringify(savedItems));
  }, [savedItems]);

  const handleSaveToggle = (item, type) => {
    setSavedItems(prev => {
      const exists = prev.some(s => s.id === item.id);
      return exists ? prev.filter(s => s.id !== item.id) : [...prev, { ...item, type }];
    });
  };

  const handleResetFilters = () => setFilters(INITIAL_FILTERS);


  // Filter Items
  const getFilteredItems = () => {
    const query = searchQuery.toLowerCase().trim();

    if (currentCategory === 'internships') {
      return internships.filter(item => {
        const matchesQuery = !query || 
          item.title?.toLowerCase().includes(query) ||
          item.company?.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.tags?.some(tag => tag.toLowerCase().includes(query));
        const matchesIndustry = filters.internshipIndustry === 'All' || item.industry === filters.internshipIndustry;
        const matchesCommitment = filters.internshipCommitment === 'All' || item.commitment === filters.internshipCommitment;
        const matchesWorkplace = filters.internshipWorkplace === 'All' || item.workplace === filters.internshipWorkplace;
        return matchesQuery && matchesIndustry && matchesCommitment && matchesWorkplace;
      });
    }

    if (currentCategory === 'competitions') {
      return competitions.filter(item => {
        const matchesQuery = !query || 
          item.title?.toLowerCase().includes(query) ||
          item.organizer?.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.tags?.some(tag => tag.toLowerCase().includes(query));
        const matchesCategory = filters.competitionCategory === 'All' || item.category === filters.competitionCategory;
        const matchesOrganizer = filters.competitionOrganizerType === 'All' || item.organizerType === filters.competitionOrganizerType;
        return matchesQuery && matchesCategory && matchesOrganizer;
      });
    }

    return [];
  };

  const getBookmarkedItems = () => savedItems.filter(item => {
    if (currentCategory === 'internships') return item.type === 'internship';
    if (currentCategory === 'competitions') return item.type === 'competition';
    return false;
  });

  const filteredItems = activeTab === 'bookmarks' ? getBookmarkedItems() : getFilteredItems();
  const stats = { internships: internships.length, competitions: competitions.length };

  return (
    <div className="app-container">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSearchQuery('');
          setFilters(INITIAL_FILTERS);
        }}
        savedCount={savedItems.length}
      />

      <main className="main-content">
        <Hero 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          currentCategory={currentCategory}
          setCurrentCategory={setCurrentCategory}
          stats={stats}
        />

        <div className="container explore-section">
          {activeTab === 'bookmarks' && (
            <div className="section-header-bookmarks animate-fade-in-up">
              <h2>🔖 Đã lưu ({getBookmarkedItems().length})</h2>
              <p>Các cơ hội bạn đã đánh dấu để theo dõi.</p>
            </div>
          )}

          <div className="explore-layout">
            {activeTab === 'explore' && (
              <SidebarFilters 
                currentCategory={currentCategory}
                filters={filters}
                setFilters={setFilters}
                resetFilters={handleResetFilters}
              />
            )}

            <div className="explore-results-panel" style={{ width: activeTab === 'bookmarks' ? '100%' : undefined }}>
              {isLoadingFeed ? (
                <div className="empty-results glass-panel animate-fade-in-up">
                  <div className="empty-icon">⏳</div>
                  <h3>Đang tải dữ liệu...</h3>
                  <p>Hệ thống đang cào dữ liệu mới nhất từ các nguồn.</p>
                </div>
              ) : (
                <CardGrid 
                  items={filteredItems}
                  currentCategory={currentCategory}
                  savedItems={savedItems}
                  onSaveToggle={handleSaveToggle}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="footer-credits glass-panel">
        <div className="container footer-container">
          <p>© 2026 UniHub. Nền tảng kết nối cơ hội phát triển sinh viên.</p>
          <div className="footer-links">
            <span>Hỗ trợ: support@unihub.edu.vn</span>
            <span>|</span>
            <span>Điều khoản sử dụng</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

