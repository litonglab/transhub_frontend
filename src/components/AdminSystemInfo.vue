<template>
  <v-card-text>
    <v-row v-if="!loading">
      <!-- 系统信息 -->
      <v-col cols="12" md="6">
        <v-card class="h-100">
          <v-card-title>系统信息</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item>
                <v-list-item-title>操作系统</v-list-item-title>
                <v-list-item-subtitle
                >{{ systemInfo.system?.platform || "-" }}
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Python版本</v-list-item-title>
                <v-list-item-subtitle
                >{{ systemInfo.system?.python_version || "-" }}
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>CPU使用率</v-list-item-title>
                <v-list-item-subtitle>
                  <v-progress-linear
                    :model-value="systemInfo.system?.cpu_percent || 0"
                    :color="getCpuColor(systemInfo.system?.cpu_percent)"
                    height="20"
                  >
                    {{ systemInfo.system?.cpu_percent || 0 }}%
                  </v-progress-linear>
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>内存使用率</v-list-item-title>
                <v-list-item-subtitle>
                  <v-progress-linear
                    :model-value="systemInfo.system?.memory_percent || 0"
                    :color="getMemoryColor(systemInfo.system?.memory_percent)"
                    height="20"
                  >
                    {{ systemInfo.system?.memory_percent || 0 }}%
                  </v-progress-linear>
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>磁盘使用率</v-list-item-title>
                <v-list-item-subtitle>
                  <v-progress-linear
                    :model-value="systemInfo.system?.disk_usage || 0"
                    :color="getDiskColor(systemInfo.system?.disk_usage)"
                    height="20"
                  >
                    {{ systemInfo.system?.disk_usage || 0 }}%
                  </v-progress-linear>
                </v-list-item-subtitle>
              </v-list-item>
              <v-divider style="margin: 10px 0"></v-divider>
              <v-list-item>
                <v-list-item-title>进程ID</v-list-item-title>
                <v-list-item-subtitle
                >{{ systemInfo.process.current_process?.current_pid || "-" }}
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>启动时间</v-list-item-title>
                <v-list-item-subtitle
                >{{ systemInfo.process.current_process?.start_time || "-" }}
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>运行时长</v-list-item-title>
                <v-list-item-subtitle>
                  <v-chip color="success" size="small" variant="elevated">
                    {{
                      systemInfo.process.current_process?.uptime_formatted ||
                      "-"
                    }}
                  </v-chip>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
      <!-- 应用配置 -->
      <v-col cols="12" md="6">
        <v-card class="h-100">
          <v-card-title>应用配置</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item>
                <v-list-item-title>调试模式</v-list-item-title>
                <v-list-item-subtitle>
                  <v-chip
                    :color="systemInfo.config?.debug ? 'warning' : 'success'"
                    size="small"
                    variant="elevated"
                  >
                    {{ systemInfo.config?.debug ? "开启" : "关闭" }}
                  </v-chip>
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>运行环境</v-list-item-title>
                <v-list-item-subtitle>
                  <v-chip
                    :color="
                      systemInfo.config?.env === 'production'
                        ? 'success'
                        : 'warning'
                    "
                    size="small"
                    variant="elevated"
                  >
                    {{ systemInfo.config?.env || "-" }}
                  </v-chip>
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>日志级别</v-list-item-title>
                <v-list-item-subtitle>
                  <v-chip
                    :color="getLogLevelColor(systemInfo.config?.log_level)"
                    size="small"
                    variant="elevated"
                  >
                    {{ systemInfo.config?.log_level || "-" }}
                  </v-chip>
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>课程列表</v-list-item-title>
                <v-list-item-subtitle>
                  <v-chip
                    v-for="course in systemInfo.config?.courses || []"
                    :key="course"
                    size="small"
                    class="mr-1 mb-1"
                    variant="elevated"
                    color="info"
                  >
                    {{ course }}
                  </v-chip>
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item v-if="systemInfo.config?.register_student_list">
                <v-list-item-title
                >允许注册的学生名单
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
                    >允许注册的学生名单为所有课程学生名单总和，若总名单为空，则允许任何人注册。</span
                    >
                  </v-tooltip>
                </v-list-item-title>
                <v-list-item-subtitle>
                  <v-chip
                    size="small"
                    variant="tonal"
                    color="primary"
                    @click="
                      showStudentList(
                        '所有',
                        systemInfo.config.register_student_list
                      )
                    "
                    style="cursor: pointer"
                  >
                    共 {{ systemInfo.config.register_student_list.length }} 人
                    <v-icon size="small" class="ml-1">mdi-eye</v-icon>
                  </v-chip>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 相关进程信息 -->
    <v-row
      v-if="
        systemInfo.process?.related_processes &&
        systemInfo.process.related_processes.length > 0
      "
    >
      <v-col cols="12">
        <v-card>
          <v-card-title> 相关进程信息</v-card-title>
          <v-card-text>
            <v-data-table
              :headers="processHeaders"
              :items="systemInfo.process.related_processes"
              :items-per-page="10"
              class="elevation-1"
              dense
              v-model:sort-by="processSortBy"
            >
              <template v-slot:item.pid="{ item }">
                <v-chip
                  :color="
                    item.pid === systemInfo.process.current_process?.current_pid
                      ? 'primary'
                      : 'default'
                  "
                  size="small"
                  variant="outlined"
                >
                  {{ item.pid }}
                  <v-icon
                    v-if="
                      item.pid ===
                      systemInfo.process.current_process?.current_pid
                    "
                    class="ml-1"
                    size="small"
                  >
                    mdi-star
                  </v-icon>
                </v-chip>
              </template>
              <template v-slot:item.name="{ item }">
                <v-chip size="small" variant="tonal" color="info">
                  {{ item.name }}
                </v-chip>
              </template>
              <template v-slot:item.uptime_formatted="{ item }">
                <v-chip
                  size="small"
                  variant="tonal"
                  :color="getUptimeColor(item.uptime_seconds)"
                >
                  {{ item.uptime_formatted }}
                </v-chip>
              </template>
              <template v-slot:item.cmdline="{ item }">
                <div class="cmdline-text">
                  {{ item.cmdline }}
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 课程详细配置 -->
    <v-row v-if="systemInfo.config?.course_detail">
      <v-col cols="12">
        <v-card>
          <v-card-title>课程详细配置</v-card-title>
          <v-card-text>
            <v-expansion-panels variant="accordion" multiple>
              <v-expansion-panel
                v-for="(courseConfig, courseName) in systemInfo.config
                  .course_detail"
                :key="courseName"
              >
                <v-expansion-panel-title>
                  <div class="d-flex align-center">
                    <v-icon class="mr-2" color="primary"
                    >mdi-book-outline
                    </v-icon>
                    <span class="font-weight-medium">{{ courseName }}</span>
                    <v-spacer></v-spacer>
                    <v-chip
                      :color="
                        getCourseStatus(
                          courseConfig.start_time,
                          courseConfig.end_time
                        ).color
                      "
                      size="small"
                      variant="flat"
                      class="mr-2"
                    >
                      {{
                        getCourseStatus(
                          courseConfig.start_time,
                          courseConfig.end_time
                        ).text
                      }}
                    </v-chip>
                    <v-chip
                      :color="courseConfig.allow_login ? 'success' : 'error'"
                      size="small"
                      variant="flat"
                      class="mr-2"
                    >
                      {{ courseConfig.allow_login ? "允许登录" : "禁止登录" }}
                    </v-chip>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-row class="mt-2">
                    <v-col cols="12" md="4">
                      <v-list dense>
                        <v-list-item>
                          <v-list-item-title>课程名称</v-list-item-title>
                          <v-list-item-subtitle
                          >{{ courseConfig.name || "-" }}
                          </v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>开始时间</v-list-item-title>
                          <v-list-item-subtitle
                          >{{ courseConfig.start_time || "-" }}
                          </v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>结束时间</v-list-item-title>
                          <v-list-item-subtitle
                          >{{ courseConfig.end_time || "-" }}
                          </v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item v-if="courseConfig.student_list">
                          <v-list-item-title
                          >学生名单
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
                              <span>未设置学生名单时，任何人可登录。</span>
                            </v-tooltip>
                          </v-list-item-title>
                          <v-list-item-subtitle>
                            <v-chip
                              size="small"
                              variant="tonal"
                              color="primary"
                              @click="
                                showStudentList(
                                  courseName,
                                  courseConfig.student_list
                                )
                              "
                              style="cursor: pointer"
                            >
                              共 {{ courseConfig.student_list.length }} 人
                              <v-icon size="small" class="ml-1">mdi-eye</v-icon>
                            </v-chip>
                          </v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item v-if="courseConfig.trace_files">
                          <v-list-item-title>Trace文件</v-list-item-title>
                          <v-list-item-subtitle>
                            <div class="trace-files-container">
                              <v-chip
                                v-for="traceFile in courseConfig.trace_files"
                                :key="traceFile"
                                size="small"
                                class="mr-1 mb-1"
                                variant="outlined"
                                color="secondary"
                              >
                                {{ traceFile }}
                              </v-chip>
                            </div>
                          </v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                    </v-col>
                    <v-col cols="12" md="8">
                      <v-list dense>
                        <v-list-item>
                          <v-list-item-title>课程路径</v-list-item-title>
                          <v-list-item-subtitle class="text-caption"
                          >{{ courseConfig.path || "-" }}
                          </v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>上行目录</v-list-item-title>
                          <v-list-item-subtitle class="text-caption"
                          >{{ courseConfig.uplink_dir || "-" }}
                          </v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>下行目录</v-list-item-title>
                          <v-list-item-subtitle class="text-caption"
                          >{{ courseConfig.downlink_dir || "-" }}
                          </v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>指南路径</v-list-item-title>
                          <v-list-item-subtitle class="text-caption"
                          >{{ courseConfig.zhinan_path || "-" }}
                          </v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                    </v-col>
                  </v-row>

                  <!-- 如果有trace配置，显示trace详情 -->
                  <div v-if="courseConfig.trace" class="mt-4">
                    <v-divider class="mb-3"></v-divider>
                    <h4 class="mb-3">网络trace配置</h4>
                    <v-row>
                      <v-col
                        v-for="(traceConfig, traceName) in courseConfig.trace"
                        :key="traceName"
                        cols="12"
                        md="6"
                      >
                        <v-card variant="outlined" class="mb-2">
                          <v-card-title class="text-subtitle-1 py-2">
                            <v-icon class="mr-2" size="small"
                            >mdi-network
                            </v-icon>
                            {{ traceName }}
                            <v-spacer></v-spacer>
                            <v-chip
                              :color="traceConfig.block ? 'error' : 'success'"
                              size="x-small"
                              variant="flat"
                            >
                              {{
                                traceConfig.block ? "屏蔽性能图" : "公开性能图"
                              }}
                            </v-chip>
                          </v-card-title>
                          <v-card-text class="py-2">
                            <div class="d-flex justify-space-between mb-1">
                              <span class="text-caption">缓冲区:</span>
                              <v-chip
                                size="x-small"
                                variant="tonal"
                                color="info"
                              >
                                {{
                                  traceConfig.buffer_size
                                    ? traceConfig.buffer_size.join(", ")
                                    : "-"
                                }}
                              </v-chip>
                            </div>
                            <div class="d-flex justify-space-between">
                              <span class="text-caption">丢包率:</span>
                              <v-chip
                                size="x-small"
                                variant="tonal"
                                color="warning"
                              >
                                {{
                                  traceConfig.loss_rate
                                    ? traceConfig.loss_rate.join(", ")
                                    : "-"
                                }}
                              </v-chip>
                            </div>
                          </v-card-text>
                        </v-card>
                      </v-col>
                    </v-row>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate size="64"></v-progress-circular>
        <div class="mt-4">加载系统信息中...</div>
      </v-col>
    </v-row>

    <!-- 学生名单弹窗 -->
    <v-dialog v-model="studentListDialog" max-width="600px">
      <v-card>
        <v-card-title class="text-h6">
          <v-icon class="mr-2" color="primary">mdi-account-group</v-icon>
          {{ selectedCourseName }}课程学生名单
        </v-card-title>
        <v-card-text>
          <div class="d-flex align-center mb-3">
            <v-chip color="primary" variant="tonal">
              共 {{ selectedStudentList.length }} 人
            </v-chip>
            <v-spacer></v-spacer>
            <v-text-field
              v-model="studentSearchText"
              label="搜索学生"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              style="max-width: 250px"
            ></v-text-field>
          </div>
          <v-divider class="mb-3"></v-divider>
          <div v-if="filteredStudentList.length > 0" class="student-list">
            <v-chip
              v-for="(student, index) in filteredStudentList"
              :key="student"
              size="small"
              class="mr-1 mb-1"
              variant="outlined"
              color="primary"
            >
              {{ index + 1 }}. {{ student }}
            </v-chip>
          </div>
          <div v-else class="text-center text-grey pa-4">
            <v-icon size="64" color="grey-lighten-1">mdi-account-search</v-icon>
            <div class="mt-2">没有找到匹配的学生</div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="text"
            @click="studentListDialog = false"
          >
            关闭
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card-text>
</template>

