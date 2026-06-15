import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import SidebarFilters from './components/SidebarFilters';
import CardGrid from './components/CardGrid';
import DetailModal from './components/DetailModal';
import Dashboard from './components/Dashboard';
import AdGate from './components/AdGate'; 

import { mockInternships, mockCompetitions } from './data/mockData';

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

  // Lọc hết hạn: deadline < hôm nay thì bỏ
  const isNotExpired = (item) => {
    if (!item.deadline) return true;
    return new Date(item.deadline) >= new Date(new Date().toDateString());
  };

  // Hanoi-only Internships & Competitions (Mock data + dynamic scraper feeds)
  const [internships, setInternships] = useState(mockInternships.filter(isNotExpired));
  const [competitions, setCompetitions] = useState(mockCompetitions.filter(isNotExpired));
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);

  // Fetch scraped JSON files from public directory on mount
  useEffect(() => {
    const loadScrapedData = async () => {
      try {
        setIsLoadingFeed(true);
        const [jobsRes, compsRes] = await Promise.all([
          fetch('/data/facebook_jobs.json').then(r => r.ok ? r.json() : []),
          fetch('/data/facebook_competitions.json').then(r => r.ok ? r.json() : [])
        ]);

        if (jobsRes && jobsRes.length > 0) {
          setInternships(prev => {
            const existingIds = new Set(prev.map(item => item.id));
            const newJobs = jobsRes
              .filter(job => !existingIds.has(job.id))
              .filter(isNotExpired); // Bỏ job hết hạn
            return [...prev, ...newJobs];
          });
        }

        if (compsRes && compsRes.length > 0) {
          setCompetitions(prev => {
            const existingIds = new Set(prev.map(item => item.id));
            const newComps = compsRes
              .filter(comp => !existingIds.has(comp.id))
              .filter(isNotExpired); // Bỏ cuộc thi hết hạn
            return [...prev, ...newComps];
          });
        }
      } catch (err) {
        console.error('Failed to load scraped feeds:', err);
      } finally {
        setIsLoadingFeed(false);
      }
    };

    loadScrapedData();
  }, []);

  // Detail Modal State
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemCategory, setSelectedItemCategory] = useState(null); 

  // Ad-Gate States
  const [pendingAdItem, setPendingAdItem] = useState(null);
  const [pendingAdCategory, setPendingAdCategory] = useState(null);
  const [unlockedItems, setUnlockedItems] = useState([]);

  // User Interactive States (synced with LocalStorage)
  const [savedItems, setSavedItems] = useState([]);
  const [userApplications, setUserApplications] = useState([]);
  const [userCompetitions, setUserCompetitions] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('unihub_saved');
      const apps = localStorage.getItem('unihub_apps');
      const comps = localStorage.getItem('unihub_competitions');

      if (saved) setSavedItems(JSON.parse(saved));
      if (apps) setUserApplications(JSON.parse(apps));
      if (comps) setUserCompetitions(JSON.parse(comps));
    } catch (e) {
      console.error('Failed to load local storage state:', e);
    }
  }, []);

  // Save state to localStorage on update
  useEffect(() => {
    localStorage.setItem('unihub_saved', JSON.stringify(savedItems));
  }, [savedItems]);

  useEffect(() => {
    localStorage.setItem('unihub_apps', JSON.stringify(userApplications));
  }, [userApplications]);

  useEffect(() => {
    localStorage.setItem('unihub_competitions', JSON.stringify(userCompetitions));
  }, [userCompetitions]);

  const handleSaveToggle = (item, type) => {
    setSavedItems(prev => {
      const exists = prev.some(saved => saved.id === item.id);
      if (exists) {
        return prev.filter(saved => saved.id !== item.id);
      } else {
        return [...prev, { ...item, type }];
      }
    });
  };

  const handleApplyInternship = (internshipId, resumeName, coverLetter) => {
    const internship = internships.find(job => job.id === internshipId);
    if (internship) {
      setUserApplications(prev => {
        if (prev.some(app => app.id === internshipId)) return prev;
        return [...prev, { ...internship, resumeName, coverLetter, appliedAt: new Date().toISOString() }];
      });
      setSelectedItem(prev => prev && prev.id === internshipId ? { ...prev, resumeName, coverLetter } : prev);
    }
  };

  const handleCancelInternship = (internshipId) => {
    setUserApplications(prev => prev.filter(app => app.id !== internshipId));
  };

  const handleRegisterCompetition = (competitionId, teamName, memberCount, leaderPhone) => {
    const comp = competitions.find(c => c.id === competitionId);
    if (comp) {
      setUserCompetitions(prev => {
        if (prev.some(c => c.id === competitionId)) return prev;
        return [...prev, { ...comp, teamName, memberCount, leaderPhone, registeredAt: new Date().toISOString() }];
      });
      // Correctly update registrations in state
      setCompetitions(prev => prev.map(c => 
        c.id === competitionId ? { ...c, registered: Math.min(c.capacity, (c.registered || 0) + 1) } : c
      ));
      setSelectedItem(prev => prev && prev.id === competitionId ? { 
        ...prev, 
        teamName, 
        memberCount, 
        leaderPhone,
        registered: Math.min(prev.capacity, (prev.registered || 0) + 1)
      } : prev);
    }
  };

  const handleCancelCompetition = (competitionId) => {
    setUserCompetitions(prev => prev.filter(c => c.id !== competitionId));
    const comp = competitions.find(c => c.id === competitionId);
    if (comp) {
      setCompetitions(prev => prev.map(c => 
        c.id === competitionId ? { ...c, registered: Math.max(0, (c.registered || 0) - 1) } : c
      ));
    }
  };

  const handleViewDetails = (item, category) => {
    const isAlreadyUnlocked = unlockedItems.includes(item.id);
    const isInteracted = 
      userApplications.some(app => app.id === item.id) ||
      userCompetitions.some(c => c.id === item.id);

    if (isAlreadyUnlocked || isInteracted) {
      setSelectedItem(item);
      setSelectedItemCategory(category);
    } else {
      setPendingAdItem(item);
      setPendingAdCategory(category);
    }
  };

  const handleUnlockItem = () => {
    if (pendingAdItem) {
      setUnlockedItems(prev => [...prev, pendingAdItem.id]);
      setSelectedItem(pendingAdItem);
      setSelectedItemCategory(pendingAdCategory);
      setPendingAdItem(null);
      setPendingAdCategory(null);
    }
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setSelectedItemCategory(null);
  };

  const handleCloseAd = () => {
    setPendingAdItem(null);
    setPendingAdCategory(null);
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  // Filter Items
  const getFilteredItems = () => {
    const query = searchQuery.toLowerCase().trim();

    if (currentCategory === 'internships') {
      return internships.filter(item => {
        const matchesQuery = !query || 
          item.title.toLowerCase().includes(query) ||
          item.company.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.tags.some(tag => tag.toLowerCase().includes(query));

        // Industry Filter
        const matchesIndustry = filters.internshipIndustry === 'All' || 
          item.industry === filters.internshipIndustry;

        // Commitment Filter (Full-time / Part-time)
        const matchesCommitment = filters.internshipCommitment === 'All' ||
          item.commitment === filters.internshipCommitment;

        // Workplace Filter (On-site / Remote / Hybrid)
        const matchesWorkplace = filters.internshipWorkplace === 'All' ||
          item.workplace === filters.internshipWorkplace;

        // Stipend Filter
        let matchesStipend = true;
        if (filters.internshipStipend !== 'All') {
          const isVinAI = item.company === 'VinAI Research'; 
          const isVNG = item.company === 'VNG Corporation'; 
          const isShopee = item.company === 'Shopee Vietnam'; 
          const isFPT = item.company === 'FPT Software'; 
          const isVinGroup = item.company === 'VinGroup'; 
          const isMomo = item.company.includes('MoMo'); // 6m

          if (filters.internshipStipend === '10m') {
            matchesStipend = isShopee || isVinAI;
          } else if (filters.internshipStipend === '8m') {
            matchesStipend = isVNG || isShopee || isVinAI;
          } else if (filters.internshipStipend === '5m') {
            matchesStipend = isVNG || isShopee || isVinAI || isFPT || isVinGroup || isMomo;
          }
        }

        return matchesQuery && matchesIndustry && matchesCommitment && matchesWorkplace && matchesStipend;
      });
    }

    if (currentCategory === 'competitions') {
      return competitions.filter(item => {
        const matchesQuery = !query || 
          item.title.toLowerCase().includes(query) ||
          item.organizer.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.tags.some(tag => tag.toLowerCase().includes(query));

        // Category Filter (Tech / Business)
        const matchesCategory = filters.competitionCategory === 'All' || 
          item.category === filters.competitionCategory;

        // Organizer Type Filter (Club / Enterprise / University)
        const matchesOrganizer = filters.competitionOrganizerType === 'All' || 
          item.organizerType === filters.competitionOrganizerType;

        return matchesQuery && matchesCategory && matchesOrganizer;
      });
    }

    return [];
  };

  const getBookmarkedItems = () => {
    return savedItems.filter(item => {
      if (currentCategory === 'internships') return item.type === 'internship';
      if (currentCategory === 'competitions') return item.type === 'competition';
      return false;
    });
  };

  const filteredItems = activeTab === 'bookmarks' ? getBookmarkedItems() : getFilteredItems();

  const stats = {
    internships: internships.length,
    competitions: competitions.length
  };

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
        {activeTab !== 'dashboard' ? (
          <>
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
                  <h2>🔖 Danh sách đã lưu của bạn ({getBookmarkedItems().length})</h2>
                  <p>Xem các cơ hội hoặc cuộc thi bạn đã lưu lại để theo dõi.</p>
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
                  <CardGrid 
                    items={filteredItems}
                    currentCategory={currentCategory}
                    savedItems={savedItems}
                    onSaveToggle={handleSaveToggle}
                    onViewDetails={handleViewDetails}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <Dashboard 
            userApplications={userApplications}
            userCompetitions={userCompetitions}
            onCancelInternship={handleCancelInternship}
            onCancelCompetition={handleCancelCompetition}
            onViewDetails={(item, type) => handleViewDetails(item, type)}
          />
        )}
      </main>

      {/* Ad Gate Modal */}
      {pendingAdItem && (
        <AdGate 
          onClose={handleCloseAd}
          onUnlock={handleUnlockItem}
        />
      )}

      {/* Detail Overlay Modal */}
      {selectedItem && (
        <DetailModal 
          item={selectedItem}
          category={selectedItemCategory}
          onClose={handleCloseModal}
          userApplications={userApplications}
          userCompetitions={userCompetitions}
          onApplyInternship={handleApplyInternship}
          onCancelInternship={handleCancelInternship}
          onRegisterCompetition={handleRegisterCompetition}
          onCancelCompetition={handleCancelCompetition}
        />
      )}

      {/* Floating footer element */}
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
