import { prisma } from './dependencies';

// Get list of requests
export const getRequests = async (req: any, res: any) => {
    try {
        const { type, status, statuses, page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const where: any = { depot_deleted_at: null };
        if (type) { where.type = type; }
        if (status) { 
            where.status = status; 
        } else if (statuses) {
            // Hỗ trợ multiple statuses (comma-separated)
            const statusArray = statuses.split(',').map((s: string) => s.trim());
            where.status = { in: statusArray };
        }
        // Không thêm filter mặc định để các trang khác vẫn hoạt động bình thường

        const requests = await prisma.serviceRequest.findMany({
            where,
            include: {
                shipping_line: { select: { name: true } },
                container_type: { select: { code: true } },
                customer: { select: { name: true } },
                lower_customer: { select: { id: true, name: true } },
                vehicle_company: { select: { name: true } },
                attachments: {
                    where: { deleted_at: null },
                    select: { id: true, file_name: true, file_type: true, file_size: true, storage_url: true, uploaded_at: true }
                },
                invoices: {
                    where: { source_module: 'REQUESTS' },
                    select: { id: true, total_amount: true, subtotal: true, tax_amount: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip: offset,
            take: parseInt(limit)
        });

        const total = await prisma.serviceRequest.count({ where });

        res.json({
            success: true,
            data: requests,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error: any) {
        console.error('Get requests error:', error);
        res.status(500).json({ success: false, message: error.message || 'Có lỗi xảy ra khi lấy danh sách yêu cầu' });
    }
};


