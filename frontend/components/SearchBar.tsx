import { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onFilterChange?: (filter: string) => void;
  onStatusFilterChange?: (status: string) => void;
  placeholder?: string;
  filters?: Array<{ value: string; label: string }>;
  statusFilters?: Array<{ value: string; label: string }>;
  className?: string;
  showClearButton?: boolean;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export default function SearchBar({ 
  onSearch, 
  onFilterChange, 
  onStatusFilterChange,
  placeholder = "Tìm kiếm container...",
  filters = [
    { value: "all", label: "Tất cả loại" },
    { value: "IMPORT", label: "Nhập" },
    { value: "EXPORT", label: "Xuất" },
    { value: "CONVERT", label: "Chuyển đổi" }
  ],
  statusFilters = [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "PENDING", label: "Chờ xử lý" },
    { value: "RECEIVED", label: "Đã nhận" },
    { value: "COMPLETED", label: "Hoàn thành" },
    { value: "EXPORTED", label: "Đã xuất" },
    { value: "REJECTED", label: "Từ chối" },
    { value: "PENDING_ACCEPT", label: "Chờ chấp nhận" },
    { value: "CHECKING", label: "Đang kiểm tra" },
    { value: "CHECKED", label: "Đã kiểm tra" }
  ],
  className = '',
  showClearButton = true,
  size = 'md',
  loading = false
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFilter = e.target.value;
    setFilter(newFilter);
    onFilterChange?.(newFilter);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatusFilter = e.target.value;
    setStatusFilter(newStatusFilter);
    onStatusFilterChange?.(newStatusFilter);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    onSearch('');
  };

  const sizeClasses = {
    sm: 'search-bar-sm',
    md: 'search-bar-md', 
    lg: 'search-bar-lg'
  };

  const searchBarClasses = [
    'search-bar',
    sizeClasses[size],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={searchBarClasses}>
      <div className="search-input-group">
        <span className="search-icon" aria-hidden="true">
          {loading ? (
            <div className="search-loading-spinner"></div>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          )}
        </span>
        <input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleSearchChange}
          className="search-input"
          disabled={loading}
        />
        {showClearButton && searchQuery && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="search-clear-btn"
            aria-label="Xóa tìm kiếm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>
      
      <div className="filter-group">
        {onFilterChange && filters.length > 0 && (
          <select 
            value={filter} 
            onChange={handleFilterChange}
            className="filter-select"
            disabled={loading}
          >
            {filters.map(filterOption => (
              <option key={filterOption.value} value={filterOption.value}>
                {filterOption.label}
              </option>
            ))}
          </select>
        )}
        
        {onStatusFilterChange && statusFilters.length > 0 && (
          <select 
            value={statusFilter} 
            onChange={handleStatusFilterChange}
            className="filter-select"
            disabled={loading}
          >
            {statusFilters.map(filterOption => (
              <option key={filterOption.value} value={filterOption.value}>
                {filterOption.label}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}


