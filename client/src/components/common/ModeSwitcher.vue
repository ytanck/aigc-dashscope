<script setup>
import { useModeStore } from '@/stores/mode-store';

const modeStore = useModeStore();

const modes = [
  { value: 'chat', label: '💬 普通对话' },
  { value: 'image', label: '🎨 图像生成' },
  { value: 'video', label: '🎬 视频生成' }
];

function onModeChange(value) {
  modeStore.setMode(value);
}
</script>

<template>
  <div class="sidebar-section">
    <div class="sidebar-section-title">功能模式</div>
    <t-radio-group
      :value="modeStore.currentMode"
      @change="onModeChange"
      variant="default-filled"
      style="display: flex; flex-direction: column; gap: 4px;"
    >
      <t-radio
        v-for="m in modes"
        :key="m.value"
        :value="m.value"
        style="margin-right: 0;"
      >
        {{ m.label }}
      </t-radio>
    </t-radio-group>
  </div>
</template>