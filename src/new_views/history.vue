<template>
  <div id="historyRecord">
    <el-row class="text-h4 pa-10">
      <div
        style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        "
      >
        <span>历史记录</span>
        <div>
          <el-button type="success" @click="toggleExpandAll">
            {{ allExpanded ? "折叠所有" : "展开所有" }}
          </el-button>
          <el-button type="primary" @click="get_history_records(200)"
          >刷新
          </el-button>
        </div>
      </div>
      <el-text style="margin-left: auto; margin-top: 10px">
        <el-icon>
          <InfoFilled/>
        </el-icon>
        历史记录数据将自动刷新
      </el-text>
    </el-row>
    <el-empty
      v-if="!totalTableData.length"
      description="当前暂无历史记录"
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
      style="width: 100%; margin: auto"
      @sort-change="handleSortChange"
      :default-sort="{ prop: 'formatted_time', order: 'descending' }"
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
        prop="formatted_time"
        label="上传时间"
        width="180"
        sortable="custom"
        :sort-orders="['ascending', 'descending']"
      >
      </el-table-column>
      <el-table-column
        prop="status"
        label="状态"
        min-width="120"
      ></el-table-column>
      <el-table-column prop="score" label="总分" sortable="custom"
                       :sort-orders="['ascending', 'descending']">
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
          <el-button type="success" plain @click="checkCode(row.upload_id)"
          >下载
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-row class="flex default_margin flex_justify_content_center">
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
    </el-row>
  </div>
</template>

<script setup>
import {nextTick, onBeforeUnmount, onMounted, ref} from "vue";
import {useRouter} from "vue-router";
import {APIS} from "@/config";
import {ElMessage} from "element-plus";
import {formatDateTime, request} from "@/utility.js";
import {InfoFilled, Link} from "@element-plus/icons-vue";
import TaskDetailTable from "@/components/TaskDetailTable.vue";

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
let autoRefreshTimer = null;
// Keep track of current sort state for data refresh
let currentTableSort = {prop: "formatted_time", order: "descending"};

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
      if (prop === "formatted_time") {
        return new Date(a.created_time) - new Date(b.created_time);
      }
      return a[prop] > b[prop] ? 1 : -1;
    } else {
      if (prop === "formatted_time") {
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
    let temp = res.history;
    // Save the upload_id list of currently expanded rows
    const currentExpandedIds = [...expandedRows.value];

    const formattedData = temp.map((record) => {
      const formatted_time = formatDateTime(record.created_time);
      return {
        ...record,
        formatted_time,
      };
    });

    // Apply current sorting to the entire dataset
    totalTableData.value = applySorting(formattedData);

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
  }, 10000); // 每10秒刷新一次
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

async function checkCode(upload_id) {
  try {
    const response = await request(
      APIS.get_code,
      {
        body: JSON.stringify({
          upload_id: upload_id,
        }),
      },
      {raw: true}
    );
    if (response.ok) {
      const contentDisposition = response.headers.get("Content-Disposition");
      const fileNameMatch = contentDisposition
        ? contentDisposition.match(/filename="?([^"]+)"?/)
        : null;
      let fileName = "code.cc";
      if (fileNameMatch && fileNameMatch[1]) {
        fileName = fileNameMatch[1];
      }
      ElMessage.success(`代码下载成功`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error("Failed to download code:", error);
    // ElMessage.error("Failed to download code");
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
</style>
