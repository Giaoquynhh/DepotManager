import Header from '@components/Header';
import Card from '@components/Card';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from '@hooks/useTranslation';
import { api } from '@services/api';
import { useToast } from '@hooks/useToastHook';

interface RepairTicket {
  id: string;
  code: string;
  container_no?: string;
  problem_description: string;
  estimated_cost?: number;
  labor_cost?: number;
  manager_comment?: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
  endTime?: string;
  serviceRequest?: {
    id: string;
    request_no?: string;
    container_no: string;
    license_plate?: string;
    driver_name?: string;
    driver_phone?: string;
    container_type?: {
      code: string;
    };
    attachments: any[];
  };
  imagesCount?: number;
}

export default function RepairsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { showSuccess, showError, ToastContainer } = useToast();
  const [repairs, setRepairs] = useState<RepairTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [repairImagesModal, setRepairImagesModal] = useState<{ open: boolean; ticket?: RepairTicket; images?: any[] }>({ open: false });
  const [requestDocsModal, setRequestDocsModal] = useState<{ open: boolean; ticket?: RepairTicket }>({ open: false });
  const [uploadModal, setUploadModal] = useState<{ open: boolean; ticket?: RepairTicket; files: File[]; previews: string[] }>({ open: false, files: [], previews: [] });
  const [acceptModal, setAcceptModal] = useState<{ open: boolean; ticket?: RepairTicket; status: 'GOOD' | 'NEED_REPAIR'; files: File[]; previews: string[] }>({ open: false, status: 'GOOD', files: [], previews: [] });
  const [servicesLoading, setServicesLoading] = useState(false);
  const [repairServices, setRepairServices] = useState<Array<{ id: string; serviceCode: string; serviceName: string; type: string; price: number }>>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [serviceQuantities, setServiceQuantities] = useState<Record<string, number>>({});

  const fetchRepairs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      
      const response = await api.get(`/maintenance/repairs?${params.toString()}`);
      setRepairs(response.data.data || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error: any) {
      console.error('Error fetching repairs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepairs();
  }, [page]);

  // Refetch data when route changes (to handle navigation from other pages)
  useEffect(() => {
    if (router.isReady) {
      fetchRepairs();
    }
  }, [router.pathname, router.isReady]);

  const fetchRepairServices = async () => {
    try {
      setServicesLoading(true);
      // Lấy nhiều mục để tránh phải phân trang khi chọn dịch vụ
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '1000');
      const res = await api.get(`/api/setup/price-lists?${params.toString()}`);
      const all: any[] = res?.data?.data?.data || res?.data?.data || [];
      const filtered = all.filter((x: any) => (x.type || '').toLowerCase() === 'tồn kho' || (x.type || '').toLowerCase() === 'ton kho');
      setRepairServices(filtered.map((x: any) => ({ id: x.id, serviceCode: x.serviceCode, serviceName: x.serviceName, type: x.type, price: x.price })));
    } catch (e) {https://github.com/Giaoquynhh/DepotManager.git
      console.error('Error loading repair services:', e);
      setRepairServices([]);
    } finally {
      setServicesLoading(false);
    }
  };

  const getContainerStatusLabel = (_serviceRequest: any, ticketStatus?: string) => {
    if (!ticketStatus) return 'Không xác định';
    const map: Record<string, string> = {
      'COMPLETE': 'Container tốt',
      'COMPLETE_NEEDREPAIR': 'Container xấu có thể sửa chữa',
      'COMPLETE_NEED_REPAIR': 'Container xấu có thể sửa chữa',
      'PENDING': 'Chưa kiểm tra',
      'REJECT': 'Container xấu không thể sửa chữa',
      'REJECTED': 'Container xấu không thể sửa chữa'
    };
    return map[ticketStatus] || 'Không xác định';
  };

  const getTicketStatusLabel = (status?: string) => {
    if (!status) return 'Không xác định';
    const map: Record<string, string> = {
      PENDING: 'Chờ xử lý',
      REJECT: 'Từ chối',
      REJECTED: 'Từ chối',
      COMPLETE: 'Chấp nhận',
      COMPLETE_NEEDREPAIR: 'Chấp nhận - cần sửa',
      COMPLETE_NEED_REPAIR: 'Chấp nhận - cần sửa'
    };
    return map[status] || status;
  };

  const openRepairImages = async (ticket: RepairTicket) => {
    try {
      const res = await api.get(`/maintenance/repairs/${ticket.id}/images`);
      setRepairImagesModal({ open: true, ticket, images: res.data.data || [] });
    } catch (e) {
      console.error(e);
      setRepairImagesModal({ open: true, ticket, images: [] });
    }
  };

  const deleteRepairImage = async (imageId: string) => {
    try {
      await api.delete(`/maintenance/repairs/images/${imageId}`);
      showSuccess('Xóa ảnh kiểm tra thành công!');
      if (repairImagesModal.ticket) {
        await openRepairImages(repairImagesModal.ticket);
        fetchRepairs();
      }
    } catch (e) {
      console.error(e);
      showError('Có lỗi xảy ra khi xóa ảnh kiểm tra');
    }
  };

  const openRequestDocs = (ticket: RepairTicket) => {
    setRequestDocsModal({ open: true, ticket });
  };

  const openUpload = (ticket: RepairTicket) => {
    setUploadModal({ open: true, ticket, files: [], previews: [] });
  };

  const onUploadFilesChosen = (filesList: FileList | null) => {
    if (!filesList) return;
    const files = Array.from(filesList);
    const previews = files.map(f => URL.createObjectURL(f));
    setUploadModal(prev => ({ ...prev, files, previews }));
  };

  const submitUpload = async () => {
    if (!uploadModal.ticket || uploadModal.files.length === 0) return;
    const form = new FormData();
    uploadModal.files.forEach(f => form.append('files', f));
    try {
      await api.post(`/maintenance/repairs/${uploadModal.ticket.id}/images`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      showSuccess('Tải ảnh kiểm tra thành công!');
      setUploadModal({ open: false, files: [], previews: [] });
      fetchRepairs();
    } catch (e) {
      console.error('Upload repair images error:', e);
      showError('Có lỗi xảy ra khi tải ảnh kiểm tra');
    }
  };

  const openAcceptModal = (ticket: RepairTicket) => {
    setAcceptModal({ open: true, ticket, status: 'GOOD', files: [], previews: [] });
    setSelectedServiceIds([]);
    setServiceQuantities({});
    fetchRepairServices();
  };

  const toggleService = (id: string) => {
    setSelectedServiceIds(prev => {
      if (prev.includes(id)) {
        const next = prev.filter(x => x !== id);
        const { [id]: _removed, ...rest } = serviceQuantities;
        setServiceQuantities(rest);
        return next;
      }
      setServiceQuantities(q => ({ ...q, [id]: q[id] ?? 1 }));
      return [...prev, id];
    });
  };

  const selectedServices = repairServices.filter(s => selectedServiceIds.includes(s.id));
  const totalSelectedCost = selectedServices.reduce((sum, s) => {
    const qty = serviceQuantities[s.id] ?? 1;
    return sum + (Number(s.price) || 0) * qty;
  }, 0);

  const updateQuantity = (serviceId: string, qtyRaw: string) => {
    const num = Number(qtyRaw);
    const isNatural = Number.isInteger(num) && num >= 0;
    const qty = isNatural ? Math.min(999999, num) : 0;
    setServiceQuantities(prev => ({ ...prev, [serviceId]: qty }));
    if (!selectedServiceIds.includes(serviceId)) setSelectedServiceIds(prev => [...prev, serviceId]);
  };

  const onAcceptFilesChosen = (filesList: FileList | null) => {
    if (!filesList) return;
    const files = Array.from(filesList);
    const previews = files.map(f => URL.createObjectURL(f));
    setAcceptModal(prev => ({ ...prev, files, previews }));
  };

  const submitAccept = async () => {
    if (!acceptModal.ticket) return;
    try {
      // Map trạng thái container từ dropdown sang canRepair flag
      const canRepair = acceptModal.status === 'NEED_REPAIR';
      const payload: any = { decision: 'ACCEPT', canRepair };
      
      // Nếu cần sửa chữa, thêm thông tin dịch vụ sửa chữa
      if (canRepair) {
        payload.repairServices = selectedServices.map(s => {
          const quantity = serviceQuantities[s.id] ?? 1;
          const lineTotal = (Number(s.price) || 0) * quantity;
          return { id: s.id, serviceCode: s.serviceCode, serviceName: s.serviceName, price: s.price, quantity, lineTotal };
        });
        payload.totalCost = totalSelectedCost;
      }
      
      // Gọi API để cập nhật trạng thái repairTicket
      await api.post(`/maintenance/repairs/${acceptModal.ticket.id}/decide`, payload);

      // Upload ảnh nếu có
      if (acceptModal.files.length > 0) {
        const form = new FormData();
        acceptModal.files.forEach(f => form.append('files', f));
        await api.post(`/maintenance/repairs/${acceptModal.ticket.id}/images`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      }

      // Đóng modal và refresh danh sách
      setAcceptModal({ open: false, status: 'GOOD', files: [], previews: [] });
      showSuccess('Chấp nhận phiếu sửa chữa thành công!');
      fetchRepairs();
    } catch (e) {
      console.error('Accept container error:', e);
      showError('Có lỗi xảy ra khi chấp nhận phiếu sửa chữa');
    }
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


        <Card>
          <div style={{ overflow: 'auto' }}>
            <table className="table" style={{ width: '100%', minWidth: '1800px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', minWidth: '150px', whiteSpace: 'nowrap' }}>Số yêu cầu</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', minWidth: '120px', whiteSpace: 'nowrap' }}>Số cont</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', minWidth: '100px', whiteSpace: 'nowrap' }}>Loại cont</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', minWidth: '120px', whiteSpace: 'nowrap' }}>Số xe</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', minWidth: '100px', whiteSpace: 'nowrap' }}>Tài xế</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', minWidth: '120px', whiteSpace: 'nowrap' }}>SDT tài xế</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', minWidth: '180px', whiteSpace: 'nowrap' }}>Trạng thái phiếu</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', minWidth: '200px', whiteSpace: 'nowrap' }}>Trạng thái cont</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', minWidth: '160px', whiteSpace: 'nowrap' }}>Thời gian bắt đầu</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', minWidth: '160px', whiteSpace: 'nowrap' }}>Thời gian kết thúc</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', minWidth: '300px', whiteSpace: 'nowrap' }}>Hình ảnh</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', minWidth: '200px', whiteSpace: 'nowrap' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={12} style={{
                      padding: '40px 8px',
                      textAlign: 'center',
                      color: '#6b7280',
                      fontSize: '14px'
                    }}>
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : repairs.length === 0 ? (
                  <tr>
                    <td colSpan={12} style={{
                      padding: '40px 8px',
                      textAlign: 'center',
                      color: '#6b7280',
                      fontSize: '14px'
                    }}>
                      Không có phiếu sửa chữa nào để hiển thị
                    </td>
                  </tr>
                ) : (
                  repairs.map((repair) => (
                    <tr key={repair.id}>
                      <td style={{ padding: '12px 16px', minWidth: '150px', whiteSpace: 'nowrap' }}>
                        {repair.serviceRequest?.request_no || repair.code}
                      </td>
                      <td style={{ padding: '12px 16px', minWidth: '120px', whiteSpace: 'nowrap' }}>
                        {repair.container_no || repair.serviceRequest?.container_no || '-'}
                      </td>
                      <td style={{ padding: '12px 16px', minWidth: '100px', whiteSpace: 'nowrap' }}>
                        {repair.serviceRequest?.container_type?.code || '-'}
                      </td>
                      <td style={{ padding: '12px 16px', minWidth: '120px', whiteSpace: 'nowrap' }}>
                        {repair.serviceRequest?.license_plate || '-'}
                      </td>
                      <td style={{ padding: '12px 16px', minWidth: '100px', whiteSpace: 'nowrap' }}>
                        {repair.serviceRequest?.driver_name || '-'}
                      </td>
                      <td style={{ padding: '12px 16px', minWidth: '120px', whiteSpace: 'nowrap' }}>
                        {repair.serviceRequest?.driver_phone || '-'}
                      </td>
                      <td style={{ padding: '12px 16px', minWidth: '180px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: '#e0e7ff',
                          color: '#2563eb'
                        }}>
                          {getTicketStatusLabel(repair.status)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', minWidth: '200px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: '#f3f4f6',
                          color: '#374151'
                        }}>
                          {getContainerStatusLabel(repair.serviceRequest, repair.status)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', minWidth: '160px', whiteSpace: 'nowrap' }}>
                        {repair.status === 'PENDING' ? 'Chưa có' : new Date(repair.updatedAt).toLocaleString('vi-VN')}
                      </td>
                      <td style={{ padding: '12px 16px', minWidth: '160px', whiteSpace: 'nowrap' }}>
                        {repair.endTime ? new Date(repair.endTime).toLocaleString('vi-VN') : 'Chưa có'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', minWidth: '300px' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                          {/* Ảnh của RepairTicket */}
                          <button onClick={() => openRepairImages(repair)} style={{ padding: '4px 8px', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '4px', fontSize: '12px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            {(repair.imagesCount ?? 0)} ảnh kiểm tra
                          </button>
                          {/* Ảnh chứng từ của Request */}
                          <button onClick={() => openRequestDocs(repair)} style={{ padding: '4px 8px', backgroundColor: '#e0e7ff', color: '#2563eb', borderRadius: '4px', fontSize: '12px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            {(repair.serviceRequest?.attachments?.length || 0)} ảnh chứng từ
                          </button>
                          {/* Nút upload ảnh RepairTicket */}
                          {!(repair.status === 'COMPLETE' || repair.status === 'COMPLETE_NEEDREPAIR' || repair.status === 'COMPLETE_NEED_REPAIR' || repair.status === 'REJECT' || repair.status === 'REJECTED') && (
                            <button onClick={() => openUpload(repair)} style={{ padding: '4px 8px', backgroundColor: '#10b981', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', border: 'none', whiteSpace: 'nowrap' }}>
                              Tải ảnh
                            </button>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', minWidth: '200px' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          {(repair.status === 'REJECT' || repair.status === 'REJECTED' || repair.status === 'COMPLETE' || repair.status === 'COMPLETE_NEEDREPAIR' || repair.status === 'COMPLETE_NEED_REPAIR') ? (
                            <button
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#6b7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                whiteSpace: 'nowrap'
                              }}
                              onClick={async () => {
                                if (!window.confirm('Bạn có chắc muốn xóa phiếu sửa chữa này?')) return;
                                try {
                                  await api.delete(`/maintenance/repairs/${repair.id}`);
                                  showSuccess('Xóa phiếu sửa chữa thành công!');
                                  fetchRepairs();
                                } catch (e) { 
                                  console.error(e);
                                  showError('Có lỗi xảy ra khi xóa phiếu sửa chữa');
                                }
                              }}
                            >Xóa</button>
                          ) : (
                            <>
                              <button
                                style={{
                                  padding: '4px 8px',
                                  backgroundColor: '#dc2626',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  whiteSpace: 'nowrap'
                                }}
                                onClick={async () => {
                                  try {
                                    await api.post(`/maintenance/repairs/${repair.id}/decide`, { decision: 'REJECT' });
                                    showSuccess('Từ chối phiếu sửa chữa thành công!');
                                    fetchRepairs();
                                  } catch (e) { 
                                    console.error(e);
                                    showError('Có lỗi xảy ra khi từ chối phiếu sửa chữa');
                                  }
                                }}>Từ chối</button>
                              <button
                                style={{
                                  padding: '4px 8px',
                                  backgroundColor: '#16a34a',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  whiteSpace: 'nowrap'
                                }}
                                onClick={() => openAcceptModal(repair)}>Chấp nhận</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                    </tbody>
                  </table>
                </div>

          {/* Pagination */}
          {totalPages > 1 && (
              <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
                marginTop: '20px',
              padding: '20px'
              }}>
                <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '8px 16px',
                  backgroundColor: page === 1 ? '#f3f4f6' : '#3b82f6',
                  color: page === 1 ? '#9ca3af' : 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: page === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Trước
              </button>
              <span style={{ padding: '0 16px' }}>
                Trang {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                  style={{
                    padding: '8px 16px',
                  backgroundColor: page === totalPages ? '#f3f4f6' : '#3b82f6',
                  color: page === totalPages ? '#9ca3af' : 'white',
                    border: 'none',
                    borderRadius: '4px',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                Sau
                </button>
          </div>
        )}
        </Card>


      </main>
      {/* Modal: Repair images list */}
      {repairImagesModal.open && repairImagesModal.ticket && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: 20, borderRadius: 8, width: '800px', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3>Ảnh kiểm tra - {repairImagesModal.ticket.code}</h3>
              <button onClick={() => setRepairImagesModal({ open: false })} style={{ border: 'none', background: 'transparent', fontSize: 18, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {(repairImagesModal.images || []).map((img: any) => (
                <div key={img.id} style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 8 }}>
                  <img src={img.storage_url} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 4 }} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'space-between' }}>
                    <a href={img.storage_url} target="_blank" rel="noreferrer" style={{ padding: '4px 8px', background: '#3b82f6', color: 'white', borderRadius: 4, textDecoration: 'none', fontSize: 12 }}>Xem</a>
                    <button onClick={() => deleteRepairImage(img.id)} style={{ padding: '4px 8px', background: '#ef4444', color: 'white', borderRadius: 4, border: 'none', fontSize: 12, cursor: 'pointer' }}>Xóa</button>
                  </div>
                </div>
              ))}
              {(repairImagesModal.images || []).length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#6b7280' }}>Chưa có ảnh</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Request documents */}
      {requestDocsModal.open && requestDocsModal.ticket && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: 20, borderRadius: 8, width: '700px', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3>Chứng từ - {requestDocsModal.ticket.serviceRequest?.request_no || requestDocsModal.ticket.code}</h3>
              <button onClick={() => setRequestDocsModal({ open: false })} style={{ border: 'none', background: 'transparent', fontSize: 18, cursor: 'pointer' }}>×</button>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {(requestDocsModal.ticket.serviceRequest?.attachments || []).map((doc: any) => (
                <li key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', padding: '8px 0' }}>
                  <span style={{ fontSize: 14 }}>{doc.file_name} <span style={{ color: '#9ca3af' }}>({Math.round((doc.file_size || 0)/1024)} KB)</span></span>
                  <a href={doc.storage_url} target="_blank" rel="noreferrer" style={{ padding: '4px 8px', background: '#3b82f6', color: 'white', borderRadius: 4, textDecoration: 'none', fontSize: 12 }}>Xem</a>
                </li>
              ))}
              {(requestDocsModal.ticket.serviceRequest?.attachments || []).length === 0 && (
                <li style={{ textAlign: 'center', color: '#6b7280', padding: 12 }}>Không có chứng từ</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Modal: Upload images for RepairTicket */}
      {uploadModal.open && uploadModal.ticket && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: 20, borderRadius: 8, width: '720px', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3>Tải ảnh kiểm tra - {uploadModal.ticket.code}</h3>
              <button onClick={() => setUploadModal({ open: false, files: [], previews: [] })} style={{ border: 'none', background: 'transparent', fontSize: 18, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ marginBottom: 12 }}>
              <input type="file" accept="image/*" multiple onChange={(e) => onUploadFilesChosen(e.target.files)} />
            </div>
            {uploadModal.previews.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 12 }}>
                {uploadModal.previews.map((src, idx) => (
                  <img key={idx} src={src} style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 4 }} />
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setUploadModal({ open: false, files: [], previews: [] })} style={{ padding: '6px 12px', background: '#e5e7eb', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Hủy</button>
              <button onClick={submitUpload} style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Tải lên</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Accept container */}
      {acceptModal.open && acceptModal.ticket && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: 20, borderRadius: 8, width: '760px', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3>Chấp nhận container</h3>
              <button onClick={() => setAcceptModal({ open: false, status: 'GOOD', files: [], previews: [] })} style={{ border: 'none', background: 'transparent', fontSize: 18, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Số container</label>
                <div style={{ padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6 }}>
                  {acceptModal.ticket.serviceRequest?.container_no || acceptModal.ticket.container_no || '-'}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Loại container</label>
                <div style={{ padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6 }}>
                  {acceptModal.ticket.serviceRequest?.container_type?.code || '-'}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Trạng thái cont</label>
                <select
                  value={acceptModal.status}
                  onChange={(e) => setAcceptModal(prev => ({ ...prev, status: (e.target.value as 'GOOD' | 'NEED_REPAIR') }))}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6 }}
                >
                  <option value="GOOD">Container tốt</option>
                  <option value="NEED_REPAIR">Cần sửa chữa</option>
                </select>
              </div>
              <div></div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Hình ảnh</label>
              <input type="file" accept="image/*" multiple onChange={(e) => onAcceptFilesChosen(e.target.files)} />
            </div>
            {acceptModal.status === 'NEED_REPAIR' && (
              <div style={{ marginTop: 12 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 8 }}>Dịch vụ sửa chữa (Loại hình: Tồn kho)</label>
                {servicesLoading ? (
                  <div style={{ color: '#6b7280', fontSize: 13 }}>Đang tải dịch vụ...</div>
                ) : (
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 10, maxHeight: 220, overflow: 'auto' }}>
                    {repairServices.length === 0 ? (
                      <div style={{ color: '#6b7280', fontSize: 13 }}>Không có dịch vụ phù hợp</div>
                    ) : (
                      repairServices.map(s => (
                        <div key={s.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', alignItems: 'center', gap: 8, padding: '6px 8px', borderBottom: '1px solid #f3f4f6' }}>
                          <input type="checkbox" checked={selectedServiceIds.includes(s.id)} onChange={() => toggleService(s.id)} />
                          <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {s.serviceCode} - {s.serviceName}
                          </div>
                          <div>
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={serviceQuantities[s.id] ?? 1}
                              onChange={(e) => updateQuantity(s.id, e.target.value)}
                              style={{ width: 70, padding: '4px 6px', border: '1px solid #e5e7eb', borderRadius: 4 }}
                            />
                          </div>
                          <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 600, textAlign: 'right' }}>
                            {(((Number(s.price) || 0) * (serviceQuantities[s.id] ?? 1))).toLocaleString('vi-VN')} VND
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <div style={{ fontSize: 14 }}>
                    Tổng chi phí: <span style={{ color: '#16a34a', fontWeight: 700 }}>{totalSelectedCost.toLocaleString('vi-VN')} VND</span>
                  </div>
                </div>
              </div>
            )}
            {acceptModal.previews.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginTop: 12 }}>
                {acceptModal.previews.map((src, idx) => (
                  <img key={idx} src={src} style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 4 }} />
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button onClick={() => setAcceptModal({ open: false, status: 'GOOD', files: [], previews: [] })} style={{ padding: '6px 12px', background: '#e5e7eb', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Hủy</button>
              <button onClick={submitAccept} style={{ padding: '6px 12px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer />
    </>
  );
}


