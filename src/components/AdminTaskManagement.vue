<template>
  <v-card-title>
    <v-row align="center">
      <v-col cols="12" sm="6" md="3">
        <v-text-field
          v-model="usernameFilter"
          label="用户名"
          @input="searchTasks"
          clearable
          density="compact"
        ></v-text-field>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-text-field
          v-model="traceNameFilter"
          label="Trace 名称"
          @input="searchTasks"
          clearable
          density="compact"
        ></v-text-field>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-select
          v-model="statusFilter"
          label="状态筛选"
          :items="statusOptions"
          @update:model-value="searchTasks"
          clearable
          density="compact"
        ></v-select>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-select
          v-model="cnameFilter"
          label="比赛名称"
          :items="courseList"
          :loading="courseListLoading"
          @update:model-value="searchTasks"
          clearable
          density="compact"
          no-data-text="没有可用的课程"
        ></v-select>
      </v-col>
    </v-row>
  </v-card-title>

  <v-card-text>
    <v-data-table-server
      :headers="headers"
      :items="tasks"
      :loading="loading"
      :items-length="pagination.total"
      v-model:page="pagination.page"
      v-model:items-per-page="pagination.size"
      :items-per-page-options="[10, 20, 50, 100]"
      @update:options="loadTasks"
      show-current-page
    >
      <template v-slot:header.actions>
        <div
          class="d-flex justify-space-between align-center"
          style="width: 100%"
        >
          <span>操作</span>
          <v-btn
            icon="mdi-refresh"
            size="small"
            variant="text"
            @click="refreshTasks"
            title="刷新"
          ></v-btn>
        </div>
      </template>

      <template v-slot:item.task_status="{ item }">
        <v-chip
          :color="getStatusColor(item.task_status)"
          size="small"
          variant="elevated"
        >
          {{ getStatusText(item.task_status) }}
        </v-chip>
      </template>

      <template v-slot:item.created_time="{ item }">
        {{ formatDateTime(item.created_time) }}
      </template>

      <template v-slot:item.actions="{ item }">
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
      </template>
    </v-data-table-server>
  </v-card-text>

  <!-- 任务详情对话框 -->
  <v-dialog v-model="detailDialog" max-width="900px">
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
              <v-list-item-subtitle
              >{{ selectedTask.algorithm }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-col>
          <v-col cols="12" md="4">
            <v-list-item>
              <v-list-item-title>Trace</v-list-item-title>
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
                  :color="getStatusColor(selectedTask.task_status)"
                  size="small"
                  variant="elevated"
                >
                  {{ getStatusText(selectedTask.task_status) }}
                </v-chip>
              </v-list-item-subtitle>
            </v-list-item>
          </v-col>
          <v-col cols="12" md="4">
            <v-list-item>
              <v-list-item-title>创建时间</v-list-item-title>
              <v-list-item-subtitle
              >{{ formatDateTime(selectedTask.created_time) }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-col>
          <v-col cols="12" md="4">
            <v-list-item>
              <v-list-item-title>完成时间</v-list-item-title>
              <v-list-item-subtitle
              >暂不支持
                <!--                {{ formatDateTime(selectedTask.end_time) }}-->
              </v-list-item-subtitle>
            </v-list-item>
          </v-col>
          <v-col cols="12" md="6">
            <v-list-item>
              <v-list-item-title>缓冲区大小</v-list-item-title>
              <v-list-item-subtitle
              >{{ selectedTask.buffer_size }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-col>
          <v-col cols="12" md="6">
            <v-list-item>
              <v-list-item-title>丢包率</v-list-item-title>
              <v-list-item-subtitle
              >{{ selectedTask.loss_rate }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-col>
          <v-col cols="12" v-if="selectedTask.task_desc">
            <v-list-item>
              <v-list-item-title>任务描述</v-list-item-title>
              <v-list-item-subtitle
              >{{ selectedTask.task_desc }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-col>
          <v-col cols="12" v-if="selectedTask.log">
            <v-list-item>
              <v-list-item-title>日志</v-list-item-title>
              <v-list-item-subtitle>
                <pre
                  style="
                    white-space: pre-wrap;
                    word-break: break-all;
                    background-color: #f5f5f5;
                    padding: 10px;
                    border-radius: 4px;
                    max-height: 300px;
                    overflow-y: auto;
                  "
                >{{ selectedTask.log }}</pre
                >
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
  <v-dialog v-model="recordDetailDialog" max-width="1200px" scrollable>
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
</template>

<script setup>
import {onMounted, reactive, ref} from "vue";
// useRouter is no longer needed for navigation here, but might be used elsewhere.
// import { useRouter } from "vue-router";
import {APIS} from "@/config";
import {request} from "@/utility.js";
import {ElMessage} from "element-plus";
import TaskDetailTable from "@/components/TaskDetailTable.vue";

// const router = useRouter();

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
const usernameFilter = ref("");
const statusFilter = ref(null);
const cnameFilter = ref(null);
const traceNameFilter = ref("");
const courseList = ref([]);
const courseListLoading = ref(false);

const tasks = ref([]);
const selectedTask = ref(null);
const selectedUploadId = ref(null);
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0,
});

const headers = [
  {title: "任务ID", key: "task_id", sortable: false},
  {title: "用户名", key: "username", sortable: false},
  {title: "比赛名称", key: "cname", sortable: false},
  {title: "算法", key: "algorithm", sortable: false},
  {title: "Trace", key: "trace_name", sortable: false},
  {title: "任务得分", key: "task_score", sortable: true},
  {title: "状态", key: "task_status", sortable: false},
  {title: "创建时间", key: "created_time", sortable: true},
  {title: "操作", key: "actions", sortable: false, align: "center"},
];

const statusOptions = [
  {title: "排队中", value: "queued"},
  {title: "编译中", value: "compling"},
  {title: "编译完成", value: "compiled"},
  {title: "编译失败", value: "compile_failed"},
  {title: "运行中", value: "running"},
  {title: "已完成", value: "finished"},
  {title: "错误", value: "error"},
  {title: "未能入队", value: "not_queued"},
];

const getStatusColor = (status) => {
  switch (status) {
    case "finished":
      return "success";
    case "running":
      return "primary";
    case "queued":
      return "warning";
    case "compling":
      return "info";
    case "compiled":
      return "cyan";
    case "compile_failed":
    case "error":
      return "error";
    case "not_queued":
      return "secondary";
    default:
      return "grey";
  }
};

const getStatusText = (status) => {
  switch (status) {
    case "queued":
      return "排队中";
    case "compling":
      return "编译中";
    case "compiled":
      return "编译完成";
    case "compile_failed":
      return "编译失败";
    case "running":
      return "运行中";
    case "finished":
      return "已完成";
    case "error":
      return "错误";
    case "not_queued":
      return "未能入队";
    default:
      return "未知";
  }
};

const formatDateTime = (dateTime) => {
  if (!dateTime) return "-";
  return new Date(dateTime).toLocaleString("zh-CN");
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

    if (sortBy && sortBy.length > 0) {
      const sortItem = sortBy[0];
      const sortByMap = {
        task_score: "score",
        created_time: "created_time",
      };
      if (sortByMap[sortItem.key]) {
        params.append("sort_by", sortByMap[sortItem.key]);
        params.append("sort_order", sortItem.order || "desc");
      }
    }

    const result = await request(`${APIS.admin_get_tasks}?${params}`, {
      method: "GET",
    });

    if (result.data) {
      console.log("任务管理 - 后端返回数据:", result.data); // 调试信息
      tasks.value = result.data.tasks || [];

      // 根据后端实际返回的结构修复分页信息
      // 后端返回: { pagination: { page: 1, pages: 28, size: 20, total: 544 }, tasks: [...] }
      if (
        result.data.pagination &&
        result.data.pagination.total !== undefined
      ) {
        pagination.total = result.data.pagination.total;
      } else if (result.data.total !== undefined) {
        pagination.total = result.data.total;
      } else {
        pagination.total = tasks.value.length;
      }
    }
  } catch (error) {
    console.error("加载任务列表失败:", error);
    ElMessage.error("加载任务列表失败");
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

const loadCourseList = async () => {
  courseListLoading.value = true;
  try {
    const result = await request(APIS.get_pantheon, {method: "GET"});
    // The response for get_pantheon is expected to be an object with a "pantheon" key.
    courseList.value = result.pantheon || [];
  } catch (error) {
    console.error("加载课程列表失败:", error);
    ElMessage.error("加载课程列表失败");
    courseList.value = []; // Ensure list is empty on error
  } finally {
    courseListLoading.value = false;
  }
};

onMounted(() => {
  // v-data-table-server will call @update:options on mount
  loadCourseList();
});
</script>
