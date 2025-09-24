import Header from '@components/Header';
import Card from '@components/Card';
import { useState } from 'react';
import { useTranslation } from '@hooks/useTranslation';

export default function InventoryPage(){
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [onlyLow, setOnlyLow] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <>
      <Header />
      <main className="container depot-requests">
        <div className="page-header modern-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title gradient gradient-ultimate">Quản lý tồn kho</h1>
            </div>
            <div className="header-actions">
            </div>
          </div>
        </div>

        <div className="search-filter-section modern-search">
          <div className="search-row">
            <div className="search-section">
              <div className="search-input-group">
                <span className="search-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
            <div className="filter-group">
              <button 
                className="btn btn-outline add-product-btn"
                onClick={() => setShowAddForm(!showAddForm)}
                title={showAddForm ? 'Hủy thêm sản phẩm' : 'Thêm sản phẩm mới'}
              >
                {showAddForm ? '❌ Hủy' : '➕ Thêm sản phẩm'}
              </button>
            </div>
            <div className="filter-group">
              <label className="filter-label">
                <input 
                  type="checkbox" 
                  checked={onlyLow} 
                  onChange={e => setOnlyLow(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                Chỉ hiển thị hàng sắp hết
              </label>
            </div>
          </div>
        </div>

        <Card>
          <table className="table">
            <thead>
              <tr>
                <th>Tên sản phẩm</th>
                <th>Đơn vị</th>
                <th>Tồn kho</th>
                <th>Điểm đặt hàng</th>
                <th>Đơn giá</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6} style={{
                  padding: '40px 8px',
                  textAlign: 'center',
                  color: '#6b7280',
                  fontSize: '14px'
                }}>
                  Không có sản phẩm nào để hiển thị
                </td>
              </tr>
            </tbody>
          </table>
        </Card>
      </main>
    </>
  );
}


