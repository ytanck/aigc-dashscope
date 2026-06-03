# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Chat Studio — an API proxy + chat frontend for 百炼 (Alibaba Cloud DashScope) models. Provides OpenAI-compatible chat, text-to-image, image-to-image, text-to-video, and image-to-video through a Vue 3 frontend with a Node.js Express backend.

## Running the project

```bash
# Backend (port 3000)
cd server && npm run dev

# Frontend (port 5173, proxies /v1 and /uploads to backend)
cd client && npm run dev
```

## Architecture

### Backend (`server/`)

Express server. Model configuration lives in `models.json` at the server root (loaded by `config.js`). Three model categories: `chat[]`, `image[]`, `video[]`.

**Request flow:**
- `routes/` → thin Express routers → `services/` → upstream API via `fetch()`
- All generation endpoints (image/video) auto-detect sync vs async models via `modelConfig.async === true`
- Async models: `X-DashScope-Async: enable` header + return `task_id` for polling
- Sync models: no async header + extract results from response directly

**Key backend files:**
- `src/services/image-utils.js` — shared utility: converts local image URLs to compressed base64 data URIs using `sharp`. Used by chat, image, and video services before forwarding to upstream APIs.
- `src/services/chat-service.js` — proxies chat completions (SSE streaming + non-streaming), converts local image URLs to base64 before forwarding.
- `src/services/kling-image.js` — DashScope image generation. Builds Kling-format content (`{ text, image }` not OpenAI format). Handles sync/async.
- `src/services/kling-video.js` — DashScope video generation. Handles sync/async.
- `src/config.js` — loads/saves `models.json`, provides `findChatModel()`, `findImageModel()`, `findVideoModel()`, `getPublicModels()` (strips secrets).

**Model config fields** (image/video): `async`, `endpoint`, `apiKey`, `supportedResolutions`, `supportedAspectRatios`, `maxN`, `supportedModes`, `minDuration`/`maxDuration`, `supportsAudio`, `supportsFirstFrame`/`supportsLastFrame`, `maxReferImages`.

### Frontend (`client/`)

Vue 3 + Vite + TDesign + Pinia. Three modes: chat, image generation, video generation.

**Mode store** (`mode-store.js`): `currentMode` is `'chat' | 'image' | 'video'`. Image/video generation share a single panel each — uploading an image in image mode acts as image-to-image; uploading in video mode acts as image-to-video.

**Generation flow:**
1. `ImageGenPanel.vue` / `VideoGenPanel.vue` → `useGeneration.js` → `api/image-api.js` / `api/video-api.js`
2. `useGeneration.submitGeneration()` checks response: if `output.results` + `SUCCEEDED` (sync model) → add results directly; if `output.task_id` (async model) → add task + start 2s polling interval
3. Polling calls `queryImageTask`/`queryVideoTask` every 2s, extracts `output.choices[].message.content[].image` for images or `output.video_url` for videos

**Chat flow:**
1. `ChatPanel.vue` → `chat-store.js` → `api/chat-api.js` (uses native `fetch` for SSE streaming)
2. `@image` detection in `useFileUpload.detectAtImage()` triggers file upload dialog
3. `t-textarea` was replaced with native `<textarea>` to work around a TDesign internal bug (`Cannot use 'in' operator`)

**Key patterns:**
- Native `<textarea>` with inline styles, not `<t-textarea>` (TDesign textarea has internal bugs)
- `window.location.origin + result.url` pattern for constructing image URLs from upload responses
- `stores/generation-store.js` manages `genParams`, `tasks[]`, `results[]`, and polling timers

### Image handling

All local images must be converted to base64 before reaching upstream APIs. The `toBase64DataUri()` function in `image-utils.js`:
- Detects `localhost`/`127.0.0.1`/`/uploads/` paths
- Reads file from `server/uploads/`
- Resizes via `sharp` (max 1280px, JPEG quality 80; falls back to 800px quality 60 if base64 > 60000 chars)
- Returns `data:image/jpeg;base64,...`

This is called in `chat-service.js`, `kling-image.js`, and `kling-video.js`.

### Kling API format notes

- Image content: `{ text: "prompt" }` and `{ image: "url_or_base64" }` — NOT OpenAI's `{ type: "text", text: "..." }` format
- Video media: `{ type: "first_frame" | "last_frame" | "refer", url: "..." }`
- `refer` type only supported by `kling/kling-v3-omni-video-generation`
- Model IDs must include the `kling/` prefix (e.g., `kling/kling-v3-image-generation`)
- Task query: `GET https://dashscope.aliyuncs.com/api/v1/tasks/{task_id}` (same for image and video)

### Model config page

`/models` route → `ModelConfigView.vue` — CRUD for chat/image/video models via `/v1/models/chat|image|video` endpoints. Changes are written directly to `server/models.json`. Image/video model edit dialogs include an `async` toggle (default OFF).