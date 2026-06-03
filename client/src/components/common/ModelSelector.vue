<script setup>
import { computed } from 'vue';
import { useModeStore } from '@/stores/mode-store';
import { useModelStore } from '@/stores/model-store';

const modeStore = useModeStore();
const modelStore = useModelStore();

const currentModels = computed(() => {
  const modeModels = modelStore.currentModeModels[modeStore.currentMode];
  return modeModels || [];
});

const currentSelectedModel = computed(() => {
  return modelStore.selectedModel[modeStore.currentMode];
});

function onModelChange(value) {
  modelStore.selectModel(modeStore.currentMode, value);
}

const modelOptions = computed(() => {
  return currentModels.value.map(m => ({
    value: m.id,
    label: m.name
  }));
});
</script>

<template>
  <div class="sidebar-section">
    <div class="sidebar-section-title">模型选择</div>
    <t-select
      :value="currentSelectedModel"
      :options="modelOptions"
      @change="onModelChange"
      placeholder="选择模型"
      style="width: 100%;"
    />
    <div v-if="currentModels.length === 0" style="margin-top: 8px; font-size: 12px; color: #999;">
      暂无可用模型，请前往<router-link to="/models">模型配置</router-link>添加
    </div>
  </div>
</template>