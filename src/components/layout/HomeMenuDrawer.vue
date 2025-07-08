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

    <!--    底栏-->
    <div
      style="
        position: absolute;
        bottom: 0;
        width: 100%;
        text-align: center;
        padding: 16px 0;
        font-size: 13px;
        color: #888;
        background: #fff;
      "
    >
      <div style="margin-bottom: 10px">
        <div
          style="
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            margin-bottom: 4px;
          "
        >
          <span>系统负载：</span>
          <span style="display: flex; align-items: center; gap: 4px">
            <svg width="20" height="20" viewBox="0 0 22 22">
              <circle
                cx="11"
                cy="11"
                r="9"
                fill="#f5f5f5"
                stroke="#ddd"
                stroke-width="2"
              />
              <circle
                :stroke="loadConfig[sysLoad === -1 ? loadConfig.length - 1 : sysLoad].color"
                stroke-width="4"
                fill="none"
                cx="11"
                cy="11"
                r="9"
                :stroke-dasharray="2 * Math.PI * 9"
                :stroke-dashoffset="2 * Math.PI * 9 * (1 - loadConfig[sysLoad === -1 ? loadConfig.length - 1 : sysLoad].ratio)"
                stroke-linecap="round"
                transform="rotate(-90 11 11)"
                style="transition: stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1);"
              />
            </svg>
            <span
              :style="{ color: loadConfig[sysLoad === -1 ? loadConfig.length - 1 : sysLoad].color, fontWeight: 'bold' }"
            >{{ loadConfig[sysLoad === -1 ? loadConfig.length - 1 : sysLoad].text }}</span>
          </span>
          <v-tooltip location="right">
            <template v-slot:activator="{ props }">
              <v-icon
                v-bind="props"
                icon="mdi-information-outline"
                size="16"
                color="grey"
                class="ml-1"
              ></v-icon>
            </template>
            <span>当系统处于满载状态时，评测程序偶现不稳定现象，如分数明显异常，可尝试重新提交任务，如有需要可联系管理员。</span>
          </v-tooltip>
        </div>
        <div
          style="
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
          "
        >
          <span>队列长度：</span>
          <span style="display: flex; align-items: center; gap: 4px">
            <span
              style="
                width: 60px;
                height: 8px;
                background: #eee;
                border-radius: 4px;
                overflow: hidden;
                display: inline-block;
              "
            >
              <span
                :style="{
                  display: 'block',
                  height: '100%',
                  width: queueLevel === -1 ? '0%' : ((queueLevel + 1) * 100) / (queueConfig.length - 1) + '%',
                  background: queueConfig[queueLevel === -1 ? queueConfig.length - 1 : queueLevel].color,
                  borderRadius: '4px',
                  transition: 'width 0.6s cubic-bezier(.4,0,.2,1)',
                }"
              ></span>
            </span>
            <span
              :class="`ml-1`"
              :style="{
                color: queueConfig[queueLevel === -1 ? queueConfig.length - 1 : queueLevel].color,
                fontWeight: 'bold',
                display: 'inline-block',
              }"
            >{{ queueConfig[queueLevel === -1 ? queueConfig.length - 1 : queueLevel].text }}</span>
          </span>
          <v-tooltip location="right">
            <template v-slot:activator="{ props }">
              <v-icon
                v-bind="props"
                icon="mdi-information-outline"
                size="16"
                color="grey"
                class="ml-1"
              ></v-icon>
            </template>
            <span>系统中待处理的任务数量，可简单换算还需等待的时间。</span>
          </v-tooltip>
        </div>
      </div>
      <v-divider style="margin: 10px auto;width: 80%;"/>
      <a
        href="https://www.litonglab.com/"
        target="_blank"
        style="color: #888; text-decoration: underline"
      >LitongLab</a><br/>© 2025 TransHub. All rights reserved.
    </div>
  </v-navigation-drawer>
</template>

<script setup>
import {computed, onMounted, onUnmounted, ref} from "vue";
import {useAppStore} from "@/store/app.js";
import {useRouter} from "vue-router";

import {APIS} from "@/config";
import {request} from "@/utility";

// 系统负载和队列数据
const sysLoad = ref(-1); // 0: 轻载, 1: 重载, 2: 满载, -1: 未获取
const queueLevel = ref(-1); // 0~7, -1: 未获取

let sysInfoTimer = null;
const updateSystemInfo = async () => {
  try {
    const res = await request(APIS.get_system_info, {method: "GET"}, {showError: false});
    sysLoad.value = res.data.system_status;
    queueLevel.value = res.data.queue_status;
  } catch (e) {
    sysLoad.value = -1;
    queueLevel.value = -1;
  }
};

// 系统负载配置，-1 配置放在最后一项，未获取时直接取最后一项
const loadConfig = [
  {text: "轻载", color: "#4caf50", ratio: 0.3,},
  {text: "重载", color: "#ff9800", ratio: 0.8,},
  {text: "满载", color: "#f44336", ratio: 1,},
  {text: "无数据", color: "#bbb", ratio: 0,},
];

// 队列长度配置，-1 配置放在最后一项，未获取时直接取最后一项
const queueConfig = [
  {text: "<10", color: "#4caf50"},
  {text: "10-50", color: "#8bc34a"},
  {text: "50-100", color: "#ffc107"},
  {text: "100-200", color: "#ff9800"},
  {text: "200-500", color: "#ff5722"},
  {text: "500-1000", color: "#f44336"},
  {text: "1000-2000", color: "#b71c1c"},
  {text: ">2000", color: "#880808"},
  {text: "无数据", color: "#bbb"},
];

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
  updateSystemInfo();
  sysInfoTimer = setInterval(updateSystemInfo, 2000);
  window.addEventListener("resize", checkMobile);
  // 监听顶栏菜单按钮事件，移动端切换抽屉
  window.addEventListener("toggle-home-drawer", () => {
    if (window.innerWidth <= 960) {
      innerDrawer.value = !innerDrawer.value;
    }
  });
});
onUnmounted(() => {
  if (sysInfoTimer) clearInterval(sysInfoTimer);
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
