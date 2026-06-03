const { findVideoModel, loadConfig } = require('../config');
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

  const requestBody = {
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

  if (input?.media && Array.isArray(input.media)) {
    requestBody.input.media = await Promise.all(input.media.map(async (m) => ({
      ...m,
      url: await toBase64DataUri(m.url)
    })));
  }

  if (input?.negative_prompt) {
    requestBody.input.negative_prompt = input.negative_prompt;
  }

  console.log('[video] Creating generation (async=%s):', isAsync(modelConfig), JSON.stringify(requestBody).slice(0, 300));

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
      console.error('[video] Upstream error:', JSON.stringify(data).slice(0, 500));
      return res.status(response.status || 500).json({
        error: {
          message: data.message || 'Video generation failed',
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

    // Sync model: extract results directly
    const results = [];
    if (data.output?.video_url) {
      results.push({
        url: data.output.video_url,
        coverUrl: data.output.watermark_video_url || data.output.video_url,
        type: 'video'
      });
    }
    if (data.output?.results) {
      for (const r of data.output.results) {
        results.push({ url: r.url || r.video_url, type: 'video' });
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
      headers: { 'Authorization': `Bearer ${apiKey}` }
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