<template>
  <v-dialog v-model="dialogVisible" class="responsive-dialog">
    <v-card
      class="position-relative d-flex flex-column"
      style="height: auto; max-height: 100%"
    >
      <v-card-title class="flex-shrink-0">{{ title }}</v-card-title>

      <!-- Floating file info and download button -->
      <div v-if="!loading && !error && filename" class="floating-controls">
        <v-chip
          color="primary"
          variant="outlined"
          prepend-icon="mdi-file-code"
          size="small"
          class="mr-2"
        >
          {{ filename }}
        </v-chip>
        <v-btn
          color="primary"
          variant="elevated"
          prepend-icon="mdi-download"
          size="small"
          @click="handleDownload"
        >
          下载
        </v-btn>
      </div>

      <v-card-text
        :class="[
          'dialog-card-text',
          'flex-grow-1',
          { 'is-image': contentType === 'image' },
        ]"
      >
        <!-- Loading State -->
        <div
          v-if="loading"
          class="d-flex justify-center align-center fill-height"
        >
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
          ></v-progress-circular>
        </div>

        <!-- Error State -->
        <div
          v-else-if="error"
          class="d-flex flex-column align-center justify-center fill-height"
        >
          <v-icon size="64" color="grey-lighten-1" class="mb-4"
          >mdi-file-alert-outline
          </v-icon
          >
          <v-card-subtitle>{{
              errorMessage || "无法加载内容"
            }}
          </v-card-subtitle>
        </div>

        <!-- Content Display -->
        <template v-else>
          <img
            v-if="contentType === 'image'"
            :src="content"
            class="image-content"
            alt="Image content"
          />
          <pre
            v-else-if="contentType === 'log' || contentType === 'code'"
            class="code-content"
          ><code>{{ content }}</code></pre>
        </template>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import {ref, watch} from "vue";
import {ElMessage} from "element-plus";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "查看内容",
  },
  contentType: {
    type: String, // 'image', 'log', 'code'
    required: true,
  },
  content: {
    type: [String, null],
  },
  filename: {
    type: String,
    default: "",
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: "无法加载内容",
  },
});

const emit = defineEmits(["update:visible"]);

const dialogVisible = ref(props.visible);

watch(
  () => props.visible,
  (newVal) => {
    dialogVisible.value = newVal;
  }
);

watch(dialogVisible, (newVal) => {
  emit("update:visible", newVal);
});

function handleDownload() {
  if (!props.content) {
    ElMessage.warning("没有可下载的内容");
    return;
  }

  const a = document.createElement("a");
  let downloadUrl = props.content;
  let needsRevoke = false;

  if (props.contentType === "log" || props.contentType === "code") {
    const blob = new Blob([props.content], {
      type: "text/plain;charset=utf-8",
    });
    downloadUrl = URL.createObjectURL(blob);
    needsRevoke = true;
  }

  a.href = downloadUrl;
  a.download = props.filename || "download";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  if (needsRevoke) {
    URL.revokeObjectURL(downloadUrl);
  }
  ElMessage.success("下载成功");
}
</script>

<style scoped>
.responsive-dialog {
  max-width: 70%;
  max-height: 95%;
}

@media (max-width: 600px) {
  .responsive-dialog {
    max-width: 100%;
    max-height: 80%;
  }
}

.dialog-card-text {
  height: calc(80vh - 100px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.dialog-card-text.is-image {
  height: auto;
  padding: 0;
}

.fill-height {
  height: 100%;
}

/* .image-content {
  display: block;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  margin: auto;
} */

.code-content {
  background-color: #f8f9fa;
  border-radius: 4px;
  padding: 16px;
  margin: 0;
  font-family: "Courier New", Consolas, "Liberation Mono", monospace;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  color: #333;
  overflow: auto;
  box-sizing: border-box;
  height: 100%;
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

.position-relative {
  position: relative;
}
</style>
