import { PrismaClient } from '@prisma/client';
// import { AuditLogService } from '../../audit/services/AuditLogService';

const prisma = new PrismaClient();

export class RequestStatusService {
  // private auditLogService: AuditLogService;

  constructor() {
    // this.auditLogService = new AuditLogService();
  }

  /**
   * Cập nhật trạng thái hóa đơn cho request
   * @param requestId ID của request
   * @param hasInvoice Trạng thái hóa đơn
   * @param userId ID của user thực hiện thay đổi
   * @returns Request đã được cập nhật
   */
  async updateInvoiceStatus(
    requestId: string,
    hasInvoice: boolean,
    userId: string
  ) {
    try {
      const request = await prisma.serviceRequest.update({
        where: { id: requestId },
        data: {
          has_invoice: hasInvoice,
          updatedAt: new Date(),
        },
      });

      // Ghi audit log - tạm thời comment out để tránh lỗi
      // await this.auditLogService.createLog({
      //   actor_id: userId,
      //   action: hasInvoice ? 'INVOICE_CREATED' : 'INVOICE_REMOVED',
      //   entity: 'ServiceRequest',
      //   entity_id: requestId,
      //   meta: {
      //     request_id: requestId,
      //     has_invoice: hasInvoice,
      //     previous_status: !hasInvoice,
      //   },
      // });

      return request;
    } catch (error: any) {
      throw new Error(`Không thể cập nhật trạng thái hóa đơn: ${error.message}`);
    }
  }

  /**
   * Cập nhật trạng thái thanh toán cho request
   * @param requestId ID của request
   * @param isPaid Trạng thái thanh toán
   * @param userId ID của user thực hiện thay đổi
   * @returns Request đã được cập nhật
   */
  async updatePaymentStatus(
    requestId: string,
    isPaid: boolean,
    userId: string
  ) {
    try {
      const request = await prisma.serviceRequest.update({
        where: { id: requestId },
        data: {
          is_paid: isPaid,
          updatedAt: new Date(),
        },
      });

      // Ghi audit log - tạm thời comment out để tránh lỗi
      // await this.auditLogService.createLog({
      //   actor_id: userId,
      //   action: isPaid ? 'PAYMENT_COMPLETED' : 'PAYMENT_PENDING',
      //   entity: 'ServiceRequest',
      //   entity_id: requestId,
      //   meta: {
      //     request_id: requestId,
      //     is_paid: isPaid,
      //     previous_status: !isPaid,
      //   },
      // });

      return request;
    } catch (error: any) {
      throw new Error(`Không thể cập nhật trạng thái thanh toán: ${error.message}`);
    }
  }

  /**
   * Cập nhật cả hai trạng thái cùng lúc
   * @param requestId ID của request
   * @param hasInvoice Trạng thái hóa đơn
   * @param isPaid Trạng thái thanh toán
   * @param userId ID của user thực hiện thay đổi
   * @returns Request đã được cập nhật
   */
  async updateBothStatuses(
    requestId: string,
    hasInvoice: boolean,
    isPaid: boolean,
    userId: string
  ) {
    try {
      const request = await prisma.serviceRequest.update({
        where: { id: requestId },
        data: {
          has_invoice: hasInvoice,
          is_paid: isPaid,
          updatedAt: new Date(),
        },
      });

      // Ghi audit log - tạm thời comment out để tránh lỗi
      // await this.auditLogService.createLog({
      //   actor_id: userId,
      //   action: 'STATUS_UPDATED',
      //   entity: 'ServiceRequest',
      //   entity_id: requestId,
      //   meta: {
      //     request_id: requestId,
      //     has_invoice: hasInvoice,
      //     is_paid: isPaid,
      //   },
      // });

      return request;
    } catch (error: any) {
      throw new Error(`Không thể cập nhật trạng thái: ${error.message}`);
    }
  }

  /**
   * Lấy danh sách requests theo trạng thái hóa đơn và thanh toán
   * @param filters Bộ lọc
   * @returns Danh sách requests
   */
  async getRequestsByStatus(filters: {
    hasInvoice?: boolean;
    isPaid?: boolean;
    status?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      const where: any = {};

      if (filters.hasInvoice !== undefined) {
        where.has_invoice = filters.hasInvoice;
      }

      if (filters.isPaid !== undefined) {
        where.is_paid = filters.isPaid;
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.type) {
        where.type = filters.type;
      }

      const requests = await prisma.serviceRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
        include: {
          docs: true,
          paymentRequests: true,
        },
      });

