<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  getModelsConfig,
  addChatModel, updateChatModel, deleteChatModel,
  addImageModel, updateImageModel, deleteImageModel,
  addVideoModel, updateVideoModel, deleteVideoModel
} from '@/api/model-api';
import { MessagePlugin } from 'tdesign-vue-next';

const router = useRouter();
const config = ref({ chat: [], image: [], video: [] });
const loading = ref(false);

// Dialog states
const showChatDialog = ref(false);
const showImageDialog = ref(false);
const showVideoDialog = ref(false);
const editingModel = ref(null);
const saving = ref(false);

const emptyChatModel = () => ({
  id: '', name: '', provider: '', endpoint: '', apiKey: '',
  capabilities: ['text'],
  defaultParams: { temperature: 0.7, max_tokens: 4096 }
});

const emptyImageModel = () => ({
  id: '', name: '', provider: 'kling', endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/image-generation/generation',
  apiKey: '', async: false, capabilities: ['text-to-image'],
  supportedResolutions: ['1k', '2k'],
  supportedAspectRatios: ['16:9', '9:16', '1:1'],
  maxN: 9
});

const emptyVideoModel = () => ({
  id: '', name: '', provider: 'kling', endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis',
  apiKey: '', async: false, capabilities: ['text-to-video'],
  supportedModes: ['std', 'pro'],
  supportedAspectRatios: ['16:9', '9:16', '1:1'],
  minDuration: 3, maxDuration: 15,
  supportsAudio: true, supportsFirstFrame: true, supportsLastFrame: false
});

const formData = ref({});

async function loadConfig() {
  loading.value = true;
  try {
    const data = await getModelsConfig();
    config.value = data;
  } catch (err) {
    MessagePlugin.error('加载配置失败: ' + err.message);
  } finally {
    loading.value = false;
  }
}

function goHome() {
  router.push('/');
}

// --- Chat Models ---
function openAddChat() {
  editingModel.value = null;
  formData.value = emptyChatModel();
  showChatDialog.value = true;
}

function openEditChat(model) {
  editingModel.value = model;
  formData.value = { ...model, defaultParams: { ...model.defaultParams } };
  showChatDialog.value = true;
}

async function saveChat() {
  saving.value = true;
  try {
    if (editingModel.value) {
      await updateChatModel(editingModel.value.id, formData.value);
      MessagePlugin.success('更新成功');
    } else {
      await addChatModel(formData.value);
      MessagePlugin.success('添加成功');
    }
    showChatDialog.value = false;
    await loadConfig();
  } catch (err) {
    MessagePlugin.error('保存失败: ' + (err.response?.data?.error?.message || err.message));
  } finally {
    saving.value = false;
  }
}

async function removeChat(id) {
  try {
    await deleteChatModel(id);
    MessagePlugin.success('删除成功');
    await loadConfig();
  } catch (err) {
    MessagePlugin.error('删除失败');
  }
}

// --- Image Models ---
function openAddImage() {
  editingModel.value = null;
  formData.value = emptyImageModel();
  showImageDialog.value = true;
}

function openEditImage(model) {
  editingModel.value = model;
  formData.value = { ...model };
  showImageDialog.value = true;
}

async function saveImage() {
  saving.value = true;
  try {
    if (editingModel.value) {
      await updateImageModel(editingModel.value.id, formData.value);
      MessagePlugin.success('更新成功');
    } else {
      await addImageModel(formData.value);
      MessagePlugin.success('添加成功');
    }
    showImageDialog.value = false;
    await loadConfig();
  } catch (err) {
    MessagePlugin.error('保存失败: ' + (err.response?.data?.error?.message || err.message));
  } finally {
    saving.value = false;
  }
}

async function removeImage(id) {
  try {
    await deleteImageModel(id);
    MessagePlugin.success('删除成功');
    await loadConfig();
  } catch (err) {
    MessagePlugin.error('删除失败');
  }
}

// --- Video Models ---
function openAddVideo() {
  editingModel.value = null;
  formData.value = emptyVideoModel();
  showVideoDialog.value = true;
}

function openEditVideo(model) {
  editingModel.value = model;
  formData.value = { ...model };
  showVideoDialog.value = true;
}

