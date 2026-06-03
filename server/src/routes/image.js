const express = require('express');
const router = express.Router();
const { createImageGeneration, queryImageTask } = require('../services/kling-image');

// POST /v1/images/generations - Create image generation task
router.post('/generations', async (req, res, next) => {
  try {
    await createImageGeneration(req, res);
  } catch (err) {
    next(err);
  }
});

// GET /v1/images/tasks/:taskId - Query image generation task status
router.get('/tasks/:taskId', async (req, res, next) => {
  try {
    await queryImageTask(req, res);
  } catch (err) {
    next(err);
  }
});

module.exports = router;