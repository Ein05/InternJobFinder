import React, { useState } from 'react';

export default function DetailModal({ 
  item, 
  category, 
  onClose,
  userApplications,
  userCompetitions,
  onApplyInternship,
  onCancelInternship,
  onRegisterCompetition,
  onCancelCompetition
}) {
  const [resumeName, setResumeName] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [showApplyForm, setShowApplyForm] = useState(false);

  // Competition registration form state
  const [teamName, setTeamName] = useState('');
  const [memberCount, setMemberCount] = useState('3');
  const [leaderPhone, setLeaderPhone] = useState('');
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  if (!item) return null;

  const isApplied = userApplications.some(app => app.id === item.id);
  const registeredTeam = userCompetitions.find(c => c.id === item.id);
  const isRegistered = !!registeredTeam;

  const handleApplySubmit = (e) => {
    e.preventDefault();
    if (!resumeName) {
      alert('Vui lòng tải lên CV của bạn!');
      return;
    }
    onApplyInternship(item.id, resumeName, coverLetter);
    setShowApplyForm(false);
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!teamName || !leaderPhone) {
      alert('Vui lòng điền đầy đủ thông tin đăng ký!');
      return;
    }
    onRegisterCompetition(item.id, teamName, memberCount, leaderPhone);
    setShowRegisterForm(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setResumeName(e.target.files[0].name);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close details">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>

        {category === 'internship' && (
          <div className="modal-inner">
            <div className="modal-header-section">
              <div className="company-logo-large">
                <img src={item.logoUrl} alt={item.company} />
              </div>
              <div className="modal-header-meta">
                <span className="badge badge-primary">{item.industry}</span>
                <h2>{item.title}</h2>
                <p className="company-name-large">{item.company}</p>
                <div className="meta-grid">
                  <div className="meta-item">📍 <span>{item.location}</span></div>
                  <div className="meta-item">💵 <span>{item.stipend}</span></div>
                  <div className="meta-item">🕒 <span>{item.type}</span></div>
                  <div className="meta-item">📅 <span>Hạn: {item.deadline}</span></div>
                </div>
              </div>
            </div>

            <div className="modal-body-section">
              <div className="modal-tags">
                {item.tags.map(tag => (
                  <span key={tag} className="badge badge-secondary">{tag}</span>
                ))}
              </div>

              <div className="info-block">
                <h3>Mô tả công việc</h3>
                <p>{item.description}</p>
              </div>

              <div className="info-block">
                <h3>Yêu cầu ứng viên</h3>
                <ul>
                  {item.requirements.map((req, idx) => <li key={idx}>{req}</li>)}
                </ul>
              </div>

              <div className="info-block">
                <h3>Quyền lợi được hưởng</h3>
                <ul>
                  {item.benefits.map((ben, idx) => <li key={idx}>{ben}</li>)}
                </ul>
              </div>
            </div>

            <div className="modal-footer-section">
              {isApplied ? (
                <div className="action-success-group">
                  <span className="success-status-text">✓ Đã nộp đơn ứng tuyển</span>
                  <button className="btn btn-danger btn-sm" onClick={() => onCancelInternship(item.id)}>
                    Hủy ứng tuyển
                  </button>
                </div>
              ) : showApplyForm ? (
                <form className="apply-form glass-panel animate-fade-in-up" onSubmit={handleApplySubmit}>
                  <h3>Ứng tuyển vị trí {item.title}</h3>
                  
                  <div className="form-group">
                    <label className="form-label">Tải lên CV (PDF, DOCX)</label>
                    <div className="file-input-wrapper">
                      <input 
                        type="file" 
                        id="resume-file" 
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden-file-input" 
                      />
                      <label htmlFor="resume-file" className="btn btn-secondary file-upload-label">
                        📁 Chọn tệp CV
                      </label>
                      <span className="file-name-display">
                        {resumeName || 'Chưa chọn tệp nào'}
                      </span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Thư giới thiệu (Không bắt buộc)</label>
                    <textarea 
                      className="glass-input textarea-input" 
                      placeholder="Giới thiệu bản thân và lý do bạn phù hợp với vị trí này..."
                      rows="4"
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-success">Nộp hồ sơ</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowApplyForm(false)}>Hủy</button>
                  </div>
                </form>
              ) : (
                <button className="btn btn-primary btn-lg w-full" onClick={() => setShowApplyForm(true)}>
                  Ứng tuyển ngay
                </button>
              )}
            </div>
          </div>
        )}

        {category === 'competition' && (
          <div className="modal-inner">
            <div className="modal-banner-image">
              <img src={item.imageUrl} alt={item.title} />
              <span className="event-price-banner badge badge-accent">
                🏆 Tổng giải: {item.prizePool}
              </span>
            </div>

            <div className="modal-header-meta" style={{ marginTop: '20px' }}>
              <div className="organizer-meta-row">
                <span className="badge badge-primary">{item.organizer}</span>
                <span className="badge badge-secondary">{item.organizerType}</span>
              </div>
              <h2 style={{ marginTop: '8px' }}>{item.title}</h2>
              <div className="meta-grid" style={{ marginTop: '12px' }}>
                <div className="meta-item">📅 <span>Hạn đăng ký: {item.deadline}</span></div>
                <div className="meta-item">🕒 <span>Khởi tranh: {item.startDate}</span></div>
                <div className="meta-item">📍 <span>Địa điểm: {item.location}</span></div>
                <div className="meta-item">👥 <span>Giới hạn: {item.capacity} đội</span></div>
              </div>
            </div>

            <div className="modal-body-section">
              <div className="modal-tags">
                {item.tags.map(tag => (
                  <span key={tag} className="badge badge-secondary">{tag}</span>
                ))}
              </div>

              <div className="info-block">
                <h3>Chi tiết cuộc thi</h3>
                <p>{item.description}</p>
              </div>

              <div className="info-block">
                <h3>Các vòng thi (Rounds)</h3>
                <div className="agenda-timeline">
                  {item.rounds.map((round, idx) => (
                    <div key={idx} className="agenda-slot">
                      <div className="agenda-bullet"></div>
                      <div className="agenda-text">{round}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="info-block">
                <h3>Cơ cấu giải thưởng</h3>
                <ul>
                  {item.prizes.map((prize, idx) => <li key={idx} style={{ color: idx === 0 ? '#fbbf24' : 'inherit' }}>{prize}</li>)}
                </ul>
              </div>
            </div>

            <div className="modal-footer-section">
              {isRegistered ? (
                <div className="ticket-success-wrapper glass-panel animate-fade-in-up">
                  <div className="ticket-header">
                    <h4>🎟️ Đơn xác nhận đội thi</h4>
                    <span className="ticket-status badge badge-success">Đăng ký thành công</span>
                  </div>
                  <div className="ticket-body">
                    <div className="ticket-qr-mock">
                      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="7" height="7"/>
                        <rect x="14" y="3" width="7" height="7"/>
                        <rect x="3" y="14" width="7" height="7"/>
                        <path d="M14 14h3v3h-3zm3 3h4v4h-4zm0-3h4v3h-4zm-3 4h3v3h-3zm6 0h1v1h-1z"/>
                      </svg>
                    </div>
                    <div className="ticket-info">
                      <p className="ticket-user">Đội: <strong>{registeredTeam.teamName}</strong></p>
                      <p className="ticket-user">Thành viên: <strong>{registeredTeam.memberCount} người</strong></p>
                      <p className="ticket-code">Mã đội: <strong>TEAM-{item.id.toUpperCase()}-{registeredTeam.leaderPhone?.slice(-4)}</strong></p>
                    </div>
                  </div>
                  <button className="btn btn-danger btn-sm w-full" style={{ marginTop: '12px' }} onClick={() => onCancelCompetition(item.id)}>
                    Hủy đăng ký đội thi
                  </button>
                </div>
              ) : showRegisterForm ? (
                <form className="apply-form glass-panel animate-fade-in-up" onSubmit={handleRegisterSubmit}>
                  <h3>Đăng ký tham gia cuộc thi</h3>
                  
                  <div className="form-group">
                    <label className="form-label">Tên đội thi</label>
                    <input 
                      type="text" 
                      className="glass-input" 
                      placeholder="Nhập tên đội thi của bạn..."
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Số lượng thành viên</label>
                    <select 
                      className="glass-select"
                      value={memberCount}
                      onChange={(e) => setMemberCount(e.target.value)}
                    >
                      <option value="1">1 (Cá nhân)</option>
                      <option value="2">2 thành viên</option>
                      <option value="3">3 thành viên</option>
                      <option value="4">4 thành viên</option>
                      <option value="5">5 thành viên</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Số điện thoại trưởng nhóm</label>
                    <input 
                      type="tel" 
                      className="glass-input" 
                      placeholder="Số điện thoại liên hệ..."
                      value={leaderPhone}
                      onChange={(e) => setLeaderPhone(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-success">Xác nhận đăng ký</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowRegisterForm(false)}>Hủy</button>
                  </div>
                </form>
              ) : (
                <button 
                  className="btn btn-primary btn-lg w-full" 
                  onClick={() => setShowRegisterForm(true)}
                  disabled={item.registered >= item.capacity}
                >
                  {item.registered >= item.capacity ? 'Đã hết suất đăng ký' : 'Đăng ký đội thi ngay'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
