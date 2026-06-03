import client from './client';

export async function createVideoGeneration({ model, prompt, media, parameters }) {
  const response = await client.post('/video/generations', {
    model,
    input: {
      prompt,
      media
    },
    parameters
  });
  return response.data;
}

export async function queryVideoTask(taskId, model) {
  const response = await client.get(`/video/tasks/${taskId}`, {
    params: { model }
  });
  return response.data;
}