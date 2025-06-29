<script setup>
import {nextTick, onMounted, ref} from "vue";
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
const tocCollapsed = ref(false);

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
          // 更新 URL 但不触发路由变化
          if (window.history.replaceState) {
            window.history.replaceState(null, null, href);
          }
        }
      }
    });
  });
}

function setupTocPanelClickHandlers() {
  // 为悬浮面板中的链接添加事件处理
  setTimeout(() => {
    const tocPanelLinks = document.querySelectorAll(".toc-panel a");
    tocPanelLinks.forEach((link) => {
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
            // 点击后自动折叠目录
            tocCollapsed.value = true;
            // 更新 URL 但不触发路由变化
            if (window.history.replaceState) {
              window.history.replaceState(null, null, href);
            }
          }
        }
      });
    });
  }, 100);
}

function toggleToc() {
  tocCollapsed.value = !tocCollapsed.value;
}

function extractTocContent() {
  if (!markdownContent.value) return "";
  const parser = new DOMParser();
  const doc = parser.parseFromString(markdownContent.value, "text/html");
  const tocElement = doc.querySelector(".table-of-contents");
  return tocElement ? tocElement.innerHTML : "";
}

onMounted(() => {
  fetchMarkdown();
});
</script>

<template>
  <div class="help-container">
    <div v-html="markdownContent" class="markdown-body"/>

    <!-- 悬浮的目录按钮 -->
    <div v-if="showToc" class="toc-float-button" @click="toggleToc">
      <i class="toc-icon">📚</i>
    </div>

    <!-- 悬浮的目录面板 -->
    <div v-if="showToc" class="toc-panel" :class="{ collapsed: tocCollapsed }">
      <div class="toc-header">
        <span class="toc-title">📖 目录</span>
        <button class="toc-close" @click="toggleToc">×</button>
      </div>
      <div class="toc-content" v-html="extractTocContent()"></div>
    </div>
  </div>
</template>

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

/* 悬浮目录按钮 */
.toc-float-button {
  position: fixed;
  top: 80px;
  right: 20px;
  width: 50px;
  height: 50px;
  background: #007bff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
  z-index: 1000;
  transition: all 0.3s ease;
}

.toc-float-button:hover {
  background: #0056b3;
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(0, 123, 255, 0.4);
}

.toc-icon {
  font-size: 20px;
  color: white;
}

/* 悬浮目录面板 */
.toc-panel {
  position: fixed;
  top: 120px;
  right: 20px;
  width: 300px;
  max-height: calc(100vh - 100px);
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  z-index: 999;
  overflow: hidden;
  transform: translateX(0);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #e1e5e9;
}

.toc-panel.collapsed {
  transform: translateX(calc(100% + 20px));
}

.toc-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toc-title {
  font-weight: 600;
  font-size: 16px;
}

.toc-close {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.toc-close:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.toc-content {
  padding: 20px;
  overflow-y: auto;
  max-height: calc(100vh - 170px);
}

/* 悬浮面板中的目录样式 */
.toc-content :deep(ul) {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

.toc-content :deep(ul ul) {
  padding-left: 20px;
  margin-top: 8px;
}

.toc-content :deep(li) {
  margin: 12px 0;
  line-height: 1.5;
}

.toc-content :deep(a) {
  color: #374151;
  text-decoration: none;
  font-size: 14px;
  display: block;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
  border-left: 3px solid transparent;
}

.toc-content :deep(a:hover) {
  background-color: #f3f4f6;
  color: #007bff;
  border-left-color: #007bff;
  transform: translateX(4px);
}

/* 标题样式 - 添加滚动偏移量 */
.markdown-body :deep(h1, h2, h3, h4, h5, h6) {
  scroll-margin-top: 20px;
  position: relative;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .toc-panel {
    width: calc(100vw - 40px);
    right: 20px;
    left: 20px;
  }

  .toc-float-button {
    right: 20px;
  }
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
