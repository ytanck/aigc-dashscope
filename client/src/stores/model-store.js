import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getModels } from '@/api/model-api';

export const useModelStore = defineStore('model', () => {
  const chatModels = ref([]);
  const imageModels = ref([]);
  const videoModels = ref([]);
  const selectedChatModel = ref('');
  const selectedImageModel = ref('');
  const selectedVideoModel = ref('');
  const loading = ref(false);

  const currentModeModels = computed(() => {
    return {
      chat: chatModels.value,
      image: imageModels.value,
      video: videoModels.value
    };
  });

  const selectedModel = computed(() => {
    return {
      chat: selectedChatModel.value,
      image: selectedImageModel.value,
      video: selectedVideoModel.value
    };
  });

  async function fetchModels() {
    loading.value = true;
    try {
      const data = await getModels();
      chatModels.value = data.chat || [];
      imageModels.value = data.image || [];
      videoModels.value = data.video || [];

      // Set default selections
      if (!selectedChatModel.value && chatModels.value.length > 0) {
        selectedChatModel.value = chatModels.value[0].id;
      }
      if (!selectedImageModel.value && imageModels.value.length > 0) {
        selectedImageModel.value = imageModels.value[0].id;
      }
      if (!selectedVideoModel.value && videoModels.value.length > 0) {
        selectedVideoModel.value = videoModels.value[0].id;
      }
    } catch (err) {
      console.error('Failed to fetch models:', err);
    } finally {
      loading.value = false;
    }
  }

  function selectModel(mode, modelId) {
    switch (mode) {
      case 'chat':
        selectedChatModel.value = modelId;
        break;
      case 'image':
        selectedImageModel.value = modelId;
        break;
      case 'video':
        selectedVideoModel.value = modelId;
        break;
    }
  }

  function getModelConfig(modelId) {
    return chatModels.value.find(m => m.id === modelId) ||
           imageModels.value.find(m => m.id === modelId) ||
           videoModels.value.find(m => m.id === modelId) ||
           null;
  }

  return {
    chatModels,
    imageModels,
    videoModels,
    selectedChatModel,
    selectedImageModel,
    selectedVideoModel,
    loading,
    currentModeModels,
    selectedModel,
    fetchModels,
    selectModel,
    getModelConfig
  };
});