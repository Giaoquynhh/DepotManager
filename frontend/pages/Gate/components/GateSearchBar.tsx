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
              aria-label={t('pages.gate.searchByContainer')}
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
              aria-label={t('pages.gate.searchByLicensePlate')}
              value={searchParams.license_plate}
              onChange={(e) => onLicensePlateChange(e.target.value)}
            />
          </div>



          {/* Status Filter */}
          <div className="filter-group">
            <select
              className="filter-select"
              aria-label={t('pages.gate.statusLabel')}
              value={searchParams.status}
              onChange={(e) => onSearch({ status: e.target.value, page: 1 })}
            >
              <option value="">{t('pages.gate.allStatuses')}</option>
              <option value="FORWARDED">{t('pages.gate.statusForwarded')}</option>
              <option value="GATE_IN">{t('pages.gate.statusGateIn')}</option>
              <option value="IN_YARD">{t('pages.gate.statusInYard')}</option>
              <option value="IN_CAR">{t('pages.gate.statusInCar')}</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="filter-group">
            <select
              className="filter-select"
              aria-label={t('pages.gate.typeLabel')}
              value={searchParams.type}
              onChange={(e) => onSearch({ type: e.target.value, page: 1 })}
            >
              <option value="">{t('pages.gate.allTypes')}</option>
              <option value="IMPORT">{t('pages.gate.typeImport')}</option>
              <option value="EXPORT">{t('pages.gate.typeExport')}</option>
            </select>
          </div>


        </div>
      </form>
    </div>
  );
}
