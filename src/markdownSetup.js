import MarkdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItTocDoneRight from 'markdown-it-toc-done-right';
import markdownItFootnote from 'markdown-it-footnote';
import markdownItDeflist from 'markdown-it-deflist';
import markdownItAbbr from 'markdown-it-abbr';
import markdownItMark from 'markdown-it-mark';
import markdownItContainer from 'markdown-it-container';
//import markdownItEmoji from 'markdown-it-emoji';
import markdownItSup from 'markdown-it-sup';
import markdownItSub from 'markdown-it-sub';
import markdownItTaskLists from 'markdown-it-task-lists';
//import markdownItKatex from 'markdown-it-katex';
import markdownIthighlightjs from 'markdown-it-highlightjs';
import hljs from 'highlight.js/lib/core';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
})
  .use(markdownItAnchor)
  .use(markdownItTocDoneRight)
  .use(markdownItFootnote)
  .use(markdownItDeflist)
  .use(markdownItAbbr)
  .use(markdownItMark)
  .use(markdownItContainer, 'warning')
  //.use(markdownItEmoji)
  .use(markdownItSup)
  .use(markdownItSub)
  .use(markdownItTaskLists)
  //.use(markdownItKatex)
  .use(markdownIthighlightjs, { hljs });


export { md };