import repo from '../repository/RequestRepository';
import RequestStateMachine from './RequestStateMachine';

export interface AppointmentData {
  appointment_time: Date;
  appointment_location_type?: 'gate' | 'yard';
  appointment_location_id?: string;
  gate_ref?: string;
  appointment_note?: string;
}

export class AppointmentService {
  async scheduleAppointment(
    actor: any,
    requestId: string,
    appointmentData: AppointmentData
  ) {
    const request = await repo.findById(requestId);
    if (!request) {
      throw new Error('Yêu cầu không tồn tại');
    }

    // Xác định trạng thái đích dựa trên loại request
    let targetStatus = 'SCHEDULED';
    if (request.type === 'EXPORT' && request.status === 'PENDING') {
      targetStatus = 'PICK_CONTAINER';
      console.log('🔍 EXPORT request detected, transitioning to PICK_CONTAINER instead of SCHEDULED');
    }

    // Validate transition
    await RequestStateMachine.executeTransition(
      actor,
      requestId,
      request.status,
      targetStatus
    );

    // Update request với appointment data
    const updateData = {
      status: targetStatus,
      appointment_time: appointmentData.appointment_time,
      appointment_location_type: appointmentData.appointment_location_type,
      appointment_location_id: appointmentData.appointment_location_id,
      gate_ref: appointmentData.gate_ref,
      appointment_note: appointmentData.appointment_note,
      history: [
        ...(Array.isArray(request.history) ? request.history : []),
        {
          at: new Date().toISOString(),
          by: actor._id,
          action: targetStatus,
          appointment_data: appointmentData
        }
      ]
    };

    const updated = await repo.update(requestId, updateData);
    return updated;
  }

  async updateAppointment(
    actor: any,
    requestId: string,
    appointmentData: Partial<AppointmentData>
  ) {
    const request = await repo.findById(requestId);
    if (!request) {
      throw new Error('Yêu cầu không tồn tại');
    }

    // Chỉ cho phép update khi ở trạng thái SCHEDULED
    if (request.status !== 'SCHEDULED') {
      throw new Error('Chỉ có thể cập nhật lịch hẹn khi request ở trạng thái SCHEDULED');
    }

    // Chỉ SaleAdmin và SystemAdmin được phép update appointment
    if (!['SaleAdmin', 'SystemAdmin'].includes(actor.role)) {
      throw new Error('Không có quyền cập nhật lịch hẹn');
    }

    const updateData: any = {
      history: [
        ...(Array.isArray(request.history) ? request.history : []),
        {
          at: new Date().toISOString(),
          by: actor._id,
          action: 'APPOINTMENT_UPDATED',
          appointment_data: appointmentData
        }
      ]
    };

    // Chỉ update các field được cung cấp
    if (appointmentData.appointment_time) {
      updateData.appointment_time = appointmentData.appointment_time;
    }
    if (appointmentData.appointment_location_type !== undefined) {
      updateData.appointment_location_type = appointmentData.appointment_location_type;
    }
    if (appointmentData.appointment_location_id !== undefined) {
      updateData.appointment_location_id = appointmentData.appointment_location_id;
    }
    if (appointmentData.gate_ref !== undefined) {
      updateData.gate_ref = appointmentData.gate_ref;
    }
    if (appointmentData.appointment_note !== undefined) {
      updateData.appointment_note = appointmentData.appointment_note;
    }

    const updated = await repo.update(requestId, updateData);
    return updated;
  }

  async cancelAppointment(actor: any, requestId: string, reason?: string) {
    const request = await repo.findById(requestId);
        if (!request) {
      throw new Error('Yêu cầu không tồn tại');
    }

    // Chỉ cho phép cancel khi ở trạng thái SCHEDULED
    if (request.status !== 'SCHEDULED') {
      throw new Error('Chỉ có thể hủy lịch hẹn khi request ở trạng thái SCHEDULED');
    }

    // Chỉ SaleAdmin và SystemAdmin được phép cancel
    if (!['SaleAdmin', 'SystemAdmin'].includes(actor.role)) {
      throw new Error('Không có quyền hủy lịch hẹn');
    }

    // Chuyển về PENDING
    await RequestStateMachine.executeTransition(
      actor,
      requestId,
      request.status,
      'PENDING',
      reason
    );

    const updateData = {
      status: 'PENDING',
      appointment_time: null,
      appointment_location_type: null,
      appointment_location_id: null,
      gate_ref: null,
      appointment_note: null,
      history: [
        ...(Array.isArray(request.history) ? request.history : []),
        {
          at: new Date().toISOString(),
          by: actor._id,
          action: 'APPOINTMENT_CANCELLED',
          reason
        }
      ]
    };

    const updated = await repo.update(requestId, updateData);
    return updated;
  }

  async getAppointmentInfo(requestId: string) {
    const request = await repo.findById(requestId);
    if (!request) {
      throw new Error('Yêu cầu không tồn tại');
    }

    return {
      appointment_time: request.appointment_time,
      appointment_location_type: request.appointment_location_type,
      appointment_location_id: request.appointment_location_id,
      gate_ref: request.gate_ref,
      appointment_note: request.appointment_note,
      status: request.status
    };
  }

  async listScheduledAppointments(actor: any, query: any = {}) {
    const filter: any = {
      status: 'SCHEDULED'
    };

    // Filter theo ngày nếu có
    if (query.date) {
      const date = new Date(query.date);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      filter.appointment_time = {
        gte: date,
        lt: nextDay
      };
    }

    // Filter theo location nếu có
    if (query.location_type) {
      filter.appointment_location_type = query.location_type;
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      repo.list(filter, skip, limit),
      repo.count(filter)
    ]);

        return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
}

export default new AppointmentService();
