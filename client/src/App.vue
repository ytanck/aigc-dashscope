<script setup>
import { onMounted } from 'vue';
import { useModelStore } from '@/stores/model-store';

const modelStore = useModelStore();

onMounted(() => {
  modelStore.fetchModels();
});
</script>

<template>
  <router-view />
</template>