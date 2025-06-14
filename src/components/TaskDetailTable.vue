<template>
  <el-card shadow="hover">
    <div class="task-detail-table-wrapper">
      <el-table
        :data="tasks"
        style="width: 100%"
        :max-height="height"
        class="task-detail-table"
      >
        <el-table-column
          prop="trace_name"
          label="测试文件"
          min-width="160"
        ></el-table-column>
        <el-table-column prop="loss_rate" label="丢包率"></el-table-column>
        <el-table-column prop="buffer_size" label="缓冲区容量"/>
        <el-table-column prop="task_status" label="任务状态"></el-table-column>
        <el-table-column prop="task_score" label="得分">
          <template #default="scope">
            <span v-if="scope.row.task_status !== 'finished'"
            >任务完成后可查看</span
            >
          </template>
        </el-table-column>
        <el-table-column label="吞吐量">
          <template #default="scope">
            <el-button
              v-if="scope.row.task_status === 'finished'"
              @click="showImage('throughput', scope.row.task_id)"
            >查看
            </el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="时延">
          <template #default="scope">
            <el-button
              v-if="scope.row.task_status === 'finished'"
              @click="showImage('delay', scope.row.task_id)"
            >查看
            </el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="日志">
          <template #default="scope">
            <el-button @click="showLog(scope.row.log)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-dialog
        v-model="dialogVisible"
        :lock-scroll="true"
        :modal-append-to-body="true"
        :append-to-body="true"
      >
        <img
          v-if="dialogType === 'image'"
          :src="dialogContent"
          style="width: 100%"
        />
        <div v-else>
          <textarea
            v-model="dialogContent"
            style="width: 100%; height: 400px; white-space: pre-wrap"
            readonly
          ></textarea>
        </div>
      </el-dialog>
    </div>
  </el-card>
</template>

<script setup>
import {ref} from "vue";
import {APIS} from "@/config.js";
import {request} from "@/utility.js";
import {ElMessage} from "element-plus";

const props = defineProps({
  tasks: {
    type: Array,
    default: () => [],
  },
  height: {
    type: String,
    default: "400",
  },
  upload_id: {
    type: String,
    default: "",
  },
});

const dialogVisible = ref(false);
const dialogContent = ref("");
const dialogType = ref("");

async function fetchTasks(upload_id) {
  try {
    const data = await request(APIS.get_history_record_detail, {
      body: JSON.stringify({
        upload_id: upload_id,
      }),
    });
    return data.tasks || [];
  } catch (error) {
    console.error("获取任务详情失败:", error);
    // ElMessage.error("获取任务详情失败");
    return [];
  }
}

async function showImage(type, task_id) {
  try {
    const response = await request(
      APIS.get_graph,
      {
        body: JSON.stringify({
          task_id: task_id,
          graph_type: type,
        }),
      },
      {raw: true}
    );
    if (!response.ok) {
      const result = await response.json();
      console.error(result.message);
      return;
    }
    const contentType = response.headers.get("Content-Type");
    if (!contentType || !contentType.startsWith("image/")) {
      console.error("Returned content is not an image:", contentType);
      return;
    }
    const blob = await response.blob();
    if (blob.size === 0) {
      console.error("Blob is empty");
      return;
    }
    const blobUrl = URL.createObjectURL(blob);
    dialogContent.value = blobUrl.startsWith("blob:")
      ? blobUrl
      : `blob:${blobUrl}`;
    dialogType.value = "image";
    dialogVisible.value = true;
  } catch (error) {
    ElMessage.error("获取图片失败");
  }
}

function showLog(logContent) {
  dialogContent.value = logContent;
  dialogType.value = "log";
  dialogVisible.value = true;
}

defineExpose({
  fetchTasks,
});
</script>

<style scoped>
.task-detail-table-wrapper {
  width: 100%;
}

.task-detail-table {
  overflow-y: auto;
}

.task-detail-table :deep(.el-table__body-wrapper) {
  overflow-y: auto;
}
</style>
