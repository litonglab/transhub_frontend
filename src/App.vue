<template>
  <router-view :key="$route.fullPath"/>
</template>

<script setup>

import {onMounted} from "vue";
import {request} from "@/utility";
import {APIS} from "@/config";
import {useRouter} from "vue-router";

const router = useRouter();
onMounted(async () => {
  console.log("App mounted");
  try {
    await request(
      APIS.check_login,
      {method: "GET"},
      {showError: false,} // 不显示错误信息
    );
    // 判断当前路由是否为登录页面，router有概率获取不到当前路由
    if (router.currentRoute.value.name === "login"
      || window.location.pathname === "/login"
      || window.location.pathname === "/"
    ) {
      await router.push({name: "help"});
    }
  } catch (error) {
  }
})
</script>
