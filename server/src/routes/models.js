const express = require('express');
const router = express.Router();
const { getPublicModels, getConfig, saveConfig } = require('../config');

// GET /v1/models - Get all models (public info, no secrets)
router.get('/', (req, res) => {
  const models = getPublicModels();
  res.json({ object: 'list', data: models });
});

// GET /v1/models/config - Get full config including API keys (for admin page)
router.get('/config', (req, res) => {
  const config = getConfig();
  res.json(config);
});

// POST /v1/models/chat - Add a chat model
router.post('/chat', (req, res) => {
  const config = getConfig();
  const newModel = req.body;

  if (!newModel.id || !newModel.name || !newModel.endpoint) {
    return res.status(400).json({
      error: { message: 'Missing required fields: id, name, endpoint' }
    });
  }

  // Check for duplicate
  if (config.chat.find(m => m.id === newModel.id)) {
    return res.status(400).json({
      error: { message: `Model with id "${newModel.id}" already exists` }
    });
  }

  config.chat.push(newModel);
  if (saveConfig(config)) {
    res.json({ success: true, model: newModel });
  } else {
    res.status(500).json({ error: { message: 'Failed to save configuration' } });
  }
});

// PUT /v1/models/chat/:id - Update a chat model
router.put('/chat/:id', (req, res) => {
  const config = getConfig();
  const { id } = req.params;
  const updates = req.body;

  const index = config.chat.findIndex(m => m.id === id);
  if (index === -1) {
    return res.status(404).json({
      error: { message: `Model "${id}" not found` }
    });
  }

  config.chat[index] = { ...config.chat[index], ...updates, id }; // preserve id
  if (saveConfig(config)) {
    res.json({ success: true, model: config.chat[index] });
  } else {
    res.status(500).json({ error: { message: 'Failed to save configuration' } });
  }
});

// DELETE /v1/models/chat/:id - Delete a chat model
router.delete('/chat/:id', (req, res) => {
  const config = getConfig();
  const { id } = req.params;

  const index = config.chat.findIndex(m => m.id === id);
  if (index === -1) {
    return res.status(404).json({
      error: { message: `Model "${id}" not found` }
    });
  }

  config.chat.splice(index, 1);
  if (saveConfig(config)) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: { message: 'Failed to save configuration' } });
  }
});

// POST /v1/models/image - Add an image model
router.post('/image', (req, res) => {
  const config = getConfig();
  const newModel = req.body;

  if (!newModel.id || !newModel.name) {
    return res.status(400).json({
      error: { message: 'Missing required fields: id, name' }
    });
  }

  if (config.image.find(m => m.id === newModel.id)) {
    return res.status(400).json({
      error: { message: `Model with id "${newModel.id}" already exists` }
    });
  }

  config.image.push(newModel);
  if (saveConfig(config)) {
    res.json({ success: true, model: newModel });
  } else {
    res.status(500).json({ error: { message: 'Failed to save configuration' } });
  }
});

// PUT /v1/models/image/:id - Update an image model
router.put('/image/:id', (req, res) => {
  const config = getConfig();
  const { id } = req.params;
  const updates = req.body;

  const index = config.image.findIndex(m => m.id === id);
  if (index === -1) {
    return res.status(404).json({
      error: { message: `Model "${id}" not found` }
    });
  }

  config.image[index] = { ...config.image[index], ...updates, id };
  if (saveConfig(config)) {
    res.json({ success: true, model: config.image[index] });
  } else {
    res.status(500).json({ error: { message: 'Failed to save configuration' } });
  }
});

// DELETE /v1/models/image/:id - Delete an image model
router.delete('/image/:id', (req, res) => {
  const config = getConfig();
  const { id } = req.params;

  const index = config.image.findIndex(m => m.id === id);
  if (index === -1) {
    return res.status(404).json({
      error: { message: `Model "${id}" not found` }
    });
  }

  config.image.splice(index, 1);
  if (saveConfig(config)) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: { message: 'Failed to save configuration' } });
  }
});

// POST /v1/models/video - Add a video model
router.post('/video', (req, res) => {
  const config = getConfig();
  const newModel = req.body;

  if (!newModel.id || !newModel.name) {
    return res.status(400).json({
      error: { message: 'Missing required fields: id, name' }
    });
  }

  if (config.video.find(m => m.id === newModel.id)) {
    return res.status(400).json({
      error: { message: `Model with id "${newModel.id}" already exists` }
    });
  }

  config.video.push(newModel);
  if (saveConfig(config)) {
    res.json({ success: true, model: newModel });
  } else {
    res.status(500).json({ error: { message: 'Failed to save configuration' } });
  }
});

// PUT /v1/models/video/:id - Update a video model
router.put('/video/:id', (req, res) => {
  const config = getConfig();
  const { id } = req.params;
  const updates = req.body;

  const index = config.video.findIndex(m => m.id === id);
  if (index === -1) {
    return res.status(404).json({
      error: { message: `Model "${id}" not found` }
    });
  }

  config.video[index] = { ...config.video[index], ...updates, id };
  if (saveConfig(config)) {
    res.json({ success: true, model: config.video[index] });
  } else {
    res.status(500).json({ error: { message: 'Failed to save configuration' } });
  }
});

// DELETE /v1/models/video/:id - Delete a video model
router.delete('/video/:id', (req, res) => {
  const config = getConfig();
  const { id } = req.params;

  const index = config.video.findIndex(m => m.id === id);
  if (index === -1) {
    return res.status(404).json({
      error: { message: `Model "${id}" not found` }
    });
  }

  config.video.splice(index, 1);
  if (saveConfig(config)) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: { message: 'Failed to save configuration' } });
  }
});

module.exports = router;