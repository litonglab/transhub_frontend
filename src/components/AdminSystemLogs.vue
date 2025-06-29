<template>
  <div class="logs-container">
    <v-row v-if="!loading" class="h-100 no-gutters">
      <!-- 日志文件列表 -->
      <v-col cols="12" md="2" class="h-100">
        <v-card class="h-100 d-flex flex-column">
          <v-card-title>
            <v-icon class="mr-2" color="primary"
            >mdi-file-document-outline
            </v-icon
            >
            日志文件列表
          </v-card-title>
          <v-card-text class="flex-grow-1 overflow-auto">
            <v-list>
              <v-list-item
                v-for="logFile in logFiles"
                :key="logFile.name"
                :class="{ 'v-list-item--active': selectedLog === logFile.name }"
                @click="selectLogFile(logFile.name)"
                class="log-file-item"
              >
                <template v-slot:prepend>
                  <v-icon color="info">mdi-file-document</v-icon>
                </template>
                <v-list-item-title>{{ logFile.name }}</v-list-item-title>
                <div class="text-caption log-file-info">
                  <div class="log-file-size">
                    <v-icon size="x-small" class="mr-1"
                    >mdi-file-outline
                    </v-icon
                    >
                    {{ formatFileSize(logFile.size) }}
                  </div>
                  <div class="log-file-time">
                    <v-icon size="x-small" class="mr-1"
                    >mdi-clock-outline
                    </v-icon
                    >
                    {{ logFile.modified_time }}
                  </div>
                </div>
              </v-list-item>
            </v-list>
            <v-divider class="my-3"></v-divider>
            <div class="text-caption text-center">
              <v-icon size="small" class="mr-1">mdi-folder</v-icon>
              日志目录: {{ logDir }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 日志内容显示 -->
      <v-col cols="12" md="10" class="h-100">
        <v-card class="h-100 d-flex flex-column">
          <v-card-title>
            <v-icon class="mr-2" color="primary">mdi-text-box-outline</v-icon>
            日志内容
            <v-spacer></v-spacer>
            <div class="d-flex align-center">
              <v-chip
                v-if="selectedLog"
                size="small"
                variant="outlined"
                color="info"
                class="mr-2"
              >
                {{ selectedLog }}
              </v-chip>
              <v-btn
                v-if="selectedLog"
                size="small"
                variant="outlined"
                color="success"
                @click="startStreaming"
                :disabled="isStreaming"
                class="mr-2"
              >
                <v-icon size="small" class="mr-1">
                  {{ isStreaming ? "mdi-pause" : "mdi-play" }}
                </v-icon>
                {{ isStreaming ? "实时监控中" : "开始实时监控" }}
              </v-btn>
              <v-btn
                v-if="isStreaming"
                size="small"
                variant="outlined"
                color="error"
                @click="stopStreaming"
              >
                <v-icon size="small" class="mr-1">mdi-stop</v-icon>
                停止监控
              </v-btn>
              <v-btn
                v-if="selectedLog && !isStreaming"
                size="small"
                variant="outlined"
                @click="clearLogs"
                class="ml-2"
              >
                <v-icon size="small" class="mr-1">mdi-delete-sweep</v-icon>
                清空显示
              </v-btn>
            </div>
          </v-card-title>
          <v-card-text class="flex-grow-1 log-content-container d-flex">
            <div
              v-if="!selectedLog"
              class="d-flex flex-column align-center justify-center flex-grow-1 text-grey-600"
            >
              <v-icon size="64" color="grey-300"
              >mdi-file-document-outline
              </v-icon
              >
              <div class="mt-4">请选择一个日志文件查看内容</div>
            </div>
            <div
              v-else-if="logContent.length === 0"
              class="d-flex flex-column align-center justify-center flex-grow-1 text-grey-600"
            >
              <v-icon size="64" color="grey-300"
              >mdi-file-document-remove-outline
              </v-icon
              >
              <div class="mt-4">暂无日志内容</div>
            </div>
            <div v-else class="log-content flex-grow-1" ref="logContainer">
              <div
                v-for="(line, index) in logContent"
                :key="index"
                class="log-line"
                :class="getLogLineClass(line)"
              >
                <span class="log-line-number">{{ index + 1 }}</span>
                <span class="log-line-content">{{ line }}</span>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-else class="h-100">
      <v-col cols="12" class="text-center d-flex align-center justify-center">
        <div>
          <v-progress-circular indeterminate size="64"></v-progress-circular>
          <div class="mt-4">加载日志信息中...</div>
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import {nextTick, onMounted, onUnmounted, ref, watch} from "vue";
import {APIS} from "@/config";
import {request} from "@/utility.js";
import {ElMessage} from "element-plus";

// 接收父组件传递的激活状态
const props = defineProps({
  isActive: {
    type: Boolean,
    default: false,
  },
});

const loading = ref(false);
const logFiles = ref([]);
const logDir = ref("");
const selectedLog = ref("");
const logContent = ref([]);
const isStreaming = ref(false);
const logContainer = ref(null);
let eventSource = null;
let updateTimer = null;
let pendingLogs = [];

// 批量更新日志内容，避免频繁DOM操作
const batchUpdateLogs = () => {
  console.debug("Batch updating logs, pending count:", pendingLogs.length);
  if (pendingLogs.length > 0) {
    const container = logContainer.value;
    // 在更新前检查用户是否已经滚动到底部
    const isScrolledToBottom = container
      ? container.scrollHeight - container.scrollTop - container.clientHeight <
      10 // 增加一个小的容差
      : true;

    logContent.value.push(...pendingLogs);

    // 限制显示的行数，避免内存溢出
    if (logContent.value.length > 8000) {
      logContent.value = logContent.value.slice(-5000); // 保留最新的5000行，有一个gap保证翻阅历史日志时不会一直向上刷
    }

    pendingLogs = [];

    // 只有当用户在底部时才自动滚动
    if (isScrolledToBottom) {
      scrollToBottom();
    }
  }
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// 获取日志行的CSS类
const getLogLineClass = (line) => {
  const lowerLine = line.toLowerCase();
  if (lowerLine.includes("error") || lowerLine.includes("错误")) {
    return "log-error";
  } else if (
    lowerLine.includes("warning") ||
    lowerLine.includes("warn") ||
    lowerLine.includes("警告")
  ) {
    return "log-warning";
  } else if (lowerLine.includes("info") || lowerLine.includes("信息")) {
    return "log-info";
  } else if (lowerLine.includes("debug") || lowerLine.includes("调试")) {
    return "log-debug";
  }
  return "log-normal";
};

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  });
};

