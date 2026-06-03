<script setup>
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

function goHome() {
  router.push('/');
}

function goConfig() {
  router.push('/models');
}
</script>

<template>
  <div class="app-layout">
    <aside class="app-sidebar">
      <div class="sidebar-header">
        <h2 @click="goHome" style="cursor: pointer;">AI Chat Studio</h2>
        <t-button
          size="small"
          variant="text"
          @click="goConfig"
        >
          <template #icon><t-icon name="setting" /></template>
        </t-button>
      </div>
      <slot name="sidebar" />
    </aside>
    <main class="app-content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
/* Styles are in main.css */
</style>