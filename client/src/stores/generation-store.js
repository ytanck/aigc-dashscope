import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useGenerationStore = defineStore('generation', () => {
  // Generation parameters
  const genParams = ref({
    aspect_ratio: '16:9',
    resolution: '1k',
    n: 1,
    mode: 'std',
    duration: 5,
    audio: false,
    watermark: false
  });

  // Task queue: { id, type, status, model, createdAt, error }
  const tasks = ref([]);

  // Results: { id, taskId, type, url, coverUrl, prompt, createdAt }
  const results = ref([]);

  const pollingTimers = ref({});
  const isGenerating = ref(false);

  function updateParam(key, value) {
    genParams.value[key] = value;
  }

  function setParams(params) {
    genParams.value = { ...genParams.value, ...params };
  }

  function addTask(task) {
    tasks.value.unshift({
      ...task,
      id: task.id || Date.now().toString(),
      createdAt: Date.now()
    });
  }

  function updateTask(taskId, updates) {
    const index = tasks.value.findIndex(t => t.id === taskId);
    if (index !== -1) {
      tasks.value[index] = { ...tasks.value[index], ...updates };
    }
  }

  function removeTask(taskId) {
    tasks.value = tasks.value.filter(t => t.id !== taskId);
  }

  function addResults(taskId, newResults) {
    for (const r of newResults) {
      results.value.unshift({
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        taskId,
        ...r
      });
    }
  }

  function removeResult(resultId) {
    results.value = results.value.filter(r => r.id !== resultId);
  }

  function setPollingTimer(taskId, timer) {
    pollingTimers.value[taskId] = timer;
  }

  function clearPollingTimer(taskId) {
    if (pollingTimers.value[taskId]) {
      clearInterval(pollingTimers.value[taskId]);
      delete pollingTimers.value[taskId];
    }
  }

  function clearAllTimers() {
    for (const taskId of Object.keys(pollingTimers.value)) {
      clearPollingTimer(taskId);
    }
  }

  function resetParams() {
    genParams.value = {
      aspect_ratio: '16:9',
      resolution: '1k',
      n: 1,
      mode: 'std',
      duration: 5,
      audio: false,
      watermark: false
    };
  }

  return {
    genParams,
    tasks,
    results,
    isGenerating,
    updateParam,
    setParams,
    addTask,
    updateTask,
    removeTask,
    addResults,
    removeResult,
    setPollingTimer,
    clearPollingTimer,
    clearAllTimers,
    resetParams
  };
});