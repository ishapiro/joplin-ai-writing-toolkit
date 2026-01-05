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

  const pageSizeCSS = pageSize === 'A4' ? 'A4' : 'letter';

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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: white;
    }
    .title-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 90vh;
      text-align: center;
      page-break-after: always;
    }
    .title-page img { max-width: 200px; margin-bottom: 20px; }
    .title-page h1 { font-size: 3em; margin: 0.2em 0; }
    .title-page h2 { font-size: 1.5em; color: #666; font-weight: normal; }
    .title-page .meta { margin-top: 40px; font-size: 1.2em; }
    
    .content h1 { border-bottom: 1px solid #eee; padding-bottom: 0.3em; margin-top: 1.5em; }
    .content h2 { border-bottom: 1px solid #fafafa; padding-bottom: 0.2em; margin-top: 1.2em; }
    .content pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
    .content blockquote { border-left: 5px solid #ddd; padding-left: 15px; color: #666; font-style: italic; }
    .content table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    .content th, .content td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    .content th { background: #f8f8f8; }
    
    .note-box {
      background: #e7f3ff;
      border-left: 5px solid #2196F3;
      padding: 15px;
      margin: 20px 0;
      border-radius: 0 5px 5px 0;
      display: flex;
      gap: 15px;
    }
    .note-icon { font-size: 1.5em; }
    .note-content { flex: 1; }
    .note-content p:last-child { margin-bottom: 0; }

    .header, .footer {
      position: fixed;
      width: 100%;
      font-size: 0.8em;
      color: #999;
    }
    .header { top: 0; text-align: right; }
    .footer { bottom: 0; text-align: center; }

    @media print {
      body { padding: 0; }
      .title-page { height: 100vh; }
    }
  </style>
</head>
<body>
  ${header ? `<div class="header">${header}</div>` : ''}
  
  <div class="title-page">
    ${logo ? `<img src="${logo}" />` : ''}
    <h1>${title}</h1>
    ${subtitle ? `<h2>${subtitle}</h2>` : ''}
    <div class="meta">
      ${author ? `<div>By ${author}</div>` : ''}
      <div>${date}</div>
    </div>
  </div>

  <div class="content">
    ${htmlContent}
  </div>

  ${footer || showPageNumbers ? `
    <div class="footer">
      ${footer} ${showPageNumbers ? ' | Page <span class="pageNumber"></span>' : ''}
    </div>
  ` : ''}
</body>
</html>`;
}