<script setup>
import {computed, onMounted, onUnmounted, ref, watch} from "vue";
import {APIS} from "@/config";
import {request} from "@/utility.js";

// 接收父组件传递的激活状态
const props = defineProps({
  isActive: {
    type: Boolean,
    default: false,
  },
});

const loading = ref(false);
const systemInfo = ref({
  system: {},
  config: {},
  process: {},
});
let intervalId = null;

// 学生名单弹窗相关状态
const studentListDialog = ref(false);
const selectedCourseName = ref("");
const selectedStudentList = ref([]);
const studentSearchText = ref("");

const processSortBy = ref([{key: "start_time", order: "asc"}]);

// 进程表格头部定义
const processHeaders = [
  {title: "PID", key: "pid", width: "100px"},
  {title: "进程名", key: "name", width: "120px"},
  {title: "启动时间", key: "start_time", width: "200px"},
  {title: "运行时长", key: "uptime_formatted", width: "120px"},
  {title: "命令行", key: "cmdline", width: "auto"},
];

const getCpuColor = (percent) => {
  if (percent > 80) return "error";
  if (percent > 60) return "warning";
  return "success";
};

const getMemoryColor = (percent) => {
  if (percent > 85) return "error";
  if (percent > 70) return "warning";
  return "success";
};

