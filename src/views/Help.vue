<template>
  <div class="help-container">
    <div v-html="markdownContent" class="markdown-body"/>

    <!-- 悬浮的目录按钮 -->
    <v-fab
      v-if="showToc"
      icon="mdi-format-list-bulleted"
      color="primary"
      size="large"
      location="bottom end"
      :style="{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
      }"
      @click="toggleToc"
    />

    <!-- 悬浮的目录面板 -->
    <v-navigation-drawer
      v-if="showToc"
      v-model="tocDrawer"
      location="right"
      temporary
      width="320"
      :scrim="false"
      :style="{ zIndex: 999 }"
    >
      <v-card flat style="height: 100%; display: flex; flex-direction: column">
        <v-card-title class="d-flex align-center pa-4 bg-primary">
          <v-icon color="white" class="mr-2">mdi-book-open-page-variant</v-icon>
          <span class="text-white">目录</span>
          <v-spacer></v-spacer>
          <v-btn
            icon="mdi-close"
            color="white"
            variant="text"
            size="small"
            @click="toggleToc"
          />
        </v-card-title>
        <v-card-text
          class="pa-0"
          style="
            flex: 1 1 0;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            min-height: 0;
          "
        >
          <div
            class="toc-content pa-4"
            v-html="extractTocContent()"
            style="flex: 1 1 0; min-height: 0; overflow-y: auto"
          ></div>
        </v-card-text>
      </v-card>
    </v-navigation-drawer>
  </div>
</template>
<script setup>
import {nextTick, onMounted, onUnmounted, ref} from "vue";
import {APIS} from "@/config";
import {request} from "@/utility.js";
import MarkdownIt from "markdown-it";
import MarkdownItAbbr from "markdown-it-abbr";
import MarkdownItAnchor from "markdown-it-anchor";
import MarkdownItFootnote from "markdown-it-footnote";
import MarkdownItHighlightjs from "markdown-it-highlightjs";
import MarkdownItSub from "markdown-it-sub";
import MarkdownItSup from "markdown-it-sup";
import MarkdownItTasklists from "markdown-it-task-lists";
import MarkdownItTOC from "markdown-it-toc-done-right";
import "highlight.js/styles/atom-one-dark.css";
import "katex/dist/katex.min.css";

const md = new MarkdownIt()
  .use(MarkdownItAbbr)
  .use(MarkdownItAnchor, {
    permalink: false, // 禁用默认的锚点链接
    permalinkBefore: false,
    tabIndex: false,
  })
  .use(MarkdownItFootnote)
  .use(MarkdownItHighlightjs)
  .use(MarkdownItSub)
  .use(MarkdownItSup)
  .use(MarkdownItTasklists)
  .use(MarkdownItTOC, {
    includeLevel: [1, 2, 3, 4, 5, 6],
    containerClass: "table-of-contents",
    listType: "ul",
  });

const markdownContent = ref("");
const showToc = ref(false);
const isLoaded = ref(false);
const tocDrawer = ref(false);

async function fetchMarkdown() {
  if (isLoaded.value) return; // 防止重复加载
  try {
    const markdowns = await request(
      APIS.get_tutorial,
      {
        method: "GET",
      },
      {raw: true, showError: false}
    );
    let text = await markdowns.text();

    // 在文档开始处添加目录占位符
    text = "${toc}\n\n" + text;

    markdownContent.value = md.render(text);

    // 检查是否有标题来决定是否显示目录
    showToc.value = text.includes("#");
    isLoaded.value = true;

    // 等待 DOM 更新后设置点击事件处理
    await nextTick();
    setupTocClickHandlers();
    setupTocPanelClickHandlers();
  } catch (error) {
    markdownContent.value = md.render(
      "### 加载失败，请稍后再试。原因：" + error.message
    );
    showToc.value = false;
    isLoaded.value = true;
  }
}

