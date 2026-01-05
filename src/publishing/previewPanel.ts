export function getPreviewPanelHtml(htmlContent: string): string {
  return `
    <div class="preview-container">
      <div class="preview-header">
        <div class="header-left">
          <h3>PDF Preview</h3>
          <div class="pagination-controls" id="paginationControls" style="display: none; margin-left: 20px;">
            <button class="nav-button" id="prevPage" title="Previous Page">◀</button>
            <span id="pageInfo">Page 1 of 1</span>
            <button class="nav-button" id="nextPage" title="Next Page">▶</button>
          </div>
        </div>
        <div class="preview-actions">
          <button class="action-button" id="refreshButton">Refresh</button>
          <button class="action-button" id="printButton">Print PDF</button>
          <button class="close-button" id="closePreviewButton" title="Close">✕</button>
        </div>
      </div>
      
      <div class="preview-body" id="previewBody">
        <div id="previewContentHolder">${htmlContent}</div>
      </div>
    </div>

    <style>
      .preview-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
        background: #f0f0f0;
        font-family: sans-serif;
      }
      .preview-header {
        background: #fff;
        padding: 10px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #ddd;
        flex-shrink: 0;
        position: relative;
        z-index: 10;
      }
      .preview-header h3 { margin: 0; font-size: 16px; }
      .header-left { display: flex; align-items: center; }
      .preview-actions { display: flex; gap: 10px; }
      
      .pagination-controls {
        display: flex;
        align-items: center;
        gap: 10px;
        background: #eee;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 13px;
      }
      .nav-button {
        background: none;
        border: 1px solid #ccc;
        border-radius: 3px;
        cursor: pointer;
        padding: 0 6px;
        font-size: 12px;
      }
      .nav-button:hover { background: #ddd; }
      .nav-button:disabled { opacity: 0.3; cursor: default; }
      
      .action-button {
        padding: 5px 15px;
        background: #fff;
        border: 1px solid #333;
        border-radius: 4px;
        cursor: pointer;
      }
      .action-button:hover { background: #333; color: #fff; }
      
      .close-button {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        padding: 0 5px;
      }
      
      .preview-body {
        flex: 1;
        overflow: hidden; /* No more body scrolling */
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center; /* Center the single page */
        background: #e0e0e0;
      }
      #previewContentHolder {
        width: auto;
        height: auto;
        flex-shrink: 0;
        position: relative;
        transform-origin: center center; /* Scale from middle for single page */
        transition: transform 0.2s ease-out;
      }
      
      @media print {
        .preview-header { display: none !important; }
        .preview-body { 
          padding: 0 !important; 
          background: white !important; 
          overflow: visible !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .preview-container { height: auto !important; }
      }
    </style>
  `;
}

