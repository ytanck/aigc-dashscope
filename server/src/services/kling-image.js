const { findImageModel } = require('../config');
const { loadConfig } = require('../config');
const { toBase64DataUri } = require('./image-utils');

const DASHSCOPE_TASK_URL = 'https://dashscope.aliyuncs.com/api/v1/tasks';

function getApiKey(modelConfig) {
  if (modelConfig.apiKey) return modelConfig.apiKey;
  const cfg = loadConfig();
  return process.env.DASHSCOPE_API_KEY || cfg.dashscopeApiKey || '';
}

function isAsync(modelConfig) {
  // Default to sync (false), only async if explicitly set to true
  return modelConfig.async === true;
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

  // Build content array (Kling format: { text: "..." } / { image: "url" })
  const content = [];
  if (input?.prompt) {
    content.push({ text: input.prompt });
  }
  if (input?.reference_images && Array.isArray(input.reference_images)) {
    for (const refImg of input.reference_images) {
      const img = await toBase64DataUri(refImg);
      content.push({ image: img });
    }
  }
  if (content.length === 0) {
    return res.status(400).json({
      error: { message: 'At least one of prompt or reference_images is required', type: 'invalid_request_error' }
    });
  }

  const requestBody = {
    model: modelConfig.id,
    input: {
      messages: [{ role: 'user', content }]
    },
    parameters: {
      n: parameters?.n || 1,
      aspect_ratio: parameters?.aspect_ratio || '16:9',
      resolution: parameters?.resolution || '1k',
      watermark: parameters?.watermark !== undefined ? parameters.watermark : false
    }
  };

  console.log('[image] Creating generation (async=%s):', isAsync(modelConfig), JSON.stringify(requestBody).slice(0, 300));

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };
  if (isAsync(modelConfig)) {
    headers['X-DashScope-Async'] = 'enable';
  }

  try {
    const response = await fetch(modelConfig.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok || data.code) {
      console.error('[image] Upstream error:', JSON.stringify(data).slice(0, 500));
      return res.status(response.status || 500).json({
        error: {
          message: data.message || 'Image generation failed',
          code: data.code || 'upstream_error',
          detail: data
        }
      });
    }

    // Async model: return task_id for polling
    if (isAsync(modelConfig)) {
      return res.json({
        request_id: data.request_id,
        output: {
          task_id: data.output?.task_id || '',
          task_status: data.output?.task_status || 'PENDING'
        }
      });
    }

    // Sync model: extract results directly and return as SUCCEEDED
    const results = [];
    if (data.output?.results) {
      for (const r of data.output.results) {
        results.push({ url: r.url || r.image, type: 'image' });
      }
    } else if (data.output?.choices) {
      for (const choice of data.output.choices) {
        const contents = choice.message?.content || [];
        for (const c of contents) {
          if (c.image) results.push({ url: c.image, type: 'image' });
        }
      }
    }

    return res.json({
      request_id: data.request_id,
      output: {
        results,
        task_status: 'SUCCEEDED'
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
      headers: { 'Authorization': `Bearer ${apiKey}` }
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