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
        <span class="text-h4">榜单展示</span>
        <div>
          <!-- 管理员批量操作区域 -->
          <el-button
            v-if="store.is_admin"
            type="primary"
            :disabled="selectedRows.length === 0"
            @click="batchDownloadCodes"
            :loading="batchDownloading"
          >
            批量下载选中代码 ({{ selectedRows.length }})
          </el-button>
          <el-button
            v-if="store.is_admin"
            type="success"
            :disabled="selectedRows.length === 0"
            @click="batchDownloadCodesAsZip"
            :loading="batchDownloading"
            style="margin-left: 8px"
          >
            打包下载代码为ZIP ({{ selectedRows.length }})
          </el-button>
          <el-button
            v-if="store.is_admin"
            type="warning"
            @click="exportToExcel"
          >
            <el-icon>
              <Download/>
            </el-icon>
            导出Excel
          </el-button>
          <!-- 普通用户区域 -->
          <el-button type="success" @click="toggleExpandAll">
            {{ allExpanded ? "折叠所有" : "展开所有" }}
          </el-button>
          <el-button type="primary" @click="get_ranklist(200)">刷新</el-button>
        </div>
      </div>

      <div style="text-align: right">
        <el-text style="margin-top: 10px">
          <el-icon>
            <InfoFilled/>
          </el-icon>
          <span v-if="selectedRows.length > 0">
            已选择 {{ selectedRows.length }} 项数据，自动刷新已暂停
          </span>
          <span v-else> 榜单数据将自动刷新 </span>
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
        description="当前暂无榜单数据"
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
        @sort-change="sortTableFun"
        :default-sort="{ prop: 'task_score', order: 'descending' }"
        style="width: 100%"
        height="100%"
        @expand-change="handleExpandChange"
        @selection-change="handleSelectionChange"
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
        <el-table-column
          v-if="store.is_admin"
          type="selection"
          width="55"
          :selectable="() => true"
        >
        </el-table-column>
        <el-table-column label="编号" type="index" width="60" :index="indexAdd">
        </el-table-column>
        <el-table-column prop="username" label="用户名"></el-table-column>
        <el-table-column
          v-if="store.is_admin"
          prop="real_name"
          label="姓名"
          min-width="100"
        >
          <template #default="scope">
            {{ scope.row.to_admin?.real_name || "-" }}
          </template>
        </el-table-column>
        <el-table-column
          v-if="store.is_admin"
          prop="sno"
          label="学号"
          min-width="120"
        >
          <template #default="scope">
            {{ scope.row.to_admin?.sno || "-" }}
          </template>
        </el-table-column>
        <el-table-column
          prop="algorithm"
          label="算法"
          min-width="150"
        ></el-table-column>
        <el-table-column prop="formatted_time" label="上传时间" min-width="150">
        </el-table-column>
        <el-table-column
          prop="task_score"
          sortable="custom"
          label="总分"
          :sort-orders="['ascending', 'descending']"
        >
          <template #default="scope">
            {{ scope.row.task_score.toFixed(2) }}
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
        <el-table-column v-if="store.is_admin" label="代码">
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
        background
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
import {onBeforeUnmount, onMounted, ref} from "vue";
import {APIS} from "@/config.js";
import {formatDateTime, request} from "@/utility.js";
import {useRouter} from "vue-router";
import {Download, InfoFilled, Link} from "@element-plus/icons-vue";
import {ElMessage, ElMessageBox} from "element-plus";
import TaskDetailTable from "@/components/TaskDetailTable.vue";
import CodeViewDialog from "@/components/CodeViewDialog.vue";
import {useAppStore} from "@/store/app.js";
import * as XLSX from "xlsx";

const router = useRouter();
const store = useAppStore();
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
const selectedRows = ref([]);
const batchDownloading = ref(false);
let autoRefreshTimer = null;
// Keep track of current sort state for data refresh
let currentTableSort = {prop: "task_score", order: "descending"};

