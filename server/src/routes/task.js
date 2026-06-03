const express = require('express');
const router = express.Router();
const { loadConfig } = require('../config');

const DASHSCOPE_TASK_URL = 'https://dashscope.aliyuncs.com/api/v1/tasks';

// GET /v1/tasks/:taskId - Generic task query (proxies to DashScope)
router.get('/:taskId', async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const config = loadConfig();
    const apiKey = process.env.DASHSCOPE_API_KEY || config.dashscopeApiKey || '';

    const response = await fetch(`${DASHSCOPE_TASK_URL}/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error('[task] Query failed:', err.message);
    return res.status(502).json({
      error: { message: `Failed to query task: ${err.message}`, type: 'proxy_error' }
    });
  }
});

module.exports = router;