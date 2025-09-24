import Header from '@components/Header';
import Card from '@components/Card';
import { useState, useEffect } from 'react';
import { useTranslation } from '@hooks/useTranslation';

export default function RepairsPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<string>('');
  const [isPendingContainersModalOpen, setIsPendingContainersModalOpen] = useState(false);
  const [pendingContainers, setPendingContainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState<any>(null);
  const [inspectionStatus, setInspectionStatus] = useState<string>('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Fetch danh sách container chờ kiểm tra
  const fetchPendingContainers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      const response = await fetch('/backend/gate/requests/search?status=GATE_IN&limit=100', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API Response structure:', data);
      
      // Lọc chỉ lấy container có loại IMPORT
      const importContainers = (data.data || []).filter((request: any) => {
        return request.type === 'IMPORT';
      });
      
      console.log('Filtered containers with all fields:', importContainers);
      setPendingContainers(importContainers);
    } catch (error) {
      console.error('Error fetching pending containers:', error);
      setPendingContainers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data khi component mount
  useEffect(() => {
    fetchPendingContainers();
  }, []);

  const handleOpenModal = () => {
    setIsPendingContainersModalOpen(true);
    fetchPendingContainers();
  };

  const handleStartInspection = (container: any) => {
    setSelectedContainer(container);
    setInspectionStatus('');
    setSelectedImages([]);
    setImagePreviews([]);
    setIsInspectionModalOpen(true);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newImages = [...selectedImages, ...files];
    setSelectedImages(newImages);

    // Tạo preview cho ảnh mới
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    // Revoke URL để tránh memory leak
    URL.revokeObjectURL(imagePreviews[index]);
    
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleSubmitInspection = async () => {
    if (!inspectionStatus) {
      alert('Vui lòng chọn trạng thái kiểm tra');
      return;
    }

    try {
      // TODO: Gửi dữ liệu kiểm tra lên server
      console.log('Inspection data:', {
        container: selectedContainer,
        status: inspectionStatus,
        images: selectedImages
      });

      alert('Đã lưu kết quả kiểm tra thành công');
      setIsInspectionModalOpen(false);
      setSelectedContainer(null);
      setInspectionStatus('');
      setSelectedImages([]);
      setImagePreviews([]);
    } catch (error) {
      console.error('Error submitting inspection:', error);
      alert('Có lỗi xảy ra khi lưu kết quả kiểm tra');
    }
  };

  const handleCloseInspectionModal = () => {
    // Cleanup image URLs
    imagePreviews.forEach(url => URL.revokeObjectURL(url));
    
    setIsInspectionModalOpen(false);
    setSelectedContainer(null);
    setInspectionStatus('');
    setSelectedImages([]);
    setImagePreviews([]);
  };

  return (
    <>
      <Header />
      <main className="container depot-requests">
        <div className="page-header modern-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title gradient gradient-ultimate">Danh sách phiếu kiểm tra</h1>
            </div>
            <div className="header-actions">
            </div>
          </div>
        </div>

        <div className="search-filter-section modern-search" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
          <div className="filter-group" style={{marginLeft: '0'}}>
            <label className="filter-label">Tất cả trạng thái</label>
            <select 
              value={filter} 
              onChange={e => setFilter(e.target.value)}
              className="filter-select"
              style={{marginLeft: '0'}}
            >
              <option value="">Tất cả trạng thái</option>
            </select>
          </div>
          <div style={{marginLeft: 'auto', position: 'relative'}}>
            <button 
              onClick={handleOpenModal}
              className="btn btn-outline pending-containers-btn"
              title="Danh sách container chờ kiểm tra"
              style={{
                padding: '8px 16px',
                border: '1px solid #1e40af',
                borderRadius: '4px',
                background: 'white',
                color: '#1e40af',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                position: 'relative'
              }}
            >
              📋 Danh sách container chờ kiểm tra
              
              {/* Badge hiển thị số container đang chờ */}
              {pendingContainers.length > 0 && (
                <span className="notification-badge" style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {pendingContainers.length > 99 ? '99+' : pendingContainers.length}
                </span>
              )}
              
              {/* Loading indicator */}
              {loading && (
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  ⟳
                </span>
              )}
            </button>
          </div>
        </div>

        <Card>
          <div style={{ overflow: 'auto' }}>
            <table className="table" style={{ width: '100%', minWidth: '1200px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Số yêu cầu</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Số cont</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Loại cont</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Số xe</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Tài xế</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>SDT tài xế</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Trạng thái</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Thời gian tạo</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Thời gian cập nhật</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>Hình ảnh</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={11} style={{
                    padding: '40px 8px',
                    textAlign: 'center',
                    color: '#6b7280',
                    fontSize: '14px'
                  }}>
                    Không có phiếu sửa chữa nào để hiển thị
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Modal hiển thị danh sách container chờ kiểm tra */}
        {isPendingContainersModalOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '20px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              width: '800px',
              overflow: 'auto'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '10px'
              }}>
                <h2 style={{ margin: 0, color: '#1f2937' }}>Danh sách container chờ kiểm tra</h2>
                <button
                  onClick={() => setIsPendingContainersModalOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  ×
                </button>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ fontSize: '18px', color: '#6b7280' }}>Đang tải dữ liệu...</div>
                </div>
              ) : pendingContainers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ fontSize: '16px', color: '#6b7280' }}>Không có container nào chờ kiểm tra</div>
                </div>
              ) : (
                <div style={{ overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f9fafb' }}>
                        <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Số yêu cầu</th>
                        <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Số container</th>
                        <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Loại container</th>
                        <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Số xe</th>
                        <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Tài xế</th>
                        <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>SDT tài xế</th>
                        <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Thời gian tạo</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingContainers.map((container, index) => {
                        // Lấy thông tin từ request để hiển thị đồng bộ
                        const requestId = container.request_no || container.request_id || container.id || '-';
                        const containerCode = container.container_no || '-';
                        const containerType = container.container_type?.code || container.container_type || '-';
                        const vehicleNumber = container.license_plate || container.vehicle_number || '-';
                        const driverName = container.driver_name || '-';
                        const driverPhone = container.driver_phone || '-';
                        const timeIn = container.time_in || container.created_at || '-';
                        
                        return (
                          <tr key={container.id || index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '12px 8px' }}>
                              {requestId}
                            </td>
                            <td style={{ padding: '12px 8px' }}>
                              {containerCode}
                            </td>
                            <td style={{ padding: '12px 8px' }}>
                              {containerType}
                            </td>
                            <td style={{ padding: '12px 8px' }}>
                              {vehicleNumber}
                            </td>
                            <td style={{ padding: '12px 8px' }}>
                              {driverName}
                            </td>
                            <td style={{ padding: '12px 8px' }}>
                              {driverPhone}
                            </td>
                            <td style={{ padding: '12px 8px' }}>
                              {timeIn ? new Date(timeIn).toLocaleString('vi-VN') : '-'}
                            </td>
                            <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                              <button
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#3b82f6',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                                onClick={() => handleStartInspection(container)}
                              >
                                Bắt đầu kiểm tra
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{
                marginTop: '20px',
                paddingTop: '20px',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px'
              }}>
                <button
                  onClick={() => setIsPendingContainersModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal kiểm tra container */}
        {isInspectionModalOpen && selectedContainer && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '20px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              width: '600px',
              overflow: 'auto'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '10px'
              }}>
                <h2 style={{ margin: 0, color: '#1f2937' }}>Kiểm tra container</h2>
                <button
                  onClick={handleCloseInspectionModal}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Số container:
                  </label>
                  <div style={{ 
                    padding: '8px 12px', 
                    backgroundColor: '#f9fafb', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '4px' 
                  }}>
                    {selectedContainer.container_no || '-'}
                  </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Loại container:
                  </label>
                  <div style={{ 
                    padding: '8px 12px', 
                    backgroundColor: '#f9fafb', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '4px' 
                  }}>
                    {selectedContainer.container_type?.code || selectedContainer.container_type || '-'}
                  </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Trạng thái: <span style={{ color: 'red' }}>*</span>
                  </label>
                  <select
                    value={inspectionStatus}
                    onChange={(e) => setInspectionStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Chọn trạng thái kiểm tra</option>
                    <option value="good">Container tốt</option>
                    <option value="repairable">Container xấu có thể sửa chữa</option>
                    <option value="unrepairable">Container xấu không thể sửa chữa</option>
                    <option value="checked">Đã kiểm tra</option>
                    <option value="repairing">Đang sửa chữa</option>
                  </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Hình ảnh:
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                  
                  {/* Preview ảnh */}
                  {imagePreviews.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {imagePreviews.map((preview, index) => (
                          <div key={index} style={{ position: 'relative' }}>
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              style={{
                                width: '100px',
                                height: '100px',
                                objectFit: 'cover',
                                borderRadius: '4px',
                                border: '1px solid #e5e7eb'
                              }}
                            />
                            <button
                              onClick={() => removeImage(index)}
                              style={{
                                position: 'absolute',
                                top: '-5px',
                                right: '-5px',
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                paddingTop: '20px',
                borderTop: '1px solid #e5e7eb'
              }}>
                <button
                  onClick={handleCloseInspectionModal}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmitInspection}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Lưu kết quả
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}


