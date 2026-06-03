const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const id = uuidv4();
    cb(null, `${id}${ext}`);
  }
});

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: ${ALLOWED_TYPES.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});

function handleFileUpload(req, res) {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            error: { message: 'File too large. Maximum size is 10MB.', type: 'file_too_large' }
          });
        }
        return res.status(400).json({
          error: { message: err.message, type: 'upload_error' }
        });
      }
      return res.status(400).json({
        error: { message: err.message, type: 'invalid_file' }
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: { message: 'No file provided', type: 'missing_file' }
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    return res.json({
      id: path.parse(req.file.filename).name,
      url: fileUrl,
      originalUrl: fileUrl,
      filename: req.file.originalname,
      size: req.file.size,
      mime_type: req.file.mimetype
    });
  });
}

module.exports = { handleFileUpload };