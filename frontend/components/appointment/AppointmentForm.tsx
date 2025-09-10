import React, { useState, useEffect } from 'react';
import { api } from '@services/api';
import { useTranslation } from '../../hooks/useTranslation';

interface AppointmentFormData {
  appointment_time: string;
  note?: string;
}


interface AppointmentFormProps {
  requestId: string;
  requestData?: {
    id: string;
    container_no: string;
    type: string;
    status: string;
    created_by: string;
  };
  onSubmit: (data: AppointmentFormData) => void;
  onError: (error: string) => void;
  onSuccess: () => void;
  mode?: 'create' | 'change';
}

export default function AppointmentForm({
  requestId,
  requestData,
  onSubmit,
  onError,
  onSuccess,
  mode = 'create'
}: AppointmentFormProps) {
  const { t } = useTranslation();
  // Tạo giá trị mặc định cho thời gian hiện tại + 1 giờ
  const getDefaultAppointmentTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    
    // Sử dụng thời gian local thay vì UTC
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState<AppointmentFormData>({
    appointment_time: getDefaultAppointmentTime(),
    note: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof AppointmentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

                    const validateForm = (): boolean => {
       const newErrors: Record<string, string> = {};

       if (!formData.appointment_time) {
         newErrors.appointment_time = 'Thời gian lịch hẹn là bắt buộc';
       }



       // Validate appointment_time is in the future
       if (formData.appointment_time) {
         const selectedTime = new Date(formData.appointment_time);
         const now = new Date();
         if (selectedTime <= now) {
           newErrors.appointment_time = 'Thời gian lịch hẹn phải trong tương lai';
         }
         
         // Validate appointment_time is valid date
         if (isNaN(selectedTime.getTime())) {
           newErrors.appointment_time = 'Thời gian lịch hẹn không hợp lệ';
         }
       }

       setErrors(newErrors);
       return Object.keys(newErrors).length === 0;
     };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

              setLoading(true);
     try {
       // Convert datetime-local to Date object and map fields to match backend DTO
       const appointmentData = {
         appointment_time: new Date(formData.appointment_time), // Backend expects Date object, not string
         appointment_note: formData.note?.trim() || undefined
       };
       
       // Validate that appointment_time is a valid date
       if (isNaN(appointmentData.appointment_time.getTime())) {
         onError('Thời gian lịch hẹn không hợp lệ');
         return;
       }
       
       
       
       // Debug logging
       console.log('=== DEBUG APPOINTMENT SUBMISSION ===');
       console.log('Mode:', mode);
       console.log('Form data:', formData);
       console.log('Request ID:', requestId);
       console.log('Appointment data to send:', appointmentData);
       console.log('Appointment time type:', typeof appointmentData.appointment_time);
       console.log('Appointment time value:', appointmentData.appointment_time);
       console.log('Appointment time instanceof Date:', appointmentData.appointment_time instanceof Date);
       console.log('Appointment time toISOString:', appointmentData.appointment_time.toISOString());
       console.log('Appointment time getTime:', appointmentData.appointment_time.getTime());
       console.log('=====================================');
       
       // Chọn API endpoint dựa trên mode
       const endpoint = mode === 'change' ? 'update-appointment' : 'schedule';
       console.log('Calling API endpoint:', `/requests/${requestId}/${endpoint}`);
       
       const response = await api.patch(`/requests/${requestId}/${endpoint}`, appointmentData);
       console.log('API response:', response);
       
       // Backend đã tự động xử lý chuyển trạng thái:
       // - IMPORT: PENDING → SCHEDULED
       // - EXPORT: PENDING → PICK_CONTAINER
       console.log('🔍 Appointment created successfully, backend handled status transition');
       
       onSuccess();
         } catch (error: any) {
       console.error('Error creating appointment:', error);
       console.error('Error response:', error.response);
       
       // Handle specific errors
       if (error.response?.status === 400) {
         const errorMessage = error.response.data?.message || 'Dữ liệu không hợp lệ';
         console.error('=== BACKEND VALIDATION ERROR ===');
         console.error('Status:', error.response.status);
         console.error('Data:', error.response.data);
         console.error('Headers:', error.response.headers);
         console.error('===============================');
         onError(`Lỗi validation: ${errorMessage}`);
       } else if (error.response?.status === 422) {
         onError('Khung giờ này không khả dụng, vui lòng chọn thời gian khác');
       } else if (error.response?.data?.message) {
         onError(error.response.data.message);
       } else {
         onError('Có lỗi xảy ra, vui lòng thử lại');
       }
     } finally {
      setLoading(false);
    }
  };


  // Get minimum datetime (current time + 1 hour)
  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  console.log('AppointmentForm rendering with:', { requestId, requestData, formData });

  return (
    <form className="appointment-form" onSubmit={handleSubmit}>
      <div className="appointment-form-content">
        {/* Request Info */}
        <div className="appointment-request-info">
          <div className="appointment-info-item">
            <span className="appointment-info-label">Container:</span>
            <span className="appointment-info-value">{requestData?.container_no || requestId}</span>
          </div>
          <div className="appointment-info-item">
            <span className="appointment-info-label">{t('pages.requests.typeLabel')}:</span>
            <span className="appointment-info-value">
              {requestData?.type === 'IMPORT' 
                ? t('pages.requests.filterOptions.import')
                : requestData?.type === 'EXPORT' 
                ? t('pages.requests.filterOptions.export')
                : requestData?.type || 'N/A'
              }
            </span>
          </div>
        </div>

        {/* Appointment Date */}
        <div className="appointment-form-group">
          <label className="appointment-form-label" htmlFor="appointment_date">
            {t('pages.requests.appointmentDate')} *
          </label>
          <input
            type="date"
            id="appointment_date"
            className={`appointment-form-input ${errors.appointment_time ? 'error' : ''}`}
            value={formData.appointment_time ? formData.appointment_time.split('T')[0] : (() => {
              const now = new Date();
              const year = now.getFullYear();
              const month = String(now.getMonth() + 1).padStart(2, '0');
              const day = String(now.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            })()}
            onChange={(e) => {
              const time = formData.appointment_time ? formData.appointment_time.split('T')[1] || '09:00' : '09:00';
              handleInputChange('appointment_time', `${e.target.value}T${time}`);
            }}
            min={(() => {
              const now = new Date();
              const year = now.getFullYear();
              const month = String(now.getMonth() + 1).padStart(2, '0');
              const day = String(now.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            })()}
            disabled={loading}
          />
        </div>

        {/* Appointment Time */}
        <div className="appointment-form-group">
          <label className="appointment-form-label" htmlFor="appointment_time">
            {t('pages.requests.appointmentTime')} *
          </label>
          <input
            type="time"
            id="appointment_time"
            className={`appointment-form-input ${errors.appointment_time ? 'error' : ''}`}
            value={formData.appointment_time ? formData.appointment_time.split('T')[1] || '09:00' : (() => {
              const now = new Date();
              const hours = String(now.getHours()).padStart(2, '0');
              const minutes = String(now.getMinutes()).padStart(2, '0');
              return `${hours}:${minutes}`;
            })()}
            onChange={(e) => {
              const date = formData.appointment_time ? formData.appointment_time.split('T')[0] : (() => {
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
              })();
              handleInputChange('appointment_time', `${date}T${e.target.value}`);
            }}
            disabled={loading}
          />
          {errors.appointment_time && (
            <span className="appointment-form-error">{errors.appointment_time}</span>
          )}
        </div>






        {/* Note */}
        <div className="appointment-form-group">
          <label className="appointment-form-label" htmlFor="note">
            {t('pages.requests.notes')} <span className="text-gray-500 text-sm">({t('common.optional')})</span>
          </label>
          <textarea
            id="note"
            className="appointment-form-textarea"
            value={formData.note}
            onChange={(e) => handleInputChange('note', e.target.value)}
            placeholder={t('pages.requests.appointmentNotesPlaceholder')}
            maxLength={500}
            rows={3}
            disabled={loading}
          />
          <div className="appointment-form-counter">
            {formData.note?.length || 0}/500 {t('common.characters')}
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="appointment-form-actions">
        <button
          type="submit"
          className="appointment-form-submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="appointment-loading-spinner"></div>
              <span>{t('common.processing')}</span>
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4"></path>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
              </svg>
              <span>{mode === 'change' ? t('pages.requests.updateAppointment') : t('pages.requests.createAppointment')}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
