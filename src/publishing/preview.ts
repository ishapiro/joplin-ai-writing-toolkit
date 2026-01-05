import * as MarkdownIt from 'markdown-it';
import { PublishingSettings } from './utils';

// Initialize markdown-it with HTML support
const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
});

/**
 * Custom renderer for fenced blocks like ```note
 */
const defaultFence = md.renderer.rules.fence!;
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const info = token.info.trim();

  if (info === 'note') {
    return `
      <div class="note-box">
        <div class="note-icon">📝</div>
        <div class="note-content">${md.render(token.content)}</div>
      </div>
    `;
  }

  return defaultFence(tokens, idx, options, env, self);
};

export function generatePreviewHtml(noteBody: string, noteTitle: string, settings: PublishingSettings): string {
  // 1. Remove front matter
  let content = noteBody.trim();
  if (content.startsWith('---')) {
    const endFrontMatterIndex = content.indexOf('---', 3);
    if (endFrontMatterIndex !== -1) {
      content = content.substring(endFrontMatterIndex + 3).trim();
    }
  }

  // 2. Generate content HTML
  const htmlContent = md.render(content)
    .replace(/<p>---page-break---<\/p>/g, '</div><div class="virtual-page content-virtual-page" style="height: auto; min-height: 297mm;"><div class="content-area">');

  // 3. Prepare title page data
  const title = settings.title || noteTitle;
  const subtitle = settings.subtitle || '';
  const author = settings.author || '';
  const date = settings.date || new Date().toLocaleDateString();
  const logo = settings.logo || '';
  const pageSize = settings.pageSize || 'Letter';
  const margin = settings.margin || '2.5';
  const header = settings.header || '';
  const footer = settings.footer || '';
  const showPageNumbers = settings.showPageNumbers !== false;

  const pageSizeCSS = pageSize === 'A4' ? 'A4' : 'letter';
  // Standard CSS units (1in = 96px, 1cm = 37.8px)
  const pageHeight = pageSize === 'A4' ? '29.7cm' : '11in';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: ${pageSizeCSS};
      margin: ${margin}cm;
    }
    body {
      margin: 0;
      padding: 0;
      background: transparent;
    }
    .virtual-page {
      background: white;
      width: 210mm;
      height: 297mm; /* Fixed height for true pagination */
      margin-bottom: 20px;
      box-shadow: 0 0 10px rgba(0,0,0,0.2);
      position: relative;
      padding: 2.5cm; /* Uses the margin setting */
      box-sizing: border-box;
      overflow: hidden;
    }
    
    .title-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100%;
      text-align: center;
      box-sizing: border-box;
    }
    
    .content-area {
      height: 100%;
      width: 100%;
      position: relative;
    }

    /* Source content remains hidden until fragmented */
    #contentSource { display: none; }

    @media print {
      @page {
        size: ${pageSizeCSS};
        margin: 0; 
      }
      .preview-page { background: none; margin: 0; }
      .virtual-page {
        box-shadow: none;
        margin: 0;
        page-break-after: always;
        width: 100%;
        height: 100vh; /* Match physical page */
      }
      .page-header, .page-footer { position: absolute; }
    }
  </style>
</head>
<body>
  <div class="preview-page">
    <div id="contentSource">${htmlContent}</div>
    <div id="pageContainer">
      <!-- Title Page (Always first) -->
      <div class="virtual-page" id="titlePageContainer">
        <div class="title-page">
          ${logo ? `<img src="${logo}" />` : ''}
          <h1>${title}</h1>
          ${subtitle ? `<h2>${subtitle}</h2>` : ''}
          <div class="meta">
            ${author ? `<div>By ${author}</div>` : ''}
            <div>${date}</div>
          </div>
        </div>
        ${showPageNumbers ? `<div class="page-footer">Page <span class="page-number">1</span></div>` : ''}
      </div>
    </div>

    <!-- Templates for Fragmented Pages -->
    <template id="pageTemplate">
      <div class="virtual-page">
        ${header ? `<div class="page-header">${header}</div>` : ''}
        <div class="content-area"></div>
        ${footer || showPageNumbers ? `
          <div class="page-footer">
            ${footer}${footer && showPageNumbers ? ' | ' : ''}${showPageNumbers ? 'Page <span class="page-number"></span>' : ''}
          </div>
        ` : ''}
      </div>
    </template>
  </div>

  <script>
    console.log('Preview HTML loaded');
  </script>
</body>
</html>`;
}

