import React, { useState } from 'react';

export default function Dashboard({ 
  userApplications, 
  userCompetitions, 
  onCancelInternship,
  onCancelCompetition,
  onViewDetails
}) {
  const [activeSubTab, setActiveSubTab] = useState('apps');

  return (
    <div className="container dashboard-container animate-fade-in-up">
      {/* Profile summary card */}
      <div className="profile-banner glass-panel">
        <div className="profile-main-info">
          <div className="profile-avatar-large">
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" 
              alt="Student Avatar" 
            />
          </div>
          <div className="profile-text-info">
            <h2>Vũ Đức Minh</h2>
            <p className="student-id">MSSV: B22DCCN389 | Trường Công nghệ & Khoa học</p>
            <div className="profile-badges">
              <span className="badge badge-primary">Năm 3</span>
              <span className="badge badge-secondary">GPA: 3.6 / 4.0</span>
              <span className="badge badge-info">Ngành: Kỹ thuật Phần mềm</span>
            </div>
          </div>
        </div>

        <div className="profile-stats-grid">
          <div className="profile-stat-box" onClick={() => setActiveSubTab('apps')}>
            <span className="stat-num">{userApplications.length}</span>
            <span className="stat-label">Ứng tuyển thực tập</span>
          </div>
          <div className="profile-stat-box" onClick={() => setActiveSubTab('comps')}>
            <span className="stat-num">{userCompetitions.length}</span>
            <span className="stat-label">Cuộc thi tham gia</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-tabs */}
      <div className="dashboard-subtabs">
        <button 
          className={`subtab-btn ${activeSubTab === 'apps' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('apps')}
        >
          💼 Đơn ứng tuyển ({userApplications.length})
        </button>
        <button 
          className={`subtab-btn ${activeSubTab === 'comps' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('comps')}
        >
          🏆 Cuộc thi ({userCompetitions.length})
        </button>
      </div>

      {/* Subtab Contents */}
      <div className="dashboard-content-area">
        {activeSubTab === 'apps' && (
          <div className="dashboard-sub-section">
            <h3 className="section-title">Quản lý hồ sơ thực tập</h3>
            {userApplications.length === 0 ? (
              <div className="empty-substate glass-panel">
                <span className="empty-substate-icon">💼</span>
                <p>Bạn chưa nộp đơn ứng tuyển thực tập nào.</p>
              </div>
            ) : (
              <div className="dashboard-list">
                {userApplications.map((app) => (
                  <div key={app.id} className="dashboard-list-item glass-panel">
                    <div className="item-main-details">
                      <div className="item-logo">
                        <img src={app.logoUrl} alt={app.company} />
                      </div>
                      <div className="item-texts">
                        <h4>{app.title}</h4>
                        <p>{app.company} | 📍 {app.location}</p>
                        <div className="app-file-info">
                          <span>📄 CV: {app.resumeName}</span>
                          {app.coverLetter && <span className="cover-letter-preview">💬 Thư giới thiệu: "{app.coverLetter.substring(0, 40)}..."</span>}
                        </div>
                      </div>
                    </div>
                    <div className="item-actions-status">
                      <span className="status-indicator badge badge-info">Đang xem xét</span>
                      <div className="action-buttons">
                        <button className="btn btn-secondary btn-sm" onClick={() => onViewDetails(app, 'internship')}>
                          Chi tiết
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => onCancelInternship(app.id)}>
                          Rút hồ sơ
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'comps' && (
          <div className="dashboard-sub-section">
            <h3 className="section-title">Hồ sơ đăng ký cuộc thi</h3>
            {userCompetitions.length === 0 ? (
              <div className="empty-substate glass-panel">
                <span className="empty-substate-icon">🏆</span>
                <p>Bạn chưa đăng ký đội thi cho cuộc thi nào.</p>
              </div>
            ) : (
              <div className="dashboard-list">
                {userCompetitions.map((comp) => (
                  <div key={comp.id} className="dashboard-list-item glass-panel">
                    <div className="item-main-details">
                      <div className="item-logo event-logo-icon">🏆</div>
                      <div className="item-texts">
                        <h4>{comp.title}</h4>
                        <p>{comp.organizer}</p>
                        <div className="app-file-info">
                          <span>👥 Đội: <strong>{comp.teamName}</strong> ({comp.memberCount} thành viên)</span>
                          <span>📞 SĐT Trưởng nhóm: {comp.leaderPhone}</span>
                        </div>
                      </div>
                    </div>
                    <div className="item-actions-status">
                      <span className="status-indicator badge badge-success">Đã ghi danh</span>
                      <div className="action-buttons">
                        <button className="btn btn-secondary btn-sm" onClick={() => onViewDetails(comp, 'competition')}>
                          Xem vé đội thi
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => onCancelCompetition(comp.id)}>
                          Hủy đăng ký
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
