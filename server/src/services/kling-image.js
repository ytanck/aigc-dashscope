const { findImageModel } = require('../config');
const { loadConfig } = require('../config');
const { toBase64DataUri } = require('./image-utils');

const DASHSCOPE_TASK_URL = 'https://dashscope.aliyuncs.com/api/v1/tasks';

function getApiKey(modelConfig) {
  if (modelConfig.apiKey) return modelConfig.apiKey;
  const cfg = loadConfig();
  return process.env.DASHSCOPE_API_KEY || cfg.dashscopeApiKey || '';
}

async function createImageGeneration(req, res) {
  const { model, input, parameters } = req.body;

  if (!model) {
    return res.status(400).json({
      error: { message: 'Missing required parameter: model', type: 'invalid_request_error' }
    });
  }

  const modelConfig = findImageModel(model);
  if (!modelConfig) {
    return res.status(400).json({
      error: { message: `Unknown image model: ${model}`, type: 'invalid_request_error' }
    });
  }

  const apiKey = getApiKey(modelConfig);
  if (!apiKey) {
    return res.status(500).json({
      error: { message: 'API key not configured for this model', type: 'config_error' }
    });
  }

  // Build Kling image generation request
  // Kling API uses { text: "..." } and { image: "url" } format (NOT OpenAI format)
  const content = [];
  if (input?.prompt) {
    content.push({ text: input.prompt });
  }
  // Handle image references - convert local files to base64 (with resize)
  if (input?.reference_images && Array.isArray(input.reference_images)) {
    for (const refImg of input.reference_images) {
      const img = await toBase64DataUri(refImg);
      content.push({ image: img });
    }
  }
  // Must have at least text or image
  if (content.length === 0) {
    return res.status(400).json({
      error: { message: 'At least one of prompt or reference_images is required', type: 'invalid_request_error' }
    });
  }

  const klingRequest = {
    model: modelConfig.id,
    input: {
      messages: [{
        role: 'user',
        content
      }]
    },
    parameters: {
      n: parameters?.n || 1,
      aspect_ratio: parameters?.aspect_ratio || '16:9',
      resolution: parameters?.resolution || '1k',
      watermark: parameters?.watermark !== undefined ? parameters.watermark : false
    }
  };

  console.log('[image] Creating generation:', JSON.stringify(klingRequest, null, 2));

  try {
    const response = await fetch(modelConfig.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-DashScope-Async': 'enable'
      },
      body: JSON.stringify(klingRequest)
    });

    const data = await response.json();

    if (!response.ok || data.code) {
      console.error('[image] Upstream error:', data);
      return res.status(response.status || 500).json({
        error: {
          message: data.message || 'Image generation failed',
          code: data.code || 'upstream_error',
          detail: data
        }
      });
    }

    return res.json({
      request_id: data.request_id,
      output: {
        task_id: data.output?.task_id || '',
        task_status: data.output?.task_status || 'PENDING'
      }
    });
  } catch (err) {
    console.error('[image] Request failed:', err.message);
    return res.status(502).json({
      error: { message: `Failed to reach upstream: ${err.message}`, type: 'proxy_error' }
    });
  }
}

async function queryImageTask(req, res) {
  const { taskId } = req.params;
  const { model: modelId } = req.query;

  // Find the model to get API key
  let apiKey = process.env.DASHSCOPE_API_KEY;
  if (modelId) {
    const modelConfig = findImageModel(modelId);
    if (modelConfig) {
      apiKey = getApiKey(modelConfig);
    }
  }

  try {
    const response = await fetch(`${DASHSCOPE_TASK_URL}/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error('[image] Task query failed:', err.message);
    return res.status(502).json({
      error: { message: `Failed to query task: ${err.message}`, type: 'proxy_error' }
    });
  }
}

module.exports = { createImageGeneration, queryImageTask };