import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

export class RepairImageService {
  private ensureDir(dir: string) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  getMulter() {
    const uploadDir = path.join(__dirname, '../../../uploads/repairs');
    this.ensureDir(uploadDir);
    const storage = multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, uploadDir),
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = `repair_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`;
        cb(null, name);
      }
    });
    const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
      if (file.mimetype.startsWith('image/')) cb(null, true);
      else cb(new Error('Only image files are allowed'));
    };
    return multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });
  }

  async upload(ticketId: string, files: Express.Multer.File[]) {
    const ticket = await prisma.repairTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new Error('REPAIR_TICKET_NOT_FOUND');

    const created = [] as any[];
    for (const f of files) {
      const rel = `/backend/uploads/repairs/${f.filename}`;
      const rec = await prisma.repairImage.create({
        data: {
          repair_ticket_id: ticketId,
          file_name: f.originalname,
          file_type: f.mimetype,
          file_size: f.size,
          storage_url: rel
        }
      });
      created.push(rec);
    }
    return created;
  }

  async list(ticketId: string) {
    return prisma.repairImage.findMany({
      where: { repair_ticket_id: ticketId },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export const repairImageService = new RepairImageService();


