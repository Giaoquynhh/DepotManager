export interface UploadAttachmentDto {
  requestId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  file_type: string;
  file_size: number;
  file_name: string;
  storage_url: string;
}

export interface AttachmentResponseDto {
  id: string;
  requestId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  filePath: string;
  createdAt: Date;
  updatedAt: Date;
  request_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_url: string;
  uploader_id: string;
  uploader_role: string;
  uploaded_at: string;
}

export const FILE_UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  MAX_SIZE_MB: 10,
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
};
