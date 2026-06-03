const express = require('express');
const router = express.Router();
const { createVideoGeneration, queryVideoTask } = require('../services/kling-video');

// POST /v1/video/generations - Create video generation task
router.post('/generations', async (req, res, next) => {
  try {
    await createVideoGeneration(req, res);
  } catch (err) {
    next(err);
  }
});

// GET /v1/video/tasks/:taskId - Query video generation task status
router.get('/tasks/:taskId', async (req, res, next) => {
  try {
    await queryVideoTask(req, res);
  } catch (err) {
    next(err);
  }
});

module.exports = router;