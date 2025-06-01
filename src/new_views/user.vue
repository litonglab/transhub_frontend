<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-sheet class="pa-10" elevation="2">
          <v-row>
            <v-col>
              <h1 class="text-h4">个人中心</h1>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              <v-row>
                <v-col cols="12" md="3">
                  <v-list-item-content>
                    <v-list-item-title>用户名:</v-list-item-title>
                    <v-list-item-subtitle>{{ name }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-col>
                <v-col cols="12" md="3">
                  <v-list-item-content>
                    <v-list-item-title>真实姓名:</v-list-item-title>
                    <v-list-item-subtitle>{{ real_info.real_name }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-col>
                <v-col cols="12" md="3">
                  <v-list-item-content>
                    <v-list-item-title>学号:</v-list-item-title>
                    <v-list-item-subtitle>{{ real_info.sno }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-col>
                <v-col cols="12" md="3">
                  <v-list-item-content>
                    <v-list-item-title>课程:</v-list-item-title>
                    <v-list-item-subtitle>{{ real_info.cname }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
          <v-row class="mt-4">
            <v-col cols="12" class="text-center">
              <v-btn color="red-darken-4" outlined @click="pwd_visible = true" class="mx-2">修改密码</v-btn>
              <!-- <v-btn color="red-darken-4" outlined @click="dialogVisible_3 = true" class="mx-2">修改信息</v-btn>-->
            </v-col>
          </v-row>
        </v-sheet>
      </v-col>
    </v-row>
    <!-- <v-row>
      <v-col cols="12">
        <v-card class="mt-4">
          <v-card-title>
            最近提交
          </v-card-title>
          <v-card-text>
            <div class="content">{{ code }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row> -->

    <!-- 修改密码对话框 -->
    <v-dialog v-model="pwd_visible" max-width="500px">
      <v-card>
        <v-card-title>修改密码</v-card-title>
        <v-card-text>
          <v-form ref="pwdFormRef">
            <v-text-field label="旧密码" v-model="formLabelAlign.oldpwd" prepend-icon="mdi-lock" type="password"
                          :rules="rules.oldpwd"
            ></v-text-field>
            <v-text-field label="新密码" v-model="formLabelAlign.newpwd" prepend-icon="mdi-lock" type="password"
                          :rules="rules.newpwd"
            ></v-text-field>
            <v-text-field label="确认密码" v-model="formLabelAlign.confirmpwd" prepend-icon="mdi-lock" type="password"
                          :rules="rules.confirmpwd"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="change_pwd">提交</v-btn>
          <v-btn @click="resetForm">重置</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 修改信息对话框 -->
    <!-- <v-dialog v-model="dialogVisible_3" max-width="500px">
      <v-card>
        <v-card-title>修改信息</v-card-title>
        <v-card-text>
          <v-form ref="realInfoRef" :lazy-validation="true">
            <v-text-field
              label="真实姓名"
              v-model="real_info.real_name"
              :rules="info_rules.real_name"
            ></v-text-field>
            <v-text-field
              label="学号"
              v-model="real_info.sno"
              :rules="info_rules.sno"
            ></v-text-field>
            <v-select
              label="课程"
              v-model="real_info.cname"
              :items="pantheons"
              item-text="label"
              item-value="value"
              :rules="info_rules.myclass"
            ></v-select>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="update_info">提交</v-btn>
          <v-btn @click="resetForm2">重置</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>-->
  </v-container>
</template>

<script setup>
import {onMounted, ref} from "vue";
import {ElMessage} from "element-plus";

import {useAppStore} from "@/store/app";
import {APIS} from "@/config";
import {get_pantheon} from "@/utility";
import {request} from "@/utility.js";

const store = useAppStore();
const pantheons = ref([]);
const name = store.name;

const real_info = ref({
  real_name: "",
  sno: "",
});

const pwd_visible = ref(false);
const dialogVisible_3 = ref(false);

const formLabelAlign = ref({
  oldpwd: "",
  newpwd: "",
  confirmpwd: "",
});

//const validateConfirmPwd = async (rule, value, callback) => {
// await nextTick()
//console.log('当前新密码:', formLabelAlign.value.newpwd);
// console.log('当前确认密码:', value);
// if (!value) {
//   callback(new Error('请确认新密码'));
// } else if (value !== formLabelAlign.value.newpwd) {
//   callback(new Error('两次输入密码不一致'));
// } else {
//   callback();
// }
//};

const validateConfirmPwd = (value) => {
  if (!value) return '请确认新密码';          // 返回错误字符串
  if (value !== formLabelAlign.value.newpwd) return '两次输入不一致';
  return true;                              // 返回 true 表示验证通过
};

const rules = {
  oldpwd: [
    {required: true, message: '请输入旧密码', trigger: ['blur', 'input']}
  ],
  newpwd: [
    {required: true, message: '请输入新密码', trigger: ['blur', 'input']}
  ],
  confirmpwd: [
    (value) => !!value || '请确认新密码', // 必填规则
    (value) => value === formLabelAlign.value.newpwd || '两次输入不一致' // 一致性规则
  ]
};

const info_rules = {
  real_name: [{required: true, message: "请输入真实姓名", trigger: "blur"}],
  sno: [{required: true, message: "请输入学号", trigger: "blur"}],
  myclass: [{required: true, message: "请选择课程", trigger: "change"}],
};

const realInfoRef = ref(null);
const pwdFormRef = ref(null); // 声明表单引用

const change_pwd = async () => {

  const {valid} = await pwdFormRef.value.validate({force: true});
  if (!valid) return; // 验证失败则阻止提交
  console.log(pwdFormRef.value)
  console.log('change_pwd：', valid);
  try {
    await request(APIS.changepwd, {
      body: JSON.stringify({
        user_id: store.user_id,
        oldpwd: formLabelAlign.value.oldpwd,
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
        user_id: store.user_id,
        real_name: real_info.value.real_name,
        sno: real_info.value.sno,
      }),
    });
    ElMessage({message: "信息修改成功", type: "success"});
    dialogVisible_3.value = false;
    // store.set_cname(real_info.value.cname);
    // await request(APIS.paticipate, {
    //   body: JSON.stringify({ user_id: store.user_id, cname: store.cname }),
    // });
  } catch (error) {

  }
};

const resetForm = (formName) => {
  formRef.value.resetFields();
};

async function getRealInfo() {
  try {
    const result = await request(APIS.get_info, {
      body: JSON.stringify({user_id: store.user_id}),
    })
    real_info.value.real_name = result.real_info.real_name;
    real_info.value.sno = result.real_info.sno;
  } catch (error) {
    ElMessage.error("获取信息请求异常");
  }
}

onMounted(async () => {
  getRealInfo();
  pantheons.value = await get_pantheon();
});
</script>
<style scoped>
.text-h4 {
  font-size: 24px;
}

.pa-10 {
  padding: 10px;
}

.card-header {
  font-size: 18px;
  font-weight: bold;
}

.content {
  white-space: pre-wrap;
}

.mx-2 {
  margin-left: 8px;
  margin-right: 8px;
}
</style>
