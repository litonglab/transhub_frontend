<template>
  <v-app>
    <v-app-bar flat elevation="2" color="error">
      <v-container class="fill-height d-flex">
        <v-app-bar-title>
          Transhub：中国人民大学“一人一栈”打榜平台
        </v-app-bar-title>
      </v-container>
    </v-app-bar>
    <v-container class="fill-height">
      <v-row no-gutters>
        <v-col cols="7" class="hidden-sm-and-down">
          <el-card class="box-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>平台介绍</span>
              </div>
            </template>
            <div style="line-height: 40px" class="text item">
              用户态协议框架Transhub基于UDP协议进行实现，提供传输协议基本的功能模块，如序号、包类型、确认机制等，并提供如发送、接收等预制的接口API。
              同学们需要在该框架上，修改controller.cc代码中的内容，实现一个拥塞控制算法，尽可能地提高网络性能。平台通过模拟真实的动态变化网络环境，
              针对P95排队时延和平均吞吐量两个指标，对参赛者提供的拥塞控制算法进行评估，并打出综合评分。
            </div>
          </el-card>
        </v-col>
        <v-col>
          <v-sheet width="300" class="my-login">
            <v-form validate-on="submit" @submit.prevent="login">
              <v-text-field
                v-model="userId"
                label="账户"
                :rules="userIdRules"
              ></v-text-field>
              <v-text-field
                v-model="password"
                label="密码"
                :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                :rules="passwordRules"
                :type="showPassword ? 'text' : 'password'"
                counter
                @click:append-inner="showPassword = !showPassword"
              ></v-text-field>

              <v-select
                v-model="cname"
                :items="pantheons"
                label="请选择课程"
                required
              >
              </v-select>

              <v-btn type="submit" class="mb-6" block>登录</v-btn>
              <v-btn class="mb-6" @click="dialogVisible = true" block
              >注册
              </v-btn
              >
              <v-alert class="mt-2" v-if="showAlert" type="error">
                {{ statement }}
              </v-alert>
            </v-form>
          </v-sheet>
        </v-col>
      </v-row>
      <el-dialog v-model="dialogVisible" title="注册" width="30%">
        <v-form validate-on="submit" @submit.prevent="register">
          <v-text-field
            v-model="userId"
            label="账户"
            :rules="userIdRules"
          ></v-text-field>
          <v-text-field
            v-model="password"
            label="密码"
            :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            :rules="passwordRules"
            :type="showPassword ? 'text' : 'password'"
            counter
            @click:append-inner="showPassword = !showPassword"
          ></v-text-field>
          <v-text-field
            v-model="Name"
            label="真实姓名"
            :rules="NameRules"
          ></v-text-field>
          <v-text-field
            v-model="sno"
            label="学号"
            :rules="snoRules"
          ></v-text-field>
          <br/>
          <br/>
          <v-btn type="submit" class="mb-6" block>提交</v-btn>
        </v-form>
      </el-dialog>
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

const countdown = ref(60)
let timer = null

const openCountdownBox = (msg) => {
  countdown.value = 60 // 重置倒计时为60秒
  ElMessageBox({
    title: '提示',
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
      if (countdown.value > 0) return
      done()
    }
  })

  timer = setInterval(() => {
    countdown.value--
    // 通过ElMessageBox实例更新内容
    document.querySelector('.el-message-box__message').innerText = `${msg}\n请等待 ${countdown.value} 秒...`
    if (countdown.value <= 0) {
      clearInterval(timer)
      // 允许关闭，显示按钮
      ElMessageBox.close()
    }
  }, 1000)
}

async function register() {
  const formData = new FormData();
  formData.append("username", userId.value);
  formData.append("password", password.value);
  formData.append("real_name", Name.value);
  formData.append("sno", sno.value);
  try {
    await request(APIS.register, {body: formData, headers: {}, isFormData: true});
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
      store.set_user_id(result.user_id);
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
    const result = await request(
      APIS.get_pantheon,
      {
        method: "GET"
      },
    );
    pantheons.value = result['pantheon'] || [];
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
</style>
