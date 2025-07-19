<template>
  <el-card shadow="hover">
    <div class="task-detail-table-flex">
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
            label="测试用例"
            min-width="160"
            align="center"
          ></el-table-column>
          <el-table-column
            prop="loss_rate"
            label="丢包率"
            align="center"
          ></el-table-column>
          <el-table-column
            prop="buffer_size"
            label="缓冲区容量"
            align="center"
          ></el-table-column>
          <el-table-column
            prop="delay"
            label="往返时延"
            align="center"
          ></el-table-column>
          <el-table-column prop="created_at" label="创建时间" align="center">
            <template #default="scope">
              {{ formatDateTime(scope.row.created_at, true) }}
            </template>
          </el-table-column>
          <el-table-column prop="updated_at" label="更新时间" align="center">
            <template #default="scope">
              {{ formatDateTime(scope.row.updated_at, true) }}
            </template>
          </el-table-column>
          <el-table-column
            prop="task_status"
            label="任务状态"
            align="center"
          ></el-table-column>
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
          <el-table-column v-if="hasAnyLog" label="日志">
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
              <el-button @click="showLog(scope.row.log, scope.row)"
              >查看
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <ImageAndLogViewDialog
          :visible="dialogState.visible"
          @update:visible="dialogState.visible = $event"
          :title="dialogState.title"
          :content-type="dialogState.contentType"
          :content="dialogState.content"
          :filename="dialogState.filename"
          :loading="dialogState.loading"
          :error="dialogState.error"
          :error-message="dialogState.errorMessage"
        />

        <v-dialog v-model="dialogVisible" class="responsive-dialog">
          <v-card>
            <v-card-title> 所有测试雷达图</v-card-title>
            <v-card-text>
              <div
                style="
                  display: flex;
                  flex-wrap: wrap;
                  gap: 24px;
                  justify-content: center;
                "
              >
                <div
                  v-for="(row, idx) in allRadarRows"
                  :key="row.task_id || idx"
                  style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    min-width: 200px;
                  "
                >
                  <div
                    style="
                      font-size: 13px;
                      margin-bottom: 4px;
                      color: #666;
                      max-width: 180px;
                      text-align: center;
                      word-break: break-all;
                    "
                  >
                    {{ row.trace_name || row.task_id || "测试" + (idx + 1) }}
                  </div>
                  <RadarChart
                    :delay="row.delay"
                    :loss="row.loss_rate"
                    :throughput="row.buffer_size"
                  />
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-dialog>
      </div>
      <div class="table-summary-radar">
        <div class="radar-header">
          <span style="font-weight: bold; text-align: center">
            综合雷达图
          </span>
          <el-button
            link
            :icon="ZoomInIcon"
            @click="showAllRadarDialog"
            :disabled="!hasAnyRadarData"
            size="small"
            class="radar-expand-button"
            title="查看所有测试雷达图"
          >
          </el-button>
        </div>
        <RadarChart
          :delay="avgRadar.delay"
          :loss="avgRadar.loss"
          :throughput="avgRadar.throughput"
        />
      </div>
    </div>
  </el-card>
</template>

<script setup>
import {computed, reactive, ref, watch} from "vue";
import {APIS} from "@/config.js";
import {fetchImageBlobUrl, formatDateTime, request} from "@/utility.js";
import {Refresh as RefreshIcon, ZoomIn as ZoomInIcon,} from "@element-plus/icons-vue";
import RadarChart from "./RadarChart.vue";
import ImageAndLogViewDialog from "./ImageAndLogViewDialog.vue";

// 计算所有任务的平均分（仅统计有分数的）
const avgRadar = computed(() => {
  const finished = internalTasks.value.filter(
    (t) =>
      t.task_status === "finished" &&
      typeof t.delay === "number" &&
      typeof t.loss_rate === "number" &&
      typeof t.buffer_size === "number"
  );
  if (!finished.length) return {delay: 0, loss: 0, throughput: 0};
  const sum = finished.reduce(
    (acc, t) => {
      acc.delay += t.delay;
      acc.loss += t.loss_rate;
      acc.throughput += t.buffer_size;
      return acc;
    },
    {delay: 0, loss: 0, throughput: 0}
  );
  return {
    delay: Math.round(sum.delay / finished.length),
    loss: Math.round(sum.loss / finished.length),
    throughput: Math.round(sum.throughput / finished.length),
  };
});

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

