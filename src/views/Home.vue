<template>
  <v-app>
    <div class="app-container">
      <!-- 应用栏 -->
      <v-app-bar flat elevation="2" color="error">
        <!-- 移动端菜单按钮 -->
        <v-app-bar-nav-icon
          @click="drawer = !drawer"
          class="d-md-none"
        ></v-app-bar-nav-icon>

        <v-app-bar-title>
          Transhub：中国人民大学“一人一栈”打榜平台
        </v-app-bar-title>

        <v-spacer></v-spacer>
        <v-chip
          :color="getRoleColor(store.role)"
          size="small"
          variant="elevated"
        >
          {{ getRoleText(store.role) }}
        </v-chip>
        <v-btn class="fill-height">
          {{ user_name }}
        </v-btn>
        <v-btn @click="logout" class="fill-height"> 退出登录</v-btn>
      </v-app-bar>
      <!-- 导航抽屉 -->
      <v-navigation-drawer
        v-model="drawer"
        :permanent="!isMobile"
        :temporary="isMobile"
        color="white"
        width="280"
        :absolute="!isMobile"
      >
        <v-list nav dense>
          <v-list-item
            v-for="power in powers.array"
            :key="power.id_name"
            :to="{ name: power.id_name }"
            @click="handleNavigation(power.id_name)"
            link
            color="success"
            rounded="lg"
            class="ma-2"
          >
            <template v-slot:prepend>
              <v-icon
                :icon="getIconByName(power.id_name)"
                class="me-3"
              ></v-icon>
            </template>
            <v-list-item-title class="text-subtitle-1">
              {{ power.power_info }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-navigation-drawer>

      <!-- 主要内容区域 -->
      <v-main class="bg-grey-lighten-3 d-flex">
        <v-container fluid class="pa-0 d-flex flex-column full-height">
          <v-card class="content-card flex-grow-1" rounded="lg">
            <router-view/>
          </v-card>
        </v-container>
      </v-main>
    </div>
  </v-app>
</template>

<script setup>
import {onMounted, onUnmounted, reactive, ref} from "vue";
import {useAppStore} from "@/store/app.js";
import {useRouter} from "vue-router";
import {request} from "@/utility";
import {APIS} from "@/config";
import {ElMessage} from "element-plus";

const router = useRouter();
const store = useAppStore();

// 响应式数据
const user_name = store.name;
const selected_component = ref("student");
const isMobile = ref(false);
const drawer = ref(false);

// 菜单数据
const info = [
  {id_name: "help", power_info: "竞赛指南"},
  {id_name: "upload", power_info: "算法提交"},
  {id_name: "ranklist", power_info: "榜单展示"},
  {id_name: "user", power_info: "个人中心"},
  {id_name: "history", power_info: "历史记录"},
];

// 管理员菜单项
const adminInfo = {id_name: "admin", power_info: "管理员面板"};
const taskQueueInfo = {id_name: "taskqueue", power_info: "任务队列"};

const powers = reactive({
  array: store.is_admin ? [...info, adminInfo, taskQueueInfo] : info,
});

// 检测屏幕尺寸
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
  // 在桌面端始终显示抽屉，移动端默认隐藏
  drawer.value = !isMobile.value;
};

// 导航处理
const handleNavigation = (componentName) => {
  selected_component.value = componentName;
  // 在移动端选择后关闭抽屉
  if (isMobile.value) {
    drawer.value = false;
  }
  // 使用 router 进行导航
  router.push({name: componentName});
};

// 根据页面名称获取对应的图标
const getIconByName = (idName) => {
  const iconMap = {
    taskqueue: "mdi-monitor-dashboard",
    admin: "mdi-shield-account",
    help: "mdi-help-circle",
    upload: "mdi-upload",
    ranklist: "mdi-trophy",
    user: "mdi-account",
    history: "mdi-history",
  };
  return iconMap[idName] || "mdi-circle";
};

// 登出功能
async function logout() {
  try {
    await request(APIS.logout, {
      method: "GET",
    });
    ElMessage({type: "success", message: "注销成功"});
    store.clear_user_info();
    await router.push({name: "login"});
  } catch (error) {
  }
}

// 生命周期
onMounted(() => {
  checkMobile();
  window.addEventListener("resize", checkMobile);
});

const getRoleColor = (role) => {
  switch (role) {
    case "super_admin":
      return "purple";
    case "admin":
      return "primary";
    default:
      return "green";
  }
};

const getRoleText = (role) => {
  switch (role) {
    case "super_admin":
      return "超级管理员";
    case "admin":
      return "管理员";
    default:
      return "学生";
  }
};


onUnmounted(() => {
  window.removeEventListener("resize", checkMobile);
});
</script>

<style scoped>
/* 应用容器样式 - 设置最大宽度并居中 */
.app-container {
  max-width: 2000px; /* 页面的最大宽度 */
  margin: 0 auto;
  width: 100%;
  position: relative;
  min-height: 100dvh;
}

.content-card {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.full-height {
  height: 100%;
}

/* 确保 v-main 和 container 占满全高 */
.v-main {
  height: 100dvh !important; /* 减去 app-bar 的高度 */
  display: flex !important;
  flex-direction: column;
}

/* 移动端样式调整 */
@media (max-width: 768px) {
  /* 移动端可以使用更小的最大宽度或不限制 */
  .app-container {
    max-width: none;
  }
}

/* v-list-item 悬停效果 */
.v-list-item:hover {
  background-color: rgba(76, 175, 80, 0.1);
}

/* 激活状态样式 */
.v-list-item--active {
  background-color: rgba(76, 175, 80, 0.2);
  border-radius: 8px;
}

/* 导航栏文字样式优化 */
.v-list-item-title {
  font-size: 16px !important;
  font-weight: 500 !important;
  line-height: 1.5;
}

/* 导航项间距和大小调整 */
.v-list-item {
  min-height: 48px !important;
  padding: 8px 16px !important;
}
</style>
