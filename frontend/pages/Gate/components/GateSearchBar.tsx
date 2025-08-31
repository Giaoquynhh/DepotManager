import React from 'react';
import { useTranslation } from '../../../hooks/useTranslation';

type GateSearchParams = {
  status: string;
  container_no: string;
  type: string;
  license_plate: string; // Thêm trường biển số xe
  page: number;
  limit: number;
};

interface GateSearchBarProps {
  searchParams: GateSearchParams;
  onSearch: (params: Partial<GateSearchParams>) => void;
  onContainerSearch: (container_no: string) => void;
  onLicensePlateChange: (license_plate: string) => void; // Thêm handler
}

export default function GateSearchBar({
  searchParams,
  onSearch,
  onContainerSearch,
  onLicensePlateChange
}: GateSearchBarProps) {
  const { t } = useTranslation();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchParams);
  };

  const handleClearFilters = () => {
    onSearch({
      status: '',
      container_no: '',
      type: '',
      license_plate: '', // Thêm clear license_plate
      page: 1,
      limit: 20
    });
  };

  return (
    <div className="gate-search-section">
      <form onSubmit={handleSubmit}>
        <div className="search-row">
          {/* Container Search */}
          <div className="search-section">
            <input
              type="text"
              className="search-input"
              placeholder={t('pages.gate.searchByContainer')}
              value={searchParams.container_no}
              onChange={(e) => onContainerSearch(e.target.value)}
            />
          </div>

          {/* License Plate Search */}
          <div className="search-section">
            <input
              type="text"
              className="search-input"
              placeholder={t('pages.gate.searchByLicensePlate')}
              value={searchParams.license_plate}
              onChange={(e) => onLicensePlateChange(e.target.value)}
            />
          </div>

          

          {/* Clear Filters */}
          <button
            type="button"
            className="clear-filters-btn"
            onClick={handleClearFilters}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
            {t('pages.gate.clearFilters')}
          </button>
        </div>
      </form>
    </div>
  );
}
