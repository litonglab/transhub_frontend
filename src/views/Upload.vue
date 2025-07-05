<!--课程管理-->
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
  <v-row class="flex-grow-1" style="overflow-y: auto; min-height: 0">
    <v-col>
      <!--  <detail :task_ID="task_id"></detail>-->
      <el-card class="box-card">
        <template #header>
          <div class="card-header">
            <span>使用指南</span>
          </div>
        </template>
        <div style="line-height: 36px" class="text item">
          1. 文件名可由字母、下划线和数字组成。
          <br/>
          2.
          文件名推荐命名为参赛选手的姓名和学号信息：姓名首字母缩写_学号.cc，如：xyz_2021123456.cc。
          <br/>
          3.
          运行结束后，排行榜将更新个人最高分数及对应算法，可在排行榜或历史记录中查看得分和性能图。
          <br/>
          4.
          代码提交后需等待评测运行完成后才能查看结果，等待时间由并发提交的文件数量决定，但最多不超过两小时，超过该时间请与管理员联系。
          <br/>
          5.
          截止时间以服务器接收文件时间为准，页面倒计时为本机时间，仅供参考。截止后不再接受新的提交，已提交的算法将继续运行并更新排行榜。
          <br/>
          6.
          当前课程（比赛）最大可同时提交的文件数量为<b><u>{{ max_active_uploads_per_user }}个</u></b>，处于队列中和运行中的提交数量超出此限制后将无法再继续上传，请等待其完成后再尝试上传。
          <br/>
          7.
          利用漏洞取得的不当成绩视为无效，打榜结束后，将对每个同学的最终代码进行审查。
          <br/>
          8. 如需切换课程（比赛），请退出登录后再重新选择相应课程（比赛）登录。
          <br/>
        </div>
        <el-upload
          class="upload-demo"
          action=""
          drag
          :http-request="uploadFile"
          :on-preview="handlePreview"
          :on-remove="handleRemove"
          :before-remove="beforeRemove"
          :multiple="false"
          :on-exceed="handleExceed"
          :on-change="handleChange"
          :data="{ url: upload.url }"
          :on-success="handleSuccess"
          :file-list="fileList"
          :accept="'.cc,.c,.cxx,.cpp,.c++'"
          :disabled="upload_loading"
        >
          <el-icon class="el-icon--upload" style="height: 0">
            <upload-filled/>
          </el-icon>
          <div class="el-upload__text"></div>
          <el-button
            plain
            link
            type="primary"
            :disabled="upload_loading"
            :loading="upload_loading"
          >
            将代码文件拖入此处或点击上传
          </el-button>
          <br/>
          <el-text class="mx-1" type="info"
          >竞赛时间：{{ time_range_str }}
          </el-text>
          <template #tip>
            <div class="el-upload__tip">代码文件以“算法名称.cc”的格式命名</div>
          </template>
        </el-upload>
        <div class="countdown-timer-card">
          <span class="countdown-timer">剩余：{{ countdownDisplay }}</span>
        </div>
      </el-card>
    </v-col>
  </v-row>
</template>

<script setup>
import {onMounted, onUnmounted, ref} from "vue";
import {ElMessage, ElMessageBox} from "element-plus";
import {APIS} from "@/config";
import {request} from "@/utility.js";
import {useRouter} from "vue-router";
import {UploadFilled} from "@element-plus/icons-vue";

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
  } catch (error) {
    time_range_str.value = "加载失败，请稍后再试";
  }
});
onUnmounted(() => {
  if (timer) clearInterval(timer);
});

const uploadFile = async ({file}) => {
  const formData = new FormData();
  formData.append("file", file);
  try {
    upload_loading.value = true;
    let result = await request(
      APIS.upload,
      {body: formData, isFormData: true},
      {showError: false}
    );
    let message = result["message"];
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
    console.log(error);
    await ElMessageBox.alert(
      error.message || "请检查文件格式或网络连接",
      "上传失败",
      {
        confirmButtonText: "确定",
        type: "error",
        center: true,
      }
    );
  }
  upload_loading.value = false;
};

const handlePreview = (file) => {
  console.log("Preview:", file);
};

const handleRemove = (file, fileList) => {
  console.log("Remove:", file, fileList);
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
  console.log("Success:", response, file, fileList);
};
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 20px;
}

.text {
  font-size: 14px;
}

.item {
  margin-bottom: 0;
  margin-top: 10px;
}

.box-card {
  position: relative;
  left: 0;
  right: 0;
  margin: 1px 0;
  padding-bottom: 10px;
}

.countdown-timer-card {
  position: absolute;
  right: 38px;
  bottom: 18px;
  z-index: 2;
  pointer-events: none;
}

.countdown-timer {
  font-size: 20px;
  font-weight: bold;
  color: #ff4d4f;
  background: #fff7e6;
  border-radius: 8px;
  padding: 6px 18px;
  box-shadow: 0 2px 8px rgba(255, 77, 79, 0.08);
  margin-left: 10px;
  margin-right: 10px;
  letter-spacing: 1px;
  transition: color 0.5s;
  min-width: 200px;
  white-space: nowrap;
  display: inline-block;
}

.countdown-timer:before {
  content: "\23F1  ";
  font-size: 18px;
}

/* 移动端样式优化 */
@media screen and (max-width: 960px) {
  .countdown-timer-card {
    position: relative;
    right: auto;
    bottom: auto;
    text-align: center;
    margin-top: 20px;
    margin-bottom: 10px;
  }

  .countdown-timer {
    font-size: 16px;
    padding: 4px 12px;
    margin: 0 auto;
  }
}
</style>
