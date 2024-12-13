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
              <v-text-field v-model="userId" label="账户" :rules="userIdRules"></v-text-field>
              <v-text-field v-model="password" label="密码" :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                :rules="passwordRules" :type="showPassword ? 'text' : 'password'" counter
                @click:append-inner="showPassword = !showPassword"></v-text-field>
             
              <v-select v-model="cname" :items="pantheons" label="请选择课程" required>
              </v-select>

              <v-btn type="submit" class="mb-6" block>登录</v-btn>
              <v-btn class="mb-6" @click="dialogVisible = true" block>注册</v-btn>
              <v-alert class="mt-2" v-if="showAlert" type="error">
                {{ statement }}
              </v-alert>
            </v-form>
          </v-sheet>
        </v-col>
      </v-row>
      <el-dialog v-model="dialogVisible" title="注册" width="30%">
        <v-form validate-on="submit" @submit.prevent="register">
          <v-text-field v-model="userId" label="账户" :rules="userIdRules"></v-text-field>
          <v-text-field v-model="password" label="密码" :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            :rules="passwordRules" :type="showPassword ? 'text' : 'password'" counter
            @click:append-inner="showPassword = !showPassword"></v-text-field>
          <v-text-field v-model="Name" label="真实姓名" :rules="NameRules"></v-text-field>
          <v-text-field v-model="sno" label="学号" :rules="snoRules"></v-text-field>
          <br />
          <br />
          <v-btn type="submit" class="mb-6" block>提交</v-btn>
        </v-form>
      </el-dialog>
    </v-container>
  </v-app>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useAppStore } from "@/store/app.js";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import md5 from "js-md5";
import { APIS } from "@/config";
import axios from "axios";
import {get_pantheon} from "@/utility.js";

const router = useRouter();
const pantheons =ref([]);
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
const cname = ref("计算机网络");

const showPassword = ref(false);



let showAlert = ref(false);
let statement = ref("");
let dialogVisible = ref(false);



function register() {
  let data = new FormData();
  data.append("username", userId.value);
  data.append("password", password.value);
  data.append("real_name", Name.value);
  data.append("sno", sno.value);
  //data.append("Sclass", Class.value);
  axios.post(APIS.register, data).then((response) => {
    if (response.data.code != 200) {
      // this.$message.warning("注册失败");
      ElMessage({ type: "error", message: response.data.message });
      console.log(response);
    } else {
      ElMessage({ type: "success", message: "注册成功！请返回登录页面" });
      // this.$message.warning("注册成功！请返回登录页面")
      console.log(response);
      dialogVisible.value = false;
    }
  });
}

async function login() {
  let data = {
    username: userId.value,
    password: password.value,
  };

  const response = await fetch(APIS.login, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(data)
  });

  const result = await response.json();

  if (result.code != 200) {
    ElMessage({ type: "error", message: result.message });
  } else {
    store.set_cname(cname.value);
    store.set_user_id(result.user_id);
    store.set_name(data.username);
    //console.log("pushing");
    router.push({ name: "help" });
    //console.log("pushed");
  }
  const response2 = await fetch(APIS.paticipate, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ user_id: store.user_id, cname: store.cname })
    });

    const result2 = await response2.json();

    if (result2.code != 200) {
      ElMessage({ type: "error", message: result2.message });
    } else {
      console.log("paticipation success!");
    }
}

onMounted(async () => {
  pantheons.value = await get_pantheon();
  console.log(pantheons.value);
  
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
