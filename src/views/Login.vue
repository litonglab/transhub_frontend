<template>
  <v-app class="bg-container" :style="brand.loginPage.backgroundStyle">
    <v-container class="fill-height main-container">
      <v-row justify="center" align="center" dense>
        <v-col cols="12" md="6" class="mobile-col">
          <v-card elevation="4" class="pa-6 frosted-card mobile-card">
            <v-card-title class="text-h6 font-weight-medium mb-4"
            >{{ brand.loginPage.introTitle }}
            </v-card-title>
            <v-card-text
              class="text-body-1 text-dark mobile-text-content"
              style="line-height: 1.8"
            >
              <div>
                {{ brand.loginPage.introText }}
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
              <div class="d-flex flex-column align-center ga-2 mt-0 mb-6">
                <v-btn
                  type="submit"
                  style="width: 80%"
                  color="error"
                >
                  登录
                </v-btn>
                <v-btn
                  style="width: 80%"
                  color="error"
                  @click="dialogVisible = true"
                >
                  注册
                </v-btn>
                <v-btn
                  style="width: 80%"
                  color="error"
                  @click="guestLogin"
                >
                  游客登录
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
                placeholder="用于登录、榜单展示，注册后不可更改"
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
                placeholder="真实学号，注册后不可更改"
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
import {brand} from "@/brand";

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
    if (value?.length < 1 || value?.length > 20)
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
  countdown.value = 10; // 重置倒计时为10秒
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

async function login_request(data) {
  try {
    const result = await request(APIS.login, {body: JSON.stringify(data)});
    if (result.code === 200) {
      // 设置用户基本信息
      store.set_name(data.username);

      // 如果后端返回了用户角色信息，设置到store中
      if (result && result.role) {
        store.set_role(result.role);
      } else {
        store.set_role("student"); // 默认为学生角色
      }
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

async function login() {
  let data = {
    username: userId.value,
    password: password.value,
    cname: cname.value,
  };
  await login_request(data);
}

// 游客登录：使用固定账号密码
const guestLogin = async () => {
  // 构造登录数据
  const guestData = {
    username: 'guest',
    password: 'guestguest123',
    cname: cname.value, // 沿用用户当前选择的课程
  };

  await login_request(guestData);
};

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
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.bg-container::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.9), transparent 82%);
}

.bg-container::after {
  content: "";
  position: fixed;
  width: 520px;
  height: 520px;
  right: -180px;
  bottom: -180px;
  pointer-events: none;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.22), transparent 68%);
  filter: blur(8px);
}

.main-container {
  padding-top: 80px; /* 为header留出空间 */
  position: relative;
  z-index: 1;
}

.frosted-card {
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(18px); /* 关键：模糊背景 */
  -webkit-backdrop-filter: blur(18px); /* 兼容 Safari */
  border-radius: 20px;
  box-shadow: 0 24px 70px rgba(7, 26, 47, 0.28); /* 可选美化阴影 */
  border: 1px solid rgba(255, 255, 255, 0.46); /* 可选边框美化 */
}

.mobile-card {
  min-height: 350px; /* 最小高度保持不变，实际高度由内容决定 */
  height: auto;
}

.mobile-login-card {
  min-height: 350px;
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