// 加载日志文件列表
const loadLogFiles = async () => {
  loading.value = true;
  try {
    const result = await request(APIS.admin_get_logs, {
      method: "GET",
    });

    if (result.data) {
      logFiles.value = result.data.log_files || [];
      logDir.value = result.data.log_dir || "";
    }
  } catch (error) {
    console.error("加载日志文件列表失败:", error);
    ElMessage.error("加载日志文件列表失败");
  } finally {
    loading.value = false;
  }
};

// 选择日志文件
const selectLogFile = (filename) => {
  if (isStreaming.value) {
    stopStreaming();
  }
  selectedLog.value = filename;
  logContent.value = [];
};

// 开始流式读取日志
const startStreaming = () => {
  if (!selectedLog.value || isStreaming.value) return;

  const url = `${APIS.admin_stream_log}/${selectedLog.value}`;

  // 创建EventSource连接
  eventSource = new EventSource(url);
  isStreaming.value = true;
  logContent.value = []; // 清空之前的内容
  pendingLogs = []; // 清空待处理日志

  // 启动批量更新定时器，每500ms更新一次DOM
  updateTimer = setInterval(batchUpdateLogs, 500);

  eventSource.onmessage = (event) => {
    if (event.data) {
      // 将数据添加到待处理队列，而不是直接更新DOM
      pendingLogs.push(event.data);

      // 如果待处理队列过大，立即处理一批以避免内存问题
      if (pendingLogs.length > 500) {
        batchUpdateLogs();
      }
    }
  };

  eventSource.onerror = (error) => {
    console.error("EventSource连接错误:", error);
    ElMessage.error("日志流连接失败");
    stopStreaming();
  };

  eventSource.onopen = () => {
    ElMessage.success("开始实时监控日志");
  };
};

// 停止流式读取
const stopStreaming = () => {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
    ElMessage.info("停止日志监控");
  }

  if (updateTimer) {
    clearInterval(updateTimer);
    updateTimer = null;
    // 处理剩余的待处理日志
    batchUpdateLogs();
  }

  isStreaming.value = false;
};

