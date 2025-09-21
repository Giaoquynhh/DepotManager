import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class RequestRepository {
  async findMany(query: any) {
    return await prisma.serviceRequest.findMany(query);
  }

  async findUnique(query: any) {
    return await prisma.serviceRequest.findUnique(query);
  }

  async create(data: any) {
    return await prisma.serviceRequest.create(data);
  }

  async update(query: any) {
    return await prisma.serviceRequest.update(query);
  }

  async delete(query: any) {
    return await prisma.serviceRequest.delete(query);
  }

  async count(query: any) {
    return await prisma.serviceRequest.count(query);
  }

  // Additional methods that are being used
  async findById(id: string) {
    return await prisma.serviceRequest.findUnique({
      where: { id }
    });
  }

  async list(filter: any, skip: number, limit: number, actorType?: string, includeHidden?: boolean) {
    return await prisma.serviceRequest.findMany({
      where: filter,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
  }

  async getLatestPayment(requestId: string) {
    return await prisma.paymentRequest.findFirst({
      where: { request_id: requestId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async listDocs(requestId: string) {
    return await prisma.requestAttachment.findMany({
      where: { request_id: requestId }
    });
  }
}

export default new RequestRepository();
