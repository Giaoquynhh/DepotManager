import React from 'react';

interface ContainerSearchFormProps {
  containerNo: string;
  onContainerNoChange: (value: string) => void;
  gateLocationFilter: string;
  onGateLocationFilterChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

export const ContainerSearchForm: React.FC<ContainerSearchFormProps> = ({
  containerNo,
  onContainerNoChange,
  gateLocationFilter,
  onGateLocationFilterChange,
  onSubmit,
  loading
}) => {
  // Tắt validation 4 ký tự tối thiểu
  const isContainerNoValid = containerNo.trim().length > 0;
  const showError = false; // Tắt hiển thị lỗi validation 4 ký tự

  // Danh sách các vị trí cổng xe vào
  const gateLocations = [
    { value: '', label: 'Tất cả cổng' },
    { value: 'Gate 1', label: 'Gate 1' },
    { value: 'Gate 2', label: 'Gate 2' },
    { value: 'Gate 3', label: 'Gate 3' },
    { value: 'Gate 4', label: 'Gate 4' },
    { value: 'Gate 5', label: 'Gate 5' }
  ];

  return (
    <form onSubmit={onSubmit} className="container-form">
      <div className="form-group">
        <label htmlFor="containerNo" className="form-label">Container No <span className="required">*</span></label>
        <div className="search-input-group">
          <input
            type="text"
            id="containerNo"
            className={showError ? 'form-input error' : 'form-input'}
            value={containerNo}
            onChange={(e) => onContainerNoChange(e.target.value.toUpperCase())}
            placeholder="Ví dụ: ISO1234567890"
            required
          />
          <button
            type="submit"
            className="btn btn-primary search-btn"
            disabled={loading || !containerNo.trim() || showError}
          >
            {loading ? '🔍 Đang tìm...' : '🔍 Tìm kiếm'}
          </button>
        </div>
        {/* Tắt hiển thị lỗi validation 4 ký tự */}
        {/* {showError && (
          <p className="error-message">Container No phải có ít nhất 4 ký tự</p>
        )} */}
      </div>

      <div className="form-group">
        <label htmlFor="gateLocationFilter" className="form-label">Lọc theo vị trí cổng xe vào</label>
        <select
          id="gateLocationFilter"
          className="form-select"
          value={gateLocationFilter}
          onChange={(e) => onGateLocationFilterChange(e.target.value)}
        >
          {gateLocations.map((gate) => (
            <option key={gate.value} value={gate.value}>
              {gate.label}
            </option>
          ))}
        </select>
      </div>
    </form>
  );
};
