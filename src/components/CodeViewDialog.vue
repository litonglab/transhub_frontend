<template>
  <!-- Code View Dialog -->
  <v-dialog v-model="dialogVisible" max-width="80%">
    <v-card class="position-relative">
      <v-card-title> 代码查看</v-card-title>

      <!-- Floating file info and download button -->
      <div v-if="currentCode" class="floating-controls">
        <v-chip
          color="primary"
          variant="outlined"
          prepend-icon="mdi-file-code"
          size="small"
          class="mr-2"
        >
          {{ currentCodeFilename }}
        </v-chip>
        <v-btn
          color="primary"
          variant="elevated"
          prepend-icon="mdi-download"
          size="small"
          @click="downloadCurrentCode"
        >
          下载
        </v-btn>
      </div>

      <v-card-text>
        <div v-if="codeLoading" class="d-flex justify-center pa-4">
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
          ></v-progress-circular>
        </div>

        <div v-else-if="currentCode" class="code-container">
          <v-card variant="outlined" class="full-height-card">
            <v-card-text class="pa-0 full-height">
              <pre class="code-content"><code>{{ currentCode }}</code></pre>
            </v-card-text>
          </v-card>
        </div>

        <div v-else class="d-flex flex-column align-center justify-center pa-8">
          <v-icon size="64" color="grey-lighten-1" class="mb-4"
          >mdi-file-alert
          </v-icon
          >
          <v-card-subtitle>无法获取代码内容</v-card-subtitle>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import {ref, watch} from "vue";
import {ElMessage} from "element-plus";
import {APIS} from "@/config";
import {request} from "@/utility.js";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  uploadId: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:visible"]);

const dialogVisible = ref(false);
const codeLoading = ref(false);
const currentCode = ref("");
const currentCodeFilename = ref("");
const currentUploadId = ref("");

// 监听外部传入的 visible 属性
watch(
  () => props.visible,
  (newVal) => {
    dialogVisible.value = newVal;
    if (newVal && props.uploadId) {
      fetchCode(props.uploadId);
    }
  },
  {immediate: true}
);

// 监听内部弹窗状态变化
watch(dialogVisible, (newVal) => {
  if (!newVal) {
    // 弹窗关闭时清理数据
    handleDialogClose();
  }
  emit("update:visible", newVal);
});

// 通用的代码请求函数
async function requestCode(upload_id) {
  const params = new URLSearchParams();
  params.append("upload_id", upload_id);
  const url = `${APIS.get_code}?${params.toString()}`;

  const response = await request(url, {method: "GET"}, {raw: true});

  if (!response.ok) {
    throw new Error("Request failed");
  }

  // 解析文件名
  const contentDisposition = response.headers.get("Content-Disposition");
  const fileNameMatch = contentDisposition
    ? contentDisposition.match(/filename="?([^"]+)"?/)
    : null;
  const fileName =
    fileNameMatch && fileNameMatch[1] ? fileNameMatch[1] : "code.cc";

  return {response, fileName};
}

// 获取代码内容
async function fetchCode(upload_id) {
  codeLoading.value = true;
  currentUploadId.value = upload_id;
  currentCode.value = "";
  currentCodeFilename.value = "";

  try {
    const {response, fileName} = await requestCode(upload_id);

    currentCodeFilename.value = fileName;
    const text = await response.text();
    currentCode.value = text;
  } catch (error) {
    console.error("Failed to fetch code:", error);
    ElMessage.error("获取代码失败");
  } finally {
    codeLoading.value = false;
  }
}

// 下载代码
async function downloadCode(upload_id) {
  try {
    const {response, fileName} = await requestCode(upload_id);

    ElMessage.success(`代码下载成功`);
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error("Failed to download code:", error);
    ElMessage.error("代码下载失败");
  }
}

// 下载当前显示的代码
async function downloadCurrentCode() {
  if (currentUploadId.value) {
    await downloadCode(currentUploadId.value);
  }
}

// 处理弹窗关闭
function handleDialogClose() {
  currentCode.value = "";
  currentCodeFilename.value = "";
  currentUploadId.value = "";
}

// 暴露方法给父组件
defineExpose({
  fetchCode,
  downloadCode,
});
</script>

<style scoped>
.code-container {
  height: calc(80vh - 120px);
  overflow: hidden;
}

.full-height-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.full-height {
  flex: 1;
  height: 100%;
  overflow: hidden;
}

.code-content {
  background-color: #f8f9fa;
  border-radius: 4px;
  padding: 16px;
  margin: 0;
  font-family: "Courier New", Consolas, "Liberation Mono", monospace;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre;
  color: #333;
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
}

.floating-controls {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  padding: 8px 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.08);
}
</style>
