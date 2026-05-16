import { diskStorage } from 'multer';
import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as path from 'path';
import type { Request } from 'express';

// Allowed MIME types for image uploads
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const productImageStorage = diskStorage({
  // Where to save uploaded files on disk
  destination: './uploads/products',
  // Generate unique filenames: uuid-sanitizedOriginalName
  // UUID prefix prevents collisions; keeping the original name aids debugging.
  filename: (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void,
  ) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .substring(0, 50);
    cb(null, `${randomUUID()}-${baseName}${ext}`);
  },
});

// File filter: reject anything that isn't JPEG, PNG, or WebP
export const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    cb(
      new BadRequestException(
        `Invalid file type: ${file.mimetype}. Allowed: JPEG, PNG, WebP`,
      ),
      false,
    );
    return;
  }
  cb(null, true);
};

export const productImageMulterOptions = {
  storage: productImageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10, // max 10 images per upload
  },
};
