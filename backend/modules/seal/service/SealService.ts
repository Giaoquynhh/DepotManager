import { prisma } from '../../../shared/config/database';
import { CreateSealDto, UpdateSealDto, SealListQueryDto } from '../dto/SealDtos';

export class SealService {
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
}

export default new SealService();
