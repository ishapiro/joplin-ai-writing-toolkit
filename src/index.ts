// AI Writing Toolkit Plugin - TypeScript Implementation
import { ChatGPTAPI, ensureModelsFetchedAndGetOptions } from './api';
import { registerPluginSettings } from './settings';
import { getPanelHtml } from './panel';
import { getPublishingPanelHtml } from './publishing/panel';
import { parseFrontMatter, updateFrontMatter, webviewToPluginSettings, pluginToWebviewSettings } from './publishing/utils';
import { generatePreviewHtml } from './publishing/preview';
import { getOptionsDialogHtml } from './optionsDialog';
import { getPreviewPanelHtml } from './publishing/previewPanel';
import { PanelHandler } from './handlers';
import { MenuItemLocation } from './types';
import { 
  getCurrentNote, 
  getSelectedText, 
  replaceSelectedText, 
  copyToClipboard,
  openSystemPromptFileInEditor 
} from './utils';

declare const joplin: any;

// Register the plugin
joplin.plugins.register({
  onStart: async function() {
    console.info('AI Writing Toolkit Plugin started!');

    try {
      // 1. Initialize Settings
      await registerPluginSettings();
      
      // 2. Initialize API & Models (but don't fetch modelOptions yet)
      const chatGPTAPI = new ChatGPTAPI();
      await chatGPTAPI.loadSettings();

      // 2a. First-run check: warn if OpenAI API key is missing (supported Joplin UI)
      try {
        const apiKeyRaw = (await joplin.settings.value('openaiApiKey')) || '';
        const apiKey = String(apiKeyRaw).trim();

        const looksLikeRealOpenAIApiKey = (key: string): boolean => {
          if (!key) return false;
          const k = key.trim();

          // Common placeholders / invalid values
          const lower = k.toLowerCase();
          if (
            k === 'sk-...' ||
            k.includes('...') ||
            lower.includes('your') ||
            lower.includes('api key') ||
            lower.includes('apikey') ||
            lower.includes('replace') ||
            lower.includes('insert') ||
            lower.includes('todo')
          ) {
            return false;
          }

          // Basic OpenAI key formats (best-effort; avoids accepting obvious defaults)
          // Examples: sk-..., sk-proj-...
          // Allow underscores/dashes; require a reasonable length after prefix.
          const re = /^sk-(proj-)?[A-Za-z0-9_-]{20,}$/;
          return re.test(k);
        };

        if (!looksLikeRealOpenAIApiKey(apiKey)) {
          // Show on every app start until a real-looking key is set.
          await joplin.views.dialogs.showMessageBox(
            'AI Writing Toolkit needs an OpenAI API key to work.\n\n' +
            'Configure it here:\n' +
            'Tools > Cogitations Plugins > Options\n\n' +
            'Get an API key from:\n' +
            'https://platform.openai.com/api-keys'
          );
        }
      } catch (warnError: any) {
        console.warn('AI Writing Toolkit: could not run API key startup check:', warnError?.message || warnError);
      }
      
      // Panel references - will be lazy-loaded
      let chatPanel: any = null;
      let chatHandler: PanelHandler | null = null;
      let publishingPanel: any = null;
      let isPreviewMode = false;
      let modelOptions: string = '';
      let optionsDialog: any = null;
      
      // Lazy initialization function for Chat Panel
      const ensureChatPanel = async () => {
        if (!chatPanel) {
          console.info('DEBUG: Lazy-loading Chat Panel...');
          const panelId = 'chatgpt.toolbox.panel';
          chatPanel = await joplin.views.panels.create(panelId);
          
          // Fetch model options only when needed
          if (!modelOptions) {
            const apiKey = await joplin.settings.value('openaiApiKey');
            modelOptions = await ensureModelsFetchedAndGetOptions(apiKey);
          }
          
          await joplin.views.panels.setHtml(chatPanel, getPanelHtml(modelOptions));
          await joplin.views.panels.addScript(chatPanel, './webview.js');
          
          // Initialize Handler
          chatHandler = new PanelHandler(chatGPTAPI, chatPanel);
          
          // Set up message handler
          await joplin.views.panels.onMessage(chatPanel, async (message: any) => {
            if (chatHandler) {
              return await chatHandler.handleMessage(message);
            }
          });
          
          console.info('DEBUG: Chat Panel loaded and initialized.');
        }
        return chatPanel;
      };
      
      // Lazy initialization function for Publishing Panel
      const ensurePublishingPanel = async () => {
        if (!publishingPanel) {
          console.info('DEBUG: Lazy-loading Publishing Panel...');
          const publishingPanelId = 'publishing.panel';
          publishingPanel = await joplin.views.panels.create(publishingPanelId);
          
          // REGISTER SCRIPT ONCE: Joplin runs this script every time setHtml is called.
          await joplin.views.panels.addScript(publishingPanel, './publishing/webview.js');
          const panelHtml = getPublishingPanelHtml();
          console.info('DEBUG: PDF Publishing Panel HTML generated');
          console.info('DEBUG: Panel HTML includes "includeTitlePage":', panelHtml.includes('includeTitlePage'));
          console.info('DEBUG: Panel HTML includes "Include Title Page":', panelHtml.includes('Include Title Page'));
          await joplin.views.panels.setHtml(publishingPanel, panelHtml);
          
          // Set up message handler
          await joplin.views.panels.onMessage(publishingPanel, async (message: any) => {
            const toFileUrl = (absolutePath: string): string => {
              // Joplin webviews generally can load local files via file://
              // Ensure forward slashes and proper URL encoding.
              const normalized = absolutePath.replace(/\\/g, '/');
              // Add leading slash for Windows drive paths (C:/...)
              const withScheme = normalized.match(/^[A-Za-z]:\//) ? `file:///${normalized}` : `file://${normalized}`;
              return encodeURI(withScheme);
            };

            const resolveJoplinResourceUrlsInHtml = async (html: string): Promise<string> => {
              if (!html) return html;

              // Joplin resource URLs in rendered HTML look like src=":/<resourceId>" or href=":/<resourceId>"
              // They won't resolve in a generic webview during print-to-PDF, so rewrite to file:// URLs.
              const re = /\b(?:src|href)=["']:(?:\/)?([0-9a-fA-F]{32})["']/g;
              const ids = new Set<string>();
              let m: RegExpExecArray | null;
              while ((m = re.exec(html)) !== null) {
                if (m[1]) ids.add(m[1]);
              }
              if (!ids.size) return html;

              const idToFileUrl = new Map<string, string>();
              for (const id of ids) {
                try {
                  const resourcePath = await joplin.data.resourcePath(id);
                  if (resourcePath) idToFileUrl.set(id, toFileUrl(resourcePath));
                } catch (e) {
                  // Leave unresolved resource URLs as-is
                }
              }
              if (!idToFileUrl.size) return html;

              return html.replace(re, (match: string, id: string) => {
                const fileUrl = idToFileUrl.get(id);
                if (!fileUrl) return match;
                // Replace only the attribute value portion, preserving whether it was src or href and quote style.
                return match.replace(/:(?:\/)?[0-9a-fA-F]{32}/, fileUrl);
              });
            };

            const extractFirstResourceIdFromNoteBody = (body: string): string | null => {
              if (!body) return null;
              // Markdown resource image: ![alt](:resourceId)
              const mdMatch = body.match(/!\[[^\]]*\]\(:\/?([0-9a-fA-F]{32})\)/);
              if (mdMatch?.[1]) return mdMatch[1];
              // HTML image: <img src=":/resourceId">
              const htmlMatch = body.match(/<img[^>]+src=["']:\/*([0-9a-fA-F]{32})["']/i);
              if (htmlMatch?.[1]) return htmlMatch[1];
              return null;
            };

            const resolveLogoInputToSrc = async (logoInput: string | undefined): Promise<string> => {
              const raw = (logoInput || '').trim();
              if (!raw) return '';

              // If it looks like a URL, leave as-is.
              if (/^https?:\/\//i.test(raw)) return raw;

              // Allow ":<id>" and ":/<id>" forms
              const maybeId = raw.startsWith(':/') ? raw.slice(2).trim()
                : raw.startsWith(':') ? raw.slice(1).trim()
                : raw;

              // IDs in Joplin are 32 hex chars (notes and resources)
              if (!/^[0-9a-fA-F]{32}$/.test(maybeId)) {
                // Could be a filesystem path or other URL type; return as-is
                return raw;
              }

              // First try treating it as a note ID: use the first embedded image resource in that note.
              try {
                const note = await joplin.data.get(['notes', maybeId], { fields: ['id', 'body'] });
                if (note?.body) {
                  const rid = extractFirstResourceIdFromNoteBody(note.body);
                  if (rid) {
                    const resourcePath = await joplin.data.resourcePath(rid);
                    return toFileUrl(resourcePath);
                  }
                }
              } catch (e) {
                // Not a note ID (or no access) - fall through to resource ID resolution.
              }

              // Treat as a resource ID
              try {
                const resourcePath = await joplin.data.resourcePath(maybeId);
                return toFileUrl(resourcePath);
              } catch (e) {
                // Unknown ID - return original
                return raw;
              }
            };

            const resolvePublishingSettingsForPreview = async (pluginSettings: any): Promise<any> => {
              const resolved = { ...(pluginSettings || {}) };
              resolved.logo = await resolveLogoInputToSrc(resolved.logo);
              return resolved;
            };

            if (message.type === 'closePanel') {
              // Send a nicely formatted close message to the panel before closing
              console.info('DEBUG: Received closePanel message, showing close message.');
              await joplin.views.panels.postMessage(publishingPanel, {
                type: 'showCloseMessage'
              });
            } else if (message.type === 'confirmClose') {
              // Actually close the panel after user confirms
              console.info('DEBUG: Received confirmClose message, hiding panel.');
              await joplin.views.panels.hide(publishingPanel);
            } else if (message.type === 'cancelClose') {
              // Restore the panel HTML when user cancels close
              console.info('DEBUG: Received cancelClose message, restoring panel.');
              await joplin.views.panels.setHtml(publishingPanel, getPublishingPanelHtml());
              // Refresh settings from note after a brief delay
              setTimeout(async () => {
                try {
                  const note = await getCurrentNote();
                  const settings = parseFrontMatter(note.body);
                  const webviewSettings = pluginToWebviewSettings(settings);
                  await joplin.views.panels.postMessage(publishingPanel, {
                    type: 'updatePanelFields',
                    settings: webviewSettings
                  });
                } catch (error) {
                  console.error('DEBUG: Error restoring panel fields:', error);
                }
              }, 200);
            } else if (message.type === 'closePublishingPanel') {
              // Legacy handler - for backwards compatibility
              console.info('DEBUG: Received closePublishingPanel message.');
              await joplin.views.panels.hide(publishingPanel);
            } else if (message.type === 'closePreview') {
              console.info('DEBUG: Received closePreview message.');
              // Use the registered command to ensure consistent behavior when returning to settings
              await joplin.commands.execute('openPublishingPanel');
            } else if (message.type === 'refreshPreview') {
              try {
                console.info('DEBUG: Received refreshPreview message.');
                const note = await getCurrentNote();
                const settings = parseFrontMatter(note.body);
                const pluginSettings = await resolvePublishingSettingsForPreview(webviewToPluginSettings(settings));
                const previewHtmlRaw = generatePreviewHtml(note.body, note.title, pluginSettings);
                const previewHtml = await resolveJoplinResourceUrlsInHtml(previewHtmlRaw);
                await joplin.views.panels.setHtml(publishingPanel, getPreviewPanelHtml(previewHtml));
              } catch (error) {
                console.error('DEBUG: Error refreshing preview:', error);
              }
            } else if (message.type === 'refreshFromNote') {
              try {
                console.info('DEBUG: Received refreshFromNote message.');
                const note = await getCurrentNote();
                const settings = parseFrontMatter(note.body);
                const webviewSettings = pluginToWebviewSettings(settings);
                await joplin.views.panels.postMessage(publishingPanel, {
                  type: 'updatePanelFields',
                  settings: webviewSettings
                });
              } catch (error) {}
            } else if (message.type === 'generatePreview') {
              try {
                console.info('DEBUG: Received generatePreview message with settings:', message.settings);
                const note = await getCurrentNote();
                const pluginSettings = await resolvePublishingSettingsForPreview(webviewToPluginSettings(message.settings));
                const previewHtmlRaw = generatePreviewHtml(note.body, note.title, pluginSettings);
                const previewHtml = await resolveJoplinResourceUrlsInHtml(previewHtmlRaw);
                isPreviewMode = true;
                
                const chatPanelInstance = await ensureChatPanel();
                console.info('DEBUG: Hiding AI panel before preview.');
                await joplin.views.panels.hide(chatPanelInstance);
                console.info('DEBUG: Setting preview HTML on publishing panel.');
                await joplin.views.panels.setHtml(publishingPanel, getPreviewPanelHtml(previewHtml));
                console.info('DEBUG: Showing publishing panel (preview mode).');
                await joplin.views.panels.show(publishingPanel);
              } catch (error) {
                console.error('DEBUG: Error generating preview:', error);
              }
            } else if (message.type === 'updateNoteMetadata') {
              try {
                console.info('DEBUG: Received updateNoteMetadata message.');
                const note = await getCurrentNote();
                const pluginSettings = webviewToPluginSettings(message.settings);
                const newBody = updateFrontMatter(note.body, pluginSettings);
                if (newBody !== note.body) {
                   await joplin.data.put(['notes', note.id], null, { body: newBody });
                }
              } catch (error) {}
            }
          });
          
          console.info('DEBUG: Publishing Panel loaded and initialized.');
        }
        return publishingPanel;
      };
      
      // 3. Register Commands
      await joplin.commands.register({
        name: 'openChatGPTPanel',
        label: 'Open AI Writing Toolkit Panel',
        iconName: 'fas fa-robot',
        execute: async () => {
          const chatPanelInstance = await ensureChatPanel();
          const publishingPanelInstance = publishingPanel ? publishingPanel : null;
          if (publishingPanelInstance) {
            await joplin.views.panels.hide(publishingPanelInstance);
          }
          await joplin.views.panels.show(chatPanelInstance);
        },
      });

      await joplin.commands.register({
        name: 'toggleChatGPTToolbox',
        label: 'Toggle AI Writing Toolkit',
        execute: async () => {
          const chatPanelInstance = await ensureChatPanel();
          const isVisible = await joplin.views.panels.visible(chatPanelInstance);
          if (isVisible) {
            await joplin.views.panels.hide(chatPanelInstance);
          } else {
            const publishingPanelInstance = publishingPanel ? publishingPanel : null;
            if (publishingPanelInstance) {
              await joplin.views.panels.hide(publishingPanelInstance);
            }
            await joplin.views.panels.show(chatPanelInstance);
          }
        },
      });

      await joplin.commands.register({
        name: 'openSystemPromptFile',
        label: 'Open System Prompt File',
        iconName: 'fas fa-file-alt',
        execute: async () => {
          await openSystemPromptFileInEditor();
        },
      });

      await joplin.commands.register({
        name: 'insertNoteBlock',
        label: 'Insert Note Block',
        execute: async () => {
          await joplin.commands.execute('replaceSelection', '\n```note\n\n```\n');
        },
      });

      await joplin.commands.register({
        name: 'openPublishingPanel',
        label: 'PDF Publishing',
        iconName: 'fas fa-print',
        execute: async () => {
           console.info('DEBUG: openPublishingPanel command executing.');
           const publishingPanelInstance = await ensurePublishingPanel();
           
           // Hide chat panel if it exists
           if (chatPanel) {
             console.info('DEBUG: Hiding AI Writing Tools panel.');
             await joplin.views.panels.hide(chatPanel);
           }
           
           if (isPreviewMode) {
             console.info('DEBUG: Leaving preview mode, restoring settings HTML.');
             isPreviewMode = false;
             await joplin.views.panels.setHtml(publishingPanelInstance, getPublishingPanelHtml());
           }
           
           console.info('DEBUG: Showing publishing panel.');
           await joplin.views.panels.show(publishingPanelInstance);
           
           setTimeout(async () => {
             try {
               const note = await getCurrentNote();
               const settings = parseFrontMatter(note.body);
               const webviewSettings = pluginToWebviewSettings(settings);
               console.info('DEBUG: Posting updatePanelFields to publishing panel.');
               await joplin.views.panels.postMessage(publishingPanelInstance, {
                 type: 'updatePanelFields',
                 settings: webviewSettings
               });
             } catch (error) {
               console.error('DEBUG: Error updating panel fields:', error);
             }
           }, 200);
        },
      });

      // Register command to open options dialog
      await joplin.commands.register({
        name: 'openOptionsDialog',
        label: 'Options',
        iconName: 'fas fa-cog',
        execute: async () => {
          try {
            // Lazy initialize dialog
            if (!optionsDialog) {
              optionsDialog = await joplin.views.dialogs.create('optionsDialog');
              // Load dialog JS (inline <script> is not reliably executed in Joplin dialogs)
              await joplin.views.dialogs.addScript(optionsDialog, './optionsDialogWebview.js');
            }
            
            // Load current settings
            const systemPromptContent = await chatGPTAPI.loadSystemPromptFromFile();
            const currentSettings = {
              openaiApiKey: await joplin.settings.value('openaiApiKey') || '',
              openaiModel: await joplin.settings.value('openaiModel') || '',
              maxTokens: await joplin.settings.value('maxTokens') || 50000,
              autoSave: await joplin.settings.value('autoSave') !== false,
              reasoningEffort: await joplin.settings.value('reasoningEffort') || 'low',
              verbosity: await joplin.settings.value('verbosity') || 'low',
              webAccessEnabled: await joplin.settings.value('webAccessEnabled') === true,
              webAccessAllowedDomains: await joplin.settings.value('webAccessAllowedDomains') || '',
              webAccessMaxUrls: await joplin.settings.value('webAccessMaxUrls') || 3,
              webAccessMaxCharsPerUrl: await joplin.settings.value('webAccessMaxCharsPerUrl') || 15000,
              systemPromptFile: await joplin.settings.value('systemPromptFile') || '',
              systemPromptContent: systemPromptContent || '',
              pluginVersion: await joplin.settings.value('pluginVersion') || '',
            };
            
            // Load model options for dropdown
            let modelOptionsForDialog: {[key: string]: string} = {};
            try {
              const storedModelsStr = await joplin.settings.value('modelCache');
              if (storedModelsStr) {
                const models = JSON.parse(storedModelsStr);
                modelOptionsForDialog[''] = '(Auto-select latest general model)';
                models.forEach((model: any) => {
                  const displayName = model.id === 'gpt-5.2' ? 'GPT-5.2 (Latest)' : 
                                     model.id.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
                  modelOptionsForDialog[model.id] = displayName;
                });
              } else {
                modelOptionsForDialog[''] = '(Auto-select latest general model)';
              }
            } catch (e) {
              modelOptionsForDialog[''] = '(Auto-select latest general model)';
            }
            
            // Set dialog HTML
            const dialogHtml = getOptionsDialogHtml(currentSettings, modelOptionsForDialog);
            await joplin.views.dialogs.setHtml(optionsDialog, dialogHtml);
            
            // Set dialog buttons
            await joplin.views.dialogs.setButtons(optionsDialog, [
              { id: 'cancel', title: 'Cancel' },
              // Use a submit-like button id so Joplin returns formData
              { id: 'submit', title: 'Save' }
            ]);
            
            // Set dialog to not fit content so we can control the width via CSS
            await joplin.views.dialogs.setFitToContent(optionsDialog, false);
            
            // Open dialog and wait for result
            const result = await joplin.views.dialogs.open(optionsDialog);
            
            // Handle result - formData contains all form values when Save is clicked
            if (result.id === 'submit' && result.formData) {
              // Joplin may nest form data by form name
              const formData = (result.formData as any).optionsForm ?? result.formData;
              
              // Save all settings using the same storage mechanism
              await joplin.settings.setValue('openaiApiKey', formData.openaiApiKey || '');
              await joplin.settings.setValue('openaiModel', formData.openaiModel || '');
              await joplin.settings.setValue('maxTokens', parseInt(formData.maxTokens) || 50000);
              // Checkbox: 'on' when checked, undefined when unchecked
              await joplin.settings.setValue('autoSave', formData.autoSave === 'on' || formData.autoSave === true || formData.autoSave === 'true');
              await joplin.settings.setValue('reasoningEffort', formData.reasoningEffort || 'low');
              await joplin.settings.setValue('verbosity', formData.verbosity || 'low');
              await joplin.settings.setValue('webAccessEnabled', formData.webAccessEnabled === 'on' || formData.webAccessEnabled === true || formData.webAccessEnabled === 'true');
              await joplin.settings.setValue('webAccessAllowedDomains', String(formData.webAccessAllowedDomains || ''));
              await joplin.settings.setValue('webAccessMaxUrls', parseInt(formData.webAccessMaxUrls) || 3);
              await joplin.settings.setValue('webAccessMaxCharsPerUrl', parseInt(formData.webAccessMaxCharsPerUrl) || 15000);

              // Save system prompt (if present)
              if (typeof formData.systemPromptContent !== 'undefined') {
                try {
                  const fs = require('fs');
                  const promptFile = await chatGPTAPI.getSystemPromptFilePath();
                  fs.writeFileSync(promptFile, String(formData.systemPromptContent ?? ''), 'utf8');
                  await joplin.settings.setValue('systemPromptFile', promptFile);
                } catch (promptError: any) {
                  console.error('Error saving system prompt file:', promptError);
                  // Don't fail the whole save
                }
              }
              
              // Mark model as user-set if they changed it
              if (formData.openaiModel) {
                await joplin.settings.setValue('openaiModelUserSet', true);
              }
              
              // Reload API settings
              await chatGPTAPI.loadSettings();
              
              await joplin.views.dialogs.showMessageBox('Settings saved successfully!');
            }
          } catch (error: any) {
            console.error('Error opening options dialog:', error);
            await joplin.views.dialogs.showMessageBox(`Error opening options dialog: ${error.message}`);
          }
        },
      });

      await joplin.workspace.onNoteSelectionChange(async () => {
        if (publishingPanel) {
          const isVisible = await joplin.views.panels.visible(publishingPanel);
          if (isVisible) {
            if (isPreviewMode) {
              isPreviewMode = false;
              await joplin.views.panels.setHtml(publishingPanel, getPublishingPanelHtml());
            }
            
            setTimeout(async () => {
              try {
                const note = await getCurrentNote();
                const settings = parseFrontMatter(note.body);
                const webviewSettings = pluginToWebviewSettings(settings);
                await joplin.views.panels.postMessage(publishingPanel, {
                  type: 'updatePanelFields',
                  settings: webviewSettings
                });
              } catch (error) {}
            }, 200);
          }
        }
      });

      // 7. Menu Items
      await joplin.views.menus.create('ai-writing-toolkit-menu', 'Cogitations Plugins', [
        { commandName: 'openChatGPTPanel', label: 'Open Chat Panel' },
        { commandName: 'openPublishingPanel', label: 'PDF Publishing' },
        { commandName: 'insertNoteBlock', label: 'Insert Note Block', accelerator: 'CmdOrCtrl+Shift+3' },
        { commandName: 'openOptionsDialog', label: 'Cogitations Options' },
      ], MenuItemLocation.Tools);

    } catch (error: any) {
      console.error('Error initializing AI Writing Toolkit Plugin:', error);
    }
  },
});
