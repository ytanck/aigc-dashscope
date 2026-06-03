<script setup>
import { ref, nextTick, watch, computed } from 'vue';
import { useChatStore } from '@/stores/chat-store';
import { useModelStore } from '@/stores/model-store';
import { useModeStore } from '@/stores/mode-store';
import { useFileUpload } from '@/composables/useFileUpload';

const chatStore = useChatStore();
const modelStore = useModelStore();
const modeStore = useModeStore();
const { uploading, uploadFile, detectAtImage } = useFileUpload();

const inputText = ref('');
const attachedImages = ref([]);
const messagesContainer = ref(null);
const fileInput = ref(null);

const canSend = computed(() => {
  return (inputText.value.trim() || attachedImages.value.length > 0) && !chatStore.isLoading;
});

// Auto scroll to bottom
watch(() => chatStore.messages.length, async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
});

watch(() => chatStore.lastMessage?.content, async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
});

function onSend() {
  const text = inputText.value.trim();
  const mention = detectAtImage(text);

  if (mention) {
    inputText.value = mention.cleanText;
    if (mention.type === 'url' && mention.imageUrl) {
      attachedImages.value.push({ url: mention.imageUrl });
    } else if (mention.type === 'upload') {
      fileInput.value?.click();
      return;
    }
    // If there's remaining text after @image, send it
    if (mention.cleanText || attachedImages.value.length > 0) {
      doSend();
    }
    return;
  }

  if (canSend.value) {
    doSend();
  }
}

function doSend() {
  const model = modelStore.selectedModel[modeStore.currentMode];
  const text = inputText.value.trim();
  const images = attachedImages.value.map(img => img.url || img);

  inputText.value = '';
  attachedImages.value = [];

  chatStore.sendMessage(model, text, images);
}

function handleFileSelect(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  for (const file of files) {
    uploadAndAttach(file);
  }
  fileInput.value.value = '';
}

async function uploadAndAttach(file) {
  try {
    const result = await uploadFile(file);
    const url = result.url.startsWith('http') ? result.url : window.location.origin + result.url;
    attachedImages.value.push({ url });
  } catch (err) {
    console.error('Upload failed:', err);
  }
}

function removeImage(index) {
  attachedImages.value.splice(index, 1);
}
</script>

<template>
  <div class="chat-panel">
    <!-- Messages -->
    <div class="chat-messages" ref="messagesContainer">
      <div v-if="chatStore.messages.length === 0" class="empty-state">
        <div class="icon">💬</div>
        <h3>开始对话</h3>
        <p>输入消息开始与 AI 交流</p>
        <p style="font-size: 12px; margin-top: 8px; color: #999;">
          提示：输入 <code>@image</code> 可以上传图片，或 <code>@image URL</code> 引用在线图片
        </p>
      </div>

      <div class="message-list" v-else>
        <div
          v-for="msg in chatStore.messages"
          :key="msg.id"
          :class="['message-item', msg.role]"
        >
          <div class="message-avatar" :class="msg.role">
            {{ msg.role === 'user' ? '我' : 'AI' }}
          </div>
          <div class="message-content">
            <!-- Images attached to user messages -->
            <div v-if="msg.images && msg.images.length > 0" style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
              <img
                v-for="(img, idx) in msg.images"
                :key="idx"
                :src="img"
                style="max-width: 200px; max-height: 200px; border-radius: 6px; object-fit: cover;"
              />
            </div>
            <!-- Text content -->
            <div v-if="msg.content" v-html="msg.content.replace(/\n/g, '<br>')"></div>
            <!-- Streaming indicator -->
            <span v-if="msg.isStreaming" class="streaming-cursor">▊</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="chat-input-area">
      <!-- Image previews -->
      <div v-if="attachedImages.length > 0" class="image-preview-list">
        <div
          v-for="(img, idx) in attachedImages"
          :key="idx"
          class="image-preview-item"
        >
          <img :src="img.url || img" />
          <button class="remove-btn" @click="removeImage(idx)">×</button>
        </div>
      </div>

      <!-- Hidden file input -->
      <input
        ref="fileInput"
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
        multiple
        style="display: none;"
        @change="handleFileSelect"
      />

      <!-- Input -->
      <div style="display: flex; gap: 8px; align-items: flex-end;">
        <textarea
          v-model="inputText"
          rows="1"
          placeholder="输入消息，@image 附加上下文图片..."
          @keydown.enter.exact.prevent="onSend"
          style="flex: 1; resize: none; padding: 8px 12px; border: 1px solid #dcdcdc; border-radius: 6px; font-size: 14px; font-family: inherit; line-height: 1.5; outline: none; min-height: 38px; max-height: 130px;"
        />
        <t-button
          v-if="!chatStore.isLoading"
          theme="primary"
          :disabled="!canSend"
          @click="onSend"
        >
          发送
        </t-button>
        <t-button
          v-else
          theme="danger"
          variant="outline"
          @click="chatStore.stopGeneration()"
        >
          停止
        </t-button>
        <t-button
          variant="outline"
          @click="fileInput?.click()"
          :disabled="uploading"
        >
          <template #icon><t-icon name="image" /></template>
        </t-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.streaming-cursor {
  animation: blink 1s infinite;
  color: var(--accent-color);
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
</style>