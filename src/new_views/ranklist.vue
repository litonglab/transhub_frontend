<template>
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
        <el-button type="primary" @click="rankList">刷新</el-button>
      </div>
    </div>
  </el-row>
  <el-empty v-if="!tableData.length" description="还没有人提交过"></el-empty>
  <el-table
    :data="
      tableData.slice(
        (pageParams.page - 1) * pageParams.pageSize,
        pageParams.page * pageParams.pageSize
      )
    "
    :header-cell-style="{ 'text-align': 'center' }"
    :cell-style="{ textAlign: 'center' }"
    @sort-change="sortTableFun"
    style="width: 100%; margin: auto"
  >
    <el-table-column label="序号" type="index" width="100" :index="indexAdd">
    </el-table-column>
    <el-table-column prop="username" label="用户名"></el-table-column>
    <el-table-column
      prop="algorithm"
      label="算法名称"
      min-width="150"
    ></el-table-column>
    <el-table-column prop="formatted_time" label="上传时间" min-width="150">
    </el-table-column>
    <el-table-column prop="task_score" sortable="custom" label="总评分">
      <template #default="scope">
        {{ scope.row.task_score.toFixed(2) }}
      </template>
    </el-table-column>
    <el-table-column label="详情">
      <template #default="{ row }">
        <el-button type="success" plain @click="viewDetail(row.upload_id)"
        >查看
        </el-button>
      </template>
    </el-table-column>
  </el-table>
  <el-row class="flex default_margin flex_justify_content_center">
    <el-pagination
      background
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="pageParams.page"
      :page-sizes="[10, 15, 20, 25, 50]"
      :page-size="pageParams.pageSize"
      layout="total, sizes, prev, next, jumper"
      :total="tableData.length"
    >
    </el-pagination>
  </el-row>
</template>

<script setup>
import {onBeforeUnmount, onMounted, ref} from "vue";
import {APIS} from "@/config.js";
import {formatDateTime, request} from "@/utility.js";
import {useRouter} from "vue-router";
import {ElMessage} from "element-plus";

const router = useRouter();
const tableData = ref([]);
const pageParams = ref({
  page: 1,
  pageSize: 20,
});
const isDestroyed = ref(true);

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
  tableData.value.sort((a, b) => {
    if (order === "ascending") {
      return a[prop] - b[prop];
    } else {
      return b[prop] - a[prop];
    }
  });
};

const rankList = async () => {
  try {
    const data = await request(APIS.get_ranks, {
      method: "GET",
    });
    tableData.value = data.rank.map((record) => {
      const formatted_time = formatDateTime(record.upload_time);
      return {...record, formatted_time};
    });
    ElMessage.success("加载成功");
  } catch (error) {
    console.log(error);
  }
};

const handleSizeChange = (size) => {
  pageParams.value.pageSize = size;
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

onMounted(() => {
  loadPageState();
  rankList();
});

onBeforeUnmount(() => {
  savePageState();
  isDestroyed.value = false;
});

function viewDetail(upload_id) {
  router.push({name: "Detail", params: {upload_id}});
}
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

.demo-image {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.view-wrapper {
  padding-top: 1.22667rem;
}

.view-wrapper :deep(.van-nav-bar .van-icon) {
  color: #333;
  font-size: 18px;
  margin-right: 3px;
}

.view-wrapper :deep(.van-loading) {
  position: absolute;
  top: 50%;
  left: 46%;
}
</style>
