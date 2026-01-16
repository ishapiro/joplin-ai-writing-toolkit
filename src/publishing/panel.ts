
export function getPublishingPanelHtml(): string {
  return `
    <div class="chat-container">
      <div class="chat-header">
        <h3>PDF Publishing Settings</h3>
      </div>
      
      <div class="quick-actions">
        <button class="action-button" data-action="showHelp" title="Help & Documentation">ℹ️ Help</button>
      </div>
      
      <div class="settings-scroll-area">
        <div class="settings-group">
          <h4>Title Page</h4>
          <div class="form-group">
            <label class="input-label">Document Title</label>
            <input type="text" id="docTitle" class="text-input" placeholder="Enter title (defaults to note title)">
          </div>
          <div class="form-group">
            <label class="input-label">Subtitle</label>
            <input type="text" id="docSubtitle" class="text-input" placeholder="Enter subtitle">
          </div>
          <div class="form-group">
            <label class="input-label">Author</label>
            <input type="text" id="docAuthor" class="text-input" placeholder="Enter author name">
          </div>
          <div class="form-group">
            <label class="input-label">Date</label>
            <input type="text" id="docDate" class="text-input" placeholder="Enter date">
          </div>
          <div class="form-group">
            <label class="input-label">Logo URL/Path</label>
            <input type="text" id="docLogo" class="text-input" placeholder="URL, Resource ID, or Note ID (uses first image)">
          </div>
          <div class="checkbox-group">
            <input type="checkbox" id="includeTitlePage" checked>
            <label for="includeTitlePage" class="input-label" style="margin-bottom: 0;">Include Title Page</label>
          </div>
          <div class="checkbox-group">
            <input type="checkbox" id="centerTitlePageContent">
            <label for="centerTitlePageContent" class="input-label" style="margin-bottom: 0;">Center Title Page Content</label>
          </div>
        </div>

        <div class="settings-group">
          <h4>Layout & Margins</h4>
          <div class="form-row">
            <div class="form-group">
              <label class="input-label">Page Size</label>
              <select id="pageSize" class="select-input">
                <option value="Letter">Letter</option>
                <option value="A4">A4</option>
              </select>
            </div>
            <div class="form-group">
              <label class="input-label">Margin (cm)</label>
              <input type="number" id="pageMargin" class="text-input" value="2.5" step="0.1">
            </div>
          </div>
        </div>

        <div class="settings-group">
          <h4>Header & Footer</h4>
          <div class="form-group">
            <label class="input-label">Header Text</label>
            <input type="text" id="headerText" class="text-input" placeholder="Top of page text">
          </div>
          <div class="form-group">
            <label class="input-label">Footer Text</label>
            <input type="text" id="footerText" class="text-input" placeholder="Bottom of page text">
          </div>
          <div class="checkbox-group">
            <input type="checkbox" id="showPageNumbers" checked>
            <label for="showPageNumbers" class="input-label" style="margin-bottom: 0;">Show Page Numbers</label>
          </div>
        </div>
      </div>

      <div class="actions-container">
        <button id="closePanelButton" class="close-panel-button">Close</button>
        <button id="refreshButton" class="secondary-button">Refresh from Note</button>
        <button id="previewButton" class="primary-button">Generate Preview</button>
      </div>
    </div>

    <!-- Help Modal -->
    <div id="help-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000;">
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 25px; border-radius: 8px; width: 85%; max-height: 85%; overflow-y: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.3); font-family: sans-serif;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
          <h3 style="margin: 0; color: #2c2c2c;">🖨️ PDF Publishing Help</h3>
          <button id="close-help-modal" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">&times;</button>
        </div>
        
        <div style="color: #2c2c2c; line-height: 1.6; font-size: 14px;">
          <h4 style="margin: 15px 0 8px 0; color: #000;">✨ Features</h4>
          <ul style="margin: 0 0 15px 20px; padding: 0;">
            <li><strong>Live Preview</strong> - See exactly how your PDF will look before printing.</li>
            <li><strong>Auto-Pagination</strong> - Automatic fragmentation of long notes into pages.</li>
            <li><strong>Title Pages</strong> - Automatic generation from note metadata.</li>
            <li><strong>Front Matter</strong> - All settings are stored in your note's YAML front matter.</li>
          </ul>

          <h4 style="margin: 15px 0 8px 0; color: #000;">📄 Page Breaks</h4>
          <p style="margin-bottom: 15px;">To force a new page at a specific location, add this on its own line in your note:<br>
          <code style="background: #f0f0f0; padding: 2px 5px; border-radius: 3px; font-family: monospace;">---page-break---</code></p>

          <h4 style="margin: 15px 0 8px 0; color: #000;">🖨️ How to Print</h4>
          <ol style="margin: 0 0 15px 20px; padding: 0;">
            <li>Configure settings (Title, Author, Margins, etc.) in this panel.</li>
            <li>Click <strong>Generate Preview</strong> at the bottom.</li>
            <li>In the preview, click <strong>Print PDF</strong>.</li>
            <li>In the system dialog, select <strong>Save as PDF</strong> to create a file, or select a printer.</li>
          </ol>

          <div style="background: #f9f9f9; border-left: 4px solid #0066cc; padding: 12px; margin-top: 20px; font-size: 13px;">
            <strong>💡 Tip:</strong> Settings are synced with the YAML block at the top of your note. You can edit them there directly and click <strong>Refresh from Note</strong> to update this panel.
          </div>
        </div>
        
        <div style="margin-top: 25px; text-align: right;">
          <button id="ok-help-modal" style="padding: 8px 25px; background: #2c2c2c; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Got it</button>
        </div>
      </div>
    </div>

    <style>
      .chat-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
        width: 100%;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        background: #fafafa;
        color: #2c2c2c;
      }

      .chat-header {
        background: #f8f8f8;
        padding: 16px 20px;
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
      }
      
      .quick-actions {
        display: flex;
        gap: 4px;
        padding: 8px;
        background: #f5f5f5;
        border-bottom: 1px solid #e8e8e8;
        flex-shrink: 0;
      }

      .action-button {
        padding: 6px 8px;
        border: 1px solid #4a4a4a;
        border-radius: 4px;
        background: #ffffff;
        color: #2c2c2c;
        font-size: 11px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        white-space: nowrap;
      }

      .action-button:hover {
        background: #4a4a4a;
        color: #ffffff;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      .action-button:active {
        background: #3a3a3a;
        color: #ffffff;
        transform: translateY(1px);
      }

      .chat-header h3 {
        margin: 0;
        color: #2c2c2c;
        font-size: 18px;
        font-weight: 600;
        letter-spacing: -0.01em;
      }


      .settings-scroll-area {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .settings-group {
        background: #ffffff;
        padding: 16px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      }

      h4 {
        margin: 0 0 16px 0;
        font-size: 14px;
        font-weight: 600;
        color: #2c2c2c;
        border-bottom: 1px solid #f0f0f0;
        padding-bottom: 8px;
      }

      .form-group {
        margin-bottom: 12px;
      }

      .form-row {
        display: flex;
        gap: 12px;
      }

      .form-row .form-group {
        flex: 1;
      }

      .input-label {
        display: block;
        margin-bottom: 6px;
        font-size: 12px;
        font-weight: 500;
        color: #2c2c2c;
      }

      .text-input, .select-input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #cccccc;
        border-radius: 6px;
        font-family: inherit;
        font-size: 13px;
        color: #2c2c2c;
        box-sizing: border-box;
        transition: border-color 0.2s ease;
      }

      .text-input:focus, .select-input:focus {
        border-color: #4a4a4a;
        outline: none;
        box-shadow: 0 0 0 2px rgba(74, 74, 74, 0.1);
      }

      .checkbox-group {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
      }

      .actions-container {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        padding: 0 16px 16px;
        background: #ffffff;
        border-top: 1px solid #e0e0e0;
        flex-shrink: 0;
      }

      .primary-button, .secondary-button {
        flex: 1;
        padding: 8px 24px;
        border: none;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 14px;
      }

      .primary-button {
        background: #2c2c2c;
        color: white;
      }

      .primary-button:hover {
        background: #000000;
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      .primary-button:active {
        transform: translateY(0);
      }

      .secondary-button {
        background: transparent;
        color: #666;
        border: 1px solid #ccc;
      }

      .secondary-button:hover {
        background: #f5f5f5;
        color: #333;
        border-color: #999;
      }

      .secondary-button:active {
        transform: translateY(0);
      }

      .close-panel-button {
        padding: 8px 16px;
        background: transparent;
        color: #666;
        border: 1px solid #ccc;
        border-radius: 6px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .close-panel-button:hover {
        background: #f5f5f5;
        color: #333;
        border-color: #999;
      }

      /* Scrollbar styling */
      ::-webkit-scrollbar {
        width: 8px;
      }
      ::-webkit-scrollbar-track {
        background: transparent;
      }
      ::-webkit-scrollbar-thumb {
        background: #d0d0d0;
        border-radius: 4px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: #b0b0b0;
      }
    </style>
  `;
}
