<template>
  <el-row>
    <div class="text-h4 pa-10">榜单展示</div>
  </el-row>
  <el-empty v-if="!tableData.length" description="还没有人提交过"></el-empty>
  <!-- <div class="flex default_margin flex_justify_content_center">
    <canvas v-for="page in pages" :id="'the-canvas'+page" :key="page"></canvas>
  </div> -->
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
    <el-table-column prop="username" label="用户名"> </el-table-column>
    <el-table-column prop="algorithm" label="算法名称"> </el-table-column>
    <el-table-column prop="formatted_time" label="上传时间" width="180">
    </el-table-column>
    <el-table-column prop="task_score" sortable="custom" label="总评分">
    </el-table-column>
    <el-table-column label="详情">
      <template #default="{ row }">
        <el-button type="success" plain @click="viewDetail(row.upload_id)"
          >查看</el-button
        >
      </template>
    </el-table-column>
  </el-table>
  <el-row class="flex default_margin flex_justify_content_center">
    <el-pagination
      background
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="pageParams.page"
      :page-sizes="[10, 15, 20, 25]"
      :page-size="pageParams.pageSize"
      layout="total, sizes, prev, next, jumper"
      :total="tableData.length"
    >
    </el-pagination>
  </el-row>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
// import { axios } from '@/utils/request';
import { APIS } from "@/config.js";
import { useAppStore } from "@/store/app.js";
import { formatDateTime, request } from "@/utility.js";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
const router = useRouter();
const store = useAppStore();
const tableData = ref([]);
const pageParams = ref({
  page: 1,
  pageSize: 20,
});
const pages = ref(1);
const isDestroyed = ref(true);

const sortTableFun = ({ prop, order }) => {
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
      body: JSON.stringify({
        user_id: store.user_id,
        cname: store.cname,
      }),
    });
    console.log(data);
    tableData.value = data.rank.map((record) => {
      const formatted_time = formatDateTime(record.upload_time);
      return { ...record, formatted_time };
    });
  } catch (error) {
    console.log(error);
  }
};

const handleSizeChange = (size) => {
  pageParams.value.pageSize = size;
  console.log(pageParams.value.pageSize, "size");
};

const handleCurrentChange = (currentPage) => {
  pageParams.value.page = currentPage;
  console.log(pageParams.value.page, "page");
};

const indexAdd = (index) => {
  const page = pageParams.value.page;
  const pageSize = pageParams.value.pageSize;
  return index + 1 + (page - 1) * pageSize;
};

onMounted(() => {
  rankList();
});

onBeforeUnmount(() => {
  console.log("destroy");
  isDestroyed.value = false;
});

function viewDetail(upload_id) {
  router.push({ name: "Detail", params: { upload_id } });
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
.view-wrapper /deep/ .van-nav-bar .van-icon {
  color: #333;
  font-size: 18px;
  margin-right: 3px;
}
.view-wrapper /deep/ .van-loading {
  position: absolute;
  top: 50%;
  left: 46%;
}
</style>
