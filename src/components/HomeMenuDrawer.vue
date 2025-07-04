<template>
  <v-navigation-drawer
    :model-value="innerDrawer"
    @update:model-value="(val) => (innerDrawer = val)"
    :permanent="!isMobile"
    :temporary="isMobile"
    color="white"
    width="280"
    :absolute="!isMobile"
    :style="isMobile ? 'z-index: 2002;' : ''"
  >
    <v-list nav dense>
      <v-list-item
        v-for="power in powers"
        :key="power.id_name"
        :to="{ name: power.id_name }"
        @click="handleNavigation(power.id_name)"
        link
        color="success"
        rounded="lg"
        class="ma-2"
      >
        <template v-slot:prepend>
          <v-icon :icon="power.icon || 'mdi-circle'" class="me-3"></v-icon>
        </template>
        <v-list-item-title class="text-subtitle-1">
          {{ power.power_info }}
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup>
import {computed, onMounted, onUnmounted, ref} from "vue";
import {useAppStore} from "@/store/app.js";
import {useRouter} from "vue-router";

const innerDrawer = ref(window.innerWidth > 960);
const router = useRouter();
const store = useAppStore();

const basePowers = [
  {id_name: "help", power_info: "竞赛指南", icon: "mdi-help-circle"},
  {id_name: "upload", power_info: "算法提交", icon: "mdi-upload"},
  {id_name: "ranklist", power_info: "榜单展示", icon: "mdi-trophy"},
  {id_name: "user", power_info: "个人中心", icon: "mdi-account"},
  {id_name: "history", power_info: "历史记录", icon: "mdi-history"},
];
const adminPowers = [
  ...basePowers,
  {
    id_name: "taskqueue",
    power_info: "任务队列",
    icon: "mdi-monitor-dashboard",
  },
  {id_name: "admin", power_info: "管理员面板", icon: "mdi-shield-account"},
];

const powers = computed(() => {
  return store.is_admin ? adminPowers : basePowers;
});

// 移动端适配
const isMobile = ref(false);
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 960;
};
onMounted(() => {
  checkMobile();
  window.addEventListener("resize", checkMobile);
  // 监听顶栏菜单按钮事件，移动端切换抽屉
  window.addEventListener("toggle-home-drawer", () => {
    if (window.innerWidth <= 960) {
      innerDrawer.value = !innerDrawer.value;
    }
  });
});
onUnmounted(() => {
  window.removeEventListener("resize", checkMobile);
  window.removeEventListener("toggle-home-drawer", () => {
  });
});

const handleNavigation = (componentName) => {
  router.push({name: componentName});
  // 仅在移动端点击菜单后关闭抽屉，桌面端始终展开
  if (isMobile.value) {
    innerDrawer.value = false;
  }
};
</script>
