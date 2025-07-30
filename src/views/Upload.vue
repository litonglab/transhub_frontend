<!--算法提交-->
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
        <span class="text-h4">算法提交</span>
      </div>
    </v-col>
  </v-row>

  <!-- Scrollable Content -->
  <v-row class="flex-grow-1" style="overflow-y: auto; margin-top: 0">
    <v-col>
      <!-- 快速操作卡片 -->
      <v-card class="mb-4" elevation="2">
        <v-card-title class="card-title">
          <v-icon class="title-icon">mdi-information-outline</v-icon>
          快速开始
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="4">
              <div class="quick-info">
                <v-icon color="info" size="24">mdi-clock-outline</v-icon>
                <div class="info-content">
                  <div class="info-title">评测时间</div>
                  <div class="info-desc">{{ time_range_str }}</div>
                </div>
              </div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="quick-info">
                <v-icon color="warning" size="24">mdi-account-multiple</v-icon>
                <div class="info-content">
                  <div class="info-title">并发限制</div>
                  <div class="info-desc">
                    最多 {{ max_active_uploads_per_user }} 个文件
                  </div>
                </div>
              </div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="quick-info">
                <v-icon color="success" size="24">mdi-check-circle</v-icon>
                <div class="info-content">
                  <div class="info-title">支持格式</div>
                  <div class="info-desc">.cc</div>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- 使用指南折叠面板 -->
      <v-expansion-panels class="mt-4" variant="accordion">
        <v-expansion-panel>
          <v-expansion-panel-title class="v-card-title card-title">
            <v-card-title class="card-title mb-2" style="padding: 0 !important">
              <v-icon class="title-icon">mdi-help-circle-outline</v-icon>
              详细使用指南
            </v-card-title>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <div class="guide-content">
              <div v-for="item in guideItems" :key="item.id" class="guide-item">
                <v-icon color="primary" class="guide-icon"
                >{{ item.icon }}
                </v-icon>
                <div class="guide-text">
                  <strong>{{ item.title }}：</strong>
                  <span>{{ item.content }}</span>
                  <ul v-if="item.subItems" class="guide-sublist">
                    <li v-for="subItem in item.subItems" :key="subItem">
                      {{ subItem }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <!-- 主要内容卡片 -->
      <v-card elevation="3" class="main-card">
        <!-- 评测用例选择 -->
        <v-card-title class="card-title">
          <v-icon class="title-icon">mdi-playlist-check</v-icon>
          选择评测用例
        </v-card-title>
        <v-card-text class="pb-0">
          <v-alert
            type="info"
            variant="tonal"
            icon="mdi-lightbulb-outline"
            class="mb-2"
          >
            <template v-slot:text>
              <div class="alert-content">
                选择少量用例可缩短评测时间，建议初期开发时选择公开用例快速测试，完善后再选择全部用例进行完整评测。
                <br><small class="text-medium-emphasis">* 标记的用例为非公开用例</small>
              </div>
            </template>
          </v-alert>
          <div>
            <v-chip-group
              v-if="traceCases.length > 0"
              v-model="selectedCases"
              multiple
              class="case-chips"
              mandatory
              column
            >
              <v-chip
                v-for="item in traceCases"
                :key="item.trace_name"
                :value="item.trace_name"
                filter
                variant="outlined"
                color="primary"
                class="case-chip"
              >
                {{ item.trace_name }}{{ item.is_blocked ? ' *' : '' }}
              </v-chip>
            </v-chip-group>
            <v-alert
              v-else
              type="warning"
              variant="tonal"
              icon="mdi-alert-circle-outline"
              class="mt-2"
            >
              <template v-slot:text>
                <div class="alert-content">
                  当前没有可用的评测用例，请稍后再试或联系管理员。
                </div>
              </template>
            </v-alert>
          </div>
        </v-card-text>

        <!-- 文件上传区域 -->
        <v-card-title class="card-title">
          <v-icon class="title-icon">mdi-file-upload</v-icon>
          上传代码文件
        </v-card-title>
        <v-card-text>
          <div class="upload-container">
            <el-upload
              class="upload-demo"
              action=""
              drag
              :http-request="uploadFile"
              :on-preview="handlePreview"
              :on-remove="handleRemove"
              :before-remove="beforeRemove"
              :multiple="store.is_admin"
              :on-exceed="handleExceed"
              :on-change="handleChange"
              :data="{ url: upload.url }"
              :on-success="handleSuccess"
              :file-list="fileList"
              :accept="'.cc,.c,.cxx,.cpp,.c++'"
              :disabled="upload_loading"
            >
              <div>
                <!-- 倒计时显示 -->
                <div class="countdown-timer-card">
                  <span class="countdown-timer"
                  >剩余：{{ countdownDisplay }}</span
                  >
                </div>
                <v-icon size="48" color="primary" class="upload-icon"
                >mdi-cloud-upload
                </v-icon>
                <div class="upload-text">
                  <el-button
                    plain
                    link
                    type="primary"
                    :disabled="upload_loading"
                    :loading="upload_loading"
                    size="large"
                  >
                    将代码文件拖入此处或点击上传
                  </el-button>
                </div>
                <div class="upload-hint" v-if="store.is_admin">
                  <v-icon color="warning" size="20">mdi-shield-crown</v-icon>
                  <span class="info-label">管理员权限：</span>
                  <span>支持批量上传且不受时间和数量限制</span>
                </div>
              </div>
            </el-upload>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import {onMounted, onUnmounted, ref, watch} from "vue";
import {ElMessage, ElMessageBox} from "element-plus";
import {APIS} from "@/config";
import {request} from "@/utility.js";
import {useRouter} from "vue-router";
import {useAppStore} from "@/store/app";

const store = useAppStore();

const router = useRouter();
const fileList = ref([]);
const upload = ref({
  url: APIS.upload,
});
let upload_loading = ref(false);
let max_active_uploads_per_user = ref(0); // 最大同时上传数量

const countdownDisplay = ref("");
const deadline = ref(new Date("2025-01-01T21:00:00+08:00"));
let time_range_str = ref("加载中...");
let timer = null;
// 评测用例相关
const traceCases = ref([]);
const selectedCases = ref([]);

// 记忆功能：保存和恢复评测用例选择
const SELECTED_CASES_KEY = "transhub_selected_cases";

// 使用指南内容
const guideItems = ref([
  {
    id: 1,
    icon: "mdi-numeric-1-circle",
    title: "文件命名",
    content:
      "文件名可由字母、下划线和数字组成，推荐格式：姓名首字母缩写_学号.cc",
  },
  {
    id: 2,
    icon: "mdi-numeric-2-circle",
    title: "结果查看",
    content:
      "运行结束后，排行榜将更新个人最高分数及对应算法，可在排行榜或历史记录中查看得分和性能图",
  },
  {
    id: 3,
    icon: "mdi-numeric-3-circle",
    title: "等待时间",
    content:
      "代码提交后需等待评测运行完成，等待时间由并发提交数量决定，一般最多不超过两小时",
  },
  {
    id: 4,
    icon: "mdi-numeric-4-circle",
    title: "截止时间",
    content:
      "以服务器接收文件时间为准，页面倒计时为本机时间，仅供参考，截止后不再接受新提交，已提交的代码仍会继续评测",
  },
  {
    id: 5,
    icon: "mdi-numeric-5-circle",
    title: "并发限制",
    content:
      "处于队列中或运行中的提交数量超过并发提交限制后，需等待其完成后才能再次提交",
  },
  {
    id: 6,
    icon: "mdi-numeric-6-circle",
    title: "代码审查",
    content: "利用漏洞取得的不当成绩视为无效，提交结束后将对最终代码进行审查",
  },
  {
    id: 7,
    icon: "mdi-numeric-7-circle",
    title: "课程切换",
    content: "如需切换课程（比赛），请退出登录后重新选择相应课程登录",
  },
  {
    id: 8,
    icon: "mdi-numeric-8-circle",
    title: "用例选择建议",
    content:
      "在上传代码前，请选择要使用的评测用例。选择少量用例，可以缩短评测时间，并减轻系统负载。即使上传时未选择所有用例，后续仍可在任务详情页手动执行其他用例的评测",
    subItems: [
      "开发初期：选择少量用例（特别是公开用例）进行快速测试",
      "针对性优化：在某些特定用例上表现不佳，对其进行单独评测",
      "完整测试：算法开发已基本完成，选择全部用例进行全面测试以更新榜单数据",
    ],
  },
]);

// 监听选择变化，自动保存
watch(selectedCases, (val) => {
  localStorage.setItem(SELECTED_CASES_KEY, JSON.stringify(val));
}, {deep: true});

function updateCountdown() {
  const now = new Date();
  let diff = deadline.value - now;
  if (diff <= 0) {
    countdownDisplay.value = "提交已截止";
    if (timer) clearInterval(timer);
    return;
  }
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  const days = Math.floor(hours / 24);
  const showHours = hours % 24;
  countdownDisplay.value = `${days > 0 ? days + "天" : ""}${showHours
    .toString()
    .padStart(2, "0")}小时${minutes.toString().padStart(2, "0")}分${seconds
    .toString()
    .padStart(2, "0")}秒`;
}

onMounted(async () => {
  try {
    const result = await request(APIS.get_competition_info, {
      method: "GET",
    });
    // 返回的是时间戳
    deadline.value = new Date(result["data"]['time_stmp'][1] * 1000);
    let start_time = new Date(result["data"]['time_stmp'][0] * 1000);
    max_active_uploads_per_user.value = result["data"]['max_active_uploads_per_user'];
    time_range_str.value = `${start_time.toLocaleString()}～${deadline.value.toLocaleString()}`;
    updateCountdown();
    timer = setInterval(updateCountdown, 1000);

    // 获取评测用例列表（对象数组）
    const traceRes = await request(APIS.get_trace_list, {method: "GET"});

    traceCases.value = traceRes.trace_list;
    // 先按is_blocked排序，公开用例在前，然后按trace_name排序
    traceCases.value.sort((a, b) => {
      if (a.is_blocked && !b.is_blocked) return 1;
      if (!a.is_blocked && b.is_blocked) return -1;
      return a.trace_name.localeCompare(b.trace_name);
    });
    // 请求成功后再读取localStorage并过滤
    const saved = localStorage.getItem(SELECTED_CASES_KEY);
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        // 从对象数组中提取trace_name进行过滤
        const availableTraceNames = traceCases.value.map(item => item.trace_name);
        selectedCases.value = Array.isArray(arr) ? arr.filter(val => availableTraceNames.includes(val)) : [];
      } catch {
        selectedCases.value = [];
      }
    }
  } catch (error) {
    time_range_str.value = "加载失败，请稍后再试";
    traceCases.value = [];
  }
});
onUnmounted(() => {
  if (timer) clearInterval(timer);
});