const hasAnyLog = computed(() => {
  return internalTasks.value.some(
    (task) =>
      task.log !== undefined &&
      task.log !== null &&
      String(task.log).trim() !== ""
  );
});
const dialogVisible = ref(false);
const dialogType = ref("");
const loading = ref(false);

const allRadarRows = ref([]);
const hasAnyRadarData = computed(() => {
  return internalTasks.value.some(
    (t) =>
      t.task_status === "finished" &&
      typeof t.delay === "number" &&
      typeof t.loss_rate === "number" &&
      typeof t.buffer_size === "number"
  );
});

const dialogState = reactive({
  visible: false,
  title: "",
  contentType: "log",
  content: "",
  filename: "",
  loading: false,
  error: false,
  errorMessage: "",
});

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
    let tasks = data.tasks || [];
    // 多重排序：trace_name > loss_rate > buffer_size > delay
    tasks = tasks.slice().sort((a, b) => {
      // 1. trace_name 字典序
      if (a.trace_name !== b.trace_name) {
        return a.trace_name.localeCompare(b.trace_name);
      }
      // 2. loss_rate 数值升序
      if (a.loss_rate !== b.loss_rate) {
        return Number(a.loss_rate) - Number(b.loss_rate);
      }
      // 3. buffer_size 数值升序
      if (a.buffer_size !== b.buffer_size) {
        return Number(a.buffer_size) - Number(b.buffer_size);
      }
      // 4. delay 数值升序
      return Number(a.delay) - Number(b.delay);
    });
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
  dialogState.visible = true;
  dialogState.loading = true;
  dialogState.error = false;
  dialogState.contentType = "image";
  dialogState.title = "性能图";
  dialogState.content = "";
  dialogState.filename = "";

  try {
    const params = new URLSearchParams();
    params.append("task_id", task_id);
    params.append("graph_type", type);
    const url = `${APIS.get_graph}?${params.toString()}`;
    const result = await fetchImageBlobUrl(url);
    if (!result) {
      dialogState.error = true;
      dialogState.errorMessage = "无法获取性能图";
      return;
    }
    const {blobUrl, filename} = result;
    dialogState.content = blobUrl;

    const task = internalTasks.value.find((t) => t.task_id === task_id);
    const traceName = task ? task.trace_name : task_id;
    const imageType = type === "throughput" ? "吞吐量" : "时延";
    dialogState.filename = filename || `${traceName}_${imageType}.png`;
    dialogState.filename = `${task.algorithm}_${dialogState.filename}`;
  } catch (error) {
    dialogState.error = true;
    dialogState.errorMessage = "加载性能图失败";
  } finally {
    dialogState.loading = false;
  }
}

function showLog(logContent, row) {
  dialogState.visible = true;
  dialogState.loading = false;
  dialogState.error = false;
  dialogState.contentType = "log";
  dialogState.title = "日志信息";
  dialogState.content = logContent || "暂无日志信息或无权限查看此日志";
  const traceName = row ? row.trace_name : "unknown";
  dialogState.filename = `${row.algorithm}_${traceName}.log`;
}

// 查看所有测试的雷达图
function showAllRadarDialog() {
  allRadarRows.value = internalTasks.value.filter(
    (t) =>
      t.task_status === "finished" &&
      typeof t.delay === "number" &&
      typeof t.loss_rate === "number" &&
      typeof t.buffer_size === "number"
  );
  dialogType.value = "allRadar";
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

.task-detail-table-flex {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 32px;
}

.task-detail-table-wrapper {
  flex: 1 1 0;
  min-width: 0;
  width: auto;
  /* 让表格自适应剩余空间 */
}

.table-summary-radar {
  /* min-width: 370px;
  max-width: 400px; */
  /* padding: 12px 0 0 0; */
  display: flex;
  flex-direction: column;
  align-items: center;
}

.radar-header {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin-bottom: 2px;
}

.radar-expand-button {
  padding: 4px;
  color: #606266;
  font-size: 16px;
  transition: all 0.3s ease;
}

.radar-expand-button:hover {
  color: #409eff;
  transform: scale(1.15);
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
</style>
