<template>
  <div id="ranklist">
    <task-detail-table ref="taskDetailTableRef" style="display: none"/>
    <el-row>
      <div
        class="text-h4 pa-10"
        style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        "
      >
        <span>榜单展示</span>
        <div>
          <el-button type="primary" @click="get_ranklist">刷新</el-button>
        </div>
      </div>
    </el-row>
    <el-empty
      v-if="!totalTableData.length"
      description="当前暂无榜单数据"
    ></el-empty>
    <el-table
      v-else
      :data="
        totalTableData.slice(
          (pageParams.page - 1) * pageParams.pageSize,
          pageParams.page * pageParams.pageSize
        )
      "
      :header-cell-style="{ 'text-align': 'center' }"
      :cell-style="{ textAlign: 'center' }"
      @sort-change="sortTableFun"
      style="width: 100%; margin: auto"
      @expand-change="handleExpandChange"
      :expand-row-keys="expandedRows"
      row-key="upload_id"
    >
      <el-table-column type="expand">
        <template #default="props">
          <div v-if="props.row.tasks" class="expanded-content">
            <task-detail-table :tasks="props.row.tasks"/>
          </div>
          <div
            v-else-if="props.row.loading"
            class="expanded-content loading-container"
          >
            <el-skeleton :rows="3" animated/>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="编号" type="index" width="60" :index="indexAdd">
      </el-table-column>
      <el-table-column prop="username" label="用户名"></el-table-column>
      <el-table-column
        prop="algorithm"
        label="算法"
        min-width="150"
      ></el-table-column>
      <el-table-column prop="formatted_time" label="上传时间" min-width="150">
      </el-table-column>
      <el-table-column prop="task_score" sortable="custom" label="总分">
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
    </el-table>
    <el-row class="flex default_margin flex_justify_content_center">
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
    </el-row>
  </div>
</template>

<script setup>
import {nextTick, onBeforeUnmount, onMounted, ref} from "vue";
import {APIS} from "@/config.js";
import {formatDateTime, request} from "@/utility.js";
import {useRouter} from "vue-router";
import {ElMessage} from "element-plus";
import {Link} from "@element-plus/icons-vue";
import TaskDetailTable from "@/components/TaskDetailTable.vue";

const router = useRouter();
const totalTableData = ref([]);
const pageParams = ref({
  page: 1,
  pageSize: 25,
});
const expandedRows = ref([]);
const taskDetailTableRef = ref(null);

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
  totalTableData.value.sort((a, b) => {
    if (order === "ascending") {
      return a[prop] - b[prop];
    } else {
      return b[prop] - a[prop];
    }
  });
};

async function handleExpandChange(row, expanded) {
  if (expanded) {
    row.loading = true;
    row.tasks = await taskDetailTableRef.value.fetchTasks(row.upload_id);
    row.loading = false;
    // 将当前行的upload_id添加到展开行列表中
    expandedRows.value = [...expandedRows.value, row.upload_id];
  } else {
    // 从展开行列表中移除当前行的upload_id
    expandedRows.value = expandedRows.value.filter(
      (id) => id !== row.upload_id
    );
  }
}

async function get_ranklist() {
  try {
    const res = await request(APIS.get_ranks, {
      method: "GET",
    });
    let temp = res.rank;
    // 保存当前展开行的upload_id列表
    const expandedIds = [...expandedRows.value];

    totalTableData.value = temp
      .map((record) => {
        const formatted_time = formatDateTime(record.upload_time);
        return {
          ...record,
          formatted_time,
          loading: false,
          tasks: null,
        };
      })
      .sort((a, b) => {
        return new Date(b.upload_time) - new Date(a.upload_time);
      });

    // 并发加载已展开行的任务详情
    const rowsToRefresh = totalTableData.value.filter((item) =>
      expandedIds.includes(item.upload_id)
    );
    rowsToRefresh.forEach((row) => (row.loading = true));

    try {
      const tasksPromises = rowsToRefresh.map((row) =>
        taskDetailTableRef.value
          .fetchTasks(row.upload_id)
          .then((tasks) => {
            row.tasks = tasks;
          })
          .catch((error) => {
            console.error(`获取任务详情失败 (${row.upload_id}):`, error);
          })
          .finally(() => {
            row.loading = false;
          })
      );
      await Promise.all(tasksPromises);
    } catch (error) {
      console.error("获取任务详情失败:", error);
    }

    // 恢复展开状态
    await nextTick(() => {
      expandedRows.value = expandedIds;
    });
    ElMessage.success("加载成功");
  } catch (error) {
    console.error("获取榜单数据失败:", error);
    // ElMessage.error("获取榜单数据失败");
  }
}

const handleSizeChange = (size) => {
  pageParams.value.pageSize = size;
  pageParams.value.page = 1;
  savePageState();
};

const handleCurrentChange = (currentPage) => {
  pageParams.value.page = currentPage;
  savePageState();
};

const indexAdd = (index) => {
  const page = pageParams.value.page;
  const pageSize = pageParams.value.pageSize;
  return index + 1 + (page - 1) * pageSize;
};

function toggleExpand(row) {
  const index = expandedRows.value.indexOf(row.upload_id);
  if (index > -1) {
    expandedRows.value.splice(index, 1);
    handleExpandChange(row, false);
  } else {
    expandedRows.value.push(row.upload_id);
    handleExpandChange(row, true);
  }
}

function viewDetail(upload_id) {
  router.push({name: "Detail", params: {upload_id}});
}

onMounted(() => {
  loadPageState();
  get_ranklist();
});

onBeforeUnmount(() => {
  savePageState();
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
  margin-bottom: 40px;
}

.expanded-content {
  padding: 20px;
}

.loading-container {
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