async function saveVideo() {
  saving.value = true;
  try {
    if (editingModel.value) {
      await updateVideoModel(editingModel.value.id, formData.value);
      MessagePlugin.success('更新成功');
    } else {
      await addVideoModel(formData.value);
      MessagePlugin.success('添加成功');
    }
    showVideoDialog.value = false;
    await loadConfig();
  } catch (err) {
    MessagePlugin.error('保存失败: ' + (err.response?.data?.error?.message || err.message));
  } finally {
    saving.value = false;
  }
}

async function removeVideo(id) {
  try {
    await deleteVideoModel(id);
    MessagePlugin.success('删除成功');
    await loadConfig();
  } catch (err) {
    MessagePlugin.error('删除失败');
  }
}

onMounted(loadConfig);
</script>

<template>
  <div class="config-page">
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
      <h1 style="margin: 0;">⚙️ 模型配置</h1>
      <t-button variant="outline" @click="goHome">
        <template #icon><t-icon name="arrow-left" /></template>
        返回聊天
      </t-button>
    </div>

    <t-loading :loading="loading">
      <!-- Chat Models -->
      <div class="config-section">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
          <h2>💬 对话模型</h2>
          <t-button size="small" theme="primary" @click="openAddChat">添加模型</t-button>
        </div>
        <t-table
          :data="config.chat"
          :columns="[
            { colKey: 'name', title: '名称' },
            { colKey: 'id', title: '模型ID' },
            { colKey: 'provider', title: '提供方' },
            { colKey: 'endpoint', title: '接口地址', ellipsis: true },
            { colKey: 'actions', title: '操作', width: 160 }
          ]"
          row-key="id"
          size="small"
          bordered
          empty="暂无对话模型，点击添加"
        >
          <template #actions="{ row }">
            <t-space>
              <t-button size="small" variant="text" @click="openEditChat(row)">编辑</t-button>
              <t-popconfirm content="确认删除？" @confirm="removeChat(row.id)">
                <t-button size="small" variant="text" theme="danger">删除</t-button>
              </t-popconfirm>
            </t-space>
          </template>
        </t-table>
      </div>

      <!-- Image Models -->
      <div class="config-section">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
          <h2>🎨 图像模型</h2>
          <t-button size="small" theme="primary" @click="openAddImage">添加模型</t-button>
        </div>
        <t-table
          :data="config.image"
          :columns="[
            { colKey: 'name', title: '名称' },
            { colKey: 'id', title: '模型ID' },
            { colKey: 'provider', title: '提供方' },
            { colKey: 'endpoint', title: '接口地址', ellipsis: true },
            { colKey: 'supportedResolutions', title: '支持分辨率', ellipsis: true },
            { colKey: 'actions', title: '操作', width: 160 }
          ]"
          row-key="id"
          size="small"
          bordered
          empty="暂无图像模型，点击添加"
        >
          <template #actions="{ row }">
            <t-space>
              <t-button size="small" variant="text" @click="openEditImage(row)">编辑</t-button>
              <t-popconfirm content="确认删除？" @confirm="removeImage(row.id)">
                <t-button size="small" variant="text" theme="danger">删除</t-button>
              </t-popconfirm>
            </t-space>
          </template>
        </t-table>
      </div>

      <!-- Video Models -->
      <div class="config-section">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
          <h2>🎬 视频模型</h2>
          <t-button size="small" theme="primary" @click="openAddVideo">添加模型</t-button>
        </div>
        <t-table
          :data="config.video"
          :columns="[
            { colKey: 'name', title: '名称' },
            { colKey: 'id', title: '模型ID' },
            { colKey: 'provider', title: '提供方' },
            { colKey: 'endpoint', title: '接口地址', ellipsis: true },
            { colKey: 'supportedModes', title: '支持模式', ellipsis: true },
            { colKey: 'actions', title: '操作', width: 160 }
          ]"
          row-key="id"
          size="small"
          bordered
          empty="暂无视频模型，点击添加"
        >
          <template #actions="{ row }">
            <t-space>
              <t-button size="small" variant="text" @click="openEditVideo(row)">编辑</t-button>
              <t-popconfirm content="确认删除？" @confirm="removeVideo(row.id)">
                <t-button size="small" variant="text" theme="danger">删除</t-button>
              </t-popconfirm>
            </t-space>
          </template>
        </t-table>
      </div>
    </t-loading>

    <!-- Chat Model Dialog -->
    <t-dialog v-model:visible="showChatDialog" :header="editingModel ? '编辑对话模型' : '添加对话模型'" width="560px" :confirm-btn="{ content: '保存', loading: saving }" @confirm="saveChat">
      <t-form label-width="100px">
        <t-form-item label="模型ID" required>
          <t-input v-model="formData.id" placeholder="如: gpt-4o" :disabled="!!editingModel" />
        </t-form-item>
        <t-form-item label="显示名称" required>
          <t-input v-model="formData.name" placeholder="如: GPT-4o" />
        </t-form-item>
        <t-form-item label="提供方">
          <t-input v-model="formData.provider" placeholder="如: openai" />
        </t-form-item>
        <t-form-item label="接口地址" required>
          <t-input v-model="formData.endpoint" placeholder="https://api.openai.com/v1/chat/completions" />
        </t-form-item>
        <t-form-item label="API Key" required>
          <t-input v-model="formData.apiKey" type="password" placeholder="sk-..." />
        </t-form-item>
        <t-form-item label="能力">
          <t-checkbox-group v-model="formData.capabilities">
            <t-checkbox value="text">文本</t-checkbox>
            <t-checkbox value="vision">视觉</t-checkbox>
          </t-checkbox-group>
        </t-form-item>
      </t-form>
    </t-dialog>

    <!-- Image Model Dialog -->
    <t-dialog v-model:visible="showImageDialog" :header="editingModel ? '编辑图像模型' : '添加图像模型'" width="560px" :confirm-btn="{ content: '保存', loading: saving }" @confirm="saveImage">
      <t-form label-width="100px">
        <t-form-item label="模型ID" required>
          <t-input v-model="formData.id" placeholder="如: kling-v3-image-generation" :disabled="!!editingModel" />
        </t-form-item>
        <t-form-item label="显示名称" required>
          <t-input v-model="formData.name" placeholder="如: Kling V3 图像生成" />
        </t-form-item>
        <t-form-item label="提供方">
          <t-input v-model="formData.provider" placeholder="kling" />
        </t-form-item>
        <t-form-item label="接口地址" required>
          <t-input v-model="formData.endpoint" placeholder="https://dashscope.aliyuncs.com/api/v1/services/aigc/image-generation/generation" />
        </t-form-item>
        <t-form-item label="API Key">
          <t-input v-model="formData.apiKey" type="password" placeholder="留空则使用全局 Key" />
        </t-form-item>
        <t-form-item label="最大生成数">
          <t-input-number v-model="formData.maxN" :min="1" :max="9" />
        </t-form-item>
        <t-form-item label="异步模式">
          <t-switch v-model="formData.async" />
          <span style="margin-left: 8px; font-size: 12px; color: #999;">{{ formData.async ? '异步（需轮询任务）' : '同步（直接返回）' }}</span>
        </t-form-item>
      </t-form>
    </t-dialog>

    <!-- Video Model Dialog -->
    <t-dialog v-model:visible="showVideoDialog" :header="editingModel ? '编辑视频模型' : '添加视频模型'" width="560px" :confirm-btn="{ content: '保存', loading: saving }" @confirm="saveVideo">
      <t-form label-width="100px">
        <t-form-item label="模型ID" required>
          <t-input v-model="formData.id" placeholder="如: kling-v3-video-generation" :disabled="!!editingModel" />
        </t-form-item>
        <t-form-item label="显示名称" required>
          <t-input v-model="formData.name" placeholder="如: Kling V3 视频生成" />
        </t-form-item>
        <t-form-item label="提供方">
          <t-input v-model="formData.provider" placeholder="kling" />
        </t-form-item>
        <t-form-item label="接口地址" required>
          <t-input v-model="formData.endpoint" placeholder="https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis" />
        </t-form-item>
        <t-form-item label="API Key">
          <t-input v-model="formData.apiKey" type="password" placeholder="留空则使用全局 Key" />
        </t-form-item>
        <t-form-item label="最短时长">
          <t-input-number v-model="formData.minDuration" :min="3" :max="15" />
        </t-form-item>
        <t-form-item label="最长时长">
          <t-input-number v-model="formData.maxDuration" :min="3" :max="15" />
        </t-form-item>
        <t-form-item label="支持音频">
          <t-switch v-model="formData.supportsAudio" />
        </t-form-item>
        <t-form-item label="异步模式">
          <t-switch v-model="formData.async" />
          <span style="margin-left: 8px; font-size: 12px; color: #999;">{{ formData.async ? '异步（需轮询任务）' : '同步（直接返回）' }}</span>
        </t-form-item>
      </t-form>
    </t-dialog>
  </div>
</template>