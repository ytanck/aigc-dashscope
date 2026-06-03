import client from './client';

export async function createImageGeneration({ model, prompt, referenceImages, parameters }) {
  const response = await client.post('/images/generations', {
    model,
    input: {
      prompt,
      reference_images: referenceImages
    },
    parameters
  });
  return response.data;
}

export async function queryImageTask(taskId, model) {
  const response = await client.get(`/images/tasks/${taskId}`, {
    params: { model }
  });
  return response.data;
}