// 清空日志显示
const clearLogs = () => {
  logContent.value = [];
  pendingLogs = [];
  ElMessage.success("已清空日志显示");
};

onMounted(() => {
  if (props.isActive) {
    loadLogFiles();
  }
  console.debug("AdminSystemLogs mounted");
});

onUnmounted(() => {
  stopStreaming();
  if (updateTimer) {
    clearInterval(updateTimer);
    updateTimer = null;
  }
  console.debug("AdminSystemLogs unmounted");
});

// 监听激活状态变化
watch(
  () => props.isActive,
  (newValue, oldValue) => {
    console.debug(
      "AdminSystemLogs isActive changed:",
      newValue,
      "from:",
      oldValue
    );
    if (newValue) {
      loadLogFiles();
    } else {
      stopStreaming(); // 切换走时停止流式读取
    }
  },
  {immediate: false}
);
</script>

<style scoped>
.logs-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding-top: 5px;
  padding-bottom: 3px;
}

.no-gutters {
  margin: 0 !important;
}

.no-gutters > [class*="col-"] {
  padding: 0 8px !important;
}

.log-file-item {
  cursor: pointer;
  border-radius: 8px;
  margin-bottom: 4px;
}

.log-file-item :deep(.v-list-item__prepend) {
  width: auto !important;
  min-width: auto !important;
  flex: none !important;
}

.log-file-item :deep(.v-list-item__prepend .v-list-item__spacer) {
  display: none !important;
}

.log-file-item :deep(.v-list-item__content) {
  margin-left: 8px !important;
}

.log-file-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.log-file-info {
  margin-top: 4px;
}

.log-file-size,
.log-file-time {
  display: flex;
  align-items: center;
  font-size: 11px !important;
  opacity: 0.8;
  line-height: 1.2;
}

.log-file-size .v-icon,
.log-file-time .v-icon {
  opacity: 0.6;
}

.log-content-container {
  overflow: hidden;
  height: 100%;
}

.log-content {
  overflow-y: auto;
  font-family: "Courier New", Monaco, monospace;
  font-size: 12px;
  line-height: 1.4;
  background-color: #1e1e1e;
  color: #d4d4d4;
  padding: 16px;
  border-radius: 4px;
  max-height: 100%;
}

.log-line {
  display: flex;
  margin-bottom: 2px;
  word-break: break-all;
  white-space: pre-wrap;
}

.log-line-number {
  width: 50px;
  flex-shrink: 0;
  color: #858585;
  text-align: right;
  margin-right: 12px;
  border-right: 1px solid #333;
  padding-right: 8px;
  user-select: none;
}

.log-line-content {
  flex: 1;
  word-break: break-all;
  white-space: pre-wrap;
}

/* 日志级别颜色 */
.log-error .log-line-content {
  color: #f48771;
  background-color: rgba(244, 135, 113, 0.1);
}

.log-warning .log-line-content {
  color: #dcdcaa;
  background-color: rgba(220, 220, 170, 0.1);
}

.log-info .log-line-content {
  color: #9cdcfe;
  background-color: rgba(156, 220, 254, 0.1);
}

.log-debug .log-line-content {
  color: #b5cea8;
  background-color: rgba(181, 206, 168, 0.1);
}

.log-normal .log-line-content {
  color: #d4d4d4;
}

/* 活跃的日志文件项 */
.v-list-item--active {
  background-color: rgba(25, 118, 210, 0.12) !important;
  color: #1976d2 !important;
}

.v-list-item--active .v-list-item-title {
  color: #1976d2 !important;
  font-weight: 500;
}

.v-list-item--active .log-file-size,
.v-list-item--active .log-file-time {
  color: #1976d2 !important;
  opacity: 0.8;
}

.v-list-item--active .log-file-size .v-icon,
.v-list-item--active .log-file-time .v-icon {
  color: #1976d2 !important;
}

/* 滚动条样式 */
.log-content::-webkit-scrollbar {
  width: 8px;
}

.log-content::-webkit-scrollbar-track {
  background: #2d2d2d;
}

.log-content::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 4px;
}

.log-content::-webkit-scrollbar-thumb:hover {
  background: #777;
}
</style>
