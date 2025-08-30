<template>
  <el-card shadow="hover" style="min-width: 600px" class="el-card-wrapper">
    <div class="task-detail-table-flex" style="min-height: 350px">
      <div class="task-detail-table-wrapper">
        <el-table
          :data="internalTasks"
          :max-height="height"
          class="task-detail-table"
          v-loading="loading"
          element-loading-text="加载中..."
          :span-method="objectSpanMethod"
          :cell-class-name="tableCellClassName"
        >
          <template #empty>
            <div class="empty-container">
              <span>暂无数据</span>
              <v-btn
                icon
                variant="text"
                size="small"
                @click="handleRefresh"
                :loading="loading"
                class="table-header-btn"
                title="刷新数据"
              >
                <v-icon>mdi-refresh</v-icon>
              </v-btn>
            </div>
          </template>
          <el-table-column
            prop="trace_name"
            label="测试用例"
            min-width="160"
            align="center"
            fixed
          >
          </el-table-column>
          <el-table-column
            prop="created_at"
            label="任务时间"
            align="center"
            min-width="100"
          >
            <template #default="scope">
              {{ formatDateTime(scope.row.created_at, true) }}
              <br/>
              <v-chip color="" size="small">
                {{ formatDateTime(scope.row.updated_at, true) }}
              </v-chip>
            </template>
          </el-table-column>
          <el-table-column
            prop="task_status"
            label="任务状态"
            align="center"
          ></el-table-column>
          <el-table-column label="网络环境配置与得分" align="center">
            <el-table-column label="丢包率" align="center">
              <template #default="scope">
                <span>{{ scope.row.loss_rate }}</span>
                <span
                  v-if="
                    scope.row.task_status === 'finished' &&
                    scope.row.loss_score !== 0
                  "
                >
                  <br/>
                  <v-chip
                    :color="getScoreColor(scope.row.loss_score)"
                    size="small"
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
                  {{
                    typeof scope.row.delay === "number"
                      ? scope.row.delay * 2
                      : scope.row.delay
                  }}
                </span>
                <span
                  v-if="
                    scope.row.task_status === 'finished' &&
                    scope.row.delay_score !== 0
                  "
                >
                  <br/>
                  <v-chip
                    :color="getScoreColor(scope.row.delay_score)"
                    size="small"
                  >
                    {{ scope.row.delay_score.toFixed(2) ?? "-" }}
                  </v-chip>
                </span>
              </template>
            </el-table-column>
            <el-table-column label="缓冲区" align="center">
              <template #default="scope">
                <span>{{ formatBufferSize(scope.row.buffer_size) }}</span>
                <span
                  v-if="
                    scope.row.task_status === 'finished' &&
                    scope.row.throughput_score !== 0
                  "
                >
                  <br/>
                  <v-chip
                    :color="getScoreColor(scope.row.throughput_score)"
                    size="small"
                  >
                    {{ scope.row.throughput_score.toFixed(2) ?? "-" }}
                  </v-chip>
                </span>
              </template>
            </el-table-column>
          </el-table-column>
          <el-table-column prop="task_score" label="总分" align="center">
            <template #default="scope">
              <span v-if="scope.row.task_status !== 'finished'"
              >任务完成后可查看</span
              >
              <span v-else>
                <v-chip
                  :color="getScoreColor(scope.row.task_score)"
                  size="medium"
                  style="padding: 5px 10px"
                >
                  {{ scope.row.task_score.toFixed(2) ?? "-" }}
                </v-chip>
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" fixed="right">
            <template #header>
              <div class="column-header">
                <span style="text-align: center; flex-grow: 1">操作</span>
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  @click="startGuide"
                  :disabled="guide.active"
                  class="table-header-btn"
                  title="表格列说明"
                >
                  <v-icon>mdi-help-circle-outline</v-icon>
                </v-btn>
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  @click="handleRefresh"
                  :loading="loading"
                  class="table-header-btn"
                  title="刷新数据"
                >
                  <v-icon>mdi-refresh</v-icon>
                </v-btn>
              </div>
            </template>
            <el-table-column label="性能图" min-width="160" align="center">
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
            <el-table-column v-if="hasAnyLog" label="日志" min-width="90" align="center">
              <template #default="scope">
                <el-button @click="showLog(scope.row)">查看</el-button>
              </template>
            </el-table-column>
            <el-table-column
              v-if="isInTableRadarVisible"
              label="雷达图列"
              align="center"
              :width="radarColumnWidth"
            >
              <template #header>
                <div class="column-header">
                  <div class="radar-header">
                    <span
                      style="font-weight: bold; text-align: center"
                      class="ml-8"
                    >
                      综合雷达图
                    </span>
                  </div>

                  <v-btn
                    icon
                    variant="text"
                    size="small"
                    @click="showAllRadarDialog"
                    :disabled="!hasAnyRadarData"
                    class="table-header-btn"
                    title="查看所有测试雷达图"
                    color="grey"
                  >
                    <v-icon>mdi-apps</v-icon>
                  </v-btn>
                </div>
              </template>
              <!-- 空白内容，实际雷达图通过绝对定位显示 -->
              <template #default>
                <div style="height: 1px"></div>
              </template>
            </el-table-column>
          </el-table-column>
        </el-table>

        <!--         固定位置的雷达图 -->
        <div
          v-if="isInTableRadarVisible"
          class="fixed-radar-chart"
          :style="{
            width: radarColumnWidth + 'px',
            top: tableHeaderHeight + 'px',
          }"
        >
          <div class="radar-center">
            <RadarChart
              :delay="avgRadar.delay_score"
              :loss="avgRadar.loss_score"
              :throughput="avgRadar.throughput_score"
            />
          </div>
        </div>

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
      <div class="table-summary-radar" v-if="!isInTableRadarVisible">
        <div class="radar-header">
          <span style="font-weight: bold; text-align: center" class="ml-8">
            综合雷达图
          </span>
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
            <div style="text-align: center">
              <span
              >综合雷达图各项分数为所有测试用例各项原始分数的平均值：avg_score=sum(test_i_score)/count(test)</span
              >
            </div>
          </v-tooltip>
          <v-btn
            icon
            variant="text"
            size="small"
            @click="showAllRadarDialog"
            :disabled="!hasAnyRadarData"
            class="radar-expand-button"
            title="查看所有测试雷达图"
            color="grey"
          >
            <v-icon>mdi-apps</v-icon>
          </v-btn>
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

    <!-- 新手引导覆盖层 -->
    <transition name="fade">
      <div v-if="guide.active" class="guide-overlay">
        <div
          v-for="(step, idx) in guide.renderedSteps"
          :key="idx"
          v-show="idx === guide.stepIndex"
        >
          <template v-if="step.rect">
            <div
              v-for="(pieceStyle, i2) in computeMaskPieces(step)"
              :key="'piece-' + i2"
              class="guide-dim-piece"
              :style="pieceStyle"
              @click="finishGuide"
            ></div>
          </template>
          <div
            class="guide-highlight-box"
            :style="computeHighlightStyle(step)"
          ></div>
          <div class="guide-tooltip" :style="computeTooltipStyle(step)">
            <div class="guide-title">{{ step.title }}</div>
            <div class="guide-content" v-html="step.content"></div>
            <div class="guide-actions">
              <v-btn
                size="small"
                variant="text"
                @click="prevGuide"
                :disabled="guide.stepIndex === 0"
              >上一个
              </v-btn
              >
              <v-btn
                size="small"
                variant="text"
                @click="nextGuide"
                v-if="guide.stepIndex < guide.renderedSteps.length - 1"
              >下一个
              </v-btn
              >
              <v-btn
                size="small"
                color="primary"
                @click="finishGuide"
                v-else
              >明白了
              </v-btn
              >
            </div>
            <div class="guide-progress">
              {{ guide.stepIndex + 1 }}/{{ guide.renderedSteps.length }}
            </div>
            <v-btn
              icon
              size="x-small"
              class="guide-close"
              variant="text"
              @click="finishGuide"
            >
              <v-icon size="18">mdi-close</v-icon>
            </v-btn>
          </div>
        </div>
      </div>
    </transition>
  </el-card>
