import client from './client';

/**
 * Send a chat completion request (non-streaming).
 * For streaming, use chatApiStream instead.
 */
export async function sendChatMessage({ model, messages, temperature, max_tokens }) {
  const response = await client.post('/chat/completions', {
    model,
    messages,
    stream: false,
    temperature,
    max_tokens
  });
  return response.data;
}

/**
 * Send a chat completion request with SSE streaming.
 * @param {Object} params - The request parameters
 * @param {Function} onDelta - Called with each delta chunk
 * @param {Function} onDone - Called when streaming completes
 * @param {Function} onError - Called on error
 * @param {AbortSignal} signal - AbortSignal for cancellation
 */
export async function sendChatMessageStream({ model, messages, temperature, max_tokens }, { onDelta, onDone, onError, signal }) {
  try {
    const response = await fetch('/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        temperature,
        max_tokens
      }),
      signal
    });

    if (!response.ok) {
      const errorBody = await response.text();
      onError(new Error(`HTTP ${response.status}: ${errorBody}`));
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

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
            onDone();
            return;
          }
          try {
            const parsed = JSON.parse(dataStr);
            const delta = parsed.choices?.[0]?.delta;
            if (delta) {
              onDelta(delta);
            }
          } catch {
            // Skip unparseable lines
          }
        }
      }
    }

    onDone();
  } catch (err) {
    if (err.name === 'AbortError') {
      onDone();
    } else {
      onError(err);
    }
  }
}