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
           await joplin.views.panels.hide(panel);
           if (isPreviewMode) {
             isPreviewMode = false;
             await joplin.views.panels.setHtml(publishingPanel, getPublishingPanelHtml());
           }
           await joplin.views.panels.show(publishingPanel);
           
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
        },
      });

      await joplin.views.panels.onMessage(publishingPanel, async (message: any) => {
        if (message.type === 'closePublishingPanel') {
          await joplin.views.panels.hide(publishingPanel);
        } else if (message.type === 'closePreview') {
          console.info('Closing preview mode');
          isPreviewMode = false;
          await joplin.views.panels.setHtml(publishingPanel, getPublishingPanelHtml());
          await joplin.views.panels.show(panel);
          
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
        } else if (message.type === 'refreshPreview') {
          try {
            const note = await getCurrentNote();
            const settings = parseFrontMatter(note.body);
            const pluginSettings = webviewToPluginSettings(settings);
            const previewHtml = generatePreviewHtml(note.body, note.title, pluginSettings);
            await joplin.views.panels.setHtml(publishingPanel, getPreviewPanelHtml(previewHtml));
          } catch (error) {
            console.error('Error refreshing preview:', error);
          }
        } else if (message.type === 'refreshFromNote') {
          try {
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
            console.info('Preview generation requested with settings:', message.settings);
            const note = await getCurrentNote();
            const pluginSettings = webviewToPluginSettings(message.settings);
            const previewHtml = generatePreviewHtml(note.body, note.title, pluginSettings);
            isPreviewMode = true;
            await joplin.views.panels.hide(panel);
            await joplin.views.panels.setHtml(publishingPanel, getPreviewPanelHtml(previewHtml));
            await joplin.views.panels.show(publishingPanel);
          } catch (error) {
            console.error('Error generating preview:', error);
          }
        } else if (message.type === 'updateNoteMetadata') {
          try {
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
