import React from 'react';
import { useTranslation } from '../../../hooks/useTranslation';

type GateSearchParams = {
  status: string;
  statuses: string; // Hỗ trợ lọc nhiều trạng thái
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
  lockedType?: string; // Nếu truyền, khóa filter loại và dùng giá trị này
  hideTypeFilter?: boolean; // Ẩn dropdown loại
  simpleStatusFilter?: boolean; // Bật lọc trạng thái đơn giản cho trang LowerContainer/Gate
}

export default function GateSearchBar({
  searchParams,
  onSearch,
  onContainerSearch,
  onLicensePlateChange,
  lockedType,
  hideTypeFilter,
  simpleStatusFilter
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
            {simpleStatusFilter ? (
              <select
                className="filter-select"
                aria-label="Trạng thái"
                value={searchParams.status || (searchParams.statuses ? (searchParams.statuses.includes('PENDING,NEW_REQUEST') ? 'PENDING_GROUP' : 'ENTERED_GATE') : '')}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    onSearch({ status: '', statuses: '', page: 1 });
                  } else if (val === 'PENDING_GROUP') {
                    // PENDING = Đang tới
                    onSearch({ status: '', statuses: 'PENDING,NEW_REQUEST', page: 1 });
                  } else if (val === 'ENTERED_GATE') {
                    // Các trạng thái khác = Đã vào cổng (không bao gồm GATE_OUT)
                    onSearch({ status: '', statuses: 'FORWARDED,GATE_IN,IN_YARD,IN_CAR,FORKLIFTING,COMPLETED', page: 1 });
                  }
                }}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="PENDING_GROUP">Đang tới</option>
                <option value="ENTERED_GATE">Đã vào cổng</option>
              </select>
            ) : (
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
            )}
          </div>

          {/* Type Filter */}
          {!hideTypeFilter && (
            <div className="filter-group">
              <select
                className="filter-select"
                aria-label={t('pages.gate.typeLabel')}
                value={lockedType ?? searchParams.type}
                disabled={!!lockedType}
                onChange={(e) => !lockedType && onSearch({ type: e.target.value, page: 1 })}
              >
                <option value="">{t('pages.gate.allTypes')}</option>
                <option value="IMPORT">{t('pages.gate.typeImport')}</option>
                <option value="EXPORT">{t('pages.gate.typeExport')}</option>
              </select>
            </div>
          )}


        </div>
      </form>
    </div>
  );
}
