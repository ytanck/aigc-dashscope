import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useModeStore = defineStore('mode', () => {
  const currentMode = ref('chat'); // 'chat' | 'image' | 'video'

  const modeLabel = computed(() => {
    const labels = {
      'chat': '普通对话',
      'image': '图像生成',
      'video': '视频生成'
    };
    return labels[currentMode.value] || '普通对话';
  });

  const isGenerationMode = computed(() => currentMode.value !== 'chat');

  const isVideoMode = computed(() => currentMode.value === 'video');

  const isImageMode = computed(() => currentMode.value === 'image');

  function setMode(mode) {
    currentMode.value = mode;
  }

  return {
    currentMode,
    modeLabel,
    isGenerationMode,
    isVideoMode,
    isImageMode,
    setMode
  };
});