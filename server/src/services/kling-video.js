const { findVideoModel, loadConfig } = require('../config');
const { toBase64DataUri } = require('./image-utils');

const DASHSCOPE_TASK_URL = 'https://dashscope.aliyuncs.com/api/v1/tasks';

function getApiKey(modelConfig) {
  if (modelConfig.apiKey) return modelConfig.apiKey;
  const cfg = loadConfig();
  return process.env.DASHSCOPE_API_KEY || cfg.dashscopeApiKey || '';
}

async function createVideoGeneration(req, res) {
  const { model, input, parameters } = req.body;

  if (!model) {
    return res.status(400).json({
      error: { message: 'Missing required parameter: model', type: 'invalid_request_error' }
    });
  }

  const modelConfig = findVideoModel(model);
  if (!modelConfig) {
    return res.status(400).json({
      error: { message: `Unknown video model: ${model}`, type: 'invalid_request_error' }
    });
  }

  const apiKey = getApiKey(modelConfig);
  if (!apiKey) {
    return res.status(500).json({
      error: { message: 'API key not configured for this model', type: 'config_error' }
    });
  }

  // Build Kling video generation request
  const klingRequest = {
    model: modelConfig.id,
    input: {
      prompt: input?.prompt || ''
    },
    parameters: {
      mode: parameters?.mode || 'std',
      aspect_ratio: parameters?.aspect_ratio || '16:9',
      duration: parameters?.duration || 5,
      audio: parameters?.audio !== undefined ? parameters.audio : false,
      watermark: parameters?.watermark !== undefined ? parameters.watermark : true
    }
  };

  // Handle media (first_frame, last_frame, refer images) - convert local files to base64
  if (input?.media && Array.isArray(input.media)) {
    klingRequest.input.media = await Promise.all(input.media.map(async (m) => ({
      ...m,
      url: await toBase64DataUri(m.url)
    })));
  }

  // Handle negative prompt
  if (input?.negative_prompt) {
    klingRequest.input.negative_prompt = input.negative_prompt;
  }

  console.log('[video] Creating generation:', JSON.stringify(klingRequest, null, 2));

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
      console.error('[video] Upstream error:', data);
      return res.status(response.status || 500).json({
        error: {
          message: data.message || 'Video generation failed',
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
    console.error('[video] Request failed:', err.message);
    return res.status(502).json({
      error: { message: `Failed to reach upstream: ${err.message}`, type: 'proxy_error' }
    });
  }
}

async function queryVideoTask(req, res) {
  const { taskId } = req.params;
  const { model: modelId } = req.query;

  let apiKey = process.env.DASHSCOPE_API_KEY;
  if (modelId) {
    const modelConfig = findVideoModel(modelId);
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
    console.error('[video] Task query failed:', err.message);
    return res.status(502).json({
      error: { message: `Failed to query task: ${err.message}`, type: 'proxy_error' }
    });
  }
}

module.exports = { createVideoGeneration, queryVideoTask };