const uploadFile = async ({file}) => {
  const formData = new FormData();
  formData.append("file", file);
  // 判断用例是否为空
  if (selectedCases.value.length === 0) {
    ElMessage.error("请至少选择一个评测用例");
    return;
  }
  // 发送选中的评测用例
  if (Array.isArray(selectedCases.value)) {
    // 以JSON字符串形式发送，后端可按需解析
    formData.append("trace_list", JSON.stringify(selectedCases.value));
  }
  try {
    upload_loading.value = true;
    let result = await request(
      APIS.upload,
      {body: formData, isFormData: true},
      {showError: false}
    );
    let message = `${file.name}: ${result["message"]}`;
    let title = "上传成功";
    if (result["enqueue_summary"]["failed_enqueues"] !== 0) {
      title = "上传成功，部分任务未入队";
      message = result["message"];
      message += `<br/>任务列表：${result["tasks"]}`;
      message += `<br/>未入队的任务列表：${result["enqueue_summary"]["failed_tasks"]}`;
      message += `<br/>请将以上信息反馈给管理员，谢谢。`;
    }

    ElMessageBox({
      title: title,
      message: message,
      showClose: true,
      dangerouslyUseHTMLString: true,
      closeOnClickModal: false,
      closeOnPressEscape: false,
      distinguishCancelAndClose: true,
      showCancelButton: true,
      showConfirmButton: true,
      type: "success",
      center: true,
      confirmButtonText: "查看任务状态",
      cancelButtonText: "继续上传",
    })
      .then((action) => {
        if (action === "confirm") {
          // 跳转到任务状态页面
          router.push({
            name: "Detail",
            params: {upload_id: result.upload_id},
          });
        }
      })
      .catch(() => {
        // 用户点击取消或关闭弹窗
      });
  } catch (error) {
    console.error(error);
    let msg = error.message || "上传失败，请稍后再试";
    if (store.is_admin) {
      msg = `${file.name}: ${msg}`;
    }
    await ElMessageBox.alert(msg, "上传失败", {
      confirmButtonText: "确定",
      type: "error",
      center: true,
    });
  }
  upload_loading.value = false;
};

