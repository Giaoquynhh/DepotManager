import { prisma } from '../../../shared/config/database';
import { 
  CreateShippingLineDto, 
  UpdateShippingLineDto, 
  CreateTransportCompanyDto, 
  UpdateTransportCompanyDto,
  CreateContainerTypeDto,
  UpdateContainerTypeDto,
  PaginationQuery,
  ShippingLineResponse,
  TransportCompanyResponse,
  ContainerTypeResponse
} from '../dto/SetupDtos';

export class SetupRepository {
  // Shipping Lines
  async getShippingLines(query: PaginationQuery = {}) {
    const { page = 1, limit = 10, search = '' } = query;
    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { code: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {};

    const [shippingLines, total] = await Promise.all([
      prisma.shippingLine.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.shippingLine.count({ where })
    ]);

    return {
      shippingLines: shippingLines as ShippingLineResponse[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getShippingLineById(id: string) {
    return await prisma.shippingLine.findUnique({
      where: { id }
    }) as ShippingLineResponse | null;
  }

  async getShippingLineByCode(code: string) {
    return await prisma.shippingLine.findUnique({
      where: { code }
    }) as ShippingLineResponse | null;
  }

  async createShippingLine(data: CreateShippingLineDto) {
    return await prisma.shippingLine.create({
      data: {
        code: data.code,
        name: data.name,
        eir: data.eir,
        note: data.note || null
      }
    }) as ShippingLineResponse;
  }

  async updateShippingLine(id: string, data: UpdateShippingLineDto) {
    return await prisma.shippingLine.update({
      where: { id },
      data
    }) as ShippingLineResponse;
  }

  async deleteShippingLine(id: string) {
    return await prisma.shippingLine.delete({
      where: { id }
    });
  }

  // Transport Companies
  async getTransportCompanies(query: PaginationQuery = {}) {
    const { page = 1, limit = 10, search = '' } = query;
    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { code: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {};

    const [transportCompanies, total] = await Promise.all([
      prisma.transportCompany.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.transportCompany.count({ where })
    ]);

    return {
      transportCompanies: transportCompanies as TransportCompanyResponse[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getTransportCompanyById(id: string) {
    return await prisma.transportCompany.findUnique({
      where: { id }
    }) as TransportCompanyResponse | null;
  }

  async getTransportCompanyByCode(code: string) {
    return await prisma.transportCompany.findUnique({
      where: { code }
    }) as TransportCompanyResponse | null;
  }

  async createTransportCompany(data: CreateTransportCompanyDto) {
    return await prisma.transportCompany.create({
      data: {
        code: data.code,
        name: data.name,
        address: data.address || null,
        mst: data.mst || null,
        phone: data.phone || null,
        note: data.note || null
      }
    }) as TransportCompanyResponse;
  }

  async updateTransportCompany(id: string, data: UpdateTransportCompanyDto) {
    return await prisma.transportCompany.update({
      where: { id },
      data
    }) as TransportCompanyResponse;
  }

  async deleteTransportCompany(id: string) {
    return await prisma.transportCompany.delete({
      where: { id }
    });
  }

  // Container Types
  async getContainerTypes(query: PaginationQuery = {}) {
    const { page = 1, limit = 10, search = '' } = query;
    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { description: { contains: search, mode: 'insensitive' as const } },
        { code: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {};

    const [containerTypes, total] = await Promise.all([
      prisma.containerType.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.containerType.count({ where })
    ]);

    return {
      containerTypes: containerTypes as ContainerTypeResponse[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getContainerTypeById(id: string): Promise<ContainerTypeResponse | null> {
    const containerType = await prisma.containerType.findUnique({
      where: { id }
    });
    return containerType as ContainerTypeResponse | null;
  }

  async createContainerType(data: CreateContainerTypeDto): Promise<ContainerTypeResponse> {
    const containerType = await prisma.containerType.create({
      data
    });
    return containerType as ContainerTypeResponse;
  }

  async updateContainerType(id: string, data: UpdateContainerTypeDto): Promise<ContainerTypeResponse | null> {
    const containerType = await prisma.containerType.update({
      where: { id },
      data
    });
    return containerType as ContainerTypeResponse;
  }

  async deleteContainerType(id: string): Promise<boolean> {
    try {
      await prisma.containerType.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default new SetupRepository();