</template>

<script setup>
import {computed, onMounted, onUnmounted, reactive, ref, watch} from "vue";
import {APIS} from "@/config.js";
import {fetchImageBlobUrl, formatDateTime, request} from "@/utility.js";
import RadarChart from "./RadarChart.vue";
import ImageAndLogViewDialog from "./ImageAndLogViewDialog.vue";
import {ElMessage} from "element-plus";

const radarColumnWidth = ref(350);
const isInTableRadarVisible = ref(true);
const tableHeaderHeight = ref(50); // 表格头部高度

const handleWindowResize = () => {
  // 根据窗口宽度调整雷达图列宽度和显示状态
  const width = window.innerWidth;
  if (width < 768) {
    isInTableRadarVisible.value = false;
    return;
  }

  isInTableRadarVisible.value = true;
  if (width >= 1800) {
    radarColumnWidth.value = 350;
  } else if (width >= 1500) {
    radarColumnWidth.value = 250;
  } else {
    radarColumnWidth.value = 200;
  }

  // 处理新手引导控件位置
  if (guide.active) refreshGuideRects();
};

// 计算表格头部高度
const updateTableHeaderHeight = () => {
  const tableElement = document.querySelector(
    ".task-detail-table .el-table__header-wrapper"
  );
  if (tableElement) {
    tableHeaderHeight.value = tableElement.offsetHeight;
  }
};

