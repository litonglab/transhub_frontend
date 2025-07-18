<template>
  <v-app class="bg-container">
    <v-app-bar flat elevation="2" color="error">
      <v-app-bar-title>
        Transhub：中国人民大学“一人一栈”打榜平台
      </v-app-bar-title>
      <!-- litonglab超链接图标 -->
      <a
        href="https://www.litonglab.com/"
        target="_blank"
        rel="noopener noreferrer"
        class="header-logo-link"
      >
        <img
          src="@/assets/litonglab-logo-long.png"
          class="header-logo"
          alt="LitongLab Logo"
        />
      </a>
    </v-app-bar>

    <v-container class="fill-height main-container">
      <v-row justify="center" align="center" dense>
        <v-col cols="12" md="6" class="mobile-col">
          <v-card elevation="4" class="pa-6 frosted-card mobile-card">
            <v-card-title class="text-h6 font-weight-medium mb-4"
            >平台介绍
            </v-card-title>
            <v-card-text
              class="text-body-1 text-dark mobile-text-content"
              style="line-height: 1.8"
            >
              <div>
                用户态协议框架Transhub基于UDP协议进行实现，提供传输协议基本的功能模块，如序号、包类型、确认机制等，并提供如发送、接收等预制的接口API。
                同学们需要在该框架上，修改controller.cc代码中的内容，实现一个拥塞控制算法，尽可能地提高网络性能。平台通过模拟真实的动态变化网络环境，
                针对P95排队时延和平均吞吐量两个指标，对参赛者提供的拥塞控制算法进行评估，并打出综合评分。
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col class="mobile-col">
          <v-sheet class="my-login frosted-card mobile-login-card">
            <v-form validate-on="submit" @submit.prevent="login">
              <v-text-field
                v-model="userId"
                label="账户"
                :rules="userIdRules"
                autocomplete="username"
              ></v-text-field>
              <v-text-field
                v-model="password"
                label="密码"
                :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                :rules="passwordRules"
                :type="showPassword ? 'text' : 'password'"
                counter
                autocomplete="current-password"
                @click:append-inner="showPassword = !showPassword"
              ></v-text-field>

              <v-select
                v-model="cname"
                :items="pantheons"
                label="请选择课程"
                required
              >
              </v-select>

              <!-- 登录和注册按钮设置 -->
              <div class="d-flex justify-center">
                <v-btn
                  type="submit"
                  style="width: 80%"
                  color="error"
                  class="mb-4"
                >登录
                </v-btn>
              </div>

              <div class="d-flex justify-center">
                <v-btn
                  style="width: 80%"
                  color="error"
                  class="mb-4"
                  @click="dialogVisible = true"
                >注册
                </v-btn>
              </div>

              <v-alert class="mt-2" v-if="showAlert" type="error">
                {{ statement }}
              </v-alert>
            </v-form>
          </v-sheet>
        </v-col>
      </v-row>
      <v-dialog v-model="dialogVisible" max-width="600px">
        <v-card>
          <v-card-title>注册</v-card-title>
          <v-card-text>
            <v-form validate-on="submit" @submit.prevent="register">
              <v-text-field
                v-model="userId"
                label="账户"
                :rules="userIdRules"
                autocomplete="username"
              ></v-text-field>
              <v-text-field
                v-model="password"
                label="密码"
                :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                :rules="passwordRules"
                :type="showPassword ? 'text' : 'password'"
                counter
                autocomplete="new-password"
                @click:append-inner="showPassword = !showPassword"
              ></v-text-field>
              <v-text-field
                v-model="Name"
                label="真实姓名"
                :rules="NameRules"
                autocomplete="name"
              ></v-text-field>
              <v-text-field
                v-model="sno"
                label="学号"
                :rules="snoRules"
                autocomplete="off"
              ></v-text-field>
              <v-btn type="submit" class="mb-6" block>提交</v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-dialog>
    </v-container>
  </v-app>
</template>

<script setup>
import {onMounted, ref} from "vue";
import {useAppStore} from "@/store/app.js";
import {useRouter} from "vue-router";
import {ElMessage, ElMessageBox} from "element-plus";
import {APIS} from "@/config";
import {request} from "@/utility.js";

const router = useRouter();
const pantheons = ref([]);
const store = useAppStore();

let userId = ref("");
const userIdRules = [
  (value) => {
    if (value?.length === 0) return "用户名不能为空";
    if (value?.length < 4 || value?.length > 16) return "用户名应为4-16字符";
    return true;
  },
];
let password = ref("");
const passwordRules = [
  (value) => {
    if (value?.length < 6) return "密码不能小于6位";
    return true;
  },
];
let Name = ref("");
const NameRules = [
  (value) => {
    if (value?.length === 0) return "姓名不能为空";
    if (value?.length > 10) return "姓名超过长度，请检查输入是否正确";
    return true;
  },
];
let sno = ref("");
const snoRules = [
  (value) => {
    if (value?.length === 0) return "学号不能为空";
    if (value?.length < 10 || value?.length > 10)
      return "学号格式有误，请检查输入是否正确";
    return true;
  },
];
const cname = ref("");

const showPassword = ref(false);

let showAlert = ref(false);
let statement = ref("");
let dialogVisible = ref(false);

const countdown = ref(60);
let timer = null;

