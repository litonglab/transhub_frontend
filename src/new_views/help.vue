<script setup>
import {onMounted, ref} from "vue";
import {APIS} from "@/config";
import {useAppStore} from "@/store/app.js";
import {request} from "@/utility.js";
import {ElMessage} from "element-plus";
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

const store = useAppStore();

const md = new MarkdownIt()
  .use(MarkdownItAbbr)
  .use(MarkdownItAnchor)
  .use(MarkdownItFootnote)
  .use(MarkdownItHighlightjs)
  .use(MarkdownItSub)
  .use(MarkdownItSup)
  .use(MarkdownItTasklists)
  .use(MarkdownItTOC);

const markdownContent = ref("");

async function fetchMarkdown() {
  try {
    const markdowns = await request(
      APIS.get_tutorial,
      {
        method: "GET"
      },
      {raw: true}
    );
    const text = await markdowns.text();
    markdownContent.value = md.render(text);
  } catch (error) {
  }
}

onMounted(() => {
  fetchMarkdown();
});
</script>

<template>
  <div v-html="markdownContent" class="markdown-body"/>
</template>

<style scoped>
.markdown-body {
  box-sizing: border-box;
  min-width: 200px;
  max-width: 800px;
  margin: 0 auto;
  padding: 0px;
}
</style>
