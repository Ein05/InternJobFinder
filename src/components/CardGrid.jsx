import React from 'react';

const isFBLink = (url) => url && (url.includes('facebook.com') || url.includes('fb.com'));

export default function CardGrid({ 
  items, 
  currentCategory, 
  savedItems, 
  onSaveToggle,
}) {
  const isSaved = (itemId) => savedItems.some(item => item.id === itemId);

  const openLink = (item) => {
    const url = item.link || item.url;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (items.length === 0) {
    return (
      <div className="empty-results glass-panel animate-fade-in-up">
        <div className="empty-icon">🔍</div>
        <h3>Không tìm thấy kết quả phù hợp</h3>
        <p>Dữ liệu đang được cập nhật, vui lòng thử lại sau hoặc điều chỉnh bộ lọc.</p>
      </div>
    );
  }

  return (
    <div className="grid-cards animate-fade-in-up">
      {items.map((item) => {
        const itemIsSaved = isSaved(item.id);

        if (currentCategory === 'internships') {
          return (
            <div key={item.id} className="glass-panel opportunity-card internship-card">
              <div className="card-header">
                <div className="company-logo-wrapper">
                  <img src={item.logoUrl} alt={item.company} className="company-logo" />
                </div>
                <div className="header-meta">
                  <span className="company-name">
                    {item.company}
                    {item.scrapedFrom && (
                      <span className="scraped-source-badge" title={`Nguồn: ${item.scrapedFrom}`}>
                        {item.scrapedFrom.toLowerCase().includes('facebook') ? '👤 FB' : '🌐 Web'}
                      </span>
                    )}
                  </span>
                  <span className="location-info">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    {item.location}
                  </span>
                </div>
                <button 
                  className={`save-btn ${itemIsSaved ? 'saved' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSaveToggle(item, 'internship');
                  }}
                  aria-label="Save internship"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={itemIsSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
                  </svg>
                </button>
              </div>

              <div className="card-body" onClick={() => openLink(item)} style={{ cursor: 'pointer' }}>
                <h3 className="card-title">{item.title}</h3>
                <div className="stipend-info">
                  <span className="stipend-icon">💵</span> {item.stipend}
                </div>
                <div className="card-tags">
                  <span className="badge badge-primary">{item.commitment}</span>
                  <span className="badge badge-info">{item.workplace}</span>
                  {item.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="badge badge-secondary">{tag}</span>
                  ))}
                </div>
              </div>

              <div className="card-footer">
                <div className="footer-left">
                  <span className="deadline-text">Hạn nộp: {item.deadline}</span>
                  {isFBLink(item.link || item.url) && (
                    <span className="fb-warning-badge" title="Bài đăng Facebook có thể yêu cầu đăng nhập để xem">
                      🔑 Cần đăng nhập FB
                    </span>
                  )}
                </div>
                <a
                  href={item.link || item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  Xem bài viết ↗
                </a>
              </div>
            </div>
          );
        }

        if (currentCategory === 'competitions') {
          return (
            <div key={item.id} className="glass-panel opportunity-card event-card competition-card">
              <div className="event-image-wrapper" onClick={() => openLink(item)} style={{ cursor: 'pointer' }}>
                <img src={item.imageUrl} alt={item.title} className="event-image" />
                <span className="event-price-tag badge badge-accent">
                  🏆 Giải: {item.prizePool.split(' ')[0]} {item.prizePool.split(' ')[1] || ''}
                </span>
                <button 
                  className={`save-btn floating-save-btn ${itemIsSaved ? 'saved' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSaveToggle(item, 'competition');
                  }}
                  aria-label="Save competition"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={itemIsSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
                  </svg>
                </button>
              </div>

              <div className="card-body" onClick={() => openLink(item)} style={{ cursor: 'pointer' }}>
                <div className="organizer-badge-group">
                  <span className="event-organizer">
                    {item.organizer}
                    {item.link && (item.link.includes('facebook.com') || item.link.includes('fb.com')) && (
                      <span className="scraped-source-badge" title="Nguồn: Facebook">👤 FB</span>
                    )}
                    {item.link && item.link.includes('ybox.vn') && (
                      <span className="scraped-source-badge" title="Nguồn: YBox">🌐 YBox</span>
                    )}
                  </span>
                  <span className="badge badge-secondary badge-organizer-type">{item.organizerType}</span>
                </div>
                <h3 className="card-title">{item.title}</h3>
                
                <div className="event-time-location">
                  <span className="event-meta-item">
                    📍 {item.location}
                  </span>
                </div>

                <div className="card-tags">
                  <span className="badge badge-primary">{item.category}</span>
                  {item.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="badge badge-secondary">{tag}</span>
                  ))}
                </div>
              </div>

              <div className="card-footer">
                <div className="footer-left">
                  <span className="deadline-text">Hạn đăng ký: {item.deadline}</span>
                  {isFBLink(item.link || item.url) && (
                    <span className="fb-warning-badge" title="Bài đăng Facebook có thể yêu cầu đăng nhập để xem">
                      🔑 Cần đăng nhập FB
                    </span>
                  )}
                </div>
                <a
                  href={item.link || item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  Xem bài viết ↗
                </a>
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
