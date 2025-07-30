<template>
  <!-- Header -->
  <v-row class="flex-grow-0">
    <v-col>
      <div
        style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        "
      >
        <span class="text-h4">历史记录</span>
        <div>
          <el-button type="warning" @click="exportHistoryToExcel">
            <el-icon>
              <Download/>
            </el-icon>
            导出Excel
          </el-button>
          <el-button type="success" @click="toggleExpandAll">
            {{ allExpanded ? "折叠所有" : "展开所有" }}
          </el-button>
          <el-button type="primary" @click="get_history_records(200)">
            刷新
          </el-button>
        </div>
      </div>
      <div style="text-align: right">
        <el-text style="margin-top: 10px">
          <el-icon>
            <InfoFilled/>
          </el-icon>
          历史记录数据将自动刷新
        </el-text>
      </div>
    </v-col>
  </v-row>

  <!-- Table -->
  <v-row
    class="flex-grow-1"
    style="min-height: 0; margin-top: 10px; margin-bottom: 10px"
  >
    <v-col style="height: 100%; padding: 0">
      <el-empty
        v-if="!totalTableData.length"
        description="当前暂无历史记录"
        style="height: 100%"
      ></el-empty>
      <el-table
        v-else
        ref="tableRef"
        v-loading="loading"
        :data="
          totalTableData.slice(
            (pageParams.page - 1) * pageParams.pageSize,
            pageParams.page * pageParams.pageSize
          )
        "
        :header-cell-style="{ 'text-align': 'center' }"
        :cell-style="{ textAlign: 'center' }"
        style="width: 100%"
        height="100%"
        @sort-change="handleSortChange"
        :default-sort="{ prop: 'created_time', order: 'descending' }"
        @expand-change="handleExpandChange"
        row-key="upload_id"
      >
        <el-table-column type="expand">
          <template #default="props">
            <div class="expanded-content">
              <task-detail-table
                :ref="
                  (el) => {
                    if (el) taskDetailRefs[props.row.upload_id] = el;
                  }
                "
                :upload_id="props.row.upload_id"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="编号" type="index" :index="indexAdd" width="60">
        </el-table-column>
        <el-table-column prop="cname" label="比赛名称" min-width="100">
        </el-table-column>
        <el-table-column
          prop="algorithm"
          label="算法"
          min-width="150"
        ></el-table-column>
        <el-table-column
          prop="created_time"
          label="上传时间"
          width="180"
          sortable="custom"
          :sort-orders="['ascending', 'descending']"
        >
          <template #default="scope">
            {{ formatDateTime(scope.row.created_time) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="updated_at"
          label="更新时间"
          width="180"
          sortable="custom"
          :sort-orders="['ascending', 'descending']"
        >
          <template #default="scope">
            {{ formatDateTime(scope.row.updated_at) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="status"
          label="状态"
          min-width="120"
        ></el-table-column>
        <el-table-column
          prop="score"
          label="总分"
          sortable="custom"
          :sort-orders="['ascending', 'descending']"
        >
          <template #default="scope">
            {{ scope.row.score.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="详情" min-width="90">
          <template #default="{ row }">
            <div
              style="
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
              "
            >
              <el-button type="success" plain @click="toggleExpand(row)"
              >查看
              </el-button>
              <el-icon
                class="link-icon"
                style="cursor: pointer; font-size: 16px; color: #409eff"
                @click="viewDetail(row.upload_id)"
              >
                <Link/>
              </el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="代码">
          <template #default="{ row }">
            <div
              style="
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
              "
            >
              <el-button type="success" plain @click="viewCode(row.upload_id)"
              >查看
              </el-button>
              <v-icon
                class="download-icon"
                style="cursor: pointer; font-size: 16px; color: #409eff"
                @click="handleDownloadCode(row.upload_id)"
              >
                mdi-download
              </v-icon>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </v-col>
  </v-row>

  <!-- Pagination -->
  <v-row class="flex-grow-0">
    <v-col class="d-flex justify-center">
      <el-pagination
        v-model:current-page="pageParams.page"
        :page-sizes="[5, 10, 25, 50, 100]"
        :page-size="pageParams.pageSize"
        layout="total, sizes, prev, next, jumper"
        :total="totalTableData.length"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      >
      </el-pagination>
    </v-col>
  </v-row>

  <!-- Code View Dialog -->
  <code-view-dialog
    ref="codeDialogRef"
    v-model:visible="codeDialogVisible"
    :upload-id="currentUploadId"
  />
</template>

<script setup>
import {nextTick, onBeforeUnmount, onMounted, ref} from "vue";
import {useRouter} from "vue-router";
import {APIS} from "@/config";
import {exportDataToExcel, formatDateTime, request} from "@/utility.js";
import {ElMessage} from "element-plus";
import {Download, InfoFilled, Link} from "@element-plus/icons-vue";
import TaskDetailTable from "@/components/TaskDetailTable.vue";
import CodeViewDialog from "@/components/CodeViewDialog.vue";

// 导出历史记录为Excel
function exportHistoryToExcel() {
  try {
    const fileName = exportDataToExcel(totalTableData.value, {
      formatter: (row, index) => ({
        "序号": index + 1,
        "比赛名称": row.cname || "-",
        "算法": row.algorithm || "-",
        "上传时间": formatDateTime(row.created_time),
        "更新时间": formatDateTime(row.updated_at),
        "状态": row.status || "-",
        "总分":
          typeof row.score === "number"
            ? row.score.toFixed(2)
            : row.score || "-",
      }),
      sheetName: "历史记录",
      fileName: "历史记录",
      colWidths: [
        {wch: 8}, // 序号
        {wch: 20}, // 比赛名称
        {wch: 20}, // 算法
        {wch: 20}, // 上传时间
        {wch: 20}, // 更新时间
        {wch: 12}, // 状态
        {wch: 10}, // 总分
      ],
    });
    ElMessage.success(
      `成功导出 ${totalTableData.value.length} 条记录到 ${fileName}`
    );
  } catch (error) {
    console.error("导出Excel失败:", error);
    ElMessage.error("导出Excel失败");
  }
}

const router = useRouter();
const totalTableData = ref([]);
const pageParams = ref({
  page: 1,
  pageSize: 25,
});
const expandedRows = ref([]);
const tableRef = ref(null);
const taskDetailRefs = ref({});
const allExpanded = ref(false);
const loading = ref(false);
const codeDialogVisible = ref(false);
const currentUploadId = ref("");
const codeDialogRef = ref(null);
let autoRefreshTimer = null;
// Keep track of current sort state for data refresh
let currentTableSort = {prop: "created_time", order: "descending"};

// 从 localStorage 加载分页状态
const loadPageState = () => {
  const savedState = localStorage.getItem("historyPageState");
  if (savedState) {
    const {page, pageSize} = JSON.parse(savedState);
    pageParams.value = {page, pageSize};
  }
};

// 保存分页状态到 localStorage
const savePageState = () => {
  localStorage.setItem(
    "historyPageState",
    JSON.stringify({
      page: pageParams.value.page,
      pageSize: pageParams.value.pageSize,
    })
  );
};

// 应用排序到整个数据集
const applySorting = (data) => {
  if (!currentTableSort.prop) return data;

  return [...data].sort((a, b) => {
    const {prop, order} = currentTableSort;
    if (order === "ascending") {
      if (prop === "created_time") {
        return new Date(a.created_time) - new Date(b.created_time);
      }
      return a[prop] > b[prop] ? 1 : -1;
    } else {
      if (prop === "created_time") {
        return new Date(b.created_time) - new Date(a.created_time);
      }
      return a[prop] < b[prop] ? 1 : -1;
    }
  });
};

async function get_history_records(loading_delay = 0) {
  loading.value = true;
  try {
    const res = await request(APIS.get_history_records, {
      method: "GET",
    });
    // Save the upload_id list of currently expanded rows
    const currentExpandedIds = [...expandedRows.value];

    // Apply current sorting to the entire dataset
    totalTableData.value = applySorting(res.history);

    // Don't force re-render TaskDetailTable components, let them reuse existing instances
    // Refresh data of expanded components in the next tick
    await nextTick(() => {
      const validExpandedIds = currentExpandedIds.filter((id) =>
        totalTableData.value.some((record) => record.upload_id === id)
      );

      // Refresh data of expanded components
      for (const uploadId of validExpandedIds) {
        const taskDetailRef = taskDetailRefs.value[uploadId];
        if (
          taskDetailRef &&
          taskDetailRef.checkTaskStatus &&
          taskDetailRef.checkTaskStatus() &&
          taskDetailRef.fetchTasks
        ) {
          taskDetailRef.fetchTasks(uploadId, 200).catch((error) => {
            console.error(
              `Failed to refresh task details (${uploadId}):`,
              error
            );
          });
        }
      }
    });
  } catch (error) {
    console.error("Failed to get history records:", error);
  } finally {
    if (loading_delay) {
      await new Promise((resolve) => setTimeout(resolve, loading_delay));
    }
    loading.value = false;
  }
}

// 启动自动刷新
function startAutoRefresh() {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
  }
  autoRefreshTimer = setInterval(() => {
    get_history_records();
  }, 30000); // 每30秒刷新一次
}

// 停止自动刷新
function stopAutoRefresh() {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
}

function viewDetail(upload_id) {
  router.push({name: "Detail", params: {upload_id}});
}

async function viewCode(upload_id) {
  currentUploadId.value = upload_id;
  codeDialogVisible.value = true;
}

// 处理代码下载，调用组件的方法
function handleDownloadCode(upload_id) {
  if (codeDialogRef.value) {
    codeDialogRef.value.downloadCode(upload_id);
  }
}

const handleSortChange = ({column, prop, order}) => {
  // Update our tracking variable when user changes sort
  currentTableSort = {prop, order};

  // Apply sorting to the entire dataset
  totalTableData.value = applySorting(totalTableData.value);
};

const indexAdd = (index) => {
  const page = pageParams.value.page;
  const pageSize = pageParams.value.pageSize;
  return index + 1 + (page - 1) * pageSize;
};

const handleSizeChange = (size) => {
  pageParams.value.pageSize = size;
  savePageState();
  cleanupInvisibleComponents();
  updateAllExpandedStatus();
};

const handleCurrentChange = (currentPage) => {
  pageParams.value.page = currentPage;
  savePageState();
  cleanupInvisibleComponents();
  updateAllExpandedStatus();
};

// Clean up component references that are not visible on current page
function cleanupInvisibleComponents() {
  const currentPageData = totalTableData.value.slice(
    (pageParams.value.page - 1) * pageParams.value.pageSize,
    pageParams.value.page * pageParams.value.pageSize
  );
  const currentPageIds = currentPageData.map((item) => item.upload_id);

  // Remove component references that are not on current page
  Object.keys(taskDetailRefs.value).forEach((uploadId) => {
    if (!currentPageIds.includes(uploadId)) {
      delete taskDetailRefs.value[uploadId];
    }
  });

  // Update expandedRows to only include items on current page
  expandedRows.value = expandedRows.value.filter((uploadId) =>
    currentPageIds.includes(uploadId)
  );
}

// Update allExpanded status based on current page data
function updateAllExpandedStatus() {
  const currentPageData = totalTableData.value.slice(
    (pageParams.value.page - 1) * pageParams.value.pageSize,
    pageParams.value.page * pageParams.value.pageSize
  );
  const currentPageIds = currentPageData.map((item) => item.upload_id);
  const expandedInCurrentPage = currentPageIds.filter((id) =>
    expandedRows.value.includes(id)
  );
  allExpanded.value =
    expandedInCurrentPage.length === currentPageData.length &&
    currentPageData.length > 0;
}

// Toggle expand all rows functions
async function toggleExpandAll() {
  if (allExpanded.value) {
    // Collapse all rows
    expandedRows.value = [];
    taskDetailRefs.value = {};
    // Use tableRef to collapse all rows in the table
    if (tableRef.value) {
      const currentPageData = totalTableData.value.slice(
        (pageParams.value.page - 1) * pageParams.value.pageSize,
        pageParams.value.page * pageParams.value.pageSize
      );
      currentPageData.forEach((row) => {
        tableRef.value.toggleRowExpansion(row, false);
      });
    }
    allExpanded.value = false;
  } else {
    // Expand all rows on the current page
    const currentPageData = totalTableData.value.slice(
      (pageParams.value.page - 1) * pageParams.value.pageSize,
      pageParams.value.page * pageParams.value.pageSize
    );

    currentPageData.forEach((row) => {
      if (!expandedRows.value.includes(row.upload_id)) {
        expandedRows.value.push(row.upload_id);
      }
      if (tableRef.value) {
        tableRef.value.toggleRowExpansion(row, true);
      }
    });
    allExpanded.value = true;
  }
}

async function handleExpandChange(row, expandedRowsParam) {
  // expandedRowsParam is an array containing all currently expanded rows
  const isExpanded =
    Array.isArray(expandedRowsParam) &&
    expandedRowsParam.some(
      (expandedRow) => expandedRow.upload_id === row.upload_id
    );

  if (isExpanded) {
    // Row is expanded
    if (!expandedRows.value.includes(row.upload_id)) {
      expandedRows.value = [...expandedRows.value, row.upload_id];
    }
  } else {
    // The Row is collapsed
    expandedRows.value = expandedRows.value.filter(
      (id) => id !== row.upload_id
    );
    // Clean up the corresponding component reference
    if (taskDetailRefs.value[row.upload_id]) {
      delete taskDetailRefs.value[row.upload_id];
    }
  }

  // Update allExpanded status based on current page data
  updateAllExpandedStatus();
}

function toggleExpand(row) {
  // Use el-table API to toggle expand state, ensuring state synchronization
  if (tableRef.value) {
    tableRef.value.toggleRowExpansion(row);
  }
}

onMounted(() => {
  loadPageState();
  get_history_records();
  startAutoRefresh(); // 启动自动刷新
});

onBeforeUnmount(() => {
  savePageState();
  stopAutoRefresh(); // 清理定时器
});
</script>

<style scoped>
.flex {
  display: flex;
}

.flex_justify_content_center {
  justify-content: center;
}

.default_margin {
  margin-top: 20px;
  margin-bottom: 10px;
}

.expanded-content {
  padding: 20px;
}

.download-icon:hover {
  color: #409eff !important;
  transform: scale(1.1);
  transition: all 0.2s ease;
}
</style>