const getDiskColor = (percent) => {
  if (percent > 90) return "error";
  if (percent > 80) return "warning";
  return "success";
};

const getLogLevelColor = (level) => {
  if (!level) return "default";
  const lowerLevel = level.toLowerCase();
  if (lowerLevel === "error" || lowerLevel === "critical") return "error";
  if (lowerLevel === "warning") return "warning";
  if (lowerLevel === "info") return "success";
  if (lowerLevel === "debug") return "primary";
  return "default";
};

const getUptimeColor = (seconds) => {
  if (seconds > 3600) return "success"; // 超过1小时 - 绿色
  if (seconds > 1800) return "warning"; // 超过30分钟 - 黄色
  return "info"; // 30分钟内 - 蓝色
};

// 计算过滤后的学生列表
const filteredStudentList = computed(() => {
  if (!studentSearchText.value) {
    return selectedStudentList.value;
  }
  return selectedStudentList.value.filter((student) =>
    student.toLowerCase().includes(studentSearchText.value.toLowerCase())
  );
});

// 显示学生名单弹窗
const showStudentList = (courseName, studentList) => {
  selectedCourseName.value = courseName;
  selectedStudentList.value = [...studentList];
  studentSearchText.value = "";
  studentListDialog.value = true;
};

const loadSystemInfo = async () => {
  // loading.value = true; 不设置loading
  try {
    const result = await request(APIS.admin_get_system_info, {
      method: "GET",
    });

    if (result.data) {
      systemInfo.value = result.data;
    }
  } catch (error) {
    console.error("加载系统信息失败:", error);
    // ElMessage.error("加载系统信息失败");
  } finally {
    loading.value = false;
  }
};

