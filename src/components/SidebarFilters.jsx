import React from 'react';

export default function SidebarFilters({ 
  currentCategory, 
  filters, 
  setFilters, 
  resetFilters 
}) {
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (currentCategory === 'internships') {
    return (
      <aside className="filters-sidebar glass-panel">
        <div className="filters-header">
          <h3 className="filters-title">Bộ lọc thực tập</h3>
          <button className="reset-btn" onClick={resetFilters}>Xóa lọc</button>
        </div>

        <div className="filter-group">
          <label className="filter-label">Ngành nghề</label>
          <select 
            className="glass-select filter-select"
            value={filters.internshipIndustry}
            onChange={(e) => handleFilterChange('internshipIndustry', e.target.value)}
          >
            <option value="All">Tất cả ngành nghề</option>
            <option value="Tech">Công nghệ (Tech)</option>
            <option value="Business">Kinh doanh (Business)</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Thời gian làm việc</label>
          <div className="filter-options">
            {[
              { label: 'Tất cả', value: 'All' },
              { label: 'Toàn thời gian (Full-time)', value: 'Full-time' },
              { label: 'Bán thời gian (Part-time)', value: 'Part-time' }
            ].map((opt) => (
              <label key={opt.value} className="checkbox-container">
                <input 
                  type="radio" 
                  name="internshipCommitment"
                  checked={filters.internshipCommitment === opt.value}
                  onChange={() => handleFilterChange('internshipCommitment', opt.value)}
                />
                <span className="checkbox-text">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label className="filter-label">Hình thức địa điểm</label>
          <div className="filter-options">
            {[
              { label: 'Tất cả', value: 'All' },
              { label: 'Trực tiếp (Hà Nội)', value: 'On-site' },
              { label: 'Từ xa (Remote)', value: 'Remote' },
              { label: 'Linh hoạt (Hybrid)', value: 'Hybrid' }
            ].map((opt) => (
              <label key={opt.value} className="checkbox-container">
                <input 
                  type="radio" 
                  name="internshipWorkplace"
                  checked={filters.internshipWorkplace === opt.value}
                  onChange={() => handleFilterChange('internshipWorkplace', opt.value)}
                />
                <span className="checkbox-text">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label className="filter-label">Trợ cấp tối thiểu</label>
          <select 
            className="glass-select filter-select"
            value={filters.internshipStipend}
            onChange={(e) => handleFilterChange('internshipStipend', e.target.value)}
          >
            <option value="All">Tất cả mức lương</option>
            <option value="5m">Trên 5.000.000 VND</option>
            <option value="8m">Trên 8.000.000 VND</option>
            <option value="10m">Trên 10.000.000 VND</option>
          </select>
        </div>
      </aside>
    );
  }

  if (currentCategory === 'competitions') {
    return (
      <aside className="filters-sidebar glass-panel">
        <div className="filters-header">
          <h3 className="filters-title">Bộ lọc cuộc thi</h3>
          <button className="reset-btn" onClick={resetFilters}>Xóa lọc</button>
        </div>

        <div className="filter-group">
          <label className="filter-label">Lĩnh vực cuộc thi</label>
          <select 
            className="glass-select filter-select"
            value={filters.competitionCategory}
            onChange={(e) => handleFilterChange('competitionCategory', e.target.value)}
          >
            <option value="All">Tất cả lĩnh vực</option>
            <option value="Tech">Công nghệ (Tech)</option>
            <option value="Business">Kinh doanh (Business)</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Đơn vị tổ chức</label>
          <div className="filter-options">
            {[
              { label: 'Tất cả', value: 'All' },
              { label: 'Câu lạc bộ (Club)', value: 'Club' },
              { label: 'Doanh nghiệp (Enterprise)', value: 'Enterprise' },
              { label: 'Đại học (University)', value: 'University' }
            ].map((opt) => (
              <label key={opt.value} className="checkbox-container">
                <input 
                  type="radio" 
                  name="competitionOrganizerType"
                  checked={filters.competitionOrganizerType === opt.value}
                  onChange={() => handleFilterChange('competitionOrganizerType', opt.value)}
                />
                <span className="checkbox-text">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      </aside>
    );
  }

  return null;
}
