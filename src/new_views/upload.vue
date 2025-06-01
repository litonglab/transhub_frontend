<!--课程管理-->
<template>
  <el-row>
    <div class="text-h4 pa-10">算法提交</div>
  </el-row>
  <!--  <detail :task_ID="task_id"></detail>-->
  <el-card class="box-card">
    <template #header>
      <div class="card-header">
        <span>使用指南</span>
      </div>
    </template>
    <div style="line-height: 40px" class="text item">
      1. 文件名仅可由字母、下划线、数字组成，且必须以字母开头。
      <br />
      2.
      文件名必须包含参赛选手的学号信息，否则成绩无效，建议命名为：姓名首字母缩写_学号.cc，如：xyz_2021123456.cc，每次提交请保持文件名一致。
      <br />
      3. 运行结束后，在排行榜或个人中心中查看得分和性能图。
      <br />
      4.
      排行榜展示的是个人最新提交的算法，所以烦请各位参赛者务必保存好自己各个版本的代码，以便最后提交得分最高的算法。
      <br />
      5.
      文件提交后需等待运行完成后才能查看结果，等待时间因并发提交的文件数量不同而不同，但最多不会超过三小时，超过该时间请与工作人员联系.
      <br />
    </div>
    <el-upload
      class="upload-demo"
      action=""
      :http-request="uploadFile"
      :on-preview="handlePreview"
      :on-remove="handleRemove"
      :before-remove="beforeRemove"
      :multiple="false"
      :on-exceed="handleExceed"
      :on-change="handleChange"
      :data="{ url: upload.url, user_id: upload.user_id }"
      :on-success="handleSuccess"
      :file-list="fileList"
      :accept="'.cc,.c,.cxx,.cpp,.c++,.h,.hpp,.hxx,.h++'"
    >
      <el-button size="large" type="success">点击上传</el-button>
      <div slot="tip" class="el-upload__tip">
        &nbsp;&nbsp;&nbsp;代码文件以“算法名称.cc”的格式命名
      </div>
    </el-upload>
    <div class="countdown-timer-card">
      <span class="countdown-timer"
        >剩余：{{ countdownDisplay }}</span
      >
    </div>
  </el-card>
  <el-card class="box-card" style="margin-top: 20px;margin-bottom: 20px;">
    <div style="line-height: 40px" class="text item">
      截止时间：6月2日21:00，截止后将不再接受新的提交，已提交的算法将继续运行并更新排行榜，最终成绩以最后一次运行结果为准。
      <br />
      鼓励同学们寻找平台的漏洞和不足，提出宝贵意见和建议，帮助我们改进平台。
      <br />
      有意利用漏洞取得的不当成绩视为无效，打榜结束后，将对每个同学的最终代码进行审查。
    </div>
  </el-card>
</template>

<script setup>
import { ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { APIS } from "@/config";
import { useAppStore } from "@/store/app.js";
import { onMounted, onUnmounted } from "vue";
import { request } from "@/utility.js";
const store = useAppStore();
const fileList = ref([]);
const upload = ref({
  url: APIS.upload,
  user_id: useAppStore().user_id,
});

const countdownDisplay = ref("");
const deadline = new Date("2025-06-02T21:00:00+08:00");
let timer = null;

function updateCountdown() {
  const now = new Date();
  let diff = deadline - now;
  if (diff < 0) diff = 0;
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

onMounted(() => {
  updateCountdown();
  timer = setInterval(updateCountdown, 1000);
});
onUnmounted(() => {
  if (timer) clearInterval(timer);
});

const uploadFile = async ({ file }) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("user_id", store.user_id);
  formData.append("cname", store.cname);
  try {
    await request(APIS.upload, { body: formData, isFormData: true }, {showError: false});
    ElMessage.success({
      message: "上传成功",
      duration: 5000,
      center: true,
    });
  } catch (error) {
    ElMessageBox.alert(
      error.message || "请检查文件格式或网络连接",
      "上传失败",
      {
        confirmButtonText: "确定",
        type: "error",
        center: true,
      }
    );
  }
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
  margin-bottom: 0px;
  margin-top: 10px;
}

.box-card {
  position: relative;
  left: 0;
  right: 0;
  margin: auto;
  width: 880px;
}

.countdown-timer-card {
  position: absolute;
  right: 32px;
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
  margin-left: 20px;
  margin-right: 20px;
  letter-spacing: 1px;
  transition: color 0.3s;
  min-width: 200px;
}
.countdown-timer:before {
  content: "\23F1  ";
  font-size: 18px;
}
</style>
