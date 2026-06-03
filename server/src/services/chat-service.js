const { findChatModel } = require('../config');
const { toBase64DataUri } = require('./image-utils');

/**
 * Recursively convert local image URLs in messages to base64 data URIs.
 */
async function convertLocalImages(messages) {
  for (const msg of messages) {
    if (typeof msg.content === 'string') continue;
    if (!Array.isArray(msg.content)) continue;
    for (const part of msg.content) {
      if (part.type === 'image_url' && part.image_url?.url) {
        part.image_url.url = await toBase64DataUri(part.image_url.url);
      }
    }
  }
  return messages;
}

async function handleChatCompletion(req, res) {
  const { model, messages, stream, temperature, max_tokens, top_p } = req.body;

  if (!model) {
    return res.status(400).json({
      error: { message: 'Missing required parameter: model', type: 'invalid_request_error' }
    });
  }

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: { message: 'Missing required parameter: messages', type: 'invalid_request_error' }
    });
  }

  const modelConfig = findChatModel(model);
  if (!modelConfig) {
    return res.status(400).json({
      error: { message: `Unknown model: ${model}`, type: 'invalid_request_error' }
    });
  }

  const targetUrl = modelConfig.endpoint;
  const apiKey = modelConfig.apiKey;
  const defaults = modelConfig.defaultParams || {};

  // Convert local image URLs to base64 before sending to upstream
  const processedMessages = await convertLocalImages(messages);

  // Build request body with defaults
  const requestBody = {
    model: model,
    messages: processedMessages,
    stream: stream || false,
    temperature: temperature ?? defaults.temperature ?? 0.7,
    max_tokens: max_tokens ?? defaults.max_tokens ?? 4096,
    top_p: top_p ?? defaults.top_p ?? 1.0
  };

  // Remove undefined values
  Object.keys(requestBody).forEach(k => {
    if (requestBody[k] === undefined || requestBody[k] === null) {
      delete requestBody[k];
    }
  });

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };

  // Add extra headers from model config
  if (modelConfig.extraHeaders) {
    Object.assign(headers, modelConfig.extraHeaders);
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[chat] Upstream error ${response.status}:`, errorBody);
      return res.status(response.status).json({
        error: {
          message: `Upstream error: ${response.statusText}`,
          type: 'upstream_error',
          detail: errorBody
        }
      });
    }

    if (requestBody.stream) {
      return handleStreamResponse(response, res, model);
    } else {
      return handleJsonResponse(response, res, model);
    }
  } catch (err) {
    console.error('[chat] Request failed:', err.message);
    return res.status(502).json({
      error: { message: `Failed to reach upstream: ${err.message}`, type: 'proxy_error' }
    });
  }
}

async function handleJsonResponse(response, res, model) {
  const data = await response.json();
  // Replace model name in response
  if (data.model) {
    data.model = model;
  }
  return res.json(data);
}

async function handleStreamResponse(response, res, requestModel) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6);
          if (dataStr === '[DONE]') {
            res.write('data: [DONE]\n\n');
            continue;
          }
          try {
            const parsed = JSON.parse(dataStr);
            // Replace model name in delta
            if (parsed.model) {
              parsed.model = requestModel;
            }
            res.write(`data: ${JSON.stringify(parsed)}\n\n`);
          } catch {
            // Pass through unparseable lines
            res.write(`${line}\n\n`);
          }
        } else {
          res.write(`${line}\n`);
        }
      }
    }
  } catch (err) {
    console.error('[chat] Stream error:', err.message);
  } finally {
    res.end();
  }
}

module.exports = { handleChatCompletion };