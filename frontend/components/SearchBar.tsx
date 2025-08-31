import { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

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
  placeholder,
  filters,
  statusFilters,
  className = '',
  showClearButton = true,
  size = 'md',
  loading = false
}: SearchBarProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // i18n defaults
  const defaultFilters = [
    { value: 'all', label: t('pages.requests.allTypes') },
    { value: 'IMPORT', label: t('pages.requests.filterOptions.import') },
    { value: 'EXPORT', label: t('pages.requests.filterOptions.export') },
    { value: 'CONVERT', label: t('pages.requests.filterOptions.convert') }
  ];
  const defaultStatusFilters = [
    { value: 'all', label: t('pages.requests.allStatuses') },
    { value: 'PENDING', label: t('pages.requests.filterOptions.pending') },
    { value: 'RECEIVED', label: t('pages.requests.filterOptions.received') },
    { value: 'COMPLETED', label: t('pages.requests.filterOptions.completed') },
    { value: 'EXPORTED', label: t('pages.requests.filterOptions.exported') },
    { value: 'REJECTED', label: t('pages.requests.filterOptions.rejected') },
    { value: 'PENDING_ACCEPT', label: t('pages.requests.filterOptions.pendingAccept') },
    { value: 'CHECKING', label: t('pages.requests.filterOptions.checking') },
    { value: 'CHECKED', label: t('pages.requests.filterOptions.checked') }
  ];

  const resolvedFilters = (filters && filters.length > 0) ? filters : defaultFilters;
  const resolvedStatusFilters = (onStatusFilterChange && statusFilters && statusFilters.length > 0) ? statusFilters : defaultStatusFilters;
  const resolvedPlaceholder = placeholder ?? t('pages.requests.searchPlaceholder');

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
          placeholder={resolvedPlaceholder}
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
            aria-label={t('common.reset')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>
      
      <div className="filter-group">
        {onFilterChange && resolvedFilters.length > 0 && (
          <select 
            value={filter} 
            onChange={handleFilterChange}
            className="filter-select"
            disabled={loading}
          >
            {resolvedFilters.map(filterOption => (
              <option key={filterOption.value} value={filterOption.value}>
                {filterOption.label}
              </option>
            ))}
          </select>
        )}
        
        {onStatusFilterChange && (
          <select 
            value={statusFilter} 
            onChange={handleStatusFilterChange}
            className="filter-select"
            disabled={loading}
          >
            {resolvedStatusFilters.map(filterOption => (
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


