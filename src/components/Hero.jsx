import React from 'react';

export default function Hero({ searchQuery, setSearchQuery, currentCategory, setCurrentCategory, stats }) {
  return (
    <section className="hero-section">
      <div className="container hero-container animate-fade-in-up">
        <div className="hero-content">
          <div className="hero-badge badge badge-primary">
            <span>Cổng thông tin sinh viên 2026</span>
          </div>
          <h1 className="hero-title">
            Khám Phá <span className="text-gradient-purple">Cơ Hội</span> & <span className="text-gradient-amber">Thử Thách</span> Tương Lai
          </h1>
          <p className="hero-subtitle">
            Tìm kiếm công việc thực tập mơ ước từ các doanh nghiệp hàng đầu và thử thách bản thân qua các cuộc thi học thuật, khởi nghiệp sôi nổi.
          </p>
        </div>

        {/* Dynamic Search Box */}
        <div className="search-box-wrapper glass-panel">
          <div className="search-input-group">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input 
              type="text" 
              className="search-input" 
              placeholder={
                currentCategory === 'internships' ? "Tìm kiếm vị trí thực tập, công ty, kỹ năng..." :
                "Tìm kiếm cuộc thi, đề tài, đơn vị tổ chức..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search" onClick={() => setSearchQuery('')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="category-tabs">
          <button 
            className={`category-tab-btn ${currentCategory === 'internships' ? 'active' : ''}`}
            onClick={() => setCurrentCategory('internships')}
          >
            <span className="tab-icon">💼</span>
            <span className="tab-label">Thực tập</span>
            <span className="tab-badge">{stats.internships}</span>
          </button>

          <button 
            className={`category-tab-btn ${currentCategory === 'competitions' ? 'active' : ''}`}
            onClick={() => setCurrentCategory('competitions')}
          >
            <span className="tab-icon">🏆</span>
            <span className="tab-label">Cuộc thi</span>
            <span className="tab-badge">{stats.competitions}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
