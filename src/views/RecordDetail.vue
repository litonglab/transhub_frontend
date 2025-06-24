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
        <span class="text-h4">任务详情</span>
        <div>
          <el-button type="success" @click="goBack">返回上页</el-button>
          <el-button type="primary" @click="refreshTasks">刷新</el-button>
        </div>
      </div>
      <div style="text-align: right">
        <el-text style="margin-top: 10px">
          <el-icon>
            <InfoFilled/>
          </el-icon>
          任务完成前其状态将自动刷新
        </el-text>
      </div>
    </v-col>
  </v-row>

  <div class="record-detail-container">
    <div class="table-container">
      <task-detail-table ref="taskDetailTableRef" :upload_id="upload_id"/>
    </div>
  </div>
</template>

<script setup>
import {defineProps, nextTick, onBeforeUnmount, onMounted, ref} from "vue";
import {useRouter} from "vue-router";
import TaskDetailTable from "@/components/TaskDetailTable.vue";
import {InfoFilled} from "@element-plus/icons-vue";

const props = defineProps({
  upload_id: {
    type: String,
    required: true,
  },
});

const router = useRouter();
const taskDetailTableRef = ref(null);
let autoRefreshTimer = null;

function goBack() {
  router.back();
}

function refreshTasks() {
  // Call the component's fetchTasks method directly, reusing the existing component
  if (taskDetailTableRef.value && taskDetailTableRef.value.fetchTasks) {
    taskDetailTableRef.value
      .fetchTasks(props.upload_id, 100)
      .then(() => {
        // Check task status after refresh
        if (
          autoRefreshTimer &&
          taskDetailTableRef.value &&
          !taskDetailTableRef.value.checkTaskStatus()
        ) {
          stopAutoRefresh();
        }
      })
      .catch((error) => {
        console.error("Failed to refresh task details:", error);
      });
  } else {
    // ElMessage.error("组件未就绪");
    console.error(
      "TaskDetailTable component not ready or fetchTasks method doesn't exist"
    );
  }
}

// Start auto-refresh
function startAutoRefresh() {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
  }
  autoRefreshTimer = setInterval(() => {
    refreshTasks();
  }, 5000); // Refresh every 5 seconds
}

// Stop auto-refresh
function stopAutoRefresh() {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
}

onMounted(async () => {
  // Wait for component to be fully mounted and data to be loaded
  await nextTick();

  // Give the TaskDetailTable component a moment to load initial data
  setTimeout(() => {
    // Check task status after initial load
    if (
      taskDetailTableRef.value &&
      taskDetailTableRef.value.checkTaskStatus()
    ) {
      startAutoRefresh(); // Only start auto-refresh if needed
    } else {
      console.debug(
        "Tasks already completed or failed, no need for auto-refresh"
      );
    }
  }, 2000); // Wait 2 second for initial data load
});

onBeforeUnmount(() => {
  stopAutoRefresh(); // Clean up timer
});
</script>

<style scoped>
.record-detail-container {
  padding: 1px 0;
}

.table-container {
  overflow: auto;
}
</style>
