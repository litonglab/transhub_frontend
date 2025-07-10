<template>
  <div class="help-container">
    <div class="markdown-wrapper">
      <div v-html="markdownContent" class="markdown-body"/>
    </div>

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
    setupCodeCopyButtons();
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

function setupCodeCopyButtons() {
  const codeBlocks = document.querySelectorAll(".markdown-body pre");
  codeBlocks.forEach((preElement) => {
    // 检查是否已经添加过复制按钮
    if (preElement.querySelector(".copy-button")) {
      return;
    }

    // 创建复制按钮
    const copyButton = document.createElement("button");
    copyButton.className = "copy-button";
    copyButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
      </svg>
      <span class="copy-text">复制</span>
    `;

    // 添加点击事件
    copyButton.addEventListener("click", async () => {
      const codeElement = preElement.querySelector("code");
      const text = codeElement
        ? codeElement.textContent
        : preElement.textContent;

      try {
        // 检查是否支持现代剪贴板API
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          // 使用更现代的方式作为备选方案
          const textArea = document.createElement("textarea");
          textArea.value = text;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          textArea.style.top = "-999999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();

          // 尝试使用新的选择API
          if (document.getSelection) {
            const selection = document.getSelection();
            const range = document.createRange();
            range.selectNodeContents(textArea);
            selection.removeAllRanges();
            selection.addRange(range);
          }

          // 触发复制事件
          const successful = document.execCommand("copy");
          document.body.removeChild(textArea);

          if (!successful) {
            throw new Error("复制操作失败");
          }
        }

        // 更新按钮状态为成功
        copyButton.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
          <span class="copy-text">已复制</span>
        `;
        copyButton.classList.add("copied");

        // 2秒后恢复原状
        setTimeout(() => {
          copyButton.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
            </svg>
            <span class="copy-text">复制</span>
          `;
          copyButton.classList.remove("copied");
        }, 2000);
      } catch (err) {
        console.error("复制失败:", err);

        // 显示错误状态
        copyButton.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          <span class="copy-text">复制失败</span>
        `;
        copyButton.classList.add("error");

        // 2秒后恢复原状
        setTimeout(() => {
          copyButton.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
            </svg>
            <span class="copy-text">复制</span>
          `;
          copyButton.classList.remove("error");
        }, 2000);
      }
    });

    // 设置pre元素为相对定位
    preElement.style.position = "relative";

    // 添加按钮到代码块
    preElement.appendChild(copyButton);
  });
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
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  /* padding: 20px 0; */
}

.markdown-wrapper {
  margin: 0 auto;
  /* padding: 0 20px; */
}

.markdown-body {
  background: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 0 10px 100px;
  line-height: 1.8;
  font-size: 16px;
  color: #2c3e50;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

@media (max-width: 768px) {
  .markdown-body {
    border-radius: 12px;
    font-size: 15px;
  }
}

/* 隐藏原始目录 */
.markdown-body :deep(.table-of-contents) {
  display: none;
}

/* 标题样式优化 */
.markdown-body :deep(h1) {
  font-size: 2.5em;
  color: #1a202c;
  border-bottom: 3px solid #667eea;
  padding-bottom: 16px;
  margin-bottom: 32px;
  margin-top: 0;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.markdown-body :deep(h2) {
  font-size: 2em;
  color: #2d3748;
  margin-top: 48px;
  margin-bottom: 24px;
  font-weight: 600;
  position: relative;
  padding-left: 20px;
}

.markdown-body :deep(h2::before) {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
}

.markdown-body :deep(h3) {
  font-size: 1.5em;
  color: #1a202c;
  margin-top: 36px;
  margin-bottom: 18px;
  font-weight: 700;
}

.markdown-body :deep(h4) {
  font-size: 1.25em;
  color: #2d3748;
  margin-top: 28px;
  margin-bottom: 14px;
  font-weight: 650;
}

.markdown-body :deep(h5, h6) {
  font-size: 1.1em;
  color: #4a5568;
  margin-top: 24px;
  margin-bottom: 12px;
  font-weight: 650;
}

/* 段落样式 */
.markdown-body :deep(p) {
  margin-bottom: 20px;
  text-align: justify;
}

/* 链接样式 */
.markdown-body :deep(a) {
  color: #667eea;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: all 0.3s ease;
  font-weight: 500;
}

.markdown-body :deep(a:hover) {
  color: #764ba2;
  border-bottom-color: #764ba2;
}

/* 列表样式 */
.markdown-body :deep(ul, ol) {
  margin-bottom: 20px;
  padding-left: 30px;
}

.markdown-body :deep(li) {
  margin-bottom: 8px;
  line-height: 1.7;
}

.markdown-body :deep(ul li) {
  position: relative;
}

.markdown-body :deep(ul li::marker) {
  color: #667eea;
}

/* 引用块样式 */
.markdown-body :deep(blockquote) {
  border-left: 4px solid #667eea;
  background: linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%);
  margin: 24px 0;
  padding: 20px 24px 10px;
  border-radius: 0 8px 8px 0;
  font-style: italic;
  color: #4a5568;
  position: relative;
}

.markdown-body :deep(blockquote::before) {
  content: '"';
  font-size: 3em;
  color: #667eea;
  position: absolute;
  top: -10px;
  left: 15px;
  opacity: 0.3;
}

/* 代码块样式 */
.markdown-body :deep(pre) {
  background: #1a202c;
  border-radius: 12px;
  padding: 24px;
  margin: 24px 0;
  overflow-x: auto;
  border: 1px solid #2d3748;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  position: relative;
}

/* 复制按钮样式 */
.markdown-body :deep(.copy-button) {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: #e2e8f0;
  padding: 8px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  backdrop-filter: blur(10px);
  z-index: 10;
}

.markdown-body :deep(.copy-button:hover) {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  color: #ffffff;
  transform: translateY(-1px);
}

.markdown-body :deep(.copy-button.copied) {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.4);
  color: #86efac;
}

.markdown-body :deep(.copy-button.error) {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  color: #fca5a5;
}

.markdown-body :deep(.copy-button svg) {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.markdown-body :deep(.copy-text) {
  font-weight: 500;
  white-space: nowrap;
}

.markdown-body :deep(code) {
  font-family: "SF Mono", "Monaco", "Inconsolata", "Fira Code", monospace;
  font-size: 0.9em;
}

.markdown-body :deep(p code, li code, td code) {
  background: #f7fafc;
  color: #e53e3e;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.85em;
  border: 1px solid #e2e8f0;
  font-weight: 500;
}

/* 表格样式 */
.markdown-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 24px 0;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.markdown-body :deep(th) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  padding: 16px;
  text-align: left;
  font-size: 0.95em;
  letter-spacing: 0.05em;
}

.markdown-body :deep(td) {
  padding: 14px 16px;
  border-bottom: 1px solid #e2e8f0;
  transition: background-color 0.2s ease;
}

.markdown-body :deep(tr:hover td) {
  background-color: #f8faff;
}

.markdown-body :deep(tr:last-child td) {
  border-bottom: none;
}

/* 图片样式 */
.markdown-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  margin: 24px auto;
  display: block;
  border: 1px solid #e2e8f0;
}

/* 分割线样式 */
.markdown-body :deep(hr) {
  border: none;
  height: 2px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 40px 0;
  border-radius: 1px;
}

/* 强调文本样式 */
.markdown-body :deep(strong) {
  font-weight: 700;
  color: #2d3748;
}

.markdown-body :deep(em) {
  font-style: italic;
  color: #4a5568;
}

/* 标题滚动偏移 */
.markdown-body :deep(h1, h2, h3, h4, h5, h6) {
  scroll-margin-top: 20px;
  position: relative;
}

/* 悬浮面板中的目录样式 */
.toc-content {
  height: 100%;
  overflow-y: auto;
  background: linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%);
}

.toc-content :deep(ul) {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

.toc-content :deep(ul ul) {
  padding-left: 16px;
  margin-top: 6px;
}

.toc-content :deep(li) {
  margin: 4px 0;
  line-height: 1.5;
}

.toc-content :deep(a) {
  color: #4a5568;
  text-decoration: none;
  font-size: 14px;
  display: block;
  padding: 12px 16px;
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border-left: 3px solid transparent;
  font-weight: 500;
  position: relative;
  background: rgba(255, 255, 255, 0.6);
  margin-bottom: 4px;
  backdrop-filter: blur(5px);
}

.toc-content :deep(a:hover) {
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.1) 0%,
    rgba(118, 75, 162, 0.1) 100%
  );
  color: #667eea;
  border-left-color: #667eea;
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

/* 悬浮按钮样式优化 */
.v-fab {
  transition: all 0.3s ease !important;
}

.v-fab:hover {
  transform: scale(1.1) !important;
}

/* 复制按钮样式 */
.copy-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  z-index: 10;
  transition: background 0.3s ease;
}

.copy-button:hover {
  background: rgba(255, 255, 255, 1);
}

.copy-button svg {
  vertical-align: middle;
  margin-right: 4px;
}

.copy-button.copied {
  background: rgba(102, 126, 234, 0.2);
}
</style>
