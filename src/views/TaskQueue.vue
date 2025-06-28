<template>
  <div class="task-queue-container">
    <!-- 页面标题 -->
    <v-row class="flex-grow-0 mb-4">
      <v-col>
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
          "
        >
          <span class="text-h4">任务队列管理</span>
          <div class="d-flex align-center ga-2">
            <v-chip color="info" variant="elevated">
              <v-icon icon="mdi-monitor-dashboard" class="me-2"></v-icon>
              Dramatiq 监控面板
            </v-chip>
            <v-btn
              icon="mdi-home"
              variant="outlined"
              size="small"
              @click="resetToHome"
              title="返回监控首页"
            ></v-btn>
            <v-btn
              icon="mdi-refresh"
              variant="outlined"
              size="small"
              @click="reloadIframe"
              title="刷新页面"
            ></v-btn>
            <v-btn
              :icon="isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
              variant="outlined"
              size="small"
              @click="toggleFullscreen"
              :title="isFullscreen ? '退出全屏' : '全屏显示'"
            ></v-btn>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- iframe 容器 -->
    <div class="iframe-container">
      <v-card class="iframe-card">
        <v-card-text class="pa-0">
          <iframe
            :src="currentIframeSrc"
            ref="dramatiqFrame"
            class="dramatiq-iframe"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
            referrerpolicy="same-origin"
            allow="fullscreen"
            @load="onIframeLoad"
            @error="onIframeError"
          ></iframe>
        </v-card-text>
      </v-card>
    </div>

    <!-- 加载指示器 -->
    <v-overlay v-model="loading" contained class="align-center justify-center">
      <v-progress-circular
        indeterminate
        size="64"
        color="primary"
      ></v-progress-circular>
      <div class="mt-4 text-h6">正在加载任务队列面板...</div>
    </v-overlay>

    <!-- 错误提示 -->
    <v-snackbar v-model="showError" color="error" timeout="5000" top>
      <v-icon icon="mdi-alert-circle" class="me-2"></v-icon>
      无法加载任务队列面板，请检查网络连接或联系管理员
      <template v-slot:actions>
        <v-btn variant="text" @click="reloadIframe"> 重试</v-btn>
        <v-btn variant="text" @click="showError = false"> 关闭</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import {computed, onMounted, onUnmounted, ref, watch} from "vue";
import {useRoute} from "vue-router";
import {APIS} from "@/config";

const route = useRoute();

const loading = ref(true);
const showError = ref(false);
const dramatiqFrame = ref(null);
const isFullscreen = ref(false);
const currentUrl = ref("");
const currentIframeSrc = ref("");

// 获取后端基础 URL
const backendBaseUrl = computed(() => {
  const hostname = import.meta.env.VITE_APP_API_HOST;
  return hostname.endsWith("/") ? hostname.slice(0, -1) : hostname;
});

// 构建 dramatiq URL
const dramatiqUrl = computed(() => {
  return APIS.dramatiq_dashboard;
});

// 根据路由参数构建初始 URL
const getInitialUrl = () => {
  const dramatiqPath = route.meta?.dramatiqPath || route.params?.pathMatch;

  if (dramatiqPath) {
    // 如果有 dramatiq 路径参数，构建完整 URL
    return `${backendBaseUrl.value}/dramatiq/${
      Array.isArray(dramatiqPath) ? dramatiqPath.join("/") : dramatiqPath
    }`;
  }

  return dramatiqUrl.value;
};

// 检查 URL 是否需要转发到后端
const shouldRedirectToBackend = (url) => {
  try {
    // 如果是相对路径，直接返回 true
    if (!url.startsWith("http")) {
      return true;
    }

    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // 检查路径是否以 /dramatiq 开头
    return pathname.startsWith("/dramatiq");
  } catch (error) {
    console.error("Invalid URL:", url);
    return false;
  }
};

// 构建后端完整 URL
const buildBackendUrl = (path) => {
  const baseUrl = backendBaseUrl.value;

  // 如果路径已经是完整的 dramatiq 路径，直接使用
  if (path.startsWith("/dramatiq")) {
    return `${baseUrl}${path}`;
  }

  // 如果路径不以 / 开头，添加 /dramatiq/ 前缀
  if (!path.startsWith("/")) {
    return `${baseUrl}/dramatiq/${path}`;
  }

  // 相对于根目录的路径，添加 dramatiq 前缀
  return `${baseUrl}/dramatiq${path}`;
};

// 处理导航请求
const handleNavigation = (targetUrl) => {
  loading.value = false; // 跳转时不再显示加载指示器
  showError.value = false;

  let finalUrl;

  // 检查是否是相对路径或者需要转发的路径
  if (shouldRedirectToBackend(targetUrl)) {
    if (targetUrl.startsWith("http")) {
      // 绝对路径
      const urlObj = new URL(targetUrl);
      finalUrl = buildBackendUrl(urlObj.pathname + urlObj.search + urlObj.hash);
    } else {
      // 相对路径
      finalUrl = buildBackendUrl(targetUrl);
    }
  } else {
    finalUrl = targetUrl;
  }

  currentIframeSrc.value = finalUrl;
  currentUrl.value = finalUrl;

  console.debug("Navigating to:", finalUrl);

  // 更新 iframe src
  if (dramatiqFrame.value) {
    dramatiqFrame.value.src = finalUrl;
  }
};