onMounted(() => {
  handleWindowResize();
  window.addEventListener("resize", handleWindowResize);
  // 延迟计算表格头部高度，确保DOM已渲染
  setTimeout(() => {
    updateTableHeaderHeight();
  }, 100);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleWindowResize);
});

const tableCellClassName = ({column}) => {
  if (column.label === "雷达图列") {
    return "radar-chart-cell";
  }
  return "";
};

const objectSpanMethod = ({row, column, rowIndex, columnIndex}) => {
  if (column.label === "雷达图列") {
    if (rowIndex === 0) {
      return {
        rowspan: internalTasks.value.length,
        colspan: 1,
      };
    } else {
      return {
        rowspan: 0,
        colspan: 0,
      };
    }
  }
};

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
    default: "9999999",
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

// 监听任务数据变化，更新表格头部高度
watch(
  () => internalTasks.value,
  () => {
    setTimeout(() => {
      updateTableHeaderHeight();
    }, 100);
  }
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

  // Check if all tasks are finished, error or not_queued, this means reach final state
  const allReachedFinalState = tasks.every(
    (task) =>
      task.task_status === "finished" ||
      task.task_status === "error" ||
      task.task_status === "not_queued"
  );
  console.debug("All tasks reached final state:", allReachedFinalState);

  if (allReachedFinalState && tasks.length > 0) {
    console.debug("All tasks reached final state, stopping auto-refresh");
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

// 格式化缓冲区大小：除以1000并添加千位分隔符
function formatBufferSize(bufferSize) {
  if (typeof bufferSize !== "number") return bufferSize;
  const sizeInKB = bufferSize / 1000;
  return sizeInKB.toLocaleString();
}

defineExpose({
  fetchTasks,
  checkTaskStatus,
});

// ---------------- 新手引导逻辑 ----------------
const guide = reactive({
  active: false,
  stepIndex: 0,
  steps: [], // 原始（含 label 定义）
  renderedSteps: [], // 解析后的（含 domRect）
});
const guideContainerRect = ref({left: 0, top: 0, width: 0, height: 0});

function updateGuideContainerRect() {
  const wrapper = document.querySelector(".el-card-wrapper");
  if (wrapper) {
    const rect = wrapper.getBoundingClientRect();
    guideContainerRect.value = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
  }
}

function buildGuideSteps() {
  guide.steps = [
    {
      label: "测试用例",
      title: "测试用例",
      content:
        "测试用例（trace）名称<br/>若名称末尾显示为*，则表示对应测试用例为非公开用例，测试环境配置和性能图已被屏蔽，比赛结束后开放查询",
    },
    {
      label: "任务时间",
      title: "任务时间",
      content: "上：创建时间<br/>下：最近一次状态更新时间",
    },
    {
      label: "任务状态",
      title: "任务状态",
      content: "展示该任务当前生命周期状态，如 finished / error 等",
    },
    {
      label: "丢包率",
      title: "丢包率与得分",
      content:
        "上：测试环境丢包率（范围0-1）<br/>下：任务完成后显示丢包性能得分（0-100分）",
    },
    {
      label: "往返时延",
      title: "往返时延与得分",
      content:
        "上：测试环境往返时延 (RTT，单位：ms)<br/>下：任务完成后显示时延性能得分（0-100分）",
    },
    {
      label: "缓冲区",
      title: "缓冲区容量与吞吐得分",
      content:
        "上：测试环境缓冲区容量（单位：KB，1KB = 1000Byte）<br/>下：任务完成后显示吞吐量性能得分（0-100分）",
    },
    {
      label: "总分",
      title: "总分",
      content:
        "各子项（丢包、时延、吞吐等）按设定权重加权后的结果（0-100分）<br/>具体权重请查询相关文档说明",
    },
    {
      label: "性能图",
      title: "性能图与操作",
      content:
        "任务完成后，系统将在后台按序生成性能图（届时可查看吞吐 / 时延曲线），请耐心等待<br/>若任务未执行评测，可点击执行评测",
    },
    hasAnyLog.value
      ? {
        label: "日志",
        title: "日志",
        content:
          "查看评测日志，可根据日志分析算法运行情况并进行调试",
      }
      : null,
    isInTableRadarVisible.value
      ? {
        label: "综合雷达图",
        title: "综合雷达图",
        content:
          "综合雷达图各项分数为所有已完成评测的测试用例对应子项分数的平均值<br/>点击右侧按钮可查看所有测试雷达图",
      }
      : null,
  ].filter(Boolean);
}

function findHeaderCell(labelText) {
  const headers = document.querySelectorAll(
    ".task-detail-table .el-table__header-wrapper th"
  );
  for (const th of headers) {
    // 去除空白比较
    const text = th.innerText.replace(/\s+/g, "").trim();
    if (text.startsWith(labelText)) {
      return th;
    }
  }
  return null;
}

function refreshGuideRects() {
  updateGuideContainerRect();
  guide.renderedSteps = guide.steps
    .map((s) => {
      const el = findHeaderCell(s.label);
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return {...s, rect};
    })
    .filter(Boolean);
  // 若当前索引越界则重置
  if (guide.stepIndex >= guide.renderedSteps.length) guide.stepIndex = 0;
  // 自动滚动当前 step 可见
  scrollCurrentIntoView();
}

function startGuide() {
  buildGuideSteps();
  guide.active = true;
  guide.stepIndex = 0;
  nextTickRefresh();
}

function finishGuide() {
  guide.active = false;
}

function prevGuide() {
  if (guide.stepIndex > 0) {
    guide.stepIndex--;
    scrollCurrentIntoView();
  }
}

function nextGuide() {
  if (guide.stepIndex < guide.renderedSteps.length - 1) {
    guide.stepIndex++;
    scrollCurrentIntoView();
  }
}

function scrollCurrentIntoView() {
  setTimeout(() => {
    const step = guide.renderedSteps[guide.stepIndex];
    if (!step) return;
    const el = findHeaderCell(step.label);
    if (el && el.scrollIntoView) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }
  }, 50);
}

function nextTickRefresh() {
  setTimeout(() => {
    refreshGuideRects();
  }, 50);
}


watch(isInTableRadarVisible, () => {
  if (guide.active) {
    buildGuideSteps();
    nextTickRefresh();
  }
});

function computeHighlightStyle(step) {
  if (!step.rect) return {};
  const padding = 4;
  const c = guideContainerRect.value;
  return {
    left: step.rect.left - c.left - padding + "px",
    top: step.rect.top - c.top - padding + "px",
    width: step.rect.width + padding * 2 + "px",
    height: step.rect.height + padding * 2 + "px",
  };
}

function computeTooltipStyle(step) {
  if (!step.rect) return {};
  const margin = 8;
  const c = guideContainerRect.value;
  const top = step.rect.bottom - c.top + margin;
  let left = step.rect.left - c.left;
  const maxWidth = 320;
  const containerWidth = c.width;
  if (left + maxWidth + 16 > containerWidth) {
    left = containerWidth - maxWidth - 16;
  }
  return {top: top + "px", left: left + "px", maxWidth: maxWidth + "px"};
}

function computeMaskPieces(step) {
  if (!step.rect) return [];
  const padding = 4; // 与高亮框保持一致
  const r = step.rect;
  const c = guideContainerRect.value;
  const vw = c.width;
  const vh = c.height;
  const x = r.left - c.left - padding;
  const y = r.top - c.top - padding;
  const w = r.width + padding * 2;
  const h = r.height + padding * 2;
  // 构造四块遮罩：上、左、右、下（顺序影响层级无所谓）
  return [
    {
      left: "0px",
      top: "0px",
      width: vw + "px",
      height: Math.max(0, y) + "px",
    }, // 上方
    {
      left: "0px",
      top: y + "px",
      width: Math.max(0, x) + "px",
      height: h + "px",
    }, // 左侧
    {
      left: x + w + "px",
      top: y + "px",
      width: Math.max(0, vw - (x + w)) + "px",
      height: h + "px",
    }, // 右侧
    {
      left: "0px",
      top: y + h + "px",
      width: vw + "px",
      height: Math.max(0, vh - (y + h)) + "px",
    }, // 下方
  ];
}
</script>

<style scoped>
/* 引导层覆盖在表格包装容器内部 */
.guide-overlay {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 2000;
  pointer-events: none;
}

.guide-dim-piece {
  position: absolute;
  background: rgba(0, 0, 0, 0.45);
  pointer-events: auto; /* 点击退出 */
  transition: all 0.15s;
}

.guide-highlight-box {
  position: absolute;
  border: 2px solid var(--el-color-primary, #409eff);
  box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.35), 0 4px 18px rgba(0, 0, 0, 0.25);
  background: rgba(255, 255, 255, 0); /* 完全透明，避免遮挡文字 */
  pointer-events: none;
  animation: guide-pulse 1.2s ease-in-out infinite;
}

@keyframes guide-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.25),
    0 4px 18px rgba(0, 0, 0, 0.25);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(64, 158, 255, 0.4),
    0 4px 18px rgba(0, 0, 0, 0.25);
  }
}

.guide-tooltip {
  position: absolute;
  background: #fff;
  color: #333;
  border-radius: 8px;
  padding: 14px 16px 10px 16px;
  box-shadow: 0 6px 24px -2px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.04);
  pointer-events: auto;
  line-height: 1.45;
}

.guide-title {
  font-weight: 600;
  margin-bottom: 6px;
  font-size: 15px;
}

.guide-content {
  font-size: 13px;
}

.guide-actions {
  margin-top: 10px;
  display: flex;
  gap: 6px;
}

.guide-progress {
  position: absolute;
  top: 6px;
  right: 38px;
  font-size: 11px;
  color: #777;
}

.guide-close {
  position: absolute;
  top: 0;
  right: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<style scoped>
.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.table-header-btn {
  padding: 2px;
  margin-left: 2px;
}

.table-header-btn:hover {
  transform: scale(1.2);
}

.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.el-card-wrapper {
  position: relative;
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
  position: relative; /* 为固定雷达图提供定位参考 */
  /* 让表格自适应剩余空间 */
}

/* 固定位置的雷达图 */
.fixed-radar-chart {
  position: absolute;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-left: 1px solid #e0e0e0;
  z-index: 10;
  pointer-events: auto;
  /* show table line */
  margin: 0 1px 1px;
  padding: 10px;
}

/* 雷达图单元格不被选中 */
.task-detail-table :deep(.radar-chart-cell):hover,
.task-detail-table :deep(.radar-chart-cell) {
  background: white !important;
}

/* 雷达图 */
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
    margin-top: 10px;
    height: 300px;
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
