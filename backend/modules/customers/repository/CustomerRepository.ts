import { prisma } from '../../../shared/config/database';

export class CustomerRepository {
	create(data: any) { return prisma.customer.create({ data }); }
	findById(id: string) { return prisma.customer.findUnique({ where: { id } }); }
	findByCode(code: string) { return prisma.customer.findUnique({ where: { code } }); }
	findByTaxCode(tax_code: string) { return prisma.customer.findUnique({ where: { tax_code } }); }
	findByName(name: string) { return prisma.customer.findFirst({ where: { name } }); }
	updateById(id: string, data: any) { return prisma.customer.update({ where: { id }, data }); }
	deleteById(id: string) { return prisma.customer.delete({ where: { id } }); }
	list(filter: any, skip: number, limit: number) { return prisma.customer.findMany({ where: filter, orderBy: { createdAt: 'desc' }, skip, take: limit }); }
	count(filter: any) { return prisma.customer.count({ where: filter }); }
}

export default new CustomerRepository();
