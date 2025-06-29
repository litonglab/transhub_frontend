<template>
  <div class="admin-container">
    <v-row class="flex-grow-0 mb-4">
      <v-col>
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
          "
        >
          <span class="text-h4">管理员面板</span>
          <v-chip
            :color="store.is_super_admin ? 'purple' : 'primary'"
            variant="elevated"
          >
            {{ store.is_super_admin ? "超级管理员" : "管理员" }}
          </v-chip>
        </div>
      </v-col>
    </v-row>

    <!-- 导航标签容器 -->
    <div class="tabs-container">
      <v-tabs
        v-model="activeTab"
        class="admin-tabs"
        bg-color="white"
        fixed-tabs
      >
        <v-tab value="stats">统计分析</v-tab>
        <v-tab value="system">系统信息</v-tab>
        <v-tab value="logs">系统日志</v-tab>
        <v-tab value="users">用户管理</v-tab>
        <v-tab value="tasks">任务管理</v-tab>
      </v-tabs>
    </div>

    <!-- 标签内容容器 -->
    <div class="content-container">
      <v-card class="content-card">
        <v-window v-model="activeTab">
          <!-- 用户管理 -->
          <v-window-item value="users">
            <AdminUserManagement/>
          </v-window-item>

          <!-- 任务管理 -->
          <v-window-item value="tasks">
            <AdminTaskManagement/>
          </v-window-item>

          <!-- 统计分析 -->
          <v-window-item value="stats">
            <AdminStatistics :is-active="activeTab === 'stats'"/>
          </v-window-item>

          <!-- 系统信息 -->
          <v-window-item value="system">
            <AdminSystemInfo :is-active="activeTab === 'system'"/>
          </v-window-item>

          <!-- 系统日志 -->
          <v-window-item value="logs">
            <AdminSystemLogs :is-active="activeTab === 'logs'"/>
          </v-window-item>
        </v-window>
      </v-card>
    </div>
  </div>
</template>

<script setup>
import {onMounted, ref, watch} from "vue";
import {useAppStore} from "@/store/app";
import AdminUserManagement from "@/components/AdminUserManagement.vue";
import AdminTaskManagement from "@/components/AdminTaskManagement.vue";
import AdminStatistics from "@/components/AdminStatistics.vue";
import AdminSystemInfo from "@/components/AdminSystemInfo.vue";
import AdminSystemLogs from "@/components/AdminSystemLogs.vue";

const store = useAppStore();
const activeTab = ref("stats");

// Restore active tab from session storage on component mount
onMounted(() => {
  const savedTab = sessionStorage.getItem("adminActiveTab");
  if (savedTab) {
    activeTab.value = savedTab;
  }
});

// Save active tab to session storage whenever it changes
watch(activeTab, (newTab) => {
  sessionStorage.setItem("adminActiveTab", newTab);
});
</script>

<style scoped>
.text-h4 {
  font-size: 24px;
}

.admin-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.tabs-container {
  position: sticky;
  top: 0;
  z-index: 10;
  background: white;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  margin-bottom: 0;
}

.admin-tabs {
  background: white !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.content-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.content-card {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.content-card :deep(.v-window) {
  height: 100%;
  overflow: hidden;
}

.content-card :deep(.v-window-item) {
  height: 100%;
  overflow-y: auto;
}

/* 确保tab标签有足够的间距和清晰的视觉效果 */
.admin-tabs :deep(.v-tab) {
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0.5px;
}

.admin-tabs :deep(.v-tab--selected) {
  color: #1976d2 !important;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .tabs-container {
    position: relative;
    top: auto;
  }

  .admin-tabs :deep(.v-tab) {
    font-size: 14px;
    min-width: auto;
    padding: 0 12px;
  }
}
</style>
