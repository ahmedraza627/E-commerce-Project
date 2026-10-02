import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { ApiError } from '../utils/apiError.js';

const UPLOAD_DIR = path.resolve('uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true }); // ensure the target exists at boot

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

/** Disk storage with random names — wired into admin product create/update. */
export const uploadProductImages = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) =>
      cb(null, `${crypto.randomBytes(12).toString('hex')}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 4 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(ApiError.badRequest('Only JPEG, PNG, WebP or AVIF images are allowed'));
    }
    cb(null, true);
  },
});
