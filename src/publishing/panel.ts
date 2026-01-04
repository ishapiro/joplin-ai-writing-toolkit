
export function getPublishingPanelHtml(): string {
  return `
    <div class="chat-container">
      <div class="chat-header">
        <h3>PDF Publishing Settings</h3>
        <button class="close-button" id="closeButton" title="Close Panel">✕</button>
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
            <input type="text" id="docLogo" class="text-input" placeholder="Image resource ID or URL">
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
        <button id="refreshButton" class="secondary-button">Refresh from Note</button>
        <button id="previewButton" class="primary-button">Generate Preview</button>
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

      .chat-header h3 {
        margin: 0;
        color: #2c2c2c;
        font-size: 18px;
        font-weight: 600;
        letter-spacing: -0.01em;
      }

      .close-button {
        background: transparent;
        color: #666666;
        border: none;
        font-size: 18px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: all 0.2s ease;
      }

      .close-button:hover {
        background: rgba(0, 0, 0, 0.1);
        color: #333333;
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
        padding: 16px;
        background: #ffffff;
        border-top: 1px solid #e0e0e0;
        flex-shrink: 0;
        display: flex;
        gap: 10px;
      }

      .primary-button, .secondary-button {
        flex: 1;
        padding: 10px 24px;
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