const handlePreview = (file) => {
  console.debug("Preview:", file);
};

const handleRemove = (file, fileList) => {
  console.debug("Remove:", file, fileList);
};

const beforeRemove = (file, fileList) => {
  return new Promise((resolve, reject) => {
    if (window.confirm(`确定要移除 ${file.name}?`)) {
      resolve();
    } else {
      reject();
    }
  });
};

const handleExceed = (files, fileList) => {
  ElMessage.warning(
    `当前限制选择 1 个文件，本次选择了 ${files.length} 个文件，共选择了 ${
      files.length + fileList.length
    } 个文件`
  );
};

const handleChange = (file, fileList) => {
  if (fileList.length > 1) {
    fileList.splice(0, 1);
  }
};

const handleSuccess = (response, file, fileList) => {
  console.debug("Success:", response, file, fileList);
};
</script>

<style scoped>
/* 卡片标题样式 */
.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  padding: 16px 16px 8px 16px !important;
}

.title-icon {
  opacity: 0.8;
}

/* 快速信息样式 */
.quick-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  background: #e7f2fe;
  transition: all 0.3s ease;
}

.quick-info:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.info-content {
  flex: 1;
}

.info-title {
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 4px;
}

.info-desc {
  font-size: 0.75rem;
}

/* 主卡片样式 */
.main-card {
  margin-top: 15px;
  border-radius: 3px !important;
  overflow: hidden;
}