function setupTocClickHandlers() {
  const tocLinks = document.querySelectorAll(".table-of-contents a");
  tocLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const href = link.getAttribute("href");
      if (href && href.startsWith("#")) {
        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }
    });
  });
}

function setupTocPanelClickHandlers() {
  // 为悬浮面板中的链接添加事件处理
  nextTick(() => {
    const tocPanelLinks = document.querySelectorAll(".toc-content a");
    tocPanelLinks.forEach((link) => {
      // 移除之前的事件监听器，避免重复绑定
      link.removeEventListener("click", handleTocLinkClick);
      // 添加新的事件监听器
      link.addEventListener("click", handleTocLinkClick);
    });
  });
}

function handleTocLinkClick(e) {
  e.preventDefault();
  const href = e.currentTarget.getAttribute("href");
  if (href && href.startsWith("#")) {
    const targetId = href.substring(1);
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      // 点击后自动折叠目录
      tocDrawer.value = false;
    }
  }
}

function toggleToc() {
  tocDrawer.value = !tocDrawer.value;
}

// 处理点击外部关闭目录
function handleClickOutside(event) {
  if (!tocDrawer.value) return;

  // 更精确的选择器，确保获取到正确的导航抽屉
  const tocPanel = document.querySelector(".v-navigation-drawer--temporary");
  const tocButton = document.querySelector(".v-fab");

  // 检查点击是否在目录面板内部（包括所有子元素）
  const isClickInsidePanel = tocPanel && tocPanel.contains(event.target);
  const isClickOnButton = tocButton && tocButton.contains(event.target);

  // 只有当点击既不在面板内也不在按钮上时才关闭
  if (!isClickInsidePanel && !isClickOnButton) {
    tocDrawer.value = false;
  }
}

function extractTocContent() {
  if (!markdownContent.value) return "";
  const parser = new DOMParser();
  const doc = parser.parseFromString(markdownContent.value, "text/html");
  const tocElement = doc.querySelector(".table-of-contents");
  const content = tocElement ? tocElement.innerHTML : "";

  // 在下一个 tick 中重新绑定事件
  nextTick(() => {
    setupTocPanelClickHandlers();
  });

  return content;
}

onMounted(() => {
  fetchMarkdown();
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
.help-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow-y: auto;
}

.markdown-body {
  box-sizing: border-box;
  width: 100%;
  max-width: none;
  position: relative;
}

/* 隐藏原始目录 */
.markdown-body :deep(.table-of-contents) {
  display: none;
}

/* 悬浮面板中的目录样式 */

.toc-content {
  height: 100%;
  overflow-y: auto;
}

.toc-content :deep(ul) {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

.toc-content :deep(ul ul) {
  padding-left: 16px;
  margin-top: 4px;
}

.toc-content :deep(li) {
  margin: 8px 0;
  line-height: 1.4;
}

.toc-content :deep(a) {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  text-decoration: none;
  font-size: 14px;
  display: block;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border-left: 3px solid transparent;
}

.toc-content :deep(a:hover) {
  background-color: rgba(var(--v-theme-primary), 0.04);
  color: rgb(var(--v-theme-primary));
  border-left-color: rgb(var(--v-theme-primary));
  transform: translateX(2px);
}

/* 标题样式 - 添加滚动偏移量 */
.markdown-body :deep(h1, h2, h3, h4, h5, h6) {
  scroll-margin-top: 20px;
  position: relative;
}

.markdown-body :deep(img) {
  max-width: 100% !important;
  width: auto !important;
  height: auto !important;
  display: block;
  margin: 0 auto;
  object-fit: contain;
}

.markdown-body :deep(table) {
  max-width: 100%;
  overflow-x: auto;
  display: block;
  white-space: nowrap;
}

.markdown-body :deep(pre) {
  max-width: 100%;
  overflow-x: auto;
}

.markdown-body :deep(code) {
  word-wrap: break-word;
  white-space: pre-wrap;
}
</style>
