import React, { useState, useEffect } from 'react';

const SPONSOR_ADS = [
  {
    id: "ad-momo",
    sponsorName: "Ví điện tử MoMo",
    title: "Kích Hoạt Ví Sinh Viên - Nhận Quà 500.000đ",
    description: "Nhận ngay gói quà thanh toán học phí, mua vé xe khách, xem phim CGV cực hời dành riêng cho sinh viên đại học. Đăng ký chỉ bằng thẻ sinh viên hoặc CCCD!",
    accentColor: "#d82d8b",
    bgGradient: "linear-gradient(135deg, #d82d8b 0%, #a21a64 100%)",
    actionText: "Nhận Quà Ngay",
    badge: "Tài trợ độc quyền"
  },
  {
    id: "ad-techcom",
    sponsorName: "Techcombank GenZ",
    title: "Tài Khoản GenZ - Miễn Phí Trọn Đời, Hoàn Tiền 2%",
    description: "Mở tài khoản thanh toán online Techcombank ngay trên ứng dụng. Miễn phí chuyển khoản, chọn số tài khoản đẹp theo số điện thoại và hoàn tiền không giới hạn cho mọi chi tiêu thẻ.",
    accentColor: "#ea580c",
    bgGradient: "linear-gradient(135deg, #27272a 0%, #09090b 100%)",
    actionText: "Mở Thẻ Miễn Phí",
    badge: "Đối tác tài chính"
  },
  {
    id: "ad-elsa",
    sponsorName: "ELSA Speak AI",
    title: "Luyện Phát Âm Chuẩn Bản Xứ - Ưu Đãi 50%",
    description: "Giao tiếp tự tin như người bản xứ cùng trợ lý AI ELSA. Chương trình đồng hành cùng sinh viên Việt Nam: Giảm 50% gói học phí trọn đời cho sinh viên xác thực bằng email trường (.edu.vn).",
    accentColor: "#2563eb",
    bgGradient: "linear-gradient(135deg, #1e40af 0%, #1e1b4b 100%)",
    actionText: "Nhận Voucher 50%",
    badge: "Đối tác giáo dục"
  }
];

export default function AdGate({ onClose, onUnlock }) {
  const [ad, setAd] = useState(SPONSOR_ADS[0]);
  const [timeLeft, setTimeLeft] = useState(5);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Pick a random sponsor ad when the component mounts
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * SPONSOR_ADS.length);
    setAd(SPONSOR_ADS[randomIndex]);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  const handleActionClick = () => {
    setHasInteracted(true);
    // Open sponsor link in new window (mocked link)
    window.open("https://unihub.edu.vn/mock-sponsor-redirect", "_blank");
  };

  return (
    <div className="modal-overlay ad-gate-overlay">
      <div className="modal-content ad-gate-content glass-panel animate-scale-up">
        {/* Cancel button */}
        <button className="modal-close-btn" onClick={onClose} aria-label="Cancel">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>

        <div className="ad-gate-inner">
          <div className="ad-gate-header">
            <span className="ad-gate-unlock-icon">🔓</span>
            <div className="ad-gate-title-meta">
              <h3>Đang mở khóa thông tin...</h3>
              <p>Mở khóa miễn phí nhờ sự tài trợ của đối tác UniHub</p>
            </div>
          </div>

          {/* Ad Canvas Display */}
          <div 
            className="sponsor-ad-card" 
            style={{ 
              background: ad.bgGradient,
              borderLeft: `5px solid ${ad.accentColor}`
            }}
          >
            <div className="ad-card-badge">{ad.badge}</div>
            
            <div className="ad-card-body">
              <span className="sponsor-name" style={{ color: ad.accentColor }}>{ad.sponsorName}</span>
              <h4 className="ad-title">{ad.title}</h4>
              <p className="ad-desc">{ad.description}</p>
            </div>

            <div className="ad-card-footer">
              <button 
                className="btn btn-sm sponsor-action-btn"
                style={{ 
                  background: ad.accentColor, 
                  color: 'white',
                  boxShadow: `0 4px 10px rgba(0,0,0,0.3)`
                }}
                onClick={handleActionClick}
              >
                {ad.actionText} ↗
              </button>
              {hasInteracted && <span className="interaction-success">Cảm ơn bạn đã quan tâm!</span>}
            </div>
          </div>

          {/* Progress and Countdown Controls */}
          <div className="ad-gate-controls">
            <div className="countdown-section">
              {timeLeft > 0 ? (
                <div className="timer-wrapper">
                  <div className="timer-spinner"></div>
                  <span className="timer-text">Chi tiết sẽ mở khóa sau <strong>{timeLeft}s</strong></span>
                </div>
              ) : (
                <span className="timer-completed-text">✓ Đã sẵn sàng mở khóa</span>
              )}
            </div>

            <button 
              className={`btn btn-lg w-full ${timeLeft > 0 ? 'btn-secondary ad-btn-locked' : 'btn-primary ad-btn-unlocked animate-pulse'}`}
              disabled={timeLeft > 0}
              onClick={onUnlock}
            >
              {timeLeft > 0 ? (
                `Bỏ qua quảng cáo (${timeLeft}s)`
              ) : (
                <>
                  Bỏ qua quảng cáo & Xem ngay
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
