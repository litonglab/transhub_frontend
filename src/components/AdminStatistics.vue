<template>
  <v-card-text>
    <v-row>
      <!-- 概览统计 -->
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center mb-4">
          <h3 class="">系统概览</h3>
          <v-chip-group v-model="taskStatsScope" mandatory density="compact">
            <v-chip value="current" variant="outlined" size="small"
            >当前课程
            </v-chip>
            <v-chip value="all" variant="outlined" size="small"
            >所有课程
            </v-chip>
          </v-chip-group>
        </div>
        <v-row>
          <v-col cols="12" md="3">
            <v-card>
              <v-card-text class="text-center">
                <v-icon
                  icon="mdi-account-group"
                  size="48"
                  color="primary"
                  class="mb-2"
                ></v-icon>
                <div class="text-h4 font-weight-bold">
                  {{ stats.user_stats?.total_users || 0 }}
                </div>
                <div class="text-subtitle-2 d-flex align-center justify-center">
                  总用户数
                  <v-tooltip location="top">
                    <template v-slot:activator="{ props }">
                      <v-icon
                        v-bind="props"
                        icon="mdi-information-outline"
                        size="16"
                        color="grey"
                        class="ml-1"
                      ></v-icon>
                    </template>
                    <span
                    >数据库所有用户数（不含被删除的{{
                        stats.user_stats?.deleted_users
                      }}个用户）</span
                    >
                  </v-tooltip>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card>
              <v-card-text class="text-center">
                <v-icon
                  icon="mdi-file-document-multiple"
                  size="48"
                  color="info"
                  class="mb-2"
                ></v-icon>
                <div class="text-h4 font-weight-bold">
                  {{ displayedTaskStats.total || 0 }}
                </div>
                <div class="text-subtitle-2">总任务数</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card>
              <v-card-text class="text-center">
                <v-icon
                  icon="mdi-upload"
                  size="48"
                  color="warning"
                  class="mb-2"
                ></v-icon>
                <div class="text-h4 font-weight-bold">
                  {{ displayedTaskStats.today_submit || 0 }}
                </div>
                <div class="text-subtitle-2">今日提交</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card>
              <v-card-text class="text-center">
                <v-icon
                  icon="mdi-chart-line"
                  size="48"
                  color="success"
                  class="mb-2"
                ></v-icon>
                <div class="text-h4 font-weight-bold">{{ successRate }}%</div>
                <div class="text-subtitle-2">任务成功率</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>

      <!-- 任务状态统计 -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>
            <span>任务状态统计</span>
          </v-card-title>
          <v-card-text>
            <div ref="taskStatsChart" style="height: 300px"></div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 角色分布统计 -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>用户角色分布</v-card-title>
          <v-card-text>
            <div ref="roleStatsChart" style="height: 300px"></div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 近7日提交统计 -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>近7日提交统计</v-card-title>
          <v-card-text>
            <div ref="dailySubmissionsChart" style="height: 300px"></div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 比赛参与统计 -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>比赛参与统计</v-card-title>
          <v-card-text>
            <div ref="competitionStatsChart" style="height: 300px"></div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-card-text>
</template>

<script setup>
import {computed, nextTick, onMounted, onUnmounted, ref, watch} from "vue";
import {APIS} from "@/config";
import {request} from "@/utility.js";
import {ElMessage} from "element-plus";
import * as echarts from "echarts";

// 接收父组件传递的激活状态
const props = defineProps({
  isActive: {
    type: Boolean,
    default: false,
  },
});

const loading = ref(false);
const stats = ref({
  user_stats: {},
  all_course_task_stats: {},
  role_stats: {},
  competition_stats: {},
  current_course_task_stats: {},
});

const taskStatsScope = ref("current"); // 'all' or 'current'

const taskStatsChart = ref(null);
const roleStatsChart = ref(null);
const competitionStatsChart = ref(null);
const dailySubmissionsChart = ref(null);

// 图表实例引用
let taskChart = null;
let roleChart = null;
let competitionChart = null;
let dailySubmissionsChartInstance = null;

// 定时器引用
let statsInterval = null;

const displayedTaskStats = computed(() => {
  if (taskStatsScope.value === "current") {
    return stats.value.current_course_task_stats || {};
  }
  return stats.value.all_course_task_stats || {};
});

const successRate = computed(() => {
  const taskStats = displayedTaskStats.value;
  const finished = taskStats.finished || 0;
  const total = taskStats.total ?? 0;
  if (total === 0) {
    return 0;
  }
  return Math.round((finished / total) * 100);
});

const loadStats = async () => {
  // 仅在首次加载时显示loading
  if (
    !stats.value.user_stats ||
    Object.keys(stats.value.user_stats).length === 0
  ) {
    loading.value = true;
  }

  try {
    const result = await request(APIS.admin_get_stats, {
      method: "GET",
    });

    if (result.data) {
      stats.value = result.data;
      await nextTick();
      renderCharts();
    }
  } catch (error) {
    console.error("加载统计数据失败:", error);
    ElMessage.error("加载统计数据失败");
  } finally {
    loading.value = false;
  }
};

const startTimer = () => {
  if (statsInterval) {
    clearInterval(statsInterval);
  }
  // 每30秒自动刷新一次统计数据
  statsInterval = setInterval(() => {
    loadStats();
  }, 30000);
};

