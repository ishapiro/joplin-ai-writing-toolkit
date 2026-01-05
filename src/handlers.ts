import { ChatGPTAPI } from './api';
import { WebviewMessage } from './types';
import { replaceSelectedText, getSelectedText, getCurrentNote, updateNoteContent, getCurrentFolderId } from './utils';

declare const joplin: any;

export class PanelHandler {
  private chatGPTAPI: ChatGPTAPI;
  private panel: string;
  private lastChatGPTResponse: string = '';

  constructor(api: ChatGPTAPI, panel: string) {
    this.chatGPTAPI = api;
    this.panel = panel;
  }
  
  // Getter for lastChatGPTResponse so it can be accessed from outside if needed
  public getLastResponse(): string {
    return this.lastChatGPTResponse;
  }

  // Setter for lastChatGPTResponse
  public setLastResponse(response: string): void {
    this.lastChatGPTResponse = response;
  }

  async handleAction(action: string): Promise<any> {
    try {
      console.log('Handling action:', action);
      
      switch (action) {
        case 'appendToNote':
          if (!this.lastChatGPTResponse) {
            return { success: false, error: 'No ChatGPT response to append. Send a message first.' };
          }
          const note = await getCurrentNote();
          await updateNoteContent(note.id, note.body + '\n\n---\n\n**ChatGPT Response:**\n' + this.lastChatGPTResponse);
          return { success: true, message: 'ChatGPT response appended to note successfully!' };
          
        case 'replaceNote':
          if (!this.lastChatGPTResponse) {
            return { success: false, error: 'No ChatGPT response to replace with. Send a message first.' };
          }
          const noteToReplace = await getCurrentNote();
          await updateNoteContent(noteToReplace.id, this.lastChatGPTResponse);
          return { success: true, message: 'Note replaced with ChatGPT response successfully!' };
          
        case 'insertAtCursor':
          if (!this.lastChatGPTResponse) {
            return { success: false, error: 'No ChatGPT response to insert. Send a message first.' };
          }
          // Check if a note is selected
          try {
            const noteIds = await joplin.workspace.selectedNoteIds();
            if (noteIds.length === 0) {
              return { success: false, error: 'No note selected. Please select a note first.' };
            }
            // Insert the response at the cursor position (replaceSelection works at cursor if no selection)
            await replaceSelectedText(this.lastChatGPTResponse);
            return { success: true, message: 'ChatGPT response inserted at cursor position successfully!' };
          } catch (error: any) {
            return { success: false, error: `Error inserting at cursor: ${error.message}` };
          }
          
        case 'createNewNote':
          if (!this.lastChatGPTResponse) {
            return { success: false, error: 'No ChatGPT response to create note with. Send a message first.' };
          }
          // Create a new note with the ChatGPT response
          const newNote = await joplin.data.post(['notes'], null, {
            title: 'ChatGPT Response - ' + new Date().toLocaleString(),
            body: this.lastChatGPTResponse,
            parent_id: await getCurrentFolderId()
          });
          
          // Make the new note active
          await joplin.commands.execute('openNote', newNote.id);
          
          return { success: true, message: 'New note created and opened successfully!' };
          
        case 'copyNoteToPrompt':
          const currentNote = await getCurrentNote();
          // Send the content directly to the webview
          try {
            console.log('About to send message to webview, panel:', this.panel);
            const result = await joplin.views.panels.postMessage(this.panel, {
              type: 'appendToPrompt',
              content: currentNote.body
            });
            console.log('PostMessage result:', result);
            console.log('Sent note content to webview:', currentNote.body.substring(0, 100) + '...');
          } catch (error: any) {
            console.error('Error sending message to webview:', error);
          }
          return { success: true, message: 'Note content appended to prompt input!' };
          
        case 'copySelectedToPrompt':
          const selectedText = await getSelectedText();
          if (!selectedText || selectedText.trim() === '') {
            return { success: false, error: 'No text selected. Please select some text first.' };
          }
          // Send the content directly to the webview
          try {
            console.log('About to send selected text to webview, panel:', this.panel);
            const result = await joplin.views.panels.postMessage(this.panel, {
              type: 'appendToPrompt',
              content: selectedText
            });
            console.log('PostMessage result for selected text:', result);
            console.log('Sent selected text to webview:', selectedText.substring(0, 100) + '...');
          } catch (error: any) {
            console.error('Error sending selected text to webview:', error);
          }
          return { success: true, message: 'Selected text appended to prompt input!' };
          
        case 'checkGrammar':
          const textToCheck = await getSelectedText();
          if (!textToCheck || textToCheck.trim() === '') {
            return { success: false, error: 'No text selected. Please select some text first.' };
          }
          
          // Show working message
          await joplin.views.panels.postMessage(this.panel, {
            type: 'addMessage',
            sender: 'system',
            content: 'Checking grammar...'
          });
          
          // Use ChatGPT to check grammar
          const grammarResponse = await this.chatGPTAPI.checkGrammar(textToCheck);
          
          // Show modal with corrected text for user approval
          await joplin.views.panels.postMessage(this.panel, {
            type: 'showGrammarModal',
            originalText: textToCheck,
            correctedText: grammarResponse
          });
          
          return { success: true, message: 'Grammar check completed! Please review the changes.' };
          
        default:
          return { success: false, error: 'Unknown action: ' + action };
      }
    } catch (error: any) {
      console.error('Error handling action:', error);
      return { success: false, error: error.message };
    }
  }

