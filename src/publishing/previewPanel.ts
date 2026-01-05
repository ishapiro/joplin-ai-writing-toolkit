export function getPreviewPanelHtml(htmlContent: string): string {
  return `
    <div class="preview-container">
      <div class="preview-header">
        <h3>PDF Preview</h3>
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
      .preview-actions { display: flex; gap: 10px; }
      
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
        overflow-y: auto;
        padding: 40px;
        display: flex;
        flex-direction: column;
        align-items: center;
        background: #e0e0e0;
      }
      #previewContentHolder {
        width: auto;
        flex-shrink: 0;
        position: relative;
        transform-origin: top center;
        transition: transform 0.2s ease-out;
        margin-bottom: 50px;
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

