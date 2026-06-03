import client from './client';

export async function getModels() {
  const response = await client.get('/models');
  return response.data.data;
}

export async function getModelsConfig() {
  const response = await client.get('/models/config');
  return response.data;
}

export async function addChatModel(model) {
  const response = await client.post('/models/chat', model);
  return response.data;
}

export async function updateChatModel(id, model) {
  const response = await client.put(`/models/chat/${id}`, model);
  return response.data;
}

export async function deleteChatModel(id) {
  const response = await client.delete(`/models/chat/${id}`);
  return response.data;
}

export async function addImageModel(model) {
  const response = await client.post('/models/image', model);
  return response.data;
}

export async function updateImageModel(id, model) {
  const response = await client.put(`/models/image/${id}`, model);
  return response.data;
}

export async function deleteImageModel(id) {
  const response = await client.delete(`/models/image/${id}`);
  return response.data;
}

export async function addVideoModel(model) {
  const response = await client.post('/models/video', model);
  return response.data;
}

export async function updateVideoModel(id, model) {
  const response = await client.put(`/models/video/${id}`, model);
  return response.data;
}

export async function deleteVideoModel(id) {
  const response = await client.delete(`/models/video/${id}`);
  return response.data;
}