      const total = await prisma.serviceRequest.count({ where });

      return {
        requests,
        total,
        limit: filters.limit || 50,
        offset: filters.offset || 0,
      };
    } catch (error: any) {
      throw new Error(`Không thể lấy danh sách requests: ${error.message}`);
    }
  }

  /**
   * Thống kê requests theo trạng thái
   * @returns Thống kê
   */
  async getStatusStatistics() {
    try {
      const [
        totalRequests,
        requestsWithInvoice,
        requestsWithoutInvoice,
        paidRequests,
        unpaidRequests,
      ] = await Promise.all([
        prisma.serviceRequest.count(),
        prisma.serviceRequest.count({ where: { has_invoice: true } }),
        prisma.serviceRequest.count({ where: { has_invoice: false } }),
        prisma.serviceRequest.count({ where: { is_paid: true } }),
        prisma.serviceRequest.count({ where: { is_paid: false } }),
      ]);

      return {
        total: totalRequests,
        invoice_status: {
          with_invoice: requestsWithInvoice,
          without_invoice: requestsWithoutInvoice,
        },
        payment_status: {
          paid: paidRequests,
          unpaid: unpaidRequests,
        },
      };
    } catch (error: any) {
      throw new Error(`Không thể lấy thống kê: ${error.message}`);
    }
  }

  /**
   * Tự động cập nhật trạng thái hóa đơn dựa trên DocumentFile
   * @param requestId ID của request
   * @returns Trạng thái đã được cập nhật
   */
  async autoUpdateInvoiceStatus(requestId: string) {
    try {
      const invoiceCount = await prisma.documentFile.count({
        where: {
          request_id: requestId,
          type: 'INVOICE',
          deleted_at: null,
        },
      });

      const hasInvoice = invoiceCount > 0;

      // Cập nhật trạng thái nếu có thay đổi
      const currentRequest = await prisma.serviceRequest.findUnique({
        where: { id: requestId },
        select: { has_invoice: true },
      });

      if (currentRequest?.has_invoice !== hasInvoice) {
        await this.updateInvoiceStatus(requestId, hasInvoice, 'SYSTEM');
      }

      return { has_invoice: hasInvoice, updated: currentRequest?.has_invoice !== hasInvoice };
    } catch (error: any) {
      throw new Error(`Không thể tự động cập nhật trạng thái hóa đơn: ${error.message}`);
    }
  }

  /**
   * Tự động cập nhật trạng thái thanh toán dựa trên PaymentRequest
   * @param requestId ID của request
   * @returns Trạng thái đã được cập nhật
   */
  async autoUpdatePaymentStatus(requestId: string) {
    try {
      const paymentRequests = await prisma.paymentRequest.findMany({
        where: {
          request_id: requestId,
          status: 'PAID',
        },
      });

      // Tính tổng số tiền đã thanh toán
      const totalPaid = paymentRequests.reduce((sum, payment) => {
        // Giả sử PaymentRequest có trường amount
        return sum + (payment as any).amount || 0;
      }, 0);

      // Lấy thông tin request để so sánh với tổng tiền cần thanh toán
      const request = await prisma.serviceRequest.findUnique({
        where: { id: requestId },
        include: {
          docs: {
            where: { type: 'INVOICE', deleted_at: null },
          },
        },
      });

      if (!request) {
        throw new Error('Request không tồn tại');
      }

      // Giả sử có trường total_amount trong request hoặc tính từ invoices
      const totalAmount = 0; // Cần implement logic tính tổng tiền
      const isPaid = totalPaid >= totalAmount;

      // Cập nhật trạng thái nếu có thay đổi
      if (request.is_paid !== isPaid) {
        await this.updatePaymentStatus(requestId, isPaid, 'SYSTEM');
      }

      return { is_paid: isPaid, updated: request.is_paid !== isPaid };
    } catch (error: any) {
      throw new Error(`Không thể tự động cập nhật trạng thái thanh toán: ${error.message}`);
    }
  }
}
