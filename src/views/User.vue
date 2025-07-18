<template>
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
        <span class="text-h4">个人中心</span>
      </div>
    </v-col>
  </v-row>
  <el-card style="margin: 25px 0; overflow-y: auto">
    <v-row>
      <v-col cols="12">
        <v-sheet>
          <v-row>
            <v-col cols="12">
              <v-row>
                <v-col cols="12" md="3">
                  <v-list-item-title>用户名:</v-list-item-title>
                  <v-list-item-subtitle>{{ name }}</v-list-item-subtitle>
                </v-col>
                <v-col cols="12" md="3">
                  <v-list-item-title>真实姓名:</v-list-item-title>
                  <v-list-item-subtitle
                  >{{ real_info.real_name }}
                  </v-list-item-subtitle>
                </v-col>
                <v-col cols="12" md="3">
                  <v-list-item-title>学号:</v-list-item-title>
                  <v-list-item-subtitle
                  >{{ real_info.sno }}
                  </v-list-item-subtitle>
                </v-col>
                <v-col cols="12" md="3">
                  <v-list-item-title>课程:</v-list-item-title>
                  <v-list-item-subtitle
                  >{{ real_info.cname }}
                  </v-list-item-subtitle>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
          <v-row class="mt-4">
            <v-col cols="12" class="text-center">
              <v-btn
                color="red-darken-4"
                outlined
                @click="pwd_visible = true"
                class="mx-2"
              >修改密码
              </v-btn>
              <v-btn
                color="red-darken-4"
                outlined
                @click="dialogVisible_3 = true"
                class="mx-2"
              >修改信息
              </v-btn>
            </v-col>
          </v-row>
        </v-sheet>
      </v-col>
    </v-row>

    <!-- 修改密码对话框 -->
    <v-dialog v-model="pwd_visible" max-width="500px">
      <v-card>
        <v-card-title>修改密码</v-card-title>
        <v-card-text>
          <v-form ref="pwdFormRef">
            <v-text-field
              label="用户名"
              v-model="name"
              prepend-icon="mdi-account"
              readonly
              autocomplete="username"
            ></v-text-field>
            <v-text-field
              label="旧密码"
              v-model="formLabelAlign.oldpwd"
              prepend-icon="mdi-lock"
              type="password"
              :rules="rules.oldpwd"
              autocomplete="current-password"
            ></v-text-field>
            <v-text-field
              label="新密码"
              v-model="formLabelAlign.newpwd"
              prepend-icon="mdi-lock"
              type="password"
              :rules="rules.newpwd"
              autocomplete="new-password"
            ></v-text-field>
            <v-text-field
              label="确认密码"
              v-model="formLabelAlign.confirmpwd"
              prepend-icon="mdi-lock"
              type="password"
              :rules="rules.confirmpwd"
              autocomplete="new-password"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="change_pwd">提交</v-btn>
          <v-btn @click="resetForm">重置</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!--    修改信息对话框-->
    <v-dialog v-model="dialogVisible_3" max-width="500px">
      <v-card>
        <v-card-title>修改信息</v-card-title>
        <v-card-text>
          <v-form ref="realInfoRef" :lazy-validation="true">
            <v-text-field
              label="真实姓名"
              v-model="real_info.real_name"
              :rules="info_rules.real_name"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="update_info">提交</v-btn>
          <v-btn @click="resetForm2">重置</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </el-card>
</template>

<script setup>
import {onMounted, ref} from "vue";
import {ElMessage} from "element-plus";

import {useAppStore} from "@/store/app";
import {APIS} from "@/config";
import {request} from "@/utility.js";

const store = useAppStore();
const pantheons = ref([]);
const name = store.name;

const real_info = ref({
  real_name: "",
  sno: "",
  cname: "",
});

const pwd_visible = ref(false);
const dialogVisible_3 = ref(false);

const formLabelAlign = ref({
  oldpwd: "",
  newpwd: "",
  confirmpwd: "",
});
const rules = {
  oldpwd: [(v) => !!v || "请输入旧密码"],
  newpwd: [(v) => !!v || "请输入新密码"],
  confirmpwd: [
    (v) => !!v || "请确认新密码",
    (v) => v === formLabelAlign.value.newpwd || "两次输入不一致",
  ],
};

const info_rules = {
  real_name: [(v) => !!v || "请输入真实姓名"],
  sno: [(v) => !!v || "请输入学号"],
  myclass: [(v) => !!v || "请选择课程"],
};

const realInfoRef = ref(null);
const pwdFormRef = ref(null); // 声明表单引用

const change_pwd = async () => {
  const {valid} = await pwdFormRef.value.validate({force: true});
  if (!valid) return; // 验证失败则阻止提交
  console.debug(pwdFormRef.value);
  try {
    await request(APIS.changepwd, {
      body: JSON.stringify({
        old_pwd: formLabelAlign.value.oldpwd,
        new_pwd: formLabelAlign.value.newpwd,
      }),
    });
    ElMessage({message: "密码修改成功", type: "success"});
    pwd_visible.value = false;
  } catch (error) {
  }
};

const update_info = async () => {
  try {
    await request(APIS.set_info, {
      body: JSON.stringify({
        real_name: real_info.value.real_name,
      }),
    });
    ElMessage({message: "信息修改成功", type: "success"});
    dialogVisible_3.value = false;
  } catch (error) {
  }
};

const resetForm = () => {
  formLabelAlign.value = {
    oldpwd: "",
    newpwd: "",
    confirmpwd: "",
  };
  pwdFormRef.value?.reset();
};

const resetForm2 = () => {
  real_info.value = {
    real_name: "",
    sno: "",
    cname: "",
  };
  realInfoRef.value?.reset();
};

async function getRealInfo() {
  try {
    const result = await request(APIS.get_info, {
      method: "GET",
    });
    real_info.value.real_name = result.real_info.real_name;
    real_info.value.sno = result.real_info.sno;
    real_info.value.cname = result.real_info.cname;
  } catch (error) {
  }
}

onMounted(async () => {
  getRealInfo();
  try {
    const result = await request(APIS.get_pantheon, {
      method: "GET",
    });
    pantheons.value = result["pantheon"] || [];
  } catch (error) {
    pantheons.value = [];
  }
});
</script>
<style scoped>
.text-h4 {
  font-size: 24px;
}

.mx-2 {
  margin: 8px;
}
</style>
