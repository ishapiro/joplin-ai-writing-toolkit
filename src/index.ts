// AI Writing Toolkit Plugin - TypeScript Implementation
import { ChatGPTAPI, ensureModelsFetchedAndGetOptions } from './api';
import { registerPluginSettings } from './settings';
import { getPanelHtml } from './panel';
import { getPublishingPanelHtml } from './publishing/panel';
import { parseFrontMatter, updateFrontMatter, webviewToPluginSettings, pluginToWebviewSettings } from './publishing/utils';
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
      
      // 2. Initialize API & Models
      const chatGPTAPI = new ChatGPTAPI();
      // Load settings to ensure API key is available
      await chatGPTAPI.loadSettings();
      
      // Get API key for fetching models
      const apiKey = await joplin.settings.value('openaiApiKey');
      
      // Ensure models are fetched/cached and get options HTML for panel
      const modelOptions = await ensureModelsFetchedAndGetOptions(apiKey);
      
      // 3. Create Chat Panel
      const panelId = 'chatgpt.toolbox.panel';
      const panel = await joplin.views.panels.create(panelId);
      console.info('Panel created with ID:', panel, 'panelId:', panelId);
      
      await joplin.views.panels.setHtml(panel, getPanelHtml(modelOptions));
      await joplin.views.panels.addScript(panel, './webview.js');

      
      // 4. Initialize Handler
      const handler = new PanelHandler(chatGPTAPI, panel);
      
      // 5. Register Commands
      console.info('Setting up AI Writing Toolkit commands...');

      // Open ChatGPT Panel
      await joplin.commands.register({
        name: 'openChatGPTPanel',
        label: 'Open AI Writing Toolkit Panel',
        iconName: 'fas fa-robot',
        execute: async () => {
          try {
            await joplin.views.panels.hide(publishingPanel);
            await joplin.views.panels.show(panel);
            console.info('AI Writing Toolkit panel opened via command');
          } catch (error: any) {
            console.error('Error opening chat panel:', error);
          }
        },
      });

      // Toggle ChatGPT Toolbox
      await joplin.commands.register({
        name: 'toggleChatGPTToolbox',
        label: 'Toggle AI Writing Toolkit',
        execute: async () => {
          try {
            const isVisible = await joplin.views.panels.visible(panel);
            if (isVisible) {
              await joplin.views.panels.hide(panel);
            } else {
              await joplin.views.panels.hide(publishingPanel);
              await joplin.views.panels.show(panel);
            }
          } catch (error: any) {
            console.error('Error toggling AI Writing Toolkit:', error);
            await joplin.views.dialogs.showMessageBox('Error toggling AI Writing Toolkit: ' + error.message);
          }
        },
      });

      // Open System Prompt File
      await joplin.commands.register({
        name: 'openSystemPromptFile',
        label: 'Open System Prompt File',
        iconName: 'fas fa-file-alt',
        execute: async () => {
          await openSystemPromptFileInEditor();
        },
      });
      
      // Check Grammar with ChatGPT (Direct Command)
      await joplin.commands.register({
        name: 'checkGrammarWithChatGPT',
        label: 'Check Grammar with ChatGPT',
        execute: async () => {
          try {
            const selectedText = await getSelectedText();
            if (!selectedText || selectedText.trim() === '') {
              await joplin.views.dialogs.showMessageBox('Please select some text to check grammar.');
              return;
            }
            
            const correctedText = await chatGPTAPI.checkGrammar(selectedText);
            await replaceSelectedText(correctedText);
            await joplin.views.dialogs.showMessageBox('Grammar check completed and text updated!');
          } catch (error: any) {
            await joplin.views.dialogs.showMessageBox(`Error: ${error.message}`);
          }
        },
      });
      
      // Copy ChatGPT Response to Clipboard
      await joplin.commands.register({
        name: 'copyChatGPTResponseToClipboard',
        label: 'Copy ChatGPT Response to Clipboard',
        execute: async () => {
          try {
            const lastResponse = handler.getLastResponse();
            if (!lastResponse) {
              await joplin.views.dialogs.showMessageBox('No ChatGPT response available. Send a message first.');
              return;
            }
            await copyToClipboard(lastResponse);
            await joplin.views.dialogs.showMessageBox('ChatGPT response copied to clipboard!');
          } catch (error: any) {
            await joplin.views.dialogs.showMessageBox(`Error: ${error.message}`);
          }
        },
      });
      
      // Use Note as ChatGPT Prompt
      await joplin.commands.register({
        name: 'useNoteAsChatGPTPrompt',
        label: 'Use Note as ChatGPT Prompt',
        execute: async () => {
          try {
            const note = await getCurrentNote();
            const response = await chatGPTAPI.sendMessage(note.body);
            handler.setLastResponse(response);
            await joplin.views.dialogs.showMessageBox(`ChatGPT Response:\n\n${response}`);
          } catch (error: any) {
            await joplin.views.dialogs.showMessageBox(`Error: ${error.message}`);
          }
        },
      });

      // Insert Note Block
      await joplin.commands.register({
        name: 'insertNoteBlock',
        label: 'Insert Note Block',
        execute: async () => {
          await joplin.commands.execute('replaceSelection', '\n```note\n\n```\n');
        },
      });

      // 6. Handle Webview Messages
      await joplin.views.panels.onMessage(panel, async (message: any) => {
        return await handler.handleMessage(message);
      });
      
      console.info('ChatGPT chat panel created successfully!');
      console.info('ChatGPT commands initialized.');

      // --- Publishing Panel Setup ---
      const publishingPanelId = 'publishing.panel';
      const publishingPanel = await joplin.views.panels.create(publishingPanelId);
      await joplin.views.panels.setHtml(publishingPanel, getPublishingPanelHtml());
      await joplin.views.panels.addScript(publishingPanel, './publishing/webview.js');

      // Open Publishing Panel Command
      await joplin.commands.register({
        name: 'openPublishingPanel',
        label: 'PDF Publishing Settings',
        iconName: 'fas fa-print',
        execute: async () => {
           await joplin.views.panels.hide(panel);
           await joplin.views.panels.show(publishingPanel);
           
           // Load current note metadata after a short delay to ensure webview is ready
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
               console.error('Error loading note metadata:', error);
             }
           }, 100);
        },
      });

      // Handle Publishing Panel Messages
      await joplin.views.panels.onMessage(publishingPanel, async (message: any) => {
        if (message.type === 'closePublishingPanel') {
          await joplin.views.panels.hide(publishingPanel);
        } else if (message.type === 'refreshFromNote') {
          try {
            const note = await getCurrentNote();
            const settings = parseFrontMatter(note.body);
            const webviewSettings = pluginToWebviewSettings(settings);
            await joplin.views.panels.postMessage(publishingPanel, {
              type: 'updatePanelFields',
              settings: webviewSettings
            });
          } catch (error) {
            console.error('Error refreshing from note:', error);
            await joplin.views.dialogs.showMessageBox('Error: Could not refresh from current note. Please make sure a note is selected.');
          }
        } else if (message.type === 'generatePreview') {
          console.info('Preview generation requested with settings:', message.settings);
          // Placeholder for preview generation
          await joplin.views.dialogs.showMessageBox('Preview generation initiated. Settings captured.');
        } else if (message.type === 'updateNoteMetadata') {
          try {
            const note = await getCurrentNote();
            const pluginSettings = webviewToPluginSettings(message.settings);
            const newBody = updateFrontMatter(note.body, pluginSettings);
            if (newBody !== note.body) {
               await joplin.data.put(['notes', note.id], null, { body: newBody });
            }
          } catch (error) {
            console.error('Error updating note metadata:', error);
          }
        }
      });

      // Listen for note selection changes to update the panel
      await joplin.workspace.onNoteSelectionChange(async () => {
        const isVisible = await joplin.views.panels.visible(publishingPanel);
        if (isVisible) {
          try {
             const note = await getCurrentNote();
             const settings = parseFrontMatter(note.body);
             const webviewSettings = pluginToWebviewSettings(settings);
             await joplin.views.panels.postMessage(publishingPanel, {
               type: 'updatePanelFields',
               settings: webviewSettings
             });
          } catch (error) {
             // Ignore error if no note selected
          }
        }
      });
      // -----------------------------

      // 7. Menu Items
      try {
        // Create a submenu in the Tools menu
        await joplin.views.menus.create('ai-writing-toolkit-menu', 'Cogitations Plugins', [
          { commandName: 'openChatGPTPanel', label: 'Open Chat Panel' },
          { commandName: 'openPublishingPanel', label: 'PDF Publishing Settings' },
          { commandName: 'openSystemPromptFile', label: 'Edit System Prompt' },
          { commandName: 'insertNoteBlock', label: 'Insert Note Block', accelerator: 'CmdOrCtrl+Shift+3' },
        ], MenuItemLocation.Tools);
        
        console.info('AI Writing Toolkit menu items added to Tools menu');
      } catch (error: any) {
        console.warn('Could not add menu items (may not be supported in this Joplin version):', error.message);
      }
      
      console.info('AI Writing Toolkit Access Methods:');
      console.info('1. Tools menu -> AI Writing Toolkit (if available)');
      console.info('2. Command Palette: Ctrl+Shift+P (or Cmd+Shift+P) -> "Open AI Writing Toolkit Panel"');
      console.info('3. Command Palette: Ctrl+Shift+P (or Cmd+Shift+P) -> "Toggle AI Writing Toolkit"');
      console.info('4. Insert Note Block: Ctrl+Shift+3 (or Cmd+Shift+3)');
      
      console.info('AI Writing Toolkit Plugin initialized successfully!');
      
    } catch (error: any) {
      console.error('Error initializing AI Writing Toolkit Plugin:', error);
    }
  },
});
