import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { api } from '@services/api';
import { useTranslation } from '../../../hooks/useTranslation';
import { useToast } from '../../../hooks/useToastHook';

interface GateActionButtonsProps {
  requestId: string;
  requestType: string;
  currentStatus: string;
  onActionSuccess: () => void;
  initialLicensePlate?: string;
  initialDriverName?: string;
  initialDriverPhone?: string;
  isPaid?: boolean; // Trạng thái thanh toán
  showSuccess?: (title: string, message?: string, duration?: number) => void;
  showError?: (title: string, message?: string, duration?: number) => void;
}

export default function GateActionButtons({ 
  requestId, 
  requestType, 
  currentStatus, 
  onActionSuccess,
  initialLicensePlate,
  initialDriverName,
  initialDriverPhone,
  isPaid = false, // Mặc định chưa thanh toán
  showSuccess: injectedShowSuccess,
  showError: injectedShowError
}: GateActionButtonsProps) {
  const { t } = useTranslation();
  const { showSuccess: hookSuccess, showError: hookError } = useToast();
  const showSuccess = injectedShowSuccess || hookSuccess;
  const showError = injectedShowError || hookError;
  const router = useRouter();
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [plateNo, setPlateNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  // Loại bỏ các state và effect cho thời gian vì sẽ tự động điền từ backend

  const statusLabel = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return t('pages.gate.statusOptions.scheduled');
      case 'FORWARDED':
        return t('pages.gate.statusOptions.forwarded');
      case 'NEW_REQUEST':
        return t('pages.gate.statusOptions.newRequest');
      case 'GATE_IN':
        return t('pages.gate.statusOptions.gateIn');
      case 'GATE_OUT':
        return t('pages.gate.statusOptions.gateOut');
      case 'GATE_REJECTED':
        return t('pages.gate.statusOptions.gateRejected');
      case 'COMPLETED':
        return t('pages.gate.statusOptions.completed');
      default:
        return status;
    }
  };

  const confirmApprove = async () => {
    try {
      const normalizedPlate = plateNo.trim().toUpperCase();
      const normalizedDriver = driverName.trim();
      
      // Validate biển số xe: 5-20 ký tự, chữ/số/gạch/space/dấu chấm
      const validPlate = /^[A-Z0-9\-\s\.]{5,20}$/.test(normalizedPlate);
      if (!validPlate) {
        showError(
          t('pages.gate.validation.invalidPlate'),
          'Biển số xe phải có 5-20 ký tự và chỉ chứa chữ, số, gạch ngang, khoảng trắng và dấu chấm'
        );
        return;
      }
      
      // Validate tên tài xế: 2-100 ký tự
      if (normalizedDriver.length < 2) {
        showError(
          t('pages.gate.validation.invalidDriver'),
          'Tên tài xế phải có ít nhất 2 ký tự'
        );
        return;
      }
      
      // Backend sẽ tự động điền thời gian khi chuyển trạng thái
      setIsLoading(true);
      await api.patch(`/gate/requests/${requestId}/approve`, { 
        license_plate: normalizedPlate,
        driver_name: normalizedDriver
      });
      
      // Hiển thị thông báo thành công
      const newStatus = requestType === 'EXPORT' ? 'GATE_OUT' : 'GATE_IN';
      const newStatusLabel = statusLabel(newStatus);
      
      showSuccess(
        `🎉 ${newStatusLabel} thành công!`,
        `📋 Container: ${requestId}\n👤 Tài xế: ${normalizedDriver}\n🚗 Biển số: ${normalizedPlate}\n⏰ Thời gian: Tự động điền khi chuyển trạng thái`,
        10000
      );
      
      setIsApproveModalOpen(false);
      setPlateNo('');
      setDriverName('');
      onActionSuccess();
      
      // Thông báo bổ sung sau 1 giây
      setTimeout(() => {
        showSuccess(
          '✅ Cập nhật thành công!',
          'Dữ liệu đã được cập nhật trong bảng điều khiển',
          3000
        );
        // Với yêu cầu Nâng (EXPORT), điều hướng sang trang quản lý xe nâng
        if (requestType === 'EXPORT') {
          router.push('/LiftContainer/Forklift');
        }
      }, 1000);
    } catch (error: any) {
      showError(
        t('pages.gate.messages.approveErrorPrefix'),
        error.response?.data?.message || error.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Mở modal Check-in và auto-fill từ dữ liệu có sẵn của yêu cầu
  const openCheckInModal = async () => {
    try {
      const res = await api.get(`/requests/${requestId}`);
      const data = res?.data?.data || {};
      setPlateNo((data.license_plate || '').toUpperCase());
      setDriverName(data.driver_name || '');
      setDriverPhone(data.driver_phone || '');
    } catch {}
    setIsCheckInModalOpen(true);
  };

  const handleApprove = () => {
    setIsApproveModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim() || rejectReason.length < 5) {
      showError(
        t('pages.gate.validation.rejectReasonMin'),
        'Lý do từ chối phải có ít nhất 5 ký tự'
      );
      return;
    }

    try {
      setIsLoading(true);
      await api.patch(`/gate/requests/${requestId}/reject`, {
        reason: rejectReason
      });
      
      showSuccess(
        '❌ Đã từ chối',
        t('pages.gate.messages.rejected'),
        5000
      );
      setIsRejectModalOpen(false);
      setRejectReason('');
      onActionSuccess();
    } catch (error: any) {
      showError(
        t('pages.gate.messages.rejectErrorPrefix'),
        error.response?.data?.message || error.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  

  const confirmCheckIn = async () => {
    try {
      const normalizedPlate = plateNo.trim().toUpperCase();
      const normalizedDriver = driverName.trim();
      const normalizedPhone = driverPhone.trim();

      // Nới lỏng validation để không chặn dữ liệu demo/ngắn
      if (!/^[A-Z0-9\-\s\.]{1,20}$/.test(normalizedPlate)) {
        showError('Biển số xe không hợp lệ', 'Biển số xe phải có 1-20 ký tự hợp lệ');
        return;
      }
      if (normalizedDriver.length < 1) {
        showError('Tên tài xế không hợp lệ', 'Tên tài xế không được để trống');
        return;
      }
      if (normalizedPhone && !/^[0-9+\-\s]{1,20}$/.test(normalizedPhone)) {
        showError('SĐT không hợp lệ', 'SĐT tài xế chỉ chứa số/khoảng trắng/+/- và tối đa 20 ký tự');
        return;
      }

      setIsLoading(true);

      // 1) Cập nhật thông tin tài xế lên request
      await api.patch(`/requests/${requestId}`, {
        license_plate: normalizedPlate,  // Backend giờ nhận field license_plate trực tiếp
        driver_name: normalizedDriver,
        driver_phone: normalizedPhone || undefined
      });

      // 2) Thực hiện check-in
      const res = await api.patch(`/gate/requests/${requestId}/check-in`);

      showSuccess('Check-in thành công', 'Đã chuyển trạng thái: GATE_IN - Xe vào cổng.', 5000);
      setIsCheckInModalOpen(false);
      setPlateNo('');
      setDriverName('');
      setDriverPhone('');
      onActionSuccess();
    } catch (error: any) {
      showError('Lỗi khi Check-in', error.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setIsLoading(true);
      await api.patch(`/gate/requests/${requestId}/check-out`);
      showSuccess(
        '🚚 Check-out thành công',
        'Đã chuyển trạng thái: GATE_OUT - Xe rời kho.',
        5000
      );
      onActionSuccess();
    } catch (error: any) {
      showError(
        'Lỗi khi Check-out',
        error.response?.data?.message || error.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGateOut = async () => {
    try {
      setIsLoading(true);
      await api.patch(`/gate/requests/${requestId}/gate-out`);
      showSuccess(
        '🚚 Xe rời kho',
        'Đã chuyển trạng thái: GATE_OUT - Xe rời kho.',
        5000
      );
      onActionSuccess();
    } catch (error: any) {
      showError(
        'Lỗi khi GATE_OUT',
        error.response?.data?.message || error.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Hiển thị action Check-in, Check-out cho NEW_REQUEST và PENDING
  if (currentStatus === 'NEW_REQUEST' || currentStatus === 'PENDING') {
    return (
      <>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <button
            onClick={openCheckInModal}
            disabled={isLoading}
            className="action-btn action-btn-success"
            style={{ backgroundColor: 'var(--color-green-600)' }}
          >
            {isLoading ? 'Đang xử lý...' : 'Check-in'}
          </button>
          
          <button
            onClick={handleCheckOut}
            disabled={isLoading}
            className="action-btn action-btn-warning"
            style={{ backgroundColor: 'var(--color-orange-600)', border: '2px solid var(--color-red-600)', boxShadow: '0 0 0 2px rgba(220,38,38,0.15) inset' }}
          >
            {isLoading ? 'Đang xử lý...' : 'Check-out'}
          </button>
        </div>

        {/* Check-in Modal (render trong nhánh này) */}
        {isCheckInModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', padding: 'var(--space-6)', borderRadius: 'var(--radius-lg)', width: '90%', maxWidth: '420px', boxShadow: 'var(--shadow-xl)' }}>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-4)' }}>Cập nhật thông tin trước khi Check-in</h3>

              <div style={{ marginBottom: 'var(--space-3)' }}>
                <label style={{ display: 'block', marginBottom: 'var(--space-2)' }}>Số xe *</label>
                <input type="text" value={plateNo} onChange={(e) => setPlateNo(e.target.value.toUpperCase())} className="form-input" style={{ width: '100%', padding: 'var(--space-3)', border: '2px solid var(--color-gray-200)', borderRadius: 'var(--radius-lg)' }} />
              </div>

              <div style={{ marginBottom: 'var(--space-3)' }}>
                <label style={{ display: 'block', marginBottom: 'var(--space-2)' }}>Tài xế *</label>
                <input type="text" value={driverName} onChange={(e) => setDriverName(e.target.value)} className="form-input" style={{ width: '100%', padding: 'var(--space-3)', border: '2px solid var(--color-gray-200)', borderRadius: 'var(--radius-lg)' }} />
              </div>

              <div style={{ marginBottom: 'var(--space-5)' }}>
                <label style={{ display: 'block', marginBottom: 'var(--space-2)' }}>SDT tài xế</label>
                <input type="text" value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} className="form-input" style={{ width: '100%', padding: 'var(--space-3)', border: '2px solid var(--color-gray-200)', borderRadius: 'var(--radius-lg)' }} />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                <button className="action-btn action-btn-secondary" disabled={isLoading} onClick={() => { setIsCheckInModalOpen(false); }}>
                  Hủy
                </button>
                <button className="action-btn action-btn-primary" disabled={isLoading} onClick={confirmCheckIn}>
                  {isLoading ? 'Đang xử lý...' : 'Xác nhận Check-in'}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Hiển thị action GATE_OUT cho IN_YARD, IN_CAR và FORKLIFTING (đối với import)
  // CHỈ khi đã thanh toán thành công
  if (
    currentStatus === 'IN_YARD' ||
    currentStatus === 'IN_CAR' ||
    (currentStatus === 'FORKLIFTING' && requestType === 'IMPORT')
  ) {
    if (!isPaid) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', alignItems: 'center' }}>
          <button
            disabled={true}
            className="action-btn action-btn-disabled"
            style={{ 
              backgroundColor: 'var(--color-gray-400)', 
              cursor: 'not-allowed',
              opacity: 0.6
            }}
            title="Chưa thanh toán - Không thể cho xe rời kho"
          >
            GATE_OUT - Chưa thanh toán
          </button>
          <span style={{ 
            fontSize: 'var(--font-size-xs)', 
            color: 'var(--color-red-600)',
            textAlign: 'center',
            fontWeight: 'var(--font-weight-medium)'
          }}>
            ⚠️ Cần thanh toán trước
          </span>
        </div>
      );
    }

    return (
      <button
        onClick={handleGateOut}
        disabled={isLoading}
        className="action-btn action-btn-success"
        style={{ backgroundColor: 'var(--color-green-600)' }}
        title="Đã thanh toán - Có thể cho xe rời kho"
      >
        {isLoading ? 'Đang xử lý...' : 'GATE_OUT - Xe rời kho'}
      </button>
    );
  }

  // Chỉ hiển thị buttons khi status là FORWARDED
  // Với FORKLIFTING: coi như đã cho phép vào → hiển thị nhãn giống GATE_IN và không có hành động
  if (currentStatus !== 'FORWARDED') {
    return (
      <span style={{ 
        color: 'var(--color-gray-500)', 
        fontSize: 'var(--font-size-sm)',
        fontStyle: 'italic'
      }}>
        {currentStatus === 'GATE_IN' && 'Đã cho phép vào'}
        {currentStatus === 'FORKLIFTING' && 'Đã cho phép vào'}
        {currentStatus === 'GATE_OUT' && 'Đã cho phép ra'}
        {currentStatus === 'GATE_REJECTED' && 'Đã từ chối'}
        {currentStatus === 'COMPLETED' && 'Hoàn tất'}
        {currentStatus === 'SCHEDULED' && 'Đã lên lịch'}
      </span>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <button
          onClick={handleApprove}
          disabled={isLoading}
          className="action-btn action-btn-primary"
        >
          {isLoading ? t('common.processing') : t('pages.gate.actions.approve')}
        </button>
        
        <button
          onClick={() => setIsRejectModalOpen(true)}
          disabled={isLoading}
          className="action-btn action-btn-danger"
        >
          {t('pages.gate.actions.reject')}
        </button>
      </div>

      {/* Approve Modal - yêu cầu nhập biển số */}
      {isApproveModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: 'var(--space-6)',
            borderRadius: 'var(--radius-lg)',
            width: '90%',
            maxWidth: '420px',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <h3 style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--space-4)',
              color: 'var(--color-gray-900)'
            }}>
              {t('pages.gate.modals.approve.title')}
            </h3>

            <div style={{ marginBottom: 'var(--space-3)' }}>
              <label style={{
                display: 'block',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-gray-700)',
                marginBottom: 'var(--space-2)'
              }}>
                {t('pages.gate.tableHeaders.driverName')} *
              </label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder={t('pages.gate.placeholders.driverName')}
                style={{
                  width: '100%',
                  padding: 'var(--space-3)',
                  border: '2px solid var(--color-gray-200)',
                  borderRadius: 'var(--radius-lg)'
                }}
                disabled={isLoading}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{
                display: 'block',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-gray-700)',
                marginBottom: 'var(--space-2)'
              }}>
                {t('pages.gate.tableHeaders.licensePlate')} *
              </label>
              <input
                type="text"
                value={plateNo}
                onChange={(e) => setPlateNo(e.target.value.toUpperCase())}
                placeholder={t('pages.gate.placeholders.plateNo')}
                style={{
                  width: '100%',
                  padding: 'var(--space-3)',
                  border: '2px solid var(--color-gray-200)',
                  borderRadius: 'var(--radius-lg)'
                }}
                disabled={isLoading}
              />
            </div>

            <div style={{ 
              marginBottom: 'var(--space-4)',
              padding: 'var(--space-3)',
              backgroundColor: 'var(--color-blue-50)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-blue-200)',
              maxWidth: '100%'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-2)',
                color: 'var(--color-blue-700)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                lineHeight: '1.4',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                hyphens: 'auto',
                maxWidth: '100%'
              }}>
                <span style={{ flexShrink: 0, marginTop: '2px' }}>ℹ️</span>
                <span style={{ 
                  flex: 1, 
                  minWidth: 0,
                  maxWidth: '100%',
                  wordBreak: 'break-word',
                  whiteSpace: 'normal'
                }}>
                  {t('pages.gate.modals.approve.autoTimeInfo')}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { 
                  setIsApproveModalOpen(false); 
                  setPlateNo(''); 
                  setDriverName(''); 
                }}
                disabled={isLoading}
                className="action-btn action-btn-secondary"
              >
                {t('pages.gate.actions.cancel')}
              </button>
              <button
                onClick={confirmApprove}
                disabled={isLoading}
                className="action-btn action-btn-primary"
              >
                {isLoading ? t('common.processing') : t('pages.gate.actions.confirmApprove')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: 'var(--space-6)',
            borderRadius: 'var(--radius-lg)',
            width: '90%',
            maxWidth: '400px',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <h3 style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--space-4)',
              color: 'var(--color-gray-900)'
            }}>
              {t('pages.gate.modals.reject.title')}
            </h3>
            
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t('pages.gate.placeholders.rejectReason')}
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                border: '2px solid var(--color-gray-200)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: 'var(--space-4)',
                height: '100px',
                resize: 'none',
                fontFamily: 'inherit',
                fontSize: 'var(--font-size-sm)'
              }}
              disabled={isLoading}
            />
            
            <div style={{
              display: 'flex',
              gap: 'var(--space-3)',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setRejectReason('');
                }}
                disabled={isLoading}
                className="action-btn action-btn-secondary"
              >
                {t('pages.gate.actions.cancel')}
              </button>
              
              <button
                onClick={handleReject}
                disabled={isLoading}
                className="action-btn action-btn-danger"
              >
                {isLoading ? t('common.processing') : t('pages.gate.actions.confirmReject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
