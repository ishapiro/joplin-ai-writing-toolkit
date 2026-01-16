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
  // Note: We no longer manually replace ---page-break--- here. 
  // It is handled by the fragmentation logic in webview.ts.
  const htmlContent = md.render(content);

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
  const includeTitlePage = settings.includeTitlePage !== false;
  const centerTitlePageContent = settings.centerTitlePageContent === true;

  const pageSizeCSS = pageSize === 'A4' ? 'A4' : 'letter';
  const pageWidth = pageSize === 'A4' ? '210mm' : '8.5in';
  const pageHeight = pageSize === 'A4' ? '297mm' : '11in';

  // Return a fragment with scoped styles and the necessary DOM structure
  return `
  <style>
    @page {
      size: ${pageSizeCSS};
      margin: 0;
    }
    .virtual-page {
      background: white;
      width: ${pageWidth};
      height: ${pageHeight};
      margin-bottom: 20px;
      box-shadow: 0 0 10px rgba(0,0,0,0.2);
      position: relative;
      padding: ${margin}cm;
      box-sizing: border-box;
      overflow: hidden;
    }
    
    /* Ensure content area doesn't overlap header/footer */
    .content-area {
      height: 100%;
      width: 100%;
      position: relative;
      /* Add internal padding to prevent text from touching header/footer borders */
      padding-top: 0.5cm;
      padding-bottom: 0.5cm;
      box-sizing: border-box;
    }

    #contentSource { display: none; }

    @media print {
      .preview-page { background: none; margin: 0; }
      .virtual-page {
        box-shadow: none;
        margin: 0;
        page-break-after: always;
        width: ${pageWidth};
        height: ${pageHeight};
      }
      .page-header, .page-footer { position: static; }
    }

    /* Note box styling from earlier iteration - preserved but integrated */
    .note-box {
      background: #f9f9f9;
      border-left: 4px solid #333;
      padding: 10px 15px;
      margin: 10px 0;
      display: flex;
      gap: 10px;
    }
    .note-icon { font-size: 20px; }
    .note-content { flex: 1; }
    .note-content p:first-child { margin-top: 0; }
    .note-content p:last-child { margin-bottom: 0; }
    
    /* Shared footer/header styles */
    .page-header, .page-footer {
      position: absolute;
      left: ${margin}cm;
      right: ${margin}cm;
      font-size: 10px;
      color: #888;
      pointer-events: none;
    }
    .page-header {
      top: 0.8cm;
      border-bottom: 1px solid #eee;
      padding-bottom: 5px;
    }
    .page-footer {
      bottom: 0.8cm;
      border-top: 1px solid #eee;
      padding-top: 5px;
      display: flex;
      justify-content: flex-end; /* Right justified within content area */
      gap: 10px;
      padding-right: 5px; /* Nudge from the right margin edge for better balance */
    }
    .footer-content { flex: 1; text-align: left; display: none; } /* Hidden if empty */
    .page-number-box { text-align: center; }

    /* Title page alignment */
    .title-page.title-page-centered {
      text-align: center;
    }
    .title-page.title-page-centered img {
      display: block;
      margin-left: auto !important;
      margin-right: auto !important;
    }
    .title-page.title-page-centered .meta {
      text-align: center;
    }
  </style>

  <div class="preview-page">
    <div id="contentSource">${htmlContent}</div>
    <div id="pageContainer">
      ${includeTitlePage ? `
      <!-- Title Page (Only if includeTitlePage is true) -->
      <div class="virtual-page" id="titlePageContainer">
        <div class="title-page${centerTitlePageContent ? ' title-page-centered' : ''}">
          ${logo ? `<img src="${logo}" style="max-width: 200px; margin-bottom: 20px;${centerTitlePageContent ? ' margin-left: auto; margin-right: auto; display: block;' : ''}" />` : ''}
          <h1 style="font-size: 32px; margin-bottom: 10px;">${title}</h1>
          ${subtitle ? `<h2 style="font-size: 20px; color: #666; margin-bottom: 20px;">${subtitle}</h2>` : ''}
          <div class="meta" style="margin-top: 30px; font-size: 14px; color: #444;">
            ${author ? `<div style="margin-bottom: 5px;">By ${author}</div>` : ''}
            <div>${date}</div>
          </div>
        </div>
        ${showPageNumbers || footer ? `
          <div class="page-footer" style="border-top: none; justify-content: flex-end;">
            ${footer ? `<span style="margin-right: 10px;">${footer}</span>` : ''}
            ${showPageNumbers ? '<span>Page <span class="page-number">1</span></span>' : ''}
          </div>
        ` : ''}
      </div>
      ` : ''}
    </div>

    <!-- Templates for Fragmented Pages -->
    <template id="pageTemplate">
      <div class="virtual-page">
        ${header ? `<div class="page-header">${header}</div>` : ''}
        <div class="content-area"></div>
        ${footer || showPageNumbers ? `
          <div class="page-footer">
            ${footer ? `<span style="margin-right: 10px;">${footer}</span>` : ''}
            ${showPageNumbers ? '<span>Page <span class="page-number"></span></span>' : ''}
          </div>
        ` : ''}
      </div>
    </template>
  </div>
  `;
}
