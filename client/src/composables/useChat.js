import { ref, computed } from 'vue';
import { useChatStore } from '@/stores/chat-store';
import { useModelStore } from '@/stores/model-store';
import { useModeStore } from '@/stores/mode-store';

export function useChat() {
  const chatStore = useChatStore();
  const modelStore = useModelStore();
  const modeStore = useModeStore();

  const inputText = ref('');
  const attachedImages = ref([]);

  const canSend = computed(() => {
    return (inputText.value.trim() || attachedImages.value.length > 0) && !chatStore.isLoading;
  });

  async function send() {
    if (!canSend.value) return;

    const text = inputText.value.trim();
    const images = attachedImages.value.map(img => img.url || img);

    // Set the model before sending
    const model = modelStore.selectedModel[modeStore.currentMode];
    if (!model) {
      console.error('No model selected');
      return;
    }

    // Temporarily set model in chat store
    chatStore._currentModel = model;

    await chatStore.sendMessage(text, images);

    inputText.value = '';
    attachedImages.value = [];
  }

  function stop() {
    chatStore.stopGeneration();
  }

  function attachImage(imageUrl) {
    attachedImages.value.push({ url: imageUrl });
  }

  function removeImage(index) {
    attachedImages.value.splice(index, 1);
  }

  function clearImages() {
    attachedImages.value = [];
  }

  return {
    inputText,
    attachedImages,
    canSend,
    send,
    stop,
    attachImage,
    removeImage,
    clearImages
  };
}