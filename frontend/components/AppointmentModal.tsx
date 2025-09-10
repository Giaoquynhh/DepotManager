import React, { useState, useEffect } from 'react';
import { api } from '@services/api';
import { useTranslation } from '../hooks/useTranslation';

interface AppointmentModalProps {
    requestId: string;
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    requestData?: {
        id: string;
        container_no: string;
        type: string;
        status: string;
        created_by: string;
    };
}

interface AppointmentData {
    appointment_time: string;
    note?: string;
}


export default function AppointmentModal({ requestId, visible, onClose, onSuccess, requestData }: AppointmentModalProps) {
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

    const [formData, setFormData] = useState<AppointmentData>({
        appointment_time: getDefaultAppointmentTime(),
        note: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleInputChange = (field: keyof AppointmentData, value: string) => {
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
        } else {
            const selectedTime = new Date(formData.appointment_time);
            const now = new Date();
            if (selectedTime <= now) {
                newErrors.appointment_time = 'Thời gian lịch hẹn phải trong tương lai';
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
                         // Convert datetime-local to ISO8601 format and map fields to match backend DTO
             const appointmentData = {
                 appointment_time: new Date(formData.appointment_time), // Backend expects Date object, not string
                 appointment_note: formData.note || undefined
             };
                         console.log('Sending appointment data:', appointmentData);
             // AppointmentModal luôn ở mode 'create' nên gọi schedule endpoint
             await api.patch(`/requests/${requestId}/schedule`, appointmentData);
            
            // Reset form
            setFormData({
                appointment_time: getDefaultAppointmentTime(),
                note: ''
            });
            setErrors({});
            
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error accepting request:', error);
            
            // Handle specific errors
            if (error.response?.status === 422) {
                setErrors({ appointment_time: 'Khung giờ này không khả dụng, vui lòng chọn thời gian khác' });
            } else if (error.response?.data?.message) {
                setErrors({ general: error.response.data.message });
            } else {
                setErrors({ general: 'Có lỗi xảy ra, vui lòng thử lại' });
            }
        } finally {
            setLoading(false);
        }
    };


    if (!visible) return null;

    console.log('AppointmentModal rendered with date/time pickers');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md max-h-[60vh] flex flex-col">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold">{t('pages.requests.createAppointment')}</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Container: {requestData?.container_no || requestId}
                                {requestData?.type && (
                                    <span className="ml-2">
                                        ({requestData.type === 'IMPORT' 
                                            ? t('pages.requests.filterOptions.import')
                                            : requestData.type === 'EXPORT' 
                                            ? t('pages.requests.filterOptions.export')
                                            : requestData.type
                                        })
                                    </span>
                                )}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-xl"
                            disabled={loading}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: '400px' }}>

                <form id="appointment-form" onSubmit={handleSubmit} className="space-y-4">
                    {/* Ngày lịch hẹn */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('pages.requests.appointmentDate')} *
                        </label>
                        <input
                            type="date"
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
                            className={`w-full px-3 py-2 border rounded-md ${
                                errors.appointment_time ? 'border-red-500' : 'border-gray-300'
                            }`}
                            min={(() => {
                                const now = new Date();
                                const year = now.getFullYear();
                                const month = String(now.getMonth() + 1).padStart(2, '0');
                                const day = String(now.getDate()).padStart(2, '0');
                                return `${year}-${month}-${day}`;
                            })()}
                        />
                    </div>

                    {/* Giờ lịch hẹn */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('pages.requests.appointmentTime')} *
                        </label>
                        <input
                            type="time"
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
                            className={`w-full px-3 py-2 border rounded-md ${
                                errors.appointment_time ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.appointment_time && (
                            <p className="text-red-500 text-sm mt-1">{errors.appointment_time}</p>
                        )}
                    </div>



                    {/* Ghi chú */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('pages.requests.notes')} <span className="text-gray-500 text-sm">({t('common.optional')})</span>
                        </label>
                        <textarea
                            value={formData.note}
                            onChange={(e) => handleInputChange('note', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder={t('pages.requests.appointmentNotesPlaceholder')}
                            rows={3}
                            maxLength={500}
                        />
                        <div className="text-xs text-gray-500 mt-1">
                            {formData.note?.length || 0}/500 {t('common.characters')}
                        </div>
                    </div>


                    {/* Error message */}
                    {errors.general && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <p className="text-red-600 text-sm">{errors.general}</p>
                        </div>
                    )}

                </form>
                </div>

                <div className="p-6 border-t border-gray-200">
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            disabled={loading}
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            form="appointment-form"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                            disabled={loading}
                        >
                            {loading ? t('common.processing') : t('pages.requests.createAppointment')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
