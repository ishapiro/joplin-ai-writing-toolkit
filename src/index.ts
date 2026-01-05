// AI Writing Toolkit Plugin - TypeScript Implementation
import { ChatGPTAPI, ensureModelsFetchedAndGetOptions } from './api';
import { registerPluginSettings } from './settings';
import { getPanelHtml } from './panel';
import { getPublishingPanelHtml } from './publishing/panel';
import { parseFrontMatter, updateFrontMatter, webviewToPluginSettings, pluginToWebviewSettings } from './publishing/utils';
import { generatePreviewHtml } from './publishing/preview';
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
      
      // 2. Initialize API & Models
      const chatGPTAPI = new ChatGPTAPI();
      await chatGPTAPI.loadSettings();
      const apiKey = await joplin.settings.value('openaiApiKey');
      const modelOptions = await ensureModelsFetchedAndGetOptions(apiKey);
      
      // 3. Create Chat Panel
      const panelId = 'chatgpt.toolbox.panel';
      const panel = await joplin.views.panels.create(panelId);
      await joplin.views.panels.setHtml(panel, getPanelHtml(modelOptions));
      await joplin.views.panels.addScript(panel, './webview.js');
      
      // 4. Initialize Handler
      const handler = new PanelHandler(chatGPTAPI, panel);
      
      // 5. Register Commands
      await joplin.commands.register({
        name: 'openChatGPTPanel',
        label: 'Open AI Writing Toolkit Panel',
        iconName: 'fas fa-robot',
        execute: async () => {
          await joplin.views.panels.hide(publishingPanel);
          await joplin.views.panels.show(panel);
        },
      });

      await joplin.commands.register({
        name: 'toggleChatGPTToolbox',
        label: 'Toggle AI Writing Toolkit',
        execute: async () => {
          const isVisible = await joplin.views.panels.visible(panel);
          if (isVisible) {
            await joplin.views.panels.hide(panel);
          } else {
            await joplin.views.panels.hide(publishingPanel);
            await joplin.views.panels.show(panel);
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

      await joplin.views.panels.onMessage(panel, async (message: any) => {
        return await handler.handleMessage(message);
      });

      // --- Publishing Panel Setup ---
      const publishingPanelId = 'publishing.panel';
      const publishingPanel = await joplin.views.panels.create(publishingPanelId);
      
      // REGISTER SCRIPT ONCE: Joplin runs this script every time setHtml is called.
      await joplin.views.panels.addScript(publishingPanel, './publishing/webview.js');
      await joplin.views.panels.setHtml(publishingPanel, getPublishingPanelHtml());
      
      let isPreviewMode = false;

      await joplin.commands.register({
        name: 'openPublishingPanel',
        label: 'PDF Publishing Settings',
        iconName: 'fas fa-print',
        execute: async () => {
           console.info('DEBUG: openPublishingPanel command executing.');
           console.info('DEBUG: Hiding AI Writing Tools panel:', panelId);
           await joplin.views.panels.hide(panel);
           
           if (isPreviewMode) {
             console.info('DEBUG: Leaving preview mode, restoring settings HTML.');
             isPreviewMode = false;
             await joplin.views.panels.setHtml(publishingPanel, getPublishingPanelHtml());
           }
           
           console.info('DEBUG: Showing publishing panel:', publishingPanelId);
           await joplin.views.panels.show(publishingPanel);
           
           setTimeout(async () => {
             try {
               const note = await getCurrentNote();
               const settings = parseFrontMatter(note.body);
               const webviewSettings = pluginToWebviewSettings(settings);
               console.info('DEBUG: Posting updatePanelFields to publishing panel.');
               await joplin.views.panels.postMessage(publishingPanel, {
                 type: 'updatePanelFields',
                 settings: webviewSettings
               });
             } catch (error) {
               console.error('DEBUG: Error updating panel fields:', error);
             }
           }, 200);
        },
      });

      await joplin.views.panels.onMessage(publishingPanel, async (message: any) => {
        if (message.type === 'closePublishingPanel') {
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
            const pluginSettings = webviewToPluginSettings(settings);
            const previewHtml = generatePreviewHtml(note.body, note.title, pluginSettings);
            await joplin.views.panels.setHtml(publishingPanel, getPreviewPanelHtml(previewHtml));
          } catch (error) {
            console.error('DEBUG: Error refreshing preview:', error);
          }
        } else if (message.type === 'printPdf') {
          try {
            console.info('DEBUG: Received printPdf message.');
            // Note: exportPdf usually requires a 'path' argument.
            // If not provided, it may not do anything or may fail.
            // We'll call it and let Joplin handle the outcome.
            await joplin.commands.execute('exportPdf');
          } catch (error) {
            console.error('DEBUG: Error executing exportPdf:', error);
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
            const pluginSettings = webviewToPluginSettings(message.settings);
            const previewHtml = generatePreviewHtml(note.body, note.title, pluginSettings);
            isPreviewMode = true;
            
            console.info('DEBUG: Hiding AI panel before preview.');
            await joplin.views.panels.hide(panel);
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

      await joplin.workspace.onNoteSelectionChange(async () => {
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
      });

      // 7. Menu Items
      await joplin.views.menus.create('ai-writing-toolkit-menu', 'Cogitations Plugins', [
        { commandName: 'openChatGPTPanel', label: 'Open Chat Panel' },
        { commandName: 'openPublishingPanel', label: 'PDF Publishing Settings' },
        { commandName: 'openSystemPromptFile', label: 'Edit System Prompt' },
        { commandName: 'insertNoteBlock', label: 'Insert Note Block', accelerator: 'CmdOrCtrl+Shift+3' },
      ], MenuItemLocation.Tools);

    } catch (error: any) {
      console.error('Error initializing AI Writing Toolkit Plugin:', error);
    }
  },
});
