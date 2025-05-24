<template>
  <div id="historyRecord">
    <el-row>
      <div class="text-h4 pa-10">
        历史记录
      </div>
    </el-row>
    <el-empty v-if="!totalTableData.length" description="当前暂无历史记录"></el-empty>
    <el-table :data="totalTableData.slice((pageParams.page - 1) * pageParams.pageSize, pageParams.page * pageParams.pageSize)"
      :header-cell-style="{ 'text-align': 'center' }" :cell-style="{ textAlign: 'center' }" style="width: 100%;margin: auto"
      @sort-change="handleSortChange"
      :default-sort="{ prop: 'formatted_time', order: 'descending' }">
      <el-table-column label="编号" type="index" :index="indexAdd" width="100">
      </el-table-column>
      <el-table-column prop="cname" label="比赛名称" width="100">
      </el-table-column>
      <el-table-column prop="algorithm" label="算法">
      </el-table-column>
      <el-table-column prop="formatted_time" label="上传时间" width="180" sortable="custom">
      </el-table-column>
      <el-table-column prop="status" label="状态">
      </el-table-column>
      <el-table-column prop="score" label="总评分" sortable="custom">
      </el-table-column>

      <el-table-column label="详情">
        <template #default="{ row }">
          <el-button type="success" plain @click="viewDetail(row.upload_id)">查看</el-button>
        </template>
      </el-table-column>
      <el-table-column label="代码">
        <template #default="{ row }">
          <el-button type="success" plain @click="checkCode(row.upload_id)">下载</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-row class="flex default_margin flex_justify_content_center">
      <el-pagination background @size-change="handleSizeChange" @current-change="handleCurrentChange"
        :current-page="pageParams.page" :page-sizes="[10, 15, 20, 25]" :page-size="pageParams.pageSize"
        layout="total, sizes, prev, next, jumper" :total="totalTableData.length">
      </el-pagination>
    </el-row>

  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "@/store/app.js";
import { APIS } from "@/config";
import { ElMessage } from "element-plus";
import {formatDateTime} from "@/utility.js";
const router = useRouter();
const store = useAppStore();
const totalTableData = ref([]);
const pageParams = ref({
  page: 1, // 查询第一页
  pageSize: 10 // 每页两条  --- 要与pagination中page-size一致
});


async function get_history_records() {
  try {
    const response = await fetch(APIS.get_history_records, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        user_id: store.user_id,
        cname: store.cname
      })
    });

    const res = await response.json();

    if (res.code == 400) {
      // 提示信息
      ElMessage(`温馨提示：您尚未提交代码，暂时没有历史记录`);
      totalTableData.value = [];
    } else {
      console.log(res.history);   // 打印后台传给前台的数据
      let temp = res.history;
      // 格式化上传时间
      totalTableData.value = temp.map(record => {
        const formatted_time = formatDateTime(record.created_time);
        return { ...record, formatted_time };
      }).sort((a, b) => {
        return new Date(b.created_time) - new Date(a.created_time);
      });

    }
  } catch (error) {
    // 报错
    console.log("history vue error", error);
  }
}

function viewDetail(upload_id) {
  router.push({ name: 'Detail', params: { upload_id } });
}

async function checkCode(upload_id) {

  try {
    const response = await fetch(APIS.get_code, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        user_id: store.user_id,
        upload_id: upload_id
      })
    });



    if (response.ok) {
      // 提示信息
      ElMessage.success(`代码下载成功`);


      let fileName = 'code.cc';


      // 读取二进制数据
      const blob = await response.blob();

      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      console.log(url);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } else {
      // 提示信息
      this.$message.error(`代码下载失败`);
    }
  } catch (error) {
    // 报错
    console.log("history vue error", error);
  }

}

const handleSortChange = ({ column, prop, order }) => {
  // 实现排序逻辑
  totalTableData.value.sort((a, b) => {
    if (order === 'ascending') {
      if (prop === 'formatted_time') {
        return new Date(a.created_time) - new Date(b.created_time);
      }
      return a[prop] > b[prop] ? 1 : -1;
    } else {
      if (prop === 'formatted_time') {
        return new Date(b.created_time) - new Date(a.created_time);
      }
      return a[prop] < b[prop] ? 1 : -1;
    }
  });
}

const indexAdd = (index) => {
  const page = pageParams.value.page;
  const pageSize = pageParams.value.pageSize;
  return index + 1 + (page - 1) * pageSize;
};

const handleSizeChange = (size) => {
  pageParams.value.pageSize = size;
};

const handleCurrentChange = (currentPage) => {
  pageParams.value.page = currentPage;
};

onMounted(() => {
  get_history_records();

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

.card-container {
  height: 500px;
  /* 设置固定高度 */
  overflow-y: auto;
  /* 显示垂直滚动条 */
}

.content {
  white-space: pre-line;
}
</style>
