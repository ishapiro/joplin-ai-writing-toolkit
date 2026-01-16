// Options Dialog HTML Generator
export function getOptionsDialogHtml(
  settings: {
    openaiApiKey: string;
    openaiModel: string;
    maxTokens: number;
    autoSave: boolean;
    reasoningEffort: string;
    verbosity: string;
    webAccessEnabled: boolean;
    webAccessAllowedDomains: string;
    webAccessMaxUrls: number;
    webAccessMaxCharsPerUrl: number;
    systemPromptFile: string;
    systemPromptContent: string;
    pluginVersion: string;
  },
  modelOptions: {[key: string]: string}
): string {
  // Helper function to escape HTML
  const escapeHtml = (text: string): string => {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // Generate model options HTML
  const modelOptionsHtml = Object.entries(modelOptions)
    .map(([value, label]) => {
      const escapedValue = escapeHtml(value);
      const escapedLabel = escapeHtml(label);
      const selected = settings.openaiModel === value ? 'selected' : '';
      return `<option value="${escapedValue}" ${selected}>${escapedLabel}</option>`;
    })
    .join('\n');

  // Generate reasoning effort options
  const reasoningEffortOptions = ['low', 'medium', 'high']
    .map(val => `<option value="${val}" ${settings.reasoningEffort === val ? 'selected' : ''}>${val.charAt(0).toUpperCase() + val.slice(1)}</option>`)
    .join('\n');

  // Generate verbosity options
  const verbosityOptions = ['low', 'medium', 'high']
    .map(val => `<option value="${val}" ${settings.verbosity === val ? 'selected' : ''}>${val.charAt(0).toUpperCase() + val.slice(1)}</option>`)
    .join('\n');

  return `
    <form id="optionsForm" name="optionsForm">
      <div class="options-container">
        <div class="options-header">
          <h3>AI Writing Toolkit Options</h3>
        </div>
        
        <div class="options-scroll-area">
          <div class="options-group">
            <h4>API Configuration</h4>
            <div class="form-group">
              <label class="input-label">OpenAI API Key</label>
              <input type="password" id="openaiApiKey" name="openaiApiKey" class="text-input" value="${escapeHtml(settings.openaiApiKey || '')}" placeholder="sk-...">
              <div class="checkbox-group" style="margin-top: 8px; margin-bottom: 0;">
                <input type="checkbox" id="showApiKeyToggle">
                <label for="showApiKeyToggle" class="input-label" style="margin-bottom: 0;">Show API key</label>
              </div>
              <div class="help-text">Your OpenAI API key for ChatGPT access. Get one from <a href="https://platform.openai.com/api-keys" target="_blank">https://platform.openai.com/api-keys</a></div>
            </div>
            <div class="form-group">
              <label class="input-label">OpenAI Model</label>
              <select id="openaiModel" name="openaiModel" class="select-input">
                ${modelOptionsHtml}
              </select>
              <div class="help-text">Select a model from the dropdown, or choose "(Auto-select latest general model)" to automatically use the newest general model.</div>
            </div>
            <div class="form-group">
              <label class="input-label">Max Tokens</label>
              <input type="number" id="maxTokens" name="maxTokens" class="text-input" value="${settings.maxTokens || 50000}" min="1" max="200000" step="1">
              <div class="help-text">Maximum number of completion tokens to generate in responses</div>
            </div>
          </div>

          <div class="options-group">
            <h4>Model Behavior</h4>
            <div class="form-group">
              <label class="input-label">Reasoning Effort</label>
              <select id="reasoningEffort" name="reasoningEffort" class="select-input">
                ${reasoningEffortOptions}
              </select>
              <div class="help-text">Controls depth of reasoning for GPT-5 and o-series models</div>
            </div>
            <div class="form-group">
              <label class="input-label">Verbosity</label>
              <select id="verbosity" name="verbosity" class="select-input">
                ${verbosityOptions}
              </select>
              <div class="help-text">Controls response detail level for GPT-5 and o-series models</div>
            </div>
          </div>

          <div class="options-group">
            <h4>General Settings</h4>
            <div class="checkbox-group">
              <input type="checkbox" id="autoSave" name="autoSave" ${settings.autoSave ? 'checked' : ''}>
              <label for="autoSave" class="input-label" style="margin-bottom: 0;">Auto-save Changes</label>
            </div>
            <div class="help-text">Automatically save note changes after AI operations</div>
          </div>

          <div class="options-group">
            <h4>Web Access (Optional)</h4>
            <div class="checkbox-group">
              <input type="checkbox" id="webAccessEnabled" name="webAccessEnabled" ${settings.webAccessEnabled ? 'checked' : ''}>
              <label for="webAccessEnabled" class="input-label" style="margin-bottom: 0;">Enable fetching URLs from your prompt</label>
            </div>
            <div class="help-text">
              When enabled, the plugin enables the OpenAI Responses API <code>web_search</code> tool so the model can open URLs you include in your prompt.
              Use the allowlist below to constrain where the model is allowed to browse.
            </div>
            <div class="form-group" style="margin-top: 14px;">
              <label class="input-label">Allowed Domains (optional allowlist)</label>
              <textarea id="webAccessAllowedDomains" name="webAccessAllowedDomains" class="prompt-textarea" rows="4" placeholder="example.com&#10;*.wikipedia.org">${escapeHtml(settings.webAccessAllowedDomains || '')}</textarea>
              <div class="help-text">Comma or newline separated. If blank, any public domain in your prompt may be fetched.</div>
            </div>
            <div class="form-group">
              <label class="input-label">Max URLs per prompt</label>
              <input type="number" id="webAccessMaxUrls" name="webAccessMaxUrls" class="text-input" value="${settings.webAccessMaxUrls || 3}" min="0" max="20" step="1">
              <div class="help-text">0 disables fetching even if enabled.</div>
            </div>
            <div class="form-group">
              <label class="input-label">Max characters per URL</label>
              <input type="number" id="webAccessMaxCharsPerUrl" name="webAccessMaxCharsPerUrl" class="text-input" value="${settings.webAccessMaxCharsPerUrl || 15000}" min="1000" max="200000" step="500">
              <div class="help-text">After HTML is converted to text, the content is truncated to this limit.</div>
            </div>
          </div>

          <div class="options-group">
            <h4>System Prompt</h4>
            <div class="form-group">
              <label class="input-label">System Prompt File Path</label>
              <input type="text" id="systemPromptFile" class="text-input" value="${escapeHtml(settings.systemPromptFile || '')}" readonly>
              <div class="help-text">Full path to the system prompt file. After editing, click the dialog's <strong>Save</strong> button to apply changes.</div>
              <button type="button" id="editSystemPromptButton" class="edit-prompt-button">Edit System Prompt</button>
            </div>
          </div>
          
          <!-- System Prompt Editor Modal -->
          <div id="systemPromptModal" class="prompt-modal" style="display: none;">
            <div class="prompt-modal-content">
              <div class="prompt-modal-header">
                <h3>Edit System Prompt</h3>
                <button type="button" id="closePromptModal" class="close-modal-button">&times;</button>
              </div>
              <div class="prompt-modal-body">
                <label class="input-label">System Prompt Content</label>
                <textarea id="systemPromptContent" name="systemPromptContent" class="prompt-textarea" rows="20" placeholder="Enter system prompt content...">${escapeHtml(settings.systemPromptContent || '')}</textarea>
                <div class="help-text">Edit the system prompt that will be used for all AI interactions.</div>
              </div>
              <div class="prompt-modal-footer">
                <button type="button" id="cancelPromptEdit" class="cancel-button">Cancel</button>
                <button type="button" id="savePromptEdit" class="save-button">Done</button>
              </div>
            </div>
          </div>

          <div class="options-group">
            <h4>Plugin Information</h4>
            <div class="form-group">
              <label class="input-label">Plugin Version & Status</label>
              <input type="text" id="pluginVersion" class="text-input" value="${escapeHtml(settings.pluginVersion || '')}" readonly>
              <div class="help-text">Shows the current plugin version and when it was last loaded.</div>
            </div>
          </div>
        </div>
      </div>
    </form>

    <style>
      html, body {
        height: 100%;
      }

      body {
        min-width: 700px;
        width: 100%;
        margin: 0;
        overflow: hidden; /* keep scrolling inside .options-scroll-area */
      }

      #optionsForm {
        height: 100%;
      }
      
      .options-container {
        display: flex;
        flex-direction: column;
        /* In Joplin dialogs, 100% height isn't always reliable; use viewport height */
        min-height: 500px;
        height: 100vh;
        max-height: 100vh;
        width: 100%;
        min-width: 700px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        background: #fafafa;
        color: #2c2c2c;
      }

      .options-header {
        background: #f8f8f8;
        padding: 16px 20px;
        border-bottom: 1px solid #e0e0e0;
        flex-shrink: 0;
      }

      .options-header h3 {
        margin: 0;
        color: #2c2c2c;
        font-size: 18px;
        font-weight: 600;
        letter-spacing: -0.01em;
      }

      .options-scroll-area {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .options-group {
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
        margin-bottom: 16px;
      }

      .form-group:last-child {
        margin-bottom: 0;
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

      .text-input[readonly] {
        background: #f5f5f5;
        color: #666;
        cursor: not-allowed;
      }

      .help-text {
        margin-top: 6px;
        font-size: 11px;
        color: #666;
        line-height: 1.4;
      }

      .help-text a {
        color: #0066cc;
        text-decoration: none;
      }

      .help-text a:hover {
        text-decoration: underline;
      }

      .checkbox-group {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }

      .checkbox-group input[type="checkbox"] {
        width: auto;
        margin: 0;
      }

      .edit-prompt-button {
        margin-top: 8px;
        padding: 8px 16px;
        background: #2c2c2c;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .edit-prompt-button:hover {
        background: #000000;
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      .prompt-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .prompt-modal-content {
        background: white;
        border-radius: 8px;
        width: 90%;
        max-width: 800px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      }

      .prompt-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid #e0e0e0;
      }

      .prompt-modal-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #2c2c2c;
      }

      .close-modal-button {
        background: none;
        border: none;
        font-size: 24px;
        color: #666;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s;
      }

      .close-modal-button:hover {
        background: #f5f5f5;
        color: #000;
      }

      .prompt-modal-body {
        padding: 20px;
        flex: 1;
        overflow-y: auto;
      }

      .prompt-textarea {
        width: 100%;
        padding: 12px;
        border: 1px solid #cccccc;
        border-radius: 6px;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        line-height: 1.5;
        resize: vertical;
        min-height: 400px;
        box-sizing: border-box;
        color: #2c2c2c;
      }

      .prompt-textarea:focus {
        border-color: #4a4a4a;
        outline: none;
        box-shadow: 0 0 0 2px rgba(74, 74, 74, 0.1);
      }

      .prompt-modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 16px 20px;
        border-top: 1px solid #e0e0e0;
      }

      .prompt-modal-footer .cancel-button,
      .prompt-modal-footer .save-button {
        padding: 8px 24px;
        border: none;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 14px;
      }

      .prompt-modal-footer .save-button {
        background: #2c2c2c;
        color: white;
      }

      .prompt-modal-footer .save-button:hover {
        background: #000000;
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      .prompt-modal-footer .cancel-button {
        background: transparent;
        color: #666;
        border: 1px solid #ccc;
      }

      .prompt-modal-footer .cancel-button:hover {
        background: #f5f5f5;
        color: #333;
        border-color: #999;
      }

      .prompt-modal-footer .save-button:focus,
      .prompt-modal-footer .cancel-button:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba(74, 74, 74, 0.2);
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
