import { prisma } from '../../../shared/config/database';
import { CreateSealDto, UpdateSealDto, SealListQueryDto } from '../dto/SealDtos';
import { SealPricingService } from './SealPricingService';

export class SealService {
  private pricingService: SealPricingService;

  constructor() {
    this.pricingService = new SealPricingService();
  }
  async create(data: CreateSealDto, userId: string) {
    const { quantity_purchased, quantity_exported = 0, unit_price } = data;
    
    // Calculate derived fields
    const quantity_remaining = quantity_purchased - quantity_exported;
    const total_amount = Number(quantity_purchased) * Number(unit_price);

    const seal = await prisma.seal.create({
      data: {
        ...data,
        quantity_exported,
        quantity_remaining,
        total_amount,
        created_by: userId,
        updated_by: userId
      }
    });

    return seal;
  }

  async list(query: SealListQueryDto) {
    const { 
      shipping_company, 
      status, 
      search, 
      page = 1, 
      pageSize = 20 
    } = query;

    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: any = {};
    
    if (shipping_company) {
      where.shipping_company = {
        contains: shipping_company,
        mode: 'insensitive'
      };
    }
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { shipping_company: { contains: search, mode: 'insensitive' } },
        { pickup_location: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [seals, total] = await Promise.all([
      prisma.seal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.seal.count({ where })
    ]);

    return {
      items: seals,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  async getById(id: string) {
    const seal = await prisma.seal.findUnique({
      where: { id }
    });

    if (!seal) {
      throw new Error('Seal not found');
    }

    return seal;
  }

  async update(id: string, data: UpdateSealDto, userId: string) {
    const existingSeal = await prisma.seal.findUnique({
      where: { id }
    });

    if (!existingSeal) {
      throw new Error('Seal not found');
    }

    // Calculate derived fields if quantity fields are being updated
    let updateData: any = { ...data, updated_by: userId };
    
    if (data.quantity_purchased !== undefined || data.quantity_exported !== undefined) {
      const quantity_purchased = data.quantity_purchased ?? existingSeal.quantity_purchased;
      const quantity_exported = data.quantity_exported ?? existingSeal.quantity_exported;
      const unit_price = data.unit_price ?? existingSeal.unit_price;
      
      updateData.quantity_remaining = quantity_purchased - quantity_exported;
      updateData.total_amount = Number(quantity_purchased) * Number(unit_price);
    }

    const seal = await prisma.seal.update({
      where: { id },
      data: updateData
    });

    return seal;
  }

  async delete(id: string) {
    const existingSeal = await prisma.seal.findUnique({
      where: { id }
    });

    if (!existingSeal) {
      throw new Error('Seal not found');
    }

    await prisma.seal.delete({
      where: { id }
    });

    return { message: 'Seal deleted successfully' };
  }

  async getStatistics() {
    const [totalSeals, activeSeals, totalQuantity, totalValue] = await Promise.all([
      prisma.seal.count(),
      prisma.seal.count({ where: { status: 'ACTIVE' } }),
      prisma.seal.aggregate({
        _sum: { quantity_remaining: true }
      }),
      prisma.seal.aggregate({
        _sum: { total_amount: true }
      })
    ]);

    return {
      totalSeals,
      activeSeals,
      totalQuantityRemaining: totalQuantity._sum.quantity_remaining || 0,
      totalValue: totalValue._sum.total_amount || 0
    };
  }

  async incrementExportedQuantity(shippingCompany: string, userId: string, sealNumber?: string, containerNumber?: string, requestId?: string) {
    // Tìm seal theo hãng tàu với logic FIFO (First In First Out)
    // Ưu tiên theo ngày mua cũ nhất, sau đó theo thời gian tạo cũ nhất
    const seal = await prisma.seal.findFirst({
      where: {
        shipping_company: {
          contains: shippingCompany,
          mode: 'insensitive'
        },
        status: 'ACTIVE',
        quantity_remaining: {
          gt: 0 // Chỉ lấy seal còn số lượng
        }
      },
      orderBy: [
        {
          purchase_date: 'asc' // Ngày mua cũ nhất trước
        },
        {
          createdAt: 'asc' // Nếu cùng ngày thì tạo cũ nhất trước
        }
      ]
    });

    if (!seal) {
      throw new Error(`Không tìm thấy seal còn số lượng cho hãng tàu: ${shippingCompany}`);
    }

    // Lấy booking từ ServiceRequest
    let bookingNumber = null;
    
    // Ưu tiên: nếu có requestId thì lấy từ requestId đó
    if (requestId) {
      const serviceRequest = await prisma.serviceRequest.findUnique({
        where: { id: requestId },
        select: { booking_bill: true }
      });
      bookingNumber = serviceRequest?.booking_bill || null;
    }
    
    // Fallback: nếu có containerNumber thì tìm ServiceRequest theo container_no
    if (!bookingNumber && containerNumber) {
      const serviceRequest = await prisma.serviceRequest.findFirst({
        where: { 
          container_no: containerNumber,
          booking_bill: { not: null }
        },
        orderBy: { createdAt: 'desc' },
        select: { booking_bill: true }
      });
      bookingNumber = serviceRequest?.booking_bill || null;
    }

    // Cập nhật số lượng đã xuất và ghi lịch sử trong transaction
    const result = await prisma.$transaction(async (tx) => {
      const newQuantityExported = seal.quantity_exported + 1;
      const newQuantityRemaining = seal.quantity_purchased - newQuantityExported;

      // Cập nhật seal
      const updatedSeal = await tx.seal.update({
        where: { id: seal.id },
        data: {
          quantity_exported: newQuantityExported,
          quantity_remaining: newQuantityRemaining,
          updated_by: userId
        }
      });

      // Ghi lịch sử sử dụng
      await tx.sealUsageHistory.create({
        data: {
          seal_id: seal.id,
          seal_number: sealNumber || `SEAL-${Date.now()}`,
          container_number: containerNumber,
          booking_number: bookingNumber,
          created_by: userId
        }
      });

      return updatedSeal;
    });

    // Cập nhật pricing cho ServiceRequest nếu có booking number hoặc container number
    if (bookingNumber || containerNumber) {
      try {
        await this.pricingService.updateServiceRequestPricing(
          bookingNumber || '',
          Number(seal.unit_price),
          userId,
          containerNumber,
          requestId,
          false // Không tự động tạo invoice khi sử dụng seal
        );
        console.log(`✅ Đã cập nhật pricing cho booking: ${bookingNumber}, container: ${containerNumber}`);
      } catch (pricingError) {
        console.error('❌ Lỗi khi cập nhật pricing:', pricingError);
        // Không throw error để không ảnh hưởng đến việc cập nhật seal
      }
    } else {
      console.log('⚠️ Không có booking number hoặc container number để cập nhật pricing');
    }

    return result;
  }

  async getUsageHistory(sealId: string) {
    const history = await prisma.sealUsageHistory.findMany({
      where: { seal_id: sealId },
      orderBy: { created_at: 'desc' },
      include: {
        seal: {
          select: {
            shipping_company: true,
            quantity_remaining: true
          }
        },
        creator: {
          select: {
            full_name: true,
            username: true,
            email: true
          }
        }
      }
    });

    return history;
  }

  async updateSealUsageHistory(
    shippingCompany: string, 
    userId: string, 
    oldSealNumber: string, 
    newSealNumber: string, 
    containerNumber?: string, 
    requestId?: string
  ) {
    // Lấy booking từ ServiceRequest
    let bookingNumber = null;
    
    if (requestId) {
      const serviceRequest = await prisma.serviceRequest.findUnique({
        where: { id: requestId },
        select: { booking_bill: true }
      });
      bookingNumber = serviceRequest?.booking_bill || null;
    }
    
    if (!bookingNumber && containerNumber) {
      const serviceRequest = await prisma.serviceRequest.findFirst({
        where: { 
          container_no: containerNumber,
          booking_bill: { not: null }
        },
        orderBy: { createdAt: 'desc' },
        select: { booking_bill: true }
      });
      bookingNumber = serviceRequest?.booking_bill || null;
    }

    // Tìm record cũ trong lịch sử sử dụng dựa trên container number và seal number cũ
    const existingHistory = await prisma.sealUsageHistory.findFirst({
      where: {
        container_number: containerNumber,
        seal_number: oldSealNumber
      },
      include: {
        seal: {
          select: {
            shipping_company: true,
            id: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    if (existingHistory) {
      // Kiểm tra xem seal có thuộc hãng tàu đúng không
      if (existingHistory.seal.shipping_company.toLowerCase().includes(shippingCompany.toLowerCase())) {
        // Cập nhật record cũ
        const updatedHistory = await prisma.sealUsageHistory.update({
          where: { id: existingHistory.id },
          data: {
            seal_number: newSealNumber,
            booking_number: bookingNumber
          }
        });

        console.log(`✅ Updated existing seal usage history: ${oldSealNumber} → ${newSealNumber}`);
        return updatedHistory;
      } else {
        console.log(`⚠️ Existing seal belongs to different shipping company: ${existingHistory.seal.shipping_company} vs ${shippingCompany}`);
      }
    }

    // Nếu không tìm thấy record cũ hoặc seal thuộc hãng tàu khác, tìm seal để tạo mới
    const seal = await prisma.seal.findFirst({
      where: {
        shipping_company: {
          contains: shippingCompany,
          mode: 'insensitive'
        },
        status: 'ACTIVE',
        quantity_remaining: {
          gt: 0
        }
      },
      orderBy: [
        {
          purchase_date: 'asc'
        },
        {
          createdAt: 'asc'
        }
      ]
    });

    if (!seal) {
      throw new Error(`Không tìm thấy seal còn số lượng cho hãng tàu: ${shippingCompany}`);
    }

    // Tạo record mới
    const newHistory = await prisma.sealUsageHistory.create({
      data: {
        seal_id: seal.id,
        seal_number: newSealNumber,
        container_number: containerNumber,
        booking_number: bookingNumber,
        created_by: userId
      }
    });

    // Cập nhật số lượng đã xuất
    await prisma.seal.update({
      where: { id: seal.id },
      data: {
        quantity_exported: seal.quantity_exported + 1,
        quantity_remaining: seal.quantity_remaining - 1,
        updated_by: userId
      }
    });

    console.log(`✅ Created new seal usage history: ${newSealNumber}`);
    return newHistory;
  }

  async removeSealFromHistory(
    shippingCompany: string,
    userId: string,
    sealNumber: string,
    containerNumber?: string
  ) {
    console.log(`🗑️ Removing seal ${sealNumber} from history for container ${containerNumber}`);
    
    // Tìm record trong lịch sử sử dụng dựa trên container number và seal number
    const existingHistory = await prisma.sealUsageHistory.findFirst({
      where: {
        container_number: containerNumber,
        seal_number: sealNumber
      },
      include: {
        seal: {
          select: {
            shipping_company: true,
            id: true,
            quantity_exported: true,
            quantity_remaining: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    if (!existingHistory) {
      console.log(`⚠️ No seal usage history found for seal ${sealNumber} and container ${containerNumber}`);
      return null;
    }

    // Kiểm tra xem seal có thuộc hãng tàu đúng không
    if (!existingHistory.seal.shipping_company.toLowerCase().includes(shippingCompany.toLowerCase())) {
      console.log(`⚠️ Seal belongs to different shipping company: ${existingHistory.seal.shipping_company} vs ${shippingCompany}`);
      return null;
    }

    // Xóa record khỏi lịch sử
    await prisma.sealUsageHistory.delete({
      where: { id: existingHistory.id }
    });

    // Hoàn trả số lượng seal (tăng quantity_remaining, giảm quantity_exported)
    await prisma.seal.update({
      where: { id: existingHistory.seal.id },
      data: {
        quantity_exported: Math.max(0, existingHistory.seal.quantity_exported - 1),
        quantity_remaining: existingHistory.seal.quantity_remaining + 1,
        updated_by: userId
      }
    });

    console.log(`✅ Successfully removed seal ${sealNumber} from history and restored seal quantity`);
    return { success: true, message: 'Seal removed from history successfully' };
  }
}

export default new SealService();
