<script setup>
import { ref, computed } from 'vue';
import { useModelStore } from '@/stores/model-store';
import { useModeStore } from '@/stores/mode-store';
import { useGenerationStore } from '@/stores/generation-store';
import { useGeneration } from '@/composables/useGeneration';
import { useFileUpload } from '@/composables/useFileUpload';

const modelStore = useModelStore();
const modeStore = useModeStore();
const genStore = useGenerationStore();
const { error, submitGeneration } = useGeneration();
const { uploading, uploadFile } = useFileUpload();

const prompt = ref('');
const attachedImages = ref([]);
const fileInput = ref(null);

// Get current model config for constraints
const currentModel = computed(() => {
  const modelId = modelStore.selectedModel[modeStore.currentMode];
  return modelStore.getModelConfig(modelId);
});


async function onGenerate() {
  if (!prompt.value.trim() && attachedImages.value.length === 0) return;

  const model = modelStore.selectedModel[modeStore.currentMode];

  const media = attachedImages.value.map((img, idx) => ({
    url: img.url || img,
    mediaType: idx === 0 ? 'first_frame' : 'refer'
  }));

  await submitGeneration('video', model, prompt.value.trim(), media);
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
    attachedImages.value.push({ url, mediaType: attachedImages.value.length === 0 ? 'first_frame' : 'refer' });
  } catch (err) {
    console.error('Upload failed:', err);
  }
}

function removeImage(index) {
  attachedImages.value.splice(index, 1);
}
</script>

<template>
  <div class="gen-panel">
    <div class="gen-prompt-area">
      <h3 style="margin-bottom: 16px;">
        🎬 视频生成
      </h3>

      <!-- Image previews -->
      <div v-if="attachedImages.length > 0" class="image-preview-list">
        <div v-for="(img, idx) in attachedImages" :key="idx" class="image-preview-item">
          <img :src="img.url" />
          <div style="position: absolute; top: 0; left: 0; right: 0; background: rgba(0,0,0,0.6); color: white; font-size: 10px; padding: 2px 4px; text-align: center;">
            {{ img.mediaType === 'first_frame' ? '首帧' : '参考' }}
          </div>
          <button class="remove-btn" @click="removeImage(idx)">×</button>
        </div>
      </div>

      <!-- Hidden file input -->
      <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/jpg,image/gif,image/webp" multiple
             style="display: none;" @change="handleFileSelect" />

      <div style="display: flex; gap: 8px; align-items: flex-end;">
        <textarea
          v-model="prompt"
          rows="2"
          placeholder="描述你想要生成的视频内容..."
          @keydown.enter.exact.prevent="onGenerate"
          style="flex: 1; resize: none; padding: 8px 12px; border: 1px solid #dcdcdc; border-radius: 6px; font-size: 14px; font-family: inherit; line-height: 1.5; outline: none; min-height: 52px; max-height: 110px;"
        />
        <t-button theme="primary" :disabled="genStore.isGenerating" @click="onGenerate">
          {{ genStore.isGenerating ? '生成中...' : '生成' }}
        </t-button>
        <t-button variant="outline" @click="fileInput?.click()" :disabled="uploading">
          <template #icon><t-icon name="image" /></template>
          首帧图
        </t-button>
      </div>
      <div v-if="error" style="color: #e34d59; font-size: 13px; margin-top: 8px;">{{ error }}</div>
    </div>

    <!-- Results -->
    <div class="gen-results">
      <div v-if="genStore.results.filter(r => r.type === 'video').length === 0 && genStore.tasks.filter(t => t.type === 'video').length === 0" class="empty-state">
        <div class="icon">🎬</div>
        <h3>开始创作</h3>
        <p>输入提示词生成视频</p>
      </div>

      <!-- Active tasks -->
      <div v-if="genStore.tasks.filter(t => t.type === 'video').filter(t => t.status === 'PENDING' || t.status === 'RUNNING').length > 0" style="margin-bottom: 16px;">
        <div v-for="task in genStore.tasks.filter(t => t.type === 'video').filter(t => t.status === 'PENDING' || t.status === 'RUNNING')" :key="task.id" class="task-progress">
          <t-loading size="small" />
          <span>视频生成中... ({{ task.status === 'PENDING' ? '排队' : '处理' }})</span>
        </div>
      </div>

      <!-- Results grid -->
      <div class="gen-results-grid">
        <div v-for="result in genStore.results.filter(r => r.type === 'video')" :key="result.id" class="gen-result-card">
          <video :src="result.url" controls preload="metadata" style="width: 100%; aspect-ratio: 16/9; object-fit: cover;" />
        </div>
      </div>

      <!-- Failed tasks -->
      <div v-if="genStore.tasks.filter(t => t.status === 'FAILED').length > 0" style="margin-top: 16px;">
        <div v-for="task in genStore.tasks.filter(t => t.status === 'FAILED')" :key="task.id"
             style="padding: 12px; background: #fff0f0; border-radius: 8px; font-size: 13px; color: #e34d59; margin-bottom: 8px;">
          ❌ 生成失败：{{ task.error || '未知错误' }}
        </div>
      </div>
    </div>
  </div>
</template>