const openCountdownBox = (msg) => {
  countdown.value = 15; // 重置倒计时为15秒
  ElMessageBox({
    title: "提示",
    message: () => `登录中...`,
    showClose: false,
    closeOnClickModal: false,
    closeOnPressEscape: false,
    distinguishCancelAndClose: true,
    showCancelButton: false,
    showConfirmButton: false,
    type: "info",
    center: true,
    beforeClose: (action, instance, done) => {
      // 倒计时未结束时禁止关闭
      if (countdown.value > 0) return;
      done();
    },
  });

  timer = setInterval(() => {
    countdown.value--;
    // 通过ElMessageBox实例更新内容
    document.querySelector(
      ".el-message-box__message"
    ).innerText = `${msg}\n请等待 ${countdown.value} 秒...`;
    if (countdown.value <= 0) {
      clearInterval(timer);
      // 允许关闭，显示按钮
      ElMessageBox.close();
    }
  }, 1000);
};

async function register() {
  const formData = new FormData();
  formData.append("username", userId.value);
  formData.append("password", password.value);
  formData.append("real_name", Name.value);
  formData.append("sno", sno.value);
  try {
    await request(APIS.register, {
      body: formData,
      headers: {},
      isFormData: true,
    });
    ElMessage({type: "success", message: "注册成功！请返回登录页面"});
    dialogVisible.value = false;
  } catch (error) {
  }
}

async function login() {
  let data = {
    username: userId.value,
    password: password.value,
    cname: cname.value,
  };
  try {
    const result = await request(APIS.login, {body: JSON.stringify(data)});
    if (result.code === 200) {
      store.set_name(data.username);
      await router.push({name: "help"});
    } else if (result.code === 201) {
      // 使用ElMessageBox弹出一个对话框，并显示一个60秒的倒计时，倒计时结束前，不能关闭对话框
      openCountdownBox(result.message);
    } else {
      ElMessage({type: "error", message: "登录过程发生未知错误，请稍后再试"});
    }
  } catch (error) {
  }
}

onMounted(async () => {
  try {
    const result = await request(APIS.get_pantheon, {
      method: "GET",
    });
    pantheons.value = result["pantheon"] || [];
  } catch (error) {
    pantheons.value = [];
  }

  if (pantheons.value.length > 0) {
    cname.value = pantheons.value[0]; // 默认选择第一个课程
  } else {
    cname.value = "未加载到课程信息，请稍后再试";
  }
});
</script>

<style scoped>
.my-login {
  margin-right: auto !important;
  margin-left: auto !important;
  position: relative;
  top: 30%;
}

.bg-container {
  background: url("@/assets/ruc_background.jpg") center/cover no-repeat;
}

/* 主页背景照片*/

.main-container {
  padding-top: 80px; /* 为header留出空间 */
}


.frosted-card {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(15px); /* 关键：模糊背景 */
  -webkit-backdrop-filter: blur(10px); /* 兼容 Safari */
  border-radius: 16px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5); /* 可选美化阴影 */
  border: 1px solid rgba(255, 255, 255, 0.3); /* 可选边框美化 */
}

/* Header logo 样式 */
.header-logo-link {
  display: flex;
  align-items: center;
  text-decoration: none;
  margin-left: auto;
  height: 100%;
  padding: 0 12px;
}

.header-logo {
  object-fit: contain;
  height: 60%;
  width: auto;
  max-height: none;
}

/* 移动端适配 */
.mobile-card {
  height: 350px; /* 桌面端保持固定高度 */
}

.mobile-login-card {
  height: 350px;
  width: 300px;
}

.mobile-text-content {
  max-height: 250px; /* 限制文本区域最大高度 */
  overflow-y: auto; /* 允许垂直滚动 */
  -webkit-overflow-scrolling: touch; /* iOS 平滑滚动 */
}

/* 移动设备适配 */
@media (max-width: 960px) {
  /* 960px only used in this login page, to make login card width the same as content card. */
  .main-container {
    padding-top: 100px !important; /* 移动端增加更多顶部间距 */
    padding-bottom: 20px; /* 底部留出空间 */
  }

  .header-logo-link {
    padding: 0 8px;
    height: 100%;
  }

  .header-logo {
    height: 60%;
    max-height: none;
  }

  .mobile-col {
    flex: 0 0 100% !important;
    max-width: 100% !important;
    margin-bottom: 16px;
  }

  .mobile-card {
    height: auto; /* 移动端使用自适应高度 */
    min-height: 300px; /* 设置最小高度 */
    max-height: 65vh; /* 稍微减少最大高度以避免遮挡 */
    width: 100% !important; /* 移动端宽度100% */
  }

  .mobile-login-card {
    height: auto !important;
    width: 100% !important; /* 移动端宽度100% */
    min-height: 350px;
    position: relative !important;
    top: 0 !important;
    margin: 0 !important;
  }

  .mobile-text-content {
    max-height: 35vh; /* 移动端文本区域稍微减少高度 */
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding-right: 8px; /* 为滚动条留出空间 */
  }

  /* 自定义滚动条样式（移动端可能不显示，但桌面端会更美观） */
  .mobile-text-content::-webkit-scrollbar {
    width: 4px;
  }

  .mobile-text-content::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
  }

  .mobile-text-content::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 2px;
  }

  .mobile-text-content::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.5);
  }
}

/* 平台介绍和登录卡片模糊背景设置*/
</style>
