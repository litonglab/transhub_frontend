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
          >
            <template #header>
              <span>测试用例</span>
              <v-tooltip location="bottom">
                <template v-slot:activator="{ props }">
                  <v-icon
                    v-bind="props"
                    icon="mdi-information-outline"
                    size="16"
                    color="grey"
                    class="ml-1"
                  ></v-icon>
                </template>
                <span>若相关数据显示为*，则表示对应测试用例已被屏蔽，比赛结束后开放查询。</span>
              </v-tooltip>
            </template>
          </el-table-column>
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
          <el-table-column label="丢包率" align="center">
            <template #default="scope">
              <span>{{ scope.row.loss_rate }}</span>
              <span v-if="scope.row.task_status === 'finished' && scope.row.loss_score !== 0">
                <br/>
                <v-chip
                  :color="getScoreColor(scope.row.loss_score)"
                  size="small"
                  text-color="white"
                >
                  {{ scope.row.loss_score.toFixed(2) ?? "-" }}
                </v-chip>
              </span>
            </template>
          </el-table-column>
          <el-table-column label="往返时延" align="center">
            <template #default="scope">
              <!-- 判断是否是数字，如果是再乘2 -->
              <span>
                {{ typeof scope.row.delay === 'number' ? (scope.row.delay * 2) : scope.row.delay }}
              </span>
              <span v-if="scope.row.task_status === 'finished' && scope.row.delay_score !== 0">
                <br/>
                <v-chip
                  :color="getScoreColor(scope.row.delay_score)"
                  size="small"
                  text-color="white"
                >
                  {{ scope.row.delay_score.toFixed(2) ?? "-" }}
                </v-chip>
              </span>
            </template>
          </el-table-column>
          <el-table-column label="缓冲区容量" align="center">
            <template #header>
              <span>缓冲区</span>
              <v-tooltip location="bottom">
                <template v-slot:activator="{ props }">
                  <v-icon
                    v-bind="props"
                    icon="mdi-information-outline"
                    size="16"
                    color="grey"
                    class="ml-1"
                  ></v-icon>
                </template>
                <span>此列上方数字为缓冲区容量（单位：字节），为简化表格，将吞吐量分数合并至此列显示。</span>
              </v-tooltip>
            </template>
            <template #default="scope">
              <span>{{ scope.row.buffer_size }}</span>
              <span v-if="scope.row.task_status === 'finished' && scope.row.throughput_score !== 0">
                <br/>
                <v-chip
                  :color="getScoreColor(scope.row.throughput_score)"
                  size="small"
                  text-color="white"
                >
                  {{ scope.row.throughput_score.toFixed(2) ?? "-" }}
                </v-chip>
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="task_score" label="总分" align="center">
            <template #header>
              <span>总分</span>
              <v-tooltip location="bottom">
                <template v-slot:activator="{ props }">
                  <v-icon
                    v-bind="props"
                    icon="mdi-information-outline"
                    size="16"
                    color="grey"
                    class="ml-1"
                  ></v-icon>
                </template>
                <span>总分为各子项分数加权计算，具体权重请参阅相关文档。</span>
              </v-tooltip>
            </template>
            <template #default="scope">
              <span v-if="scope.row.task_status !== 'finished'"
              >任务完成后可查看</span
              >
              <span v-else>
                <v-chip
                  :color="getScoreColor(scope.row.task_score)"
                  size="medium"
                  text-color="white"
                  style="padding: 5px 10px"
                >
                {{ scope.row.task_score.toFixed(2) ?? "-" }}
                </v-chip>
              </span>
            </template>
          </el-table-column>
          <el-table-column label="性能图" min-width="150" align="center">
            <template #default="scope">
              <span v-if="scope.row.task_status === 'finished'">
                <el-button @click="showImage('throughput', scope.row.task_id)"
                >吞吐
                </el-button>
                <el-button @click="showImage('delay', scope.row.task_id)"
                >时延
                </el-button>
              </span>
              <span v-else-if="scope.row.task_status === 'not_queued'">
                <el-button
                  @click="handleEnqueue(scope.row.task_id)"
                  :loading="enqueueLoadingMap[scope.row.task_id]"
                >执行评测</el-button
                >
              </span>
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
              <el-button @click="showLog(scope.row)">查看</el-button>
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
            <v-card-title>所有雷达图</v-card-title>
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
                    min-width: 250px;
                    min-height: 250px;
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
                    :delay="row.delay_score"
                    :loss="row.loss_score"
                    :throughput="row.throughput_score"
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
          <v-tooltip location="bottom">
            <template v-slot:activator="{ props }">
              <v-icon
                v-bind="props"
                icon="mdi-information-outline"
                size="16"
                color="black"
                class="ml-1"
              ></v-icon>
            </template>
            <span>综合雷达图各项分数为所有测试用例各项原始分数的平均值：avg_score=sum(test_i_score)/count(test)</span>
          </v-tooltip>
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
        <div class="radar-center">
          <RadarChart
            :delay="avgRadar.delay_score"
            :loss="avgRadar.loss_score"
            :throughput="avgRadar.throughput_score"
          />
        </div>
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
import {ElMessage} from "element-plus";

