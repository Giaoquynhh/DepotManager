import { PrismaClient } from '@prisma/client';
import FileUploadService from '../service/FileUploadService';

// Shared dependencies for request controllers
export const prisma = new PrismaClient();
export const fileUploadService = new FileUploadService(prisma);