// 封装生成文件前缀的函数
const generateFilePrefix = (row) => {
  if (!store.is_admin || !row?.to_admin) {
    return "";
  }

  const sno = row.to_admin.sno || "";
  const realName = row.to_admin.real_name || "";
  const username = row.username || "";
  return `${sno}_${realName}_${username}`;
};

// 从 localStorage 加载分页状态
const loadPageState = () => {
  const savedState = localStorage.getItem("ranklistPageState");
  if (savedState) {
    const {page, pageSize} = JSON.parse(savedState);
    pageParams.value = {page, pageSize};
  }
};

// 保存分页状态到 localStorage
const savePageState = () => {
  localStorage.setItem(
    "ranklistPageState",
    JSON.stringify({
      page: pageParams.value.page,
      pageSize: pageParams.value.pageSize,
    })
  );
};

const sortTableFun = ({prop, order}) => {
  // Update our tracking variable when user changes sort
  currentTableSort = {prop, order};

  // Apply sorting to the entire dataset
  totalTableData.value = applySorting(totalTableData.value);
};

// 应用排序到整个数据集
const applySorting = (data) => {
  if (!currentTableSort.prop) return data;

  return [...data].sort((a, b) => {
    const {prop, order} = currentTableSort;
    if (order === "ascending") {
      return a[prop] - b[prop];
    } else {
      return b[prop] - a[prop];
    }
  });
};

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
  // expandedRowsParam 是一个数组，包含当前所有展开的行
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

async function get_ranklist(loading_delay = 0) {
  loading.value = true;
  try {
    const res = await request(APIS.get_ranks, {
      method: "GET",
    });
    let temp = res.rank;

    const formattedData = temp.map((record) => {
      const formatted_time = formatDateTime(record.upload_time);
      return {
        ...record,
        formatted_time,
      };
    });

    // Apply current sorting to the entire dataset
    totalTableData.value = applySorting(formattedData);

    // No need to refresh the expanded rows, because rank list row item is static.
  } catch (error) {
    console.error("获取榜单数据失败:", error);
  } finally {
    if (loading_delay > 0) {
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
    // 如果有选择的内容，跳过自动刷新
    if (selectedRows.value.length > 0) {
      return;
    }
    get_ranklist();
  }, 10000); // 每10秒刷新一次
}

// 停止自动刷新
function stopAutoRefresh() {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
}

const handleSizeChange = (size) => {
  pageParams.value.pageSize = size;
  pageParams.value.page = 1;
  savePageState();
  cleanupInvisibleComponents();
  updateAllExpandedStatus();
  // 清空选择
  selectedRows.value = [];
};