// 重新入队相关
let enqueueLoadingMap = ref({});

async function handleEnqueue(task_id) {
  enqueueLoadingMap.value[task_id] = true;
  try {
    await request(APIS.task_enqueue, {
      method: "POST",
      body: JSON.stringify({task_id}),
    });
    ElMessage.success("任务已重新入队，正排队执行评测");
    handleRefresh();
  } catch (err) {
    console.error("重新入队失败", err);
  } finally {
    enqueueLoadingMap.value[task_id] = false;
  }
}

// 计算所有任务的平均分（仅统计有分数的，使用后端返回的分数字段）
const avgRadar = computed(() => {
  const finished = internalTasks.value.filter(
    (t) => t.task_status === "finished"
  );
  if (!finished.length)
    return {delay_score: 0, loss_score: 0, throughput_score: 0};
  const sum = finished.reduce(
    (acc, t) => {
      acc.delay_score += t.delay_score;
      acc.loss_score += t.loss_score;
      acc.throughput_score += t.throughput_score;
      return acc;
    },
    {delay_score: 0, loss_score: 0, throughput_score: 0}
  );
  return {
    delay_score: sum.delay_score / finished.length,
    loss_score: sum.loss_score / finished.length,
    throughput_score: sum.throughput_score / finished.length,
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
  return internalTasks.value.some((task) => task.log === true);
});
const dialogVisible = ref(false);
const dialogType = ref("");
const loading = ref(false);

const allRadarRows = ref([]);
const hasAnyRadarData = computed(() => {
  return internalTasks.value.some((t) => t.task_status === "finished");
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

async function showLog(row) {
  dialogState.visible = true;
  dialogState.loading = true;
  dialogState.error = false;
  dialogState.contentType = "log";
  dialogState.title = "日志信息";
  dialogState.content = "";
  const traceName = row ? row.trace_name : "unknown";
  dialogState.filename = `${row.algorithm}_${traceName}.log`;

  try {
    const params = new URLSearchParams();
    params.append("task_id", row.task_id);
    const url = `${APIS.task_get_log}?${params.toString()}`;
    const result = await request(url, {method: "GET"});
    if (result && result.log) {
      dialogState.content = result.log;
    } else {
      dialogState.content = "暂无日志信息或无权限查看此日志";
    }
  } catch (error) {
    dialogState.content = "日志获取失败";
    dialogState.error = true;
    dialogState.errorMessage = error?.message || "日志获取失败";
  } finally {
    dialogState.loading = false;
  }
}

// 查看所有测试的雷达图
function showAllRadarDialog() {
  allRadarRows.value = internalTasks.value.filter(
    (t) => t.task_status === "finished"
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

function getScoreColor(score) {
  if (typeof score !== "number") return "#bdbdbd";
  if (score < 60) return "#f44336"; // 红色
  if (score < 90) return "#ff9800"; // 橙色
  return "#4caf50"; // 绿色
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
  align-items: stretch;
  gap: 5px;
}

.task-detail-table-wrapper {
  flex: 1 1 0;
  min-width: 0;
  width: auto;
  /* 让表格自适应剩余空间 */
}

.table-summary-radar {
  width: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 5px;
  transition: all 0.3s ease-in-out;
}

@media (max-width: 768px) {
  .task-detail-table-flex {
    flex-direction: column;
  }

  .table-summary-radar {
    width: 100%;
    margin-top: 20px;
    height: 300px;
  }
}

@media (min-width: 1500px) {
  .table-summary-radar {
    width: 250px;
  }
}

@media (min-width: 1800px) {
  .table-summary-radar {
    width: 350px;
  }
}

.radar-center {
  flex-grow: 1;
  flex-basis: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
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
