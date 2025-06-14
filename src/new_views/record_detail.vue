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
      <span>任务详情</span>
      <div>
        <el-button type="success" @click="goBack">返回上页</el-button>
        <el-button type="primary" @click="refreshTasks">刷新</el-button>
      </div>
    </div>
  </el-row>
  <div class="record-detail-container">
    <div class="table-container">
      <task-detail-table ref="taskDetailTableRef" :upload_id="upload_id"/>
    </div>
  </div>
</template>

<script setup>
import {defineProps, ref} from "vue";
import {useRouter} from "vue-router";
import TaskDetailTable from "@/components/TaskDetailTable.vue";
import {ElMessage} from "element-plus";

const props = defineProps({
  upload_id: {
    type: String,
    required: true,
  },
});

const router = useRouter();
const taskDetailTableRef = ref(null);

function goBack() {
  router.back();
}

function refreshTasks() {
  // Call the component's fetchTasks method directly, reusing the existing component
  if (taskDetailTableRef.value && taskDetailTableRef.value.fetchTasks) {
    taskDetailTableRef.value
      .fetchTasks(props.upload_id, 100)
      .then(() => {
        ElMessage.success("刷新成功");
      })
      .catch((error) => {
        console.error("Failed to refresh task details:", error);
        // ElMessage.error("刷新失败");
      });
  } else {
    // ElMessage.error("组件未就绪");
    console.error(
      "TaskDetailTable component not ready or fetchTasks method doesn't exist"
    );
  }
}
</script>

<style scoped>
.record-detail-container {
  padding: 20px;
}

.table-container {
  height: calc(100vh - 120px);
  overflow: auto;
}
</style>
