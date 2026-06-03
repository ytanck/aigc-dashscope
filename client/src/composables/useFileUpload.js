import { ref } from 'vue';
import { uploadFile as uploadFileApi } from '@/api/file-api';

export function useFileUpload() {
  const uploading = ref(false);
  const error = ref(null);

  async function uploadFile(file) {
    uploading.value = true;
    error.value = null;
    try {
      const result = await uploadFileApi(file);
      return result;
    } catch (err) {
      error.value = err.message || 'Upload failed';
      throw err;
    } finally {
      uploading.value = false;
    }
  }

  async function uploadFiles(files) {
    const results = [];
    for (const file of files) {
      const result = await uploadFile(file);
      results.push(result);
    }
    return results;
  }

  /**
   * Detect @image mention in text.
   * Returns null if no mention, or { text: remaining, url: imageUrl } if found.
   * If @image is without URL, it means trigger file upload.
   */
  function detectAtImage(text) {
    const urlPattern = /@image\s+(https?:\/\/\S+)/i;
    const match = text.match(urlPattern);

    if (match) {
      return {
        cleanText: text.replace(urlPattern, '').trim(),
        imageUrl: match[1],
        type: 'url'
      };
    }

    const simpleMatch = text.match(/@image/i);
    if (simpleMatch) {
      return {
        cleanText: text.replace(/@image/i, '').trim(),
        imageUrl: null,
        type: 'upload'
      };
    }

    return null;
  }

  return {
    uploading,
    error,
    uploadFile,
    uploadFiles,
    detectAtImage
  };
}