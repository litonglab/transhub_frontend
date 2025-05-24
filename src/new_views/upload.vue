<!--课程管理-->
<template>
  <el-row>
    <div class="text-h4 pa-10">
      算法提交
    </div>
  </el-row>
<!--  <detail :task_ID="task_id"></detail>-->
  <el-card class="box-card">
    <template #header>
      <div class="card-header">
        <span>使用指南</span>
      </div>
    </template>
    <div style="line-height:40px" class="text item">
      1. 文件名仅可由字母、下划线、数字组成，且必须以字母开头。
      <br/>
      2. 文件名必须包含参赛选手的学号信息，否则成绩无效，建议命名为：姓名首字母缩写_学号.cc，如：xyz_2021123456.cc，每次提交请保持文件名一致。
      <br/>
      3. 运行结束后，在排行榜或个人中心中查看得分和性能图。
      <br/>
      4. 排行榜展示的是个人最新提交的算法，所以烦请各位参赛者务必保存好自己各个版本的代码，以便最后提交得分最高的算法。
      <br/>
      5. 文件提交后需等待运行完成后才能查看结果，等待时间因并发提交的文件数量不同而不同，但最多不会超过三小时，超过该时间请与工作人员联系.
      <br/>
    </div>
    <el-upload
      class="upload-demo"
      action=""
      :http-request="uploadFile"
      :on-preview="handlePreview"
      :on-remove="handleRemove"
      :before-remove="beforeRemove"
      multiple
      :limit="1"
      :on-exceed="handleExceed"
      :data="{url:upload.url,user_id:upload.user_id}"
      :on-success="handleSuccess"
      :file-list="fileList">
      <el-button size="large" type="success">点击上传</el-button>
      <div slot="tip" class="el-upload__tip">&nbsp;&nbsp;&nbsp;代码文件以“算法名称.cc”的格式命名</div>
    </el-upload>

  </el-card>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { APIS } from '@/config';
import { useAppStore } from "@/store/app.js";
const store = useAppStore();
const fileList = ref([]);
const upload = ref({
  url: APIS.upload,
  user_id: useAppStore().user_id
});

const uploadFile = async ({ file }) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('user_id', store.user_id);
  formData.append('cname',store.cname);
  try {
    const res = await fetch(APIS.upload, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    const data = await res.json();
    if (data.code === 200) {
      ElMessage.success('上传成功');
    } else {
      ElMessage.error(data.message);
    }
  } catch (error) {
    ElMessage.error('上传失败');
  }
};

const handlePreview = (file) => {
  console.log('Preview:', file);
};

const handleRemove = (file, fileList) => {
  console.log('Remove:', file, fileList);
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
  ElMessage.warning(`当前限制选择 1 个文件，本次选择了 ${files.length} 个文件，共选择了 ${files.length + fileList.length} 个文件`);
};

const handleSuccess = (response, file, fileList) => {
  console.log('Success:', response, file, fileList);
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
  position: absolute;
  left: 0;
  right:0;
  margin: auto;
  width: 880px;
}
</style>