const handleCurrentChange = (currentPage) => {
  pageParams.value.page = currentPage;
  savePageState();
  cleanupInvisibleComponents();
  updateAllExpandedStatus();
  // 清空选择
  selectedRows.value = [];
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

const indexAdd = (index) => {
  const page = pageParams.value.page;
  const pageSize = pageParams.value.pageSize;
  return index + 1 + (page - 1) * pageSize;
};

function toggleExpand(row) {
  // 使用 el-table 的方法来切换展开状态，确保状态同步
  if (tableRef.value) {
    tableRef.value.toggleRowExpansion(row);
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
    // 如果是管理员，生成文件前缀
    const row = totalTableData.value.find(
      (item) => item.upload_id === upload_id
    );
    const filePrefix = generateFilePrefix(row);

    codeDialogRef.value.downloadCode(upload_id, filePrefix);
  }
}

// 处理表格选择变化
function handleSelectionChange(selection) {
  selectedRows.value = selection;
}

// 批量下载代码
async function batchDownloadCodes() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning("请先选择要下载的记录");
    return;
  }

  // 确认对话框
  try {
    await ElMessageBox.confirm(
      `确定要下载选中的 ${selectedRows.value.length} 个代码文件吗？`,
      "批量下载确认",
      {
        confirmButtonText: "确定下载",
        cancelButtonText: "取消",
        type: "info",
      }
    );
  } catch {
    return; // 用户取消
  }

  batchDownloading.value = true;
  let successCount = 0;
  let failCount = 0;

  try {
    // 串行下载，避免同时发起太多请求
    for (const row of selectedRows.value) {
      try {
        if (codeDialogRef.value) {
          // 如果是管理员，生成文件前缀
          const filePrefix = generateFilePrefix(row);
          await codeDialogRef.value.downloadCode(row.upload_id, filePrefix);
          successCount++;
        }
        // 添加短暂延迟，避免请求过于频繁
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to download code for ${row.upload_id}:`, error);
        failCount++;
      }
    }

    // 显示下载结果
    if (successCount > 0 && failCount === 0) {
      ElMessage.success(`成功下载 ${successCount} 个代码文件`);
    } else if (successCount > 0 && failCount > 0) {
      ElMessage.warning(
        `成功下载 ${successCount} 个，失败 ${failCount} 个代码文件`
      );
    } else {
      ElMessage.error("所有代码文件下载失败");
    }
  } finally {
    batchDownloading.value = false;
  }
}

// 批量下载代码并打包为ZIP
async function batchDownloadCodesAsZip() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning("请先选择要下载的记录");
    return;
  }

  // 确认对话框
  try {
    await ElMessageBox.confirm(
      `确定要将选中的 ${selectedRows.value.length} 个代码文件打包下载吗？`,
      "批量打包下载确认",
      {
        confirmButtonText: "确定下载",
        cancelButtonText: "取消",
        type: "info",
      }
    );
  } catch {
    return; // 用户取消
  }

  batchDownloading.value = true;

  try {
    const uploadIds = selectedRows.value.map((row) => row.upload_id);

    // 如果是管理员，生成文件前缀数组
    const filePrefixes = store.is_admin
      ? selectedRows.value.map((row) => generateFilePrefix(row))
      : [];

    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:-]/g, "");
    const zipFileName = `ranklist_codes_${timestamp}.zip`;

    if (codeDialogRef.value) {
      await codeDialogRef.value.downloadCodesAsZip(
        uploadIds,
        zipFileName,
        filePrefixes
      );
    }
  } catch (error) {
    console.error("Failed to download codes as zip:", error);
    ElMessage.error("打包下载失败");
  } finally {
    batchDownloading.value = false;
  }
}

// 导出Excel
async function exportToExcel() {
  if (totalTableData.value.length === 0) {
    ElMessage.warning("当前没有数据可导出");
    return;
  }

  try {
    // 准备导出数据
    const exportData = totalTableData.value.map((row, index) => {
      const baseData = {
        "序号": index + 1,
        "用户名": row.username,
        "算法": row.algorithm,
        "上传时间": row.formatted_time,
        "总分": row.task_score?.toFixed(2) || "0.00",
      };

      // 如果是管理员，添加学号和姓名字段
      if (store.is_admin && row.to_admin) {
        return {
          ...baseData,
          "姓名": row.to_admin.real_name || "-",
          "学号": row.to_admin.sno || "-",
        };
      }

      return baseData;
    });

    // 创建工作簿
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    // 设置列宽
    worksheet["!cols"] = store.is_admin
      ? [{wch: 8}, {wch: 15}, {wch: 12}, {wch: 15}, {wch: 20}, {wch: 20}, {wch: 10},
      ]
      : [{wch: 8}, {wch: 15}, {wch: 20}, {wch: 20}, {wch: 10}];

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, "榜单数据");

    // 生成文件名
    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:-]/g, "")
      .replace("T", "_");
    const fileName = `榜单数据_${timestamp}.xlsx`;

    // 导出文件
    XLSX.writeFile(workbook, fileName);

    ElMessage.success(`成功导出 ${exportData.length} 条记录到 ${fileName}`);
  } catch (error) {
    console.error("导出Excel失败:", error);
    ElMessage.error("导出Excel失败");
  }
}

onMounted(() => {
  loadPageState();
  get_ranklist();
  startAutoRefresh(); // 启动自动刷新
});

onBeforeUnmount(() => {
  savePageState();
  stopAutoRefresh(); // 清理定时器
});
</script>

<style scoped>
.expanded-content {
  padding: 20px;
}

.download-icon:hover {
  color: #409eff !important;
  transform: scale(1.1);
  transition: all 0.2s ease;
}
</style>
