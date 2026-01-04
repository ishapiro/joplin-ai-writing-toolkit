# Joplin AI Writing Toolkit

## Overview
The **Joplin AI Writing Toolkit** is designed specifically for writers who use Joplin for drafting and note-taking. It integrates powerful AI capabilities directly into your workflow to help you draft documents, refine your writing, and organize your thoughts.

While currently focused on AI assistance and drafting tools, the roadmap includes comprehensive PDF publishing features to give you full control over your document's final output (title pages, headers, footers, etc.).

## Features

### 🤖 AI Assistance
- **Interactive Chat Panel**: Have a conversation with ChatGPT directly within Joplin. Ask questions, brainstorm ideas, or get feedback without leaving your notes.
- **Grammar & Style Check**: Select any text in your note and instantly check it for grammar, spelling, and stylistic improvements.
- **Note-to-Prompt**: Use your current note as a prompt for the AI to analyze, summarize, or expand upon.
- **Customizable Persona**: Easily edit the "System Prompt" to define how the AI behaves (e.g., as a professional editor, a creative co-writer, or a technical reviewer).

### ✍️ Writing Tools
- **Note Blocks**: Quickly insert a formatted note block to annotate your drafts without breaking flow.
  - Shortcut: `Ctrl+Shift+3` (or `Cmd+Shift+3` on macOS)
  - Inserts:
    ```markdown

    ```note

    ```
    
    ```

### 📄 PDF Publishing Settings
Configure how your documents will be formatted when exported to PDF. All settings are stored in YAML Front Matter at the top of your notes, allowing you to customize each document individually:
- **Title Page**: Set document title, subtitle, author, date, and logo
- **Layout & Margins**: Choose page size (Letter/A4) and margin settings
- **Headers & Footers**: Add custom header and footer text with page numbers
- **Front Matter Integration**: Settings automatically sync between the panel and your note's Front Matter

