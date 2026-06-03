const express = require('express');
const router = express.Router();
const { handleFileUpload } = require('../services/file-upload');

// POST /v1/files/upload - Upload a file
router.post('/upload', (req, res, next) => {
  try {
    handleFileUpload(req, res);
  } catch (err) {
    next(err);
  }
});

module.exports = router;