const stopTimer = () => {
  if (statsInterval) {
    clearInterval(statsInterval);
    statsInterval = null;
  }
};

const renderCharts = () => {
  renderTaskStatsChart();
  renderRoleStatsChart();
  renderCompetitionStatsChart();
  renderDailySubmissionsChart();
};

const renderTaskStatsChart = () => {
  if (!taskChart) return;

  const taskStats = displayedTaskStats.value;

  const data = Object.entries(taskStats)
    .filter(([status]) => !["total", "today_submit"].includes(status))
    .map(([status, count]) => ({
      name: status,
      value: count,
    }));

  const option = {
    tooltip: {
      trigger: "item",
      formatter: "{a} <br/>{b}: {c} ({d}%)",
    },
    series: [
      {
        name: "任务状态",
        type: "pie",
        radius: "70%",
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
    ],
  };

  taskChart.setOption(option);
};

const renderRoleStatsChart = () => {
  if (!roleChart) return;

  const roleStats = stats.value.role_stats || {};

  const roleMap = {
    student: "学生",
    admin: "管理员",
    super_admin: "超级管理员",
  };

  const data = Object.entries(roleStats).map(([role, count]) => ({
    name: roleMap[role] || role,
    value: count,
  }));

  const option = {
    tooltip: {
      trigger: "item",
      formatter: "{a} <br/>{b}: {c} ({d}%)",
    },
    series: [
      {
        name: "用户角色",
        type: "pie",
        radius: "70%",
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
    ],
  };

  roleChart.setOption(option);
};

const renderCompetitionStatsChart = () => {
  if (!competitionChart) return;

  const competitionStats = stats.value.competition_stats || {};

  const data = Object.entries(competitionStats);

  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
    },
    xAxis: {
      type: "category",
      data: data.map(([name]) => name),
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        name: "参与人数",
        type: "bar",
        data: data.map(([, count]) => count),
        itemStyle: {
          color: "#1976d2",
        },
      },
    ],
  };

  competitionChart.setOption(option);
};

const renderDailySubmissionsChart = () => {
  if (!dailySubmissionsChartInstance) return;

  const dailySubmissions = displayedTaskStats.value.daily_submissions || [];

  const sortedSubmissions = [...dailySubmissions].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const dates = sortedSubmissions.map((item) => item.date);
  const counts = sortedSubmissions.map((item) => item.count);

  const option = {
    tooltip: {
      trigger: "axis",
    },
    xAxis: {
      type: "category",
      data: dates,
      boundaryGap: false,
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        name: "提交次数",
        data: counts,
        type: "line",
        smooth: true,
        itemStyle: {
          color: "#ffc107", // a shade of yellow/orange
        },
        areaStyle: {},
      },
    ],
  };

  dailySubmissionsChartInstance.setOption(option);
};

const resizeCharts = () => {
  if (taskChart) {
    taskChart.resize();
  }
  if (roleChart) {
    roleChart.resize();
  }
  if (competitionChart) {
    competitionChart.resize();
  }
  if (dailySubmissionsChartInstance) {
    dailySubmissionsChartInstance.resize();
  }
};

// 初始化图表
const initCharts = () => {
  if (taskStatsChart.value && !taskChart) {
    taskChart = echarts.init(taskStatsChart.value);
  }
  if (roleStatsChart.value && !roleChart) {
    roleChart = echarts.init(roleStatsChart.value);
  }
  if (competitionStatsChart.value && !competitionChart) {
    competitionChart = echarts.init(competitionStatsChart.value);
  }
  if (dailySubmissionsChart.value && !dailySubmissionsChartInstance) {
    dailySubmissionsChartInstance = echarts.init(dailySubmissionsChart.value);
  }
};

// 销毁图表
const destroyCharts = () => {
  if (taskChart) {
    taskChart.dispose();
    taskChart = null;
  }
  if (roleChart) {
    roleChart.dispose();
    roleChart = null;
  }
  if (competitionChart) {
    competitionChart.dispose();
    competitionChart = null;
  }
  if (dailySubmissionsChartInstance) {
    dailySubmissionsChartInstance.dispose();
    dailySubmissionsChartInstance = null;
  }
};

onMounted(() => {
  // 等待DOM渲染完成后初始化图表
  nextTick(() => {
    initCharts();
  });
  loadStats();
  if (props.isActive) {
    startTimer();
  }
  window.addEventListener("resize", resizeCharts);
  console.debug("AdminStatistics mounted");
});

onUnmounted(() => {
  stopTimer();
  destroyCharts();
  window.removeEventListener("resize", resizeCharts);
  console.debug("AdminStatistics unmounted");
});

// 监听激活状态变化
watch(
  () => props.isActive,
  (newValue, oldValue) => {
    console.debug(
      "AdminStatistics isActive changed:",
      newValue,
      "from:",
      oldValue
    );
    if (newValue) {
      // 标签被激活时，加载数据并启动定时器
      loadStats();
      startTimer();
    } else {
      // 标签被切换走时，停止定时器
      stopTimer();
    }
  },
  {immediate: false}
);

watch(taskStatsScope, () => {
  renderTaskStatsChart();
  renderDailySubmissionsChart();
});
</script>
