import { ref } from 'vue';
import { useGenerationStore } from '@/stores/generation-store';
import { createImageGeneration, queryImageTask } from '@/api/image-api';
import { createVideoGeneration, queryVideoTask } from '@/api/video-api';

export function useGeneration() {
  const genStore = useGenerationStore();
  const error = ref(null);

  const POLL_INTERVAL = 2000;
  const MAX_POLL_TIME = 5 * 60 * 1000;

  async function submitGeneration(type, model, prompt, media = [], parameters = {}) {
    error.value = null;
    genStore.isGenerating = true;

    try {
      let response;
      if (type === 'image') {
        const refImages = media.map(m => m.url || m);
        response = await createImageGeneration({
          model,
          prompt,
          referenceImages: refImages.length > 0 ? refImages : undefined,
          parameters: { ...genStore.genParams, ...parameters }
        });
      } else if (type === 'video') {
        const mediaList = media.map(m => ({
          type: m.mediaType || 'first_frame',
          url: m.url || m
        }));
        response = await createVideoGeneration({
          model,
          prompt,
          media: mediaList.length > 0 ? mediaList : undefined,
          parameters: { ...genStore.genParams, ...parameters }
        });
      }

      // Sync model: results returned directly, no task_id
      if (response.output?.results && response.output?.task_status === 'SUCCEEDED') {
        const newResults = response.output.results.map(r => ({
          type: r.type || type,
          url: r.url,
          coverUrl: r.coverUrl || r.url
        }));
        genStore.addResults(null, newResults);
        genStore.isGenerating = false;
        return null;
      }

      // Async model: task_id returned, start polling
      const taskId = response.output?.task_id;
      if (!taskId) {
        throw new Error('No task ID returned');
      }

      genStore.addTask({
        id: taskId,
        type,
        status: 'PENDING',
        model,
        prompt
      });

      startPolling(taskId, type, model);
      return taskId;
    } catch (err) {
      error.value = err.message;
      genStore.isGenerating = false;
      throw err;
    }
  }

  function startPolling(taskId, type, model) {
    const startTime = Date.now();

    const timer = setInterval(async () => {
      if (Date.now() - startTime > MAX_POLL_TIME) {
        genStore.clearPollingTimer(taskId);
        genStore.updateTask(taskId, { status: 'TIMEOUT', error: 'Generation timed out' });
        genStore.isGenerating = false;
        return;
      }

      try {
        let result;
        if (type === 'image') {
          result = await queryImageTask(taskId, model);
        } else {
          result = await queryVideoTask(taskId, model);
        }

        const status = result.output?.task_status;
        genStore.updateTask(taskId, { status });

        if (status === 'SUCCEEDED') {
          genStore.clearPollingTimer(taskId);

          const newResults = [];
          if (result.output?.video_url) {
            newResults.push({
              type: 'video',
              url: result.output.video_url,
              coverUrl: result.output.watermark_video_url || result.output.video_url
            });
          }
          if (result.output?.choices) {
            for (const choice of result.output.choices) {
              const contents = choice.message?.content || [];
              for (const c of contents) {
                if (c.type === 'image' && c.image) {
                  newResults.push({ type: 'image', url: c.image, coverUrl: c.image });
                }
              }
            }
          }

          if (newResults.length > 0) {
            genStore.addResults(taskId, newResults);
          }

          genStore.isGenerating = false;
        } else if (status === 'FAILED') {
          genStore.clearPollingTimer(taskId);
          genStore.updateTask(taskId, {
            status: 'FAILED',
            error: result.output?.message || 'Generation failed'
          });
          genStore.isGenerating = false;
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }, POLL_INTERVAL);

    genStore.setPollingTimer(taskId, timer);
  }

  return {
    error,
    submitGeneration
  };
}