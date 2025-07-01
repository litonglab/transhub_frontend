<template>
  <el-card shadow="hover">
    <div class="task-detail-table-wrapper">
      <el-table
        :data="internalTasks"
        style="width: 100%"
        :max-height="height"
        class="task-detail-table"
        v-loading="loading"
        element-loading-text="加载中..."
      >
        <template #empty>
          <div class="empty-container">
            <span>暂无数据</span>
            <el-button
              link
              :icon="RefreshIcon"
              @click="handleRefresh"
              :loading="loading"
              size="small"
              class="refresh-button"
              title="刷新数据"
            >
            </el-button>
          </div>
        </template>
        <el-table-column
          prop="trace_name"
          label="测试文件"
          min-width="160"
          align="center"
        ></el-table-column>
        <el-table-column prop="loss_rate" label="丢包率" align="center"></el-table-column>
        <el-table-column prop="buffer_size" label="缓冲区容量" align="center"></el-table-column>
        <el-table-column prop="delay" label="往返时延" align="center"></el-table-column>
        <el-table-column prop="created_at" label="创建时间" align="center">
          <template #default="scope">
            {{ scope.row.created_at.split(" ")[1] }}
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" align="center">
          <template #default="scope">
            {{ scope.row.updated_at.split(" ")[1] }}
          </template>
        </el-table-column>
        <el-table-column prop="task_status" label="任务状态" align="center"></el-table-column>
        <el-table-column prop="task_score" label="得分" align="center">
          <template #default="scope">
            <span v-if="scope.row.task_status !== 'finished'"
            >任务完成后可查看</span
            >
          </template>
        </el-table-column>
        <el-table-column label="吞吐量">
          <template #default="scope">
            <el-button
              v-if="scope.row.task_status === 'finished'"
              @click="showImage('throughput', scope.row.task_id)"
            >查看
            </el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="时延">
          <template #default="scope">
            <el-button
              v-if="scope.row.task_status === 'finished'"
              @click="showImage('delay', scope.row.task_id)"
            >查看
            </el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="日志">
          <template #header>
            <div class="column-header">
              <span>日志</span>
              <el-button
                link
                :icon="RefreshIcon"
                @click="handleRefresh"
                :loading="loading"
                size="small"
                class="refresh-button"
                title="刷新数据"
              >
              </el-button>
            </div>
          </template>
          <template #default="scope">
            <el-button @click="showLog(scope.row.log)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <v-dialog v-model="dialogVisible" class="responsive-dialog">
        <v-card>
          <v-card-title
          >{{ dialogType === "image" ? "性能图" : "日志信息" }}
          </v-card-title>
          <v-card-text>
            <img
              v-if="dialogType === 'image'"
              :src="dialogContent"
              style="width: 100%"
              alt=""
            />
            <div v-else>
              <pre class="code-content"><code>{{ dialogContent }}</code></pre>
            </div>
          </v-card-text>
        </v-card>
      </v-dialog>
    </div>
  </el-card>
</template>

<script setup>
import {ref, watch} from "vue";
import {APIS} from "@/config.js";
import {fetchImageBlobUrl, request} from "@/utility.js";
import {Refresh as RefreshIcon} from "@element-plus/icons-vue";

const props = defineProps({
  upload_id: {
    type: String,
    required: true,
  },
  height: {
    type: String,
    default: "500",
  },
});

const internalTasks = ref([]);
const dialogVisible = ref(false);
const dialogContent = ref("");
const dialogType = ref("");
const loading = ref(false);

async function fetchTasks(upload_id, delay = 0) {
  loading.value = true;
  try {
    const data = await request(APIS.get_history_record_detail, {
      body: JSON.stringify({
        upload_id: upload_id,
      }),
    });
    if (delay) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    const tasks = data.tasks || [];
    internalTasks.value = tasks;
    return tasks;
  } catch (error) {
    console.error("Failed to get task details:", error);
    internalTasks.value = [];
    return [];
  } finally {
    loading.value = false;
  }
}

// Handle refresh button click
function handleRefresh() {
  if (props.upload_id) {
    fetchTasks(props.upload_id, 100)
      .then(() => {
        // if (result.length !== 0) {
        //   ElMessage.success("刷新成功");
        // }
      })
      .catch((error) => {
        console.error("Failed to refresh data:", error);
        // ElMessage.error("Failed to refresh data");
      });
  }
}

// 监听 upload_id 变化，自动获取数据
watch(
  () => props.upload_id,
  (newUploadId) => {
    if (newUploadId) {
      fetchTasks(newUploadId);
    }
  },
  {immediate: true}
);

async function showImage(type, task_id) {
  try {
    const params = new URLSearchParams();
    params.append("task_id", task_id);
    params.append("graph_type", type);
    const url = `${APIS.get_graph}?${params.toString()}`;
    const blobUrl = await fetchImageBlobUrl(url);
    if (!blobUrl) {
      // fetchImageBlobUrl 已自动打印错误日志
      return;
    }
    dialogContent.value = blobUrl;
    dialogType.value = "image";
    dialogVisible.value = true;
  } catch (error) {
    // fetchImageBlobUrl 已自动打印异常
  }
}

function showLog(logContent) {
  dialogContent.value = logContent;
  dialogType.value = "log";
  dialogVisible.value = true;
}

// Check task status to determine whether to refresh or stop auto-refresh, used in parent component.
function checkTaskStatus() {
  if (!internalTasks.value || internalTasks.value.length === 0) {
    return true; // If no task data, continue refreshing
  }

  const tasks = internalTasks.value;

  // Check if any task has compile_failed status
  const hasCompileFailed = tasks.some(
    (task) => task.task_status === "compile_failed"
  );
  console.debug("Has compile failed task:", hasCompileFailed);
  if (hasCompileFailed) {
    console.debug("Found compile failed task, stopping auto-refresh");
    return false;
  }

  // Check if all tasks are finished or error
  const allFinishedOrError = tasks.every(
    (task) => task.task_status === "finished" || task.task_status === "error"
  );
  console.debug("All tasks finished or error:", allFinishedOrError);

  if (allFinishedOrError && tasks.length > 0) {
    console.debug("All tasks completed or failed, stopping auto-refresh");
    return false;
  }

  return true; // Continue auto-refresh
}

defineExpose({
  fetchTasks,
  checkTaskStatus,
});
</script>

<style scoped>
.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.refresh-button {
  padding: 2px;
  margin-left: 8px;
  color: #409eff;
}

.refresh-button:hover {
  color: #66b1ff;
}

.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.task-detail-table-wrapper {
  width: 100%;
}

.task-detail-table {
  overflow-y: auto;
}

.task-detail-table :deep(.el-table__body-wrapper) {
  overflow-y: auto;
}

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
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
  min-height: 30vh;
  max-height: calc(80vh - 150px);
}
</style>
