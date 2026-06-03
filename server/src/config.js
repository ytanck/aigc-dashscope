const path = require('path');
const fs = require('fs');

let config = null;

function loadConfig() {
  const configPath = path.join(__dirname, '..', 'models.json');
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    config = JSON.parse(raw);
    console.log('[config] models.json loaded successfully');
  } catch (err) {
    console.error('[config] Failed to load models.json:', err.message);
    config = { chat: [], image: [], video: [] };
  }
  return config;
}

function getConfig() {
  if (!config) {
    loadConfig();
  }
  return config;
}

function saveConfig(newConfig) {
  const configPath = path.join(__dirname, '..', 'models.json');
  try {
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf-8');
    config = newConfig;
    return true;
  } catch (err) {
    console.error('[config] Failed to save models.json:', err.message);
    return false;
  }
}

function findChatModel(modelId) {
  const cfg = getConfig();
  return cfg.chat.find(m => m.id === modelId) || null;
}

function findImageModel(modelId) {
  const cfg = getConfig();
  return cfg.image.find(m => m.id === modelId) || null;
}

function findVideoModel(modelId) {
  const cfg = getConfig();
  return cfg.video.find(m => m.id === modelId) || null;
}

function getPublicModels() {
  const cfg = getConfig();
  return {
    chat: cfg.chat.map(m => ({
      id: m.id,
      name: m.name,
      provider: m.provider,
      capabilities: m.capabilities,
      defaultParams: m.defaultParams
    })),
    image: cfg.image.map(m => ({
      id: m.id,
      name: m.name,
      provider: m.provider,
      capabilities: m.capabilities,
      async: m.async === true,
      supportedResolutions: m.supportedResolutions,
      supportedAspectRatios: m.supportedAspectRatios,
      maxN: m.maxN
    })),
    video: cfg.video.map(m => ({
      id: m.id,
      name: m.name,
      provider: m.provider,
      capabilities: m.capabilities,
      async: m.async === true,
      supportedModes: m.supportedModes,
      supportedAspectRatios: m.supportedAspectRatios,
      minDuration: m.minDuration,
      maxDuration: m.maxDuration,
      supportsAudio: m.supportsAudio,
      supportsFirstFrame: m.supportsFirstFrame,
      supportsLastFrame: m.supportsLastFrame,
      maxReferImages: m.maxReferImages
    }))
  };
}

module.exports = {
  loadConfig,
  getConfig,
  saveConfig,
  findChatModel,
  findImageModel,
  findVideoModel,
  getPublicModels
};