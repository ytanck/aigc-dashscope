import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { sendChatMessageStream } from '@/api/chat-api';

export const useChatStore = defineStore('chat', () => {
  const messages = ref([]);
  const isLoading = ref(false);
  const abortController = ref(null);

  const lastMessage = computed(() => {
    return messages.value.length > 0 ? messages.value[messages.value.length - 1] : null;
  });

  function addMessage(role, content, images = []) {
    const msg = {
      id: Date.now().toString(),
      role,
      content,
      images,
      timestamp: new Date().toISOString()
    };
    messages.value.push(msg);
    return msg;
  }

  function addAssistantMessage() {
    const msg = {
      id: Date.now().toString(),
      role: 'assistant',
      content: '',
      images: [],
      timestamp: new Date().toISOString(),
      isStreaming: true
    };
    messages.value.push(msg);
    return msg;
  }

  function appendToLastMessage(delta) {
    const last = messages.value[messages.value.length - 1];
    if (last && last.role === 'assistant') {
      if (delta.content) {
        last.content += delta.content;
      }
    }
  }

  function finishStreaming() {
    const last = messages.value[messages.value.length - 1];
    if (last) {
      last.isStreaming = false;
    }
  }

  async function sendMessage(model, text, images = []) {
    if (isLoading.value) return;
    if (!model) {
      console.error('No model selected');
      return;
    }

    // Add user message
    addMessage('user', text, images);

    // Build content blocks for the CURRENT message only
    const content = [];
    if (text) {
      content.push({ type: 'text', text });
    }
    for (const img of images) {
      content.push({
        type: 'image_url',
        image_url: { url: img }
      });
    }

    // Add assistant placeholder
    addAssistantMessage();

    isLoading.value = true;
    const controller = new AbortController();
    abortController.value = controller;

    await sendChatMessageStream(
      {
        model,
        messages: buildMessagesArray()
      },
      {
        onDelta: (delta) => {
          appendToLastMessage(delta);
        },
        onDone: () => {
          finishStreaming();
          isLoading.value = false;
          abortController.value = null;
        },
        onError: (err) => {
          console.error('Chat error:', err);
          const last = messages.value[messages.value.length - 1];
          if (last && last.role === 'assistant') {
            last.content = `[错误] ${err.message}`;
            last.isStreaming = false;
          }
          isLoading.value = false;
          abortController.value = null;
        },
        signal: controller.signal
      }
    );
  }

  function buildMessagesArray() {
    const result = [];
    for (const msg of messages.value) {
      if (msg.role === 'system') {
        result.push({ role: 'system', content: msg.content });
      } else if (msg.role === 'user' && !msg.isStreaming) {
        const content = [];
        if (msg.content) {
          content.push({ type: 'text', text: msg.content });
        }
        for (const img of msg.images) {
          content.push({
            type: 'image_url',
            image_url: { url: img }
          });
        }
        result.push({
          role: 'user',
          content: content.length === 1 && content[0].type === 'text'
            ? content[0].text
            : content
        });
      } else if (msg.role === 'assistant' && !msg.isStreaming && msg.content) {
        result.push({ role: 'assistant', content: msg.content });
      }
      // Skip the streaming assistant message
    }
    return result;
  }

  function stopGeneration() {
    if (abortController.value) {
      abortController.value.abort();
      abortController.value = null;
    }
    finishStreaming();
    isLoading.value = false;
  }

  function clearMessages() {
    messages.value = [];
  }

  return {
    messages,
    isLoading,
    lastMessage,
    addMessage,
    sendMessage,
    stopGeneration,
    clearMessages
  };
});