const startTimer = () => {
  if (intervalId) {
    clearInterval(intervalId);
  }
  // 每2秒自动刷新一次系统信息
  intervalId = setInterval(() => {
    loadSystemInfo();
  }, 2000);
};

const stopTimer = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

onMounted(() => {
  loadSystemInfo();
  if (props.isActive) {
    startTimer();
  }
  console.log("AdminSystemInfo mounted");
});

onUnmounted(() => {
  stopTimer();
  console.log("AdminSystemInfo unmounted");
});

// 监听激活状态变化
watch(
  () => props.isActive,
  (newValue, oldValue) => {
    console.log(
      "AdminSystemInfo isActive changed:",
      newValue,
      "from:",
      oldValue
    );
    if (newValue) {
      // 标签被激活时，加载数据并启动定时器
      loadSystemInfo();
      startTimer();
    } else {
      // 标签被切换走时，停止定时器
      stopTimer();
    }
  },
  {immediate: false}
);

const getCourseStatus = (startTime, endTime) => {
  if (!startTime || !endTime) {
    return {text: "时间未定", color: "grey"};
  }
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (now < start) {
    return {text: "比赛未开始", color: "warning"};
  } else if (now > end) {
    return {text: "比赛已结束", color: "error"};
  } else {
    return {text: "比赛进行中", color: "success"};
  }
};
</script>

<style scoped>
.cmdline-text {
  font-family: "Courier New", Monaco, monospace;
  font-size: 0.75rem;
  white-space: pre-wrap;
  word-break: break-all;
  overflow-wrap: break-word;
  line-height: 1.3;
}

.student-list {
  max-height: 400px;
  overflow-y: auto;
}

.trace-files-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: flex-start;
}
</style>