  async handleMessage(message: WebviewMessage): Promise<any> {
    try {
      if (message.type === 'sendChatMessage') {
        const response = await this.chatGPTAPI.sendMessage(message.message || '');
        this.lastChatGPTResponse = response; // Store for later use
        return { success: true, content: response };
      } else if (message.type === 'getCurrentModel') {
        // Return the current model setting
        const currentModel = await joplin.settings.value('openaiModel') || 'gpt-5.1';
        return { success: true, model: currentModel };
      } else if (message.type === 'updateModel') {
        // Update the model setting
        const modelToSet = (message as any).model || message.content;
        // Allow empty string for auto-select
        await joplin.settings.setValue('openaiModel', modelToSet || '');
        // Mark as user-set when changed from UI (even if blank, user explicitly chose it)
        await joplin.settings.setValue('openaiModelUserSet', true);
        // Reload settings in the API instance
        await this.chatGPTAPI.loadSettings();
        return { success: true, message: modelToSet ? `Model updated to ${modelToSet}` : 'Model set to auto-select latest' };
      } else if (message.type === 'clearHistory') {
        this.chatGPTAPI.clearConversationHistory();
        return { success: true, message: 'Conversation history cleared' };
      } else if (message.type === 'closePanel') {
        // Send a nicely formatted close message to the panel before closing
        await joplin.views.panels.postMessage(this.panel, {
          type: 'showCloseMessage'
        });
        return { success: true, message: 'Close message sent' };
      } else if (message.type === 'confirmClose') {
        // Actually close the panel after user confirms
        await joplin.views.panels.hide(this.panel);
        return { success: true, message: 'Panel closed' };
      } else if (message.type === 'acceptGrammarChanges') {
        // Replace the selected text with the corrected version
        if (message.correctedText) {
          await replaceSelectedText(message.correctedText);
          
          // Send confirmation message to the panel
          await joplin.views.panels.postMessage(this.panel, {
            type: 'addMessage',
            sender: 'system',
            content: 'Grammar corrections applied successfully!'
          });
          
          return { success: true, message: 'Grammar changes applied' };
        } else {
          return { success: false, error: 'No corrected text provided' };
        }
      } else if (message.type === 'executeAction') {
        return await this.handleAction(message.action || '');
      }
      return { success: false, error: 'Unknown message type' };
    } catch (error: any) {
      console.error('Error handling webview message:', error);
      return { success: false, error: error.message };
    }
  }
}