See the [PDF Publishing](#pdf-publishing) section below for detailed instructions.

## Usage

### Accessing the Toolkit
- **Tools Menu**: Access key functions under `Tools > AI Writing Toolkit` (if supported) or use the Command Palette.
- **Command Palette**: Press `Ctrl+Shift+P` (or `Cmd+Shift+P`) and type "AI" to see all available commands.

### Chat Panel Buttons
The Chat Panel includes a set of quick-action buttons to streamline your workflow:

| Button | Action | Description |
|--------|--------|-------------|
| **📝 Append** | Append to Note | Appends the AI's last response to the end of your current note. |
| **🔄 Replace** | Replace Note | Replaces the *entire* content of your current note with the AI's last response. |
| **📍 Insert** | Insert at Cursor | Inserts the AI's last response at your current cursor position in the editor. |
| **📄 New Note** | Create New Note | Creates a brand new note containing the AI's last response. |
| **📋 Note→Prompt** | Note to Prompt | Copies the full content of your current note into the chat input field. |
| **✂️ Selected→Prompt** | Selected to Prompt | Copies only the currently selected text into the chat input field. |
| **✅ Grammar** | Check Grammar | Checks the selected text in your note for grammar and style issues. |
| **ℹ️ Help** | Help | Displays information about the plugin and its features. |

### Key Commands
| Command | Description | Shortcut |
|---------|-------------|----------|
| **Toggle AI Writing Toolkit** | Opens/Closes the AI Chat Panel. | `Ctrl+Shift+P` -> Search "Toggle" |
| **Check Grammar** | Checks selected text for errors. | Select text -> Command Palette |
| **Insert Note Block** | Inserts a `note` code block. | `Ctrl+Shift+3` / `Cmd+Shift+3` |
| **Open System Prompt** | Edit the AI's instructions. | Command Palette -> "Open System Prompt File" |
| **PDF Publishing Settings** | Configure PDF export settings. | `Tools > Cogitations Plugins > PDF Publishing Settings` |

## PDF Publishing

### Overview
The PDF Publishing Settings panel allows you to configure how your notes will be formatted when exported to PDF. All settings are stored as **YAML Front Matter** at the top of your notes, making it easy to customize each document individually.

### Accessing PDF Publishing Settings
- **Menu**: `Tools > Cogitations Plugins > PDF Publishing Settings`
- **Command Palette**: Press `Ctrl+Shift+P` (or `Cmd+Shift+P`) and search "PDF Publishing Settings"

### Front Matter Explained
**Front Matter** is a YAML block placed at the very beginning of your note, wrapped between `---` markers. The plugin uses this block to store PDF publishing configuration.

**Example:**
```yaml
---
title: My Document Title
subtitle: A compelling subtitle
author: Your Name
date: 2024-01-15
logo: https://example.com/logo.png
page_size: Letter
margin: 2.5
header: Document Header Text
footer: Document Footer Text
show_page_numbers: true
---

Your note content starts here...
```

### How Front Matter Works
1. **Two-Way Sync**: Changes made in the PDF Publishing Settings panel automatically update the Front Matter in your note, and vice versa. This means you can:
   - Edit settings in the panel → Front Matter updates automatically
   - Edit Front Matter directly in your note → Click "Refresh from Note" to sync the panel

2. **Automatic Updates**: When you change a field in the PDF Publishing Settings panel, the Front Matter in your current note is updated after a brief delay (debounced to avoid excessive updates).

3. **Note-Specific Settings**: Each note can have its own Front Matter, so different documents can have different formatting settings.

4. **Default Values**: If a setting is not specified in Front Matter, the panel will use sensible defaults:
   - Page Size: Letter
   - Margin: 2.5cm
   - Show Page Numbers: true

### PDF Publishing Settings Panel

The panel includes three main sections:

#### Title Page
- **Document Title**: The main title (defaults to note title if not specified)
- **Subtitle**: Optional subtitle text
- **Author**: Document author name
- **Date**: Publication or document date
- **Logo URL/Path**: URL or resource ID for a logo image

#### Layout & Margins
- **Page Size**: Choose between Letter (8.5" × 11") or A4 (210mm × 297mm)
- **Margin**: Page margin in centimeters

#### Header & Footer
- **Header Text**: Text to appear at the top of each page
- **Footer Text**: Text to appear at the bottom of each page
- **Show Page Numbers**: Toggle page number display in the footer

### Panel Actions

| Button | Action |
|--------|--------|
| **Refresh from Note** | Reloads all settings from the current note's Front Matter. Use this if you've edited Front Matter directly in your note. |
| **Generate Preview** | *(Coming soon)* Generates a preview of how your document will look as a PDF. |

### Best Practices

1. **Edit in the Panel**: For most users, editing settings in the PDF Publishing Settings panel is recommended, as it provides a user-friendly interface and ensures valid YAML syntax.

2. **Edit Front Matter Directly**: Advanced users can edit Front Matter directly in their notes. Remember to:
   - Keep valid YAML syntax (use `:` after keys, proper indentation)
   - Use `---` markers at the beginning and end
   - Click "Refresh from Note" in the panel to sync changes

3. **Consistent Formatting**: If you want consistent settings across multiple notes, consider:
   - Creating a template note with Front Matter already configured
   - Copying the Front Matter block when creating new documents

## Configuration
1. Go to **Tools > Options > AI Writing Toolkit** (or **Joplin > Settings** on macOS).
2. Enter your **OpenAI API Key**.
3. Select your preferred **Model** (e.g., gpt-4o, gpt-4-turbo).
4. Adjust other settings like `Max Tokens` or `System Prompt` as needed.

## Testing & Contributing

### How to Test
1. **Clone the Repository**
   ```bash
   git clone https://github.com/ishapiro/joplin-ai-writing-tools.git
   cd joplin-ai-writing-tools
   ```
2. **Install Dependencies**
   ```bash
   npm install
   ```
3. **Build the Plugin**
   ```bash
   npm run dist
   ```
   This will create a `publish/` directory containing the compiled `.jpl` file.
4. **Install in Joplin**
   - Open Joplin.
   - Go to **Tools > Options > Plugins**.
   - Click the **Gear Icon** (Manage your plugins) > **Install from file**.
   - Select the `publish/com.cogitations.ai-writing-toolkit.jpl` file you just built.
   - Restart Joplin to load the changes.

### Contributing
We welcome contributions!
- **Bug Reports & Feature Requests**: Please submit them via the [GitHub Issues](https://github.com/ishapiro/joplin-ai-writing-tools/issues) page.
- **Pull Requests**:
  1. Fork the repository.
  2. Create a feature branch (`git checkout -b feature/AmazingFeature`).
  3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
  4. Push to the branch (`git push origin feature/AmazingFeature`).
  5. Open a Pull Request.

---
*Created by Irv Shapiro*
- [LinkedIn](https://www.linkedin.com/in/irvshapiro/)
- [GitHub Repository](https://github.com/ishapiro/joplin-ai-writing-tools)
- [Personal Website (Cogitations.com)](https://cogitations.com)
