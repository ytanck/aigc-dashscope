const express = require('express');
const router = express.Router();
const { handleChatCompletion } = require('../services/chat-service');

// POST /v1/chat/completions - OpenAI compatible chat completions
router.post('/completions', async (req, res, next) => {
  try {
    await handleChatCompletion(req, res);
  } catch (err) {
    next(err);
  }
});

module.exports = router;