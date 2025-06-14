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
        <el-button type="primary" @click="goBack">返回</el-button>
        <el-button type="primary" @click="refreshTasks">刷新</el-button>
      </div>
    </div>
  </el-row>
  <div class="record-detail-container">
    <div class="table-container">
      <task-detail-table
        ref="taskDetailTableRef"
        :tasks="tasks"
        :upload_id="upload_id"
      />
    </div>
  </div>
</template>

<script setup>
import {defineProps, onMounted, ref} from "vue";
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
const tasks = ref([]);

async function fetchTasks() {
  tasks.value = await taskDetailTableRef.value.fetchTasks(props.upload_id);
  // 判断数组是否为空
  if (tasks.value.length !== 0) {
    ElMessage.success("获取任务详情成功");
  }
}

function goBack() {
  router.back();
}

function refreshTasks() {
  fetchTasks();
}

onMounted(() => {
  fetchTasks();
});
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