// 监听路由变化
watch(
  () => route.params,
  (newParams) => {
    if (route.name === "dramatiq" && newParams.pathMatch) {
      const newUrl = getInitialUrl();
      if (newUrl !== currentIframeSrc.value) {
        handleNavigation(newUrl);
      }
    }
  },
  {deep: true}
);

// 初始化 iframe src
onMounted(() => {
  currentIframeSrc.value = getInitialUrl();
});

// iframe 加载完成
const onIframeLoad = () => {
  loading.value = false;
  showError.value = false;

  // 尝试获取当前 iframe 的 URL
  try {
    if (dramatiqFrame.value && dramatiqFrame.value.contentWindow) {
      currentUrl.value = dramatiqFrame.value.contentWindow.location.href;
    }
  } catch (error) {
    // 跨域限制，无法访问 iframe 内容
    console.log("无法访问 iframe URL due to CORS policy");
  }

  // 监听 iframe 内的链接点击
  try {
    const iframeDoc =
      dramatiqFrame.value.contentDocument ||
      dramatiqFrame.value.contentWindow.document;

    // 拦截所有链接点击
    iframeDoc.addEventListener(
      "click",
      (event) => {
        const target = event.target;

        // 检查是否点击了链接
        if (target.tagName === "A" || target.closest("a")) {
          const link = target.tagName === "A" ? target : target.closest("a");
          const href = link.href;

          if (href && shouldRedirectToBackend(href)) {
            event.preventDefault();
            handleNavigation(href);
          }
        }
      },
      true
    );
  } catch (error) {
    console.log("无法监听 iframe 内容 due to CORS policy");
  }
};

// iframe 加载错误
const onIframeError = () => {
  loading.value = false;
  showError.value = true;
};

// 重新加载 iframe
const reloadIframe = () => {
  if (dramatiqFrame.value) {
    loading.value = true;
    showError.value = false;
    // 强制刷新 iframe
    const currentSrc = currentIframeSrc.value || getInitialUrl();
    dramatiqFrame.value.src = "about:blank";
    setTimeout(() => {
      dramatiqFrame.value.src = currentSrc;
      currentIframeSrc.value = currentSrc;
    }, 100);
  }
};

// 重置到初始页面
const resetToHome = () => {
  handleNavigation("/");
};

// 切换全屏模式
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;

  if (isFullscreen.value) {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
};

// 监听全屏状态变化
const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement;
};

// 处理来自 iframe 的消息
const handleMessage = (event) => {
  // 确保消息来自正确的源
  const hostname = import.meta.env.VITE_APP_API_HOST;
  const allowedOrigin = hostname.replace(/\/$/, "");

  if (event.origin === allowedOrigin) {
    // 处理导航消息
    if (event.data && event.data.type === "navigation") {
      handleNavigation(event.data.url);
    }

    console.log("Received message from iframe:", event.data);
  }
};

// 检查 iframe 是否可以访问
const checkIframeAccess = () => {
  try {
    if (
      dramatiqFrame.value &&
      dramatiqFrame.value.contentWindow &&
      dramatiqFrame.value.contentDocument
    ) {
      return true;
    }
  } catch (error) {
    console.log("Iframe access restricted due to CORS policy");
  }
  return false;
};

// 定时器引用
let checkInterval = null;

onMounted(() => {
  // 设置初始加载状态
  loading.value = true;
  currentIframeSrc.value = getInitialUrl();

  // 监听全屏状态变化
  document.addEventListener("fullscreenchange", handleFullscreenChange);

  // 监听来自 iframe 的消息
  window.addEventListener("message", handleMessage);

  // 定期检查 iframe 状态（可选）
  checkInterval = setInterval(() => {
    if (dramatiqFrame.value && !loading.value) {
      checkIframeAccess();
    }
  }, 5000);
});

onUnmounted(() => {
  // 清理定时器
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }

  // 清理事件监听器
  document.removeEventListener("fullscreenchange", handleFullscreenChange);
  window.removeEventListener("message", handleMessage);
});
</script>

<style scoped>
.task-queue-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.text-h4 {
  font-size: 24px;
}

.iframe-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.iframe-card {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dramatiq-iframe {
  width: 100%;
  height: 100%;
  min-height: 600px;
  border: none;
  background-color: #f5f5f5;
  transition: all 0.3s ease;
  /* 确保 iframe 内容不会溢出 */
  overflow: hidden;
}

/* 全屏模式下的特殊样式 */
:fullscreen .task-queue-container {
  height: 100vh;
  background: white;
}

:fullscreen .dramatiq-iframe {
  min-height: 100vh;
}

/* 确保 iframe 占满容器 */
.iframe-card :deep(.v-card-text) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 工具按钮样式 */
.ga-2 {
  gap: 8px;
}

/* 为按钮添加悬停效果 */
.v-btn {
  transition: all 0.2s ease;
}

.v-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .dramatiq-iframe {
    min-height: 500px;
  }

  .ga-2 {
    gap: 4px;
  }

  .ga-2 .v-btn {
    min-width: 36px;
  }
}
</style>
