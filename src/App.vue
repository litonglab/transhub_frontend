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
    await router.push({name: "help"});
  } catch (error) {
  }
})
</script>
