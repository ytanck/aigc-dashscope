<script setup>
import { computed } from 'vue';
import { useModeStore } from '@/stores/mode-store';
import { useGenerationStore } from '@/stores/generation-store';
import { useModelStore } from '@/stores/model-store';

const modeStore = useModeStore();
const genStore = useGenerationStore();
const modelStore = useModelStore();

const currentModel = computed(() => {
  const modelId = modelStore.selectedModel[modeStore.currentMode];
  return modelStore.getModelConfig(modelId);
});

const showResolution = computed(() => modeStore.isImageMode);
const showCount = computed(() => modeStore.isImageMode);
const showMode = computed(() => modeStore.isVideoMode);
const showDuration = computed(() => modeStore.isVideoMode);
const showAudio = computed(() => modeStore.isVideoMode && currentModel.value?.supportsAudio);

const resolutionOptions = [
  { value: '1k', label: '1K' },
  { value: '2k', label: '2K' },
  { value: '4k', label: '4K' }
];

const aspectRatioOptions = [
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '1:1', label: '1:1' }
];

const modeOptions = [
  { value: 'std', label: '标准' },
  { value: 'pro', label: '专业' }
];
</script>

<template>
  <div class="sidebar-section" v-if="modeStore.isGenerationMode">
    <div class="sidebar-section-title">生成参数</div>
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <!-- Aspect Ratio -->
      <div>
        <div style="font-size: 12px; color: #999; margin-bottom: 4px;">画面比例</div>
        <t-select
          :value="genStore.genParams.aspect_ratio"
          :options="aspectRatioOptions"
          @change="genStore.updateParam('aspect_ratio', $event)"
          size="small"
          style="width: 100%;"
        />
      </div>

      <!-- Resolution (image only) -->
      <div v-if="showResolution">
        <div style="font-size: 12px; color: #999; margin-bottom: 4px;">分辨率</div>
        <t-select
          :value="genStore.genParams.resolution"
          :options="resolutionOptions"
          @change="genStore.updateParam('resolution', $event)"
          size="small"
          style="width: 100%;"
        />
      </div>

      <!-- Count (image only) -->
      <div v-if="showCount">
        <div style="font-size: 12px; color: #999; margin-bottom: 4px;">
          生成数量: {{ genStore.genParams.n }}
        </div>
        <t-slider
          :value="genStore.genParams.n"
          :min="1"
          :max="currentModel?.maxN || 9"
          :step="1"
          @change="genStore.updateParam('n', $event)"
        />
      </div>

      <!-- Mode (video only) -->
      <div v-if="showMode">
        <div style="font-size: 12px; color: #999; margin-bottom: 4px;">品质模式</div>
        <t-select
          :value="genStore.genParams.mode"
          :options="modeOptions"
          @change="genStore.updateParam('mode', $event)"
          size="small"
          style="width: 100%;"
        />
      </div>

      <!-- Duration (video only) -->
      <div v-if="showDuration">
        <div style="font-size: 12px; color: #999; margin-bottom: 4px;">
          时长: {{ genStore.genParams.duration }}秒
        </div>
        <t-slider
          :value="genStore.genParams.duration"
          :min="currentModel?.minDuration || 3"
          :max="currentModel?.maxDuration || 15"
          :step="1"
          @change="genStore.updateParam('duration', $event)"
        />
      </div>

      <!-- Audio (video only) -->
      <div v-if="showAudio" style="display: flex; align-items: center; justify-content: space-between;">
        <span style="font-size: 12px; color: #999;">生成音频</span>
        <t-switch
          :value="genStore.genParams.audio"
          @change="genStore.updateParam('audio', $event)"
          size="small"
        />
      </div>

      <!-- Watermark -->
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <span style="font-size: 12px; color: #999;">添加水印</span>
        <t-switch
          :value="genStore.genParams.watermark"
          @change="genStore.updateParam('watermark', $event)"
          size="small"
        />
      </div>
    </div>
  </div>
</template>