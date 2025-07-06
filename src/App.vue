<template>
  <v-app>
    <AppHeader/>
    <router-view/>
  </v-app>
</template>

<script setup>
import {onMounted} from "vue";
import {request} from "@/utility";
import {APIS} from "@/config";
import {useRouter} from "vue-router";
import AppHeader from "@/components/AppHeader.vue";

const router = useRouter();

onMounted(async () => {
  try {
    await request(APIS.check_login, {method: "GET"}, {showError: false});
    // 判断当前路由是否为登录页面，router有概率获取不到当前路由
    if (
      router.currentRoute.value.name === "login" ||
      window.location.pathname === "/login" ||
      window.location.pathname === "/"
    ) {
      await router.push({name: "help"});
    }
  } catch (error) {
  }
});
</script>
