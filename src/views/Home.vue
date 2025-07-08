<template>
  <div class="app-container">
    <!-- 顶栏已移至 App.vue -->
    <!-- 导航抽屉-->
    <HomeMenuDrawer/>

    <!-- 主要内容区域 -->
    <v-main class="bg-grey-lighten-3 d-flex">
      <v-container fluid class="pa-0 d-flex flex-column full-height">
        <v-card class="content-card flex-grow-1" rounded="lg">
          <router-view/>
        </v-card>
      </v-container>
    </v-main>
  </div>
</template>

<script setup>
import HomeMenuDrawer from "@/components/layout/HomeMenuDrawer.vue";
</script>

<style scoped>
/* 应用容器样式 - 设置最大宽度并居中 */
.app-container {
  max-width: 2000px; /* 页面的最大宽度 */
  margin: 0 auto;
  width: 100%;
  position: relative;
  min-height: 100dvh;
}

.content-card {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.full-height {
  height: 100%;
}

/* 确保 v-main 和 container 占满全高 */
.v-main {
  height: 100dvh !important; /* 减去 app-bar 的高度 */
  display: flex !important;
  flex-direction: column;
}

/* 移动端样式调整 */
@media (max-width: 960px) {
  /* 移动端可以使用更小的最大宽度或不限制 */
  .app-container {
    max-width: none;
  }
}
</style>
