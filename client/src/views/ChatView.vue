<script setup>
import { onMounted } from 'vue';
import { useModelStore } from '@/stores/model-store';
import { useModeStore } from '@/stores/mode-store';
import AppSidebar from '@/components/layout/AppSidebar.vue';
import ModeSwitcher from '@/components/common/ModeSwitcher.vue';
import ModelSelector from '@/components/common/ModelSelector.vue';
import GenParamBar from '@/components/generation/GenParamBar.vue';
import TaskProgress from '@/components/generation/TaskProgress.vue';
import ChatPanel from '@/components/chat/ChatPanel.vue';
import ImageGenPanel from '@/components/generation/ImageGenPanel.vue';
import VideoGenPanel from '@/components/generation/VideoGenPanel.vue';

const modelStore = useModelStore();
const modeStore = useModeStore();

onMounted(() => {
  modelStore.fetchModels();
});
</script>

<template>
  <AppSidebar>
    <template #sidebar>
      <ModeSwitcher />
      <ModelSelector />
      <GenParamBar />
      <TaskProgress />
    </template>

    <ChatPanel v-if="modeStore.currentMode === 'chat'" />
    <ImageGenPanel v-else-if="modeStore.isImageMode" />
    <VideoGenPanel v-else-if="modeStore.isVideoMode" />
  </AppSidebar>
</template>