import React from 'react';

export default function Navbar({ activeTab, setActiveTab, savedCount }) {
  return (
    <header className="navbar-wrapper glass-panel">
      <div className="container navbar-container">
        <div className="logo-section" onClick={() => setActiveTab('explore')}>
          <div className="logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
            </svg>
          </div>
          <span className="logo-text">UniHub</span>
        </div>

        <nav className="nav-links">
          <button 
            className={`nav-link-btn ${activeTab === 'explore' ? 'active' : ''}`}
            onClick={() => setActiveTab('explore')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            Khám phá
          </button>

          <button 
            className={`nav-link-btn ${activeTab === 'bookmarks' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookmarks')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
            </svg>
            Đã Lưu
            {savedCount > 0 && <span className="nav-badge animate-scale-up">{savedCount}</span>}
          </button>
        </nav>
      </div>
    </header>
  );
}
