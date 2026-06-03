require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const { errorHandler } = require('./middleware/error-handler');
const { loadConfig } = require('./config');

const chatRoutes = require('./routes/chat');
const imageRoutes = require('./routes/image');
const videoRoutes = require('./routes/video');
const taskRoutes = require('./routes/task');
const modelRoutes = require('./routes/models');
const fileRoutes = require('./routes/files');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// --- Routes ---
// OpenAI compatible endpoints
app.use('/v1/chat', chatRoutes);
app.use('/v1/images', imageRoutes);
app.use('/v1/video', videoRoutes);
app.use('/v1/tasks', taskRoutes);

// Model management
app.use('/v1/models', modelRoutes);

// File upload
app.use('/v1/files', fileRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Error handling ---
app.use(errorHandler);

// --- Start ---
loadConfig();

app.listen(PORT, () => {
  console.log(`[server] AI Proxy Server running on http://localhost:${PORT}`);
  console.log(`[server] API endpoints:`);
  console.log(`  POST /v1/chat/completions  - Chat completions (OpenAI compatible)`);
  console.log(`  POST /v1/images/generations - Image generation (Kling)`);
  console.log(`  GET  /v1/images/tasks/:id   - Image task query`);
  console.log(`  POST /v1/video/generations  - Video generation (Kling)`);
  console.log(`  GET  /v1/video/tasks/:id    - Video task query`);
  console.log(`  GET  /v1/tasks/:id          - Generic task query`);
  console.log(`  GET  /v1/models             - List models (public)`);
  console.log(`  GET  /v1/models/config      - Full model config (admin)`);
  console.log(`  POST /v1/models/chat        - Add chat model`);
  console.log(`  PUT  /v1/models/chat/:id    - Update chat model`);
  console.log(`  DELETE /v1/models/chat/:id  - Delete chat model`);
  console.log(`  POST /v1/files/upload       - File upload`);
});