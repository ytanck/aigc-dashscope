<script setup>
import { computed } from 'vue';
import { useGenerationStore } from '@/stores/generation-store';

defineProps({
  compact: {
    type: Boolean,
    default: false
  }
});

const genStore = useGenerationStore();

const activeTasks = computed(() => {
  return genStore.tasks.filter(t => t.status === 'PENDING' || t.status === 'RUNNING');
});
</script>

<template>
  <div v-if="activeTasks.length > 0" class="sidebar-section">
    <div class="sidebar-section-title">进行中的任务</div>
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <div
        v-for="task in activeTasks"
        :key="task.id"
        class="task-progress"
      >
        <t-loading size="small" />
        <div style="flex: 1;">
          <div style="font-size: 12px; font-weight: 500;">
            {{ task.type === 'video' ? '视频' : '图像' }}生成中
          </div>
          <div style="font-size: 11px; color: #999;">{{ task.status === 'PENDING' ? '排队中...' : '处理中...' }}</div>
          <div style="font-size: 10px; color: #bbb; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            {{ task.prompt }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>