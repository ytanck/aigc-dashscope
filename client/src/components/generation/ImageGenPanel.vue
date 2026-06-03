<script setup>
import { ref } from 'vue';
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

const selectedModel = ref(modelStore.selectedImageModel);

async function onGenerate() {
  if (!prompt.value.trim() && attachedImages.value.length === 0) return;

  const model = modelStore.selectedModel[modeStore.currentMode];

  // Map attached images to media
  const media = attachedImages.value.map(img => ({
    url: img.url || img,
    mediaType: 'refer'
  }));

  await submitGeneration('image', model, prompt.value.trim(), media);

  // Don't clear prompt so user can iterate
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
  <div class="gen-panel">
    <div class="gen-prompt-area">
      <h3 style="margin-bottom: 16px;">
        🎨 图像生成
      </h3>

      <!-- Image previews -->
      <div v-if="attachedImages.length > 0" class="image-preview-list">
        <div v-for="(img, idx) in attachedImages" :key="idx" class="image-preview-item">
          <img :src="img.url" />
          <button class="remove-btn" @click="removeImage(idx)">×</button>
        </div>
      </div>

      <!-- Hidden file input -->
      <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/jpg,image/gif,image/webp" multiple
             style="display: none;" @change="handleFileSelect" />

      <div class="input-wrapper">
        <textarea
          v-model="prompt"
          rows="2"
          placeholder="描述你想要生成的图像..."
          @keydown.enter.exact.prevent="onGenerate"
          style="flex: 1; resize: none; padding: 10px 14px; border: none; border-radius: 6px; font-size: 14px; font-family: inherit; line-height: 1.5; outline: none; min-height: 48px; max-height: 110px; background: transparent;"
        />
        <t-button theme="primary" :disabled="genStore.isGenerating" @click="onGenerate">
          {{ genStore.isGenerating ? '生成中...' : '生成' }}
        </t-button>
        <t-button variant="outline" @click="fileInput?.click()" :disabled="uploading">
          <template #icon><t-icon name="image" /></template>
          参考图
        </t-button>
      </div>
      <div v-if="error" style="color: #e34d59; font-size: 13px; margin-top: 8px;">{{ error }}</div>
    </div>

    <!-- Results -->
    <div class="gen-results">
      <div v-if="genStore.results.length === 0 && genStore.tasks.length === 0" class="empty-state">
        <div class="icon">🎨</div>
        <h3>开始创作</h3>
        <p>输入提示词生成图像</p>
      </div>

      <!-- Active tasks -->
      <div v-if="genStore.tasks.filter(t => t.type === 'image').filter(t => t.status === 'PENDING' || t.status === 'RUNNING').length > 0" style="margin-bottom: 16px;">
        <div v-for="task in genStore.tasks.filter(t => t.type === 'image').filter(t => t.status === 'PENDING' || t.status === 'RUNNING')" :key="task.id" class="task-progress">
          <t-loading size="small" />
          <span>图像生成中... ({{ task.status === 'PENDING' ? '排队' : '处理' }})</span>
        </div>
      </div>

      <!-- Results grid -->
      <div class="gen-results-grid">
        <div v-for="result in genStore.results.filter(r => r.type === 'image')" :key="result.id" class="gen-result-card">
          <img :src="result.url" :alt="result.prompt" loading="lazy" />
        </div>
      </div>
    </div>
  </div>
</template>