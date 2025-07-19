<template>
  <div class="task-management-container">
    <!-- 筛选区域 -->
    <div class="filter-section" v-if="!isFullScreen">
      <v-card elevation="0" class="pa-4">
        <v-row align="center" dense>
          <v-col
            v-if="isMobile && !showAllFilters"
            cols="12"
            class="d-flex justify-end"
            style="margin-bottom: 0"
          >
            <v-btn
              size="small"
              variant="text"
              @click="showAllFilters = true"
              class="toggle-filter-btn"
            >
              展开筛选
              <v-icon icon="mdi-chevron-down" size="18"/>
            </v-btn>
          </v-col>
          <template v-if="!isMobile || showAllFilters">
            <v-col v-if="!isMobile || showAllFilters" cols="12" sm="6" md="2">
              <v-select
                v-model="selectedColumns"
                :items="allColumnOptions"
                label="显示列"
                multiple
                clearable
                density="compact"
              >
                <template v-slot:selection="{ item, index }">
                  <v-chip v-if="index === 0">
                    <span>{{ item.title }}</span>
                  </v-chip>
                  <span v-if="index === 1" class="grey--text text-caption">
                    (+{{ selectedColumns.length - 1 }}...)
                  </span>
                </template>
              </v-select>
            </v-col>
            <v-col v-if="!isMobile || showAllFilters" cols="12" sm="6" md="2">
              <v-text-field
                v-model="taskIdFilter"
                label="任务ID"
                @input="searchTasks"
                @click:clear="searchTasks"
                clearable
                density="compact"
              ></v-text-field>
            </v-col>
            <v-col v-if="!isMobile || showAllFilters" cols="12" sm="6" md="2">
              <v-text-field
                v-model="usernameFilter"
                label="用户名"
                @input="searchTasks"
                @click:clear="searchTasks"
                clearable
                density="compact"
              ></v-text-field>
            </v-col>
            <v-col v-if="!isMobile || showAllFilters" cols="12" sm="6" md="2">
              <v-text-field
                v-model="traceNameFilter"
                label="测试用例"
                @input="searchTasks"
                @click:clear="searchTasks"
                clearable
                density="compact"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6" md="2">
              <v-select
                v-model="statusFilter"
                label="状态筛选"
                :items="statusOptions"
                @update:model-value="searchTasks"
                @click:clear="searchTasks"
                clearable
                density="compact"
              ></v-select>
            </v-col>
            <v-col v-if="!isMobile || showAllFilters" cols="12" sm="6" md="2">
              <v-select
                v-model="cnameFilter"
                label="比赛名称"
                :items="courseList"
                :loading="courseListLoading"
                @update:model-value="searchTasks"
                @click:clear="searchTasks"
                clearable
                density="compact"
                no-data-text="没有可用的课程"
              ></v-select>
            </v-col>
            <!-- 开始时间筛选 -->
            <v-col cols="12" sm="6" md="2">
              <v-text-field
                v-model="startTimeFilter"
                label="开始时间"
                type="datetime-local"
                @input="searchTasks"
                @click:clear="searchTasks"
                clearable
                density="compact"
              ></v-text-field>
            </v-col>
            <!-- 结束时间筛选 -->
            <v-col cols="12" sm="6" md="2">
              <v-text-field
                v-model="endTimeFilter"
                label="结束时间"
                type="datetime-local"
                @input="searchTasks"
                @click:clear="searchTasks"
                clearable
                density="compact"
              ></v-text-field>
            </v-col>
            <!-- 得分筛选框 -->
            <v-col cols="12" sm="6" md="2">
              <v-text-field
                v-model="taskScoreFilter"
                label="得分(支持区间,如60-100)"
                @input="searchTasks"
                @click:clear="searchTasks"
                clearable
                density="compact"
                type="text"
              ></v-text-field>
            </v-col>
            <!-- 时延筛选框 -->
            <v-col cols="12" sm="6" md="2">
              <v-text-field
                v-model="delayFilter"
                label="时延(支持区间,如10-50)"
                @input="searchTasks"
                @click:clear="searchTasks"
                clearable
                density="compact"
                type="text"
              ></v-text-field>
            </v-col>
            <!-- 丢包率筛选框 -->
            <v-col cols="12" sm="6" md="2">
              <v-text-field
                v-model="lossRateFilter"
                label="丢包率(支持区间,如0-0.1)"
                @input="searchTasks"
                @click:clear="searchTasks"
                clearable
                density="compact"
                type="text"
              ></v-text-field>
            </v-col>
            <!-- 缓冲区大小筛选框 -->
            <v-col cols="12" sm="6" md="2">
              <v-text-field
                v-model="bufferSizeFilter"
                label="缓冲区大小(支持区间,如100-200)"
                @input="searchTasks"
                @click:clear="searchTasks"
                clearable
                density="compact"
                type="text"
              ></v-text-field>
            </v-col>
            <v-col
              v-if="isMobile"
              cols="12"
              class="d-flex justify-end"
              style="margin-bottom: 0"
            >
              <v-btn
                size="small"
                variant="text"
                @click="showAllFilters = false"
                class="toggle-filter-btn"
              >
                收起筛选
                <v-icon icon="mdi-chevron-up" size="18"/>
              </v-btn>
            </v-col>
          </template>
        </v-row>
      </v-card>
    </div>
    <!-- 表格区域 -->
    <div class="table-section">
      <div class="table-actions">
        <v-btn
          :icon="isFullScreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
          size="small"
          variant="text"
          @click="toggleFullScreen"
          :title="isFullScreen ? '退出全屏' : '全屏'"
          style="margin-right: -15px"
        ></v-btn>
        <v-btn
          icon="mdi-refresh"
          size="small"
          variant="text"
          @click="refreshTasks"
          title="刷新"
        ></v-btn>
      </div>
      <v-data-table-server
        :headers="computedHeaders"
        :items="tasks"
        :loading="loading"
        :items-length="pagination.total"
        v-model:page="pagination.page"
        v-model:items-per-page="pagination.size"
        :items-per-page-options="[10, 20, 50, 100]"
        @update:options="loadTasks"
        show-current-page
        :height="'100%'"
        fixed-header
        class="table-container"
      >
        <template v-slot:header.actions>
          <span>操作</span>
        </template>

        <template v-slot:item.task_status="{ item }">
          <v-chip
            :color="getStatusMeta(item.task_status).color"
            size="small"
            variant="elevated"
          >
            {{ getStatusMeta(item.task_status).text }}
          </v-chip>
        </template>
        <template v-slot:item.cname="{ item }">
          <span v-if="item.cname">
            <v-chip
              :color="getStatusMeta(item.task_status).color"
              size="small"
              variant="elevated"
            >
              {{ item.cname }}
            </v-chip>
          </span>
          <span v-else>-</span>
        </template>

        <template v-slot:item.created_time="{ item }">
          {{ formatDateTime(item.created_time) }}
        </template>
        <template v-slot:item.created_at="{ item }">
          {{ formatDateTime(item.created_at) }}
        </template>
        <template v-slot:item.updated_at="{ item }">
          {{ formatDateTime(item.updated_at) }}
        </template>

        <template v-slot:item.actions="{ item }">
          <div class="actions-cell">
            <div>
              <v-btn
                icon="mdi-eye"
                size="small"
                @click="viewTaskDetail(item)"
                variant="text"
                title="查看任务运行详情"
              ></v-btn>
              <v-btn
                v-if="item.upload_id"
                icon="mdi-file-document-outline"
                size="small"
                @click="viewRecordDetail(item.upload_id)"
                variant="text"
                title="查看提交记录详情"
              ></v-btn>
              <v-btn
                v-if="item.upload_id"
                icon="mdi-file-code-outline"
                size="small"
                @click="viewCode(item.upload_id)"
                variant="text"
                title="查看代码"
              ></v-btn>
            </div>
            <div>
              <v-btn
                icon="mdi-math-log"
                size="small"
                variant="text"
                @click="showLog(item.task_id, item)"
                title="查看日志"
              >
              </v-btn>
              <v-btn
                icon="mdi-chart-line"
                size="small"
                variant="text"
                @click="showImage('throughput', item.task_id)"
                title="查看吞吐量图"
              >
              </v-btn>
              <v-btn
                icon="mdi-chart-bell-curve"
                size="small"
                variant="text"
                @click="showImage('delay', item.task_id)"
                title="查看时延图"
              >
              </v-btn>
            </div>
          </div>
        </template>
      </v-data-table-server>
    </div>
  </div>

  <!-- 任务详情对话框 -->
  <v-dialog v-model="detailDialog" max-width="1500px">
    <v-card>
      <v-card-title>任务详情</v-card-title>
      <v-card-text>
        <v-row v-if="selectedTask">
          <v-col cols="12" md="4">
            <v-list-item>
              <v-list-item-title>任务ID</v-list-item-title>
              <v-list-item-subtitle
              >{{ selectedTask.task_id }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-col>
          <v-col cols="12" md="4">
            <v-list-item>
              <v-list-item-title>用户名</v-list-item-title>
              <v-list-item-subtitle
              >{{ selectedTask.username }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-col>
          <v-col cols="12" md="4">
            <v-list-item>
              <v-list-item-title>比赛名称</v-list-item-title>
              <v-list-item-subtitle
              >{{ selectedTask.cname }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-col>
          <v-col cols="12" md="4">
            <v-list-item>
              <v-list-item-title>算法</v-list-item-title>
              <v-list-item-subtitle>
                {{ selectedTask.algorithm }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-col>
          <v-col cols="12" md="4">
            <v-list-item>
              <v-list-item-title>测试用例</v-list-item-title>
              <v-list-item-subtitle
              >{{ selectedTask.trace_name }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-col>
          <v-col cols="12" md="4">
            <v-list-item>
              <v-list-item-title>任务得分</v-list-item-title>
              <v-list-item-subtitle
              >{{ selectedTask.task_score }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-col>
          <v-col cols="12" md="4">
            <v-list-item>
              <v-list-item-title>状态</v-list-item-title>
              <v-list-item-subtitle>
                <v-chip
                  :color="getStatusMeta(selectedTask.task_status).color"
                  size="small"
                  variant="elevated"
                >
                  {{ getStatusMeta(selectedTask.task_status).text }}
                </v-chip>
              </v-list-item-subtitle>
            </v-list-item>
          </v-col>
          <v-col cols="12" md="4">
            <v-list-item>
              <v-list-item-title>上传时间</v-list-item-title>
              <v-list-item-subtitle
              >{{ formatDateTime(selectedTask.created_time) }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-col>
          <v-col cols="12" md="4">
            <v-list-item>
              <v-list-item-title>更新时间</v-list-item-title>
              <v-list-item-subtitle
              >{{ formatDateTime(selectedTask.updated_at) }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-col>
          <v-col cols="12" md="4">
            <v-list-item>
              <v-list-item-title>丢包率</v-list-item-title>
              <v-list-item-subtitle
              >{{ selectedTask.loss_rate }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-col>
          <v-col cols="12" md="4">
            <v-list-item>
              <v-list-item-title>往返时延</v-list-item-title>
              <v-list-item-subtitle
              >{{ selectedTask.delay }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-col>
          <v-col cols="12" md="4">
            <v-list-item>
              <v-list-item-title>缓冲区大小</v-list-item-title>
              <v-list-item-subtitle
              >{{ selectedTask.buffer_size }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-col>
          <v-col cols="12" md="4">
            <v-list-item>
              <v-list-item-title>时延得分</v-list-item-title>
              <v-list-item-subtitle
              >{{ selectedTask.delay_score }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-col>
          <v-col cols="12" md="4">
            <v-list-item>
              <v-list-item-title>丢包率得分</v-list-item-title>
              <v-list-item-subtitle
              >{{ selectedTask.loss_score }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-col>
          <v-col cols="12" md="4">
            <v-list-item>
              <v-list-item-title>吞吐量得分</v-list-item-title>
              <v-list-item-subtitle
              >{{ selectedTask.throughput_score }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="detailDialog = false">关闭</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- 提交记录详情对话框 -->
  <v-dialog v-model="recordDetailDialog" max-width="1800px" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center">
        <span class="headline">提交记录详情</span>
        <v-spacer></v-spacer>
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text style="padding: 0">
        <TaskDetailTable
          v-if="recordDetailDialog && selectedUploadId"
          :upload_id="selectedUploadId"
          height="70vh"
        />
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- 图弹窗 -->
  <ImageAndLogViewDialog
    :visible="dialogState.visible"
    :title="dialogState.title"
    :loading="dialogState.loading"
    :error="dialogState.error"
    :error-message="dialogState.errorMessage"
    :content="dialogState.content"
    :content-type="dialogState.contentType"
    :filename="dialogState.filename"
    @update:visible="dialogState.visible = $event"
  />

  <!-- 代码查看对话框 -->
  <CodeViewDialog
    v-model:visible="codeDialogVisible"
    :upload-id="selectedUploadId"
  />
</template>

<script setup>
import {computed, onMounted, reactive, ref} from "vue";
import {APIS} from "@/config";
import {fetchImageBlobUrl, formatDateTime, request} from "@/utility.js";
import TaskDetailTable from "@/components/TaskDetailTable.vue";
import ImageAndLogViewDialog from "@/components/ImageAndLogViewDialog.vue";
import CodeViewDialog from "@/components/CodeViewDialog.vue";

// 防抖函数
function debounce(fn, delay = 300) {
  let timeoutId = null;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

const loading = ref(false);
const detailDialog = ref(false);
const recordDetailDialog = ref(false);
const codeDialogVisible = ref(false);
const usernameFilter = ref("");
const statusFilter = ref(null);
const cnameFilter = ref(null);
const traceNameFilter = ref("");
const startTimeFilter = ref(""); // 开始时间筛选
const endTimeFilter = ref(""); // 结束时间筛选
const delayFilter = ref(""); // 时延筛选
const lossRateFilter = ref(""); // 丢包率筛选
const bufferSizeFilter = ref(""); // 缓冲区大小筛选
const taskScoreFilter = ref(""); // 得分范围筛选
const courseList = ref([]);
const courseListLoading = ref(false);
const taskIdFilter = ref("");

const tasks = ref([]);
const selectedTask = ref(null);
const selectedUploadId = ref(null);
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0,
});

const headers = [
  {title: "任务ID", key: "task_id", sortable: false, default: true},
  {title: "上传ID", key: "upload_id", sortable: false, default: false},
  {title: "用户", key: "username", sortable: false, default: true},
  {title: "算法", key: "algorithm", sortable: false, default: true},
  {title: "测试用例", key: "trace_name", sortable: false, default: true},
  {title: "丢包率", key: "loss_rate", sortable: false, default: false},
  {title: "往返时延", key: "delay", sortable: false, default: false},
  {title: "缓冲区大小", key: "buffer_size", sortable: false, default: false},
  {title: "丢包率得分", key: "loss_score", sortable: true, default: false},
  {title: "时延得分", key: "delay_score", sortable: true, default: false},
  {
    title: "吞吐量得分",
    key: "throughput_score",
    sortable: true,
    default: false,
  },
  {title: "得分", key: "task_score", sortable: true, default: true},
  {title: "比赛名称", key: "cname", sortable: false, default: true},
  {title: "状态", key: "task_status", sortable: false, default: true},
  {title: "上传时间", key: "created_time", sortable: true, default: true},
  {title: "创建时间", key: "created_at", sortable: false, default: false},
  {title: "更新时间", key: "updated_at", sortable: true, default: true},
  {
    title: "操作",
    key: "actions",
    sortable: false,
    align: "center",
    default: true,
  },
];

const allColumnOptions = headers.map((h) => ({title: h.title, value: h.key}));

const selectedColumns = ref(headers.filter((h) => h.default).map((h) => h.key));

const computedHeaders = computed(() => {
  // 保证操作列始终在最后
  const cols = selectedColumns.value.filter((c) => c !== "actions");
  return [
    ...headers.filter((h) => cols.includes(h.key)),
    ...headers.filter(
      (h) => h.key === "actions" && selectedColumns.value.includes("actions")
    ),
  ];
});

const isMobile = ref(false);
const showAllFilters = ref(false);
const isFullScreen = ref(false);

const dialogState = reactive({
  visible: false,
  title: "",
  contentType: "image",
  content: "",
  filename: "",
  loading: false,
  error: false,
  errorMessage: "",
});

onMounted(() => {
  isMobile.value = window.innerWidth <= 960;
  window.addEventListener("resize", () => {
    isMobile.value = window.innerWidth <= 960;
    if (!isMobile.value) showAllFilters.value = false;
  });
  loadCourseList();
});

const toggleFullScreen = () => {
  isFullScreen.value = !isFullScreen.value;
};

const loadTasks = async ({page, itemsPerPage, sortBy}) => {
  loading.value = true;
  // v-model ahand pagination object are already in sync.
  // No need to update them here.

  try {
    const params = new URLSearchParams({
      page: page.toString(),
      size: itemsPerPage.toString(),
    });
    if (taskIdFilter.value) {
      params.append("task_id", taskIdFilter.value);
    }
    if (usernameFilter.value) {
      params.append("username", usernameFilter.value);
    }
    if (statusFilter.value) {
      params.append("status", statusFilter.value);
    }
    if (cnameFilter.value) {
      params.append("cname", cnameFilter.value);
    }
    if (traceNameFilter.value) {
      params.append("trace_file", traceNameFilter.value);
    }

    // 上传时间范围筛选
    if (startTimeFilter.value) {
      params.append("created_time_start", startTimeFilter.value);
    }
    if (endTimeFilter.value) {
      params.append("created_time_end", endTimeFilter.value);
    }

    // 时延、丢包率、缓冲区大小筛选参数
    if (delayFilter.value) {
      params.append("delay", delayFilter.value);
    }
    if (lossRateFilter.value) {
      params.append("loss_rate", lossRateFilter.value);
    }
    if (bufferSizeFilter.value) {
      params.append("buffer_size", bufferSizeFilter.value);
    }

    if (sortBy && sortBy.length > 0) {
      const sortItem = sortBy[0];
      const sortByMap = {
        task_score: "score",
        delay_score: "delay_score",
        loss_score: "loss_score",
        throughput_score: "throughput_score",
        created_time: "created_time",
        updated_at: "updated_at",
      };
      if (sortByMap[sortItem.key]) {
        params.append("sort_by", sortByMap[sortItem.key]);
        params.append("sort_order", sortItem.order || "desc");
      }
    }
    if (taskScoreFilter.value) {
      params.append("task_score", taskScoreFilter.value);
    }

    const result = await request(`${APIS.admin_get_tasks}?${params}`, {
      method: "GET",
    });

    tasks.value = result.data.tasks || [];
    // 后端返回的是单向时延，需要转换为双向时延
    tasks.value.forEach((task) => {
      if (task.delay) {
        task.delay = task.delay * 2;
      }
    });
    pagination.total = result.data.pagination.total;
  } catch (error) {
    console.error("加载任务列表失败:", error);
  } finally {
    loading.value = false;
  }
};

const debouncedSearch = debounce(() => {
  pagination.page = 1;
  loadTasks({page: pagination.page, itemsPerPage: pagination.size});
}, 500);

const searchTasks = () => {
  debouncedSearch();
};

const refreshTasks = () => {
  loadTasks({page: pagination.page, itemsPerPage: pagination.size});
};

const viewTaskDetail = (task) => {
  selectedTask.value = task;
  detailDialog.value = true;
};

const viewRecordDetail = (uploadId) => {
  // router.push({ name: "Detail", params: { upload_id: uploadId } });
  selectedUploadId.value = uploadId;
  recordDetailDialog.value = true;
};

const viewCode = (uploadId) => {
  selectedUploadId.value = uploadId;
  codeDialogVisible.value = true;
};

const loadCourseList = async () => {
  courseListLoading.value = true;
  try {
    const result = await request(APIS.get_pantheon, {method: "GET"});
    // The response for get_pantheon is expected to be an object with a "pantheon" key.
    courseList.value = result.pantheon || [];
  } catch (error) {
    console.error("加载课程列表失败:", error);
    // ElMessage.error("加载课程列表失败");
    courseList.value = []; // Ensure list is empty on error
  } finally {
    courseListLoading.value = false;
  }
};

async function showImage(type, task_id) {
  dialogState.visible = true;
  dialogState.loading = true;
  dialogState.error = false;
  dialogState.contentType = "image";
  dialogState.title = type === "throughput" ? "吞吐量图" : "时延图";
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
    dialogState.filename = filename;
  } catch (error) {
    dialogState.error = true;
    dialogState.errorMessage = "加载性能图失败";
  } finally {
    dialogState.loading = false;
  }
}

async function showLog(task_id, row) {
  dialogState.visible = true;
  dialogState.loading = true;
  dialogState.error = false;
  dialogState.contentType = "log";
  dialogState.title = "日志信息";
  dialogState.content = "";
  const traceName = row ? row.trace_name : "unknown";
  dialogState.filename = `${row.algorithm}_${traceName}.log`;
  try {
    // 假设新接口为APIS.task_get_log，GET，参数task_id
    const params = new URLSearchParams();
    params.append("task_id", task_id);
    const url = `${APIS.task_get_log}?${params.toString()}`;
    const result = await request(url, {method: "GET"});
    if (!result || !result.log) {
      dialogState.error = true;
      dialogState.errorMessage = "未获取到日志内容";
      return;
    }
    dialogState.content = result.log;
  } catch (error) {
    dialogState.error = true;
    dialogState.errorMessage = "加载日志失败";
  } finally {
    dialogState.loading = false;
  }
}

const getStatusMeta = (value) =>
  statusMeta.find((s) => s.value === value) || {text: "未知", color: "grey"};

const statusMeta = [
  {value: "queued", text: "排队中", color: "warning"},
  {value: "compiling", text: "编译中", color: "info"},
  {value: "compiled", text: "编译完成", color: "cyan"},
  {value: "compile_failed", text: "编译失败", color: "error"},
  {value: "running", text: "运行中", color: "primary"},
  {value: "finished", text: "已完成", color: "success"},
  {value: "error", text: "错误", color: "error"},
  {value: "not_queued", text: "未能入队", color: "secondary"},
];

const statusOptions = statusMeta.map((s) => ({
  title: s.text,
  value: s.value,
}));
</script>

<style scoped>
.task-management-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.filter-section {
  flex-shrink: 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  background-color: #fafafa;
}

.table-section {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

.table-actions {
  position: absolute;
  top: -8px;
  right: 0;
  z-index: 2000;
}

.table-container {
  height: 100% !important;
}

.table-container :deep(.v-data-table__wrapper) {
  height: calc(100% - 64px) !important;
  overflow-y: auto !important;
}

.table-container :deep(.v-data-table-footer) {
  flex-shrink: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.12);
}

.toggle-filter-btn {
  margin-top: 0;
  margin-bottom: 0;
  min-width: 0;
  font-size: 14px;
  color: #1976d2;
  align-items: center;
  display: inline-flex;
}

.actions-cell {
  min-width: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

@media (max-width: 960px) {
  .filter-section .pa-4 {
    padding: 6px !important;
  }

  .filter-section .v-row {
    margin-left: 0 !important;
    margin-right: 0 !important;
  }

  .filter-section .v-col {
    margin-bottom: 2px !important;
    padding: 0 1px !important;
  }

  .filter-section .v-text-field,
  .filter-section .v-select {
    font-size: 14px !important;
    min-height: 32px !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .filter-section label {
    font-size: 13px !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .table-container :deep(.v-data-table__wrapper) {
    font-size: 13px !important;
  }

  .table-container :deep(.v-data-table__wrapper tr) {
    height: 32px !important;
  }

  .table-container :deep(.v-data-table__wrapper td),
  .table-container :deep(.v-data-table__wrapper th) {
    padding: 2px 4px !important;
  }
}
</style>