.case-chips {
  gap: 8px !important;
  flex-wrap: wrap !important;
  display: flex !important;
  align-items: flex-start !important;
}

.case-chip {
  margin: 4px !important;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

/* 确保Vuetify chip group内部也能换行 */
:deep(.v-chip-group) {
  flex-wrap: wrap !important;
  display: flex !important;
}

:deep(.v-chip-group .v-slide-group__content) {
  flex-wrap: wrap !important;
  gap: 8px !important;
  display: flex !important;
  width: 100% !important;
}

:deep(.v-chip-group .v-slide-group__container) {
  overflow: visible !important;
}

:deep(.v-chip-group .v-slide-group) {
  overflow: visible !important;
}

/* 上传区域样式 */
.upload-container {
  margin-top: 16px;
}

.upload-icon {
  margin-bottom: 16px;
  opacity: 0.6;
}

.upload-text {
  margin-bottom: 12px;
}

.upload-hint {
  font-size: 0.875rem;
  margin-top: 8px;
}

.info-label {
  font-weight: 500;
}

/* 指南样式 */
.guide-content {
  padding: 8px 0;
}

.guide-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 0;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.guide-item:hover {
  background: #e7f2fe;
}

.guide-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.guide-text {
  flex: 1;
  line-height: 1.5;
  font-size: 0.875rem;
}

.guide-sublist {
  margin: 8px 0 0 16px;
  padding-left: 0;
}

.guide-sublist li {
  margin-bottom: 4px;
}

/* Element Plus 上传组件样式覆盖 */
:deep(.el-upload-dragger) {
  border: 2px dashed rgb(var(--v-theme-primary)) !important;
  border-radius: 12px !important;
  background: rgba(var(--v-theme-primary), 0.04) !important;
  transition: all 0.3s ease !important;
}

:deep(.el-upload-dragger:hover) {
  border-color: rgb(var(--v-theme-primary)) !important;
  background: rgba(var(--v-theme-primary), 0.08) !important;
}

:deep(.el-upload-dragger.is-dragover) {
  border-color: rgb(var(--v-theme-primary)) !important;
  background: rgba(var(--v-theme-primary), 0.12) !important;
}

/* Alert 样式优化 */
.alert-content {
  font-size: 0.9rem;
  line-height: 1.5;
}

/* 倒计时样式 */
.countdown-timer-card {
  display: flex;
  justify-content: center;
}

.countdown-timer {
  font-size: 20px;
  font-weight: bold;
  color: #ff4d4f;
  background: #fff7e6;
  border-radius: 8px;
  padding: 8px 20px;
  box-shadow: 0 2px 8px rgba(255, 77, 79, 0.08);
  letter-spacing: 1px;
  transition: color 0.5s;
  min-width: 200px;
  white-space: nowrap;
  display: inline-block;
  text-align: center;
  border: 1px solid rgba(255, 77, 79, 0.2);
}

.countdown-timer:before {
  content: "⏱️ ";
  font-size: 18px;
  margin-right: 4px;
}

/* 响应式设计 */
@media (max-width: 960px) {
  .quick-info {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }

  .case-chips {
    justify-content: center;
    flex-wrap: wrap !important;
  }
}

@media (max-width: 600px) {
  .upload-icon {
    font-size: 36px !important;
  }

  .countdown-timer {
    font-size: 16px;
    padding: 6px 16px;
    min-width: auto;
  }
}
</style>
