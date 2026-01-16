# Joplin AI Writing Toolkit

## Overview
The **Joplin AI Writing Toolkit** is a comprehensive plugin tailored for writers, researchers, and knowledge workers who rely on Joplin for drafting, organizing, and managing notes. This toolkit seamlessly integrates advanced AI features—such as interactive chat with ChatGPT, grammar and style checking, and automated content expansion—directly into your Joplin workflow. With these tools, you can brainstorm ideas, get instant feedback on your writing, transform notes into prompts, and improve drafts without leaving the app.

Beyond AI assistance, the toolkit offers robust PDF publishing capabilities. Easily export your notes as professionally formatted PDFs complete with customizable title pages, headers, footers, and layout options. All PDF formatting settings are defined, stored, and managed within your notes using YAML Front Matter, ensuring that each document retains its specific design preferences.

In summary, the Joplin AI Writing Toolkit transforms Joplin from just a note taking tool into a powerful platform for writing, editing, organizing, and preparing professional PDF documents—all within one seamless environment.

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

### 📄 PDF Publishing
Configure how your documents will be formatted when printed or saved as PDF. All settings are stored in YAML Front Matter at the top of your notes, allowing you to customize each document individually:
- **Title Page**: Set document title, subtitle, author, date, and logo
- **Title Page Toggles**: Include/exclude the title page and optionally center title-page content
- **Layout & Margins**: Choose page size (Letter/A4) and margin settings
- **Headers & Footers**: Add custom header and footer text with page numbers
- **Front Matter Integration**: Settings automatically sync between the panel and your note's Front Matter
- **Attachment Image Support**: Images/attachments referenced as `![](:/resourceId)` render correctly in the PDF preview/print output

See the [PDF Publishing](#pdf-publishing) section below for detailed instructions.

## Usage

### Accessing the Toolkit
- **Tools Menu**: `Tools > Cogitations Plugins`:
  - **Open Chat Panel**
  - **PDF Publishing**
  - **Insert Note Block**
  - **Cogitations Options**
- **Command Palette**: Press `Ctrl+Shift+P` (or `Cmd+Shift+P`) and search for “AI Writing Toolkit” or “PDF Publishing”.

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
| **Grammar Check** | Checks selected text for grammar/style issues (via Chat Panel button). | Select text -> Click **✅ Grammar** |
| **Insert Note Block** | Inserts a `note` code block. | `Ctrl+Shift+3` / `Cmd+Shift+3` |
| **Open System Prompt** | Edit the AI's instructions. | Command Palette -> "Open System Prompt File" |
| **PDF Publishing** | Configure PDF publishing settings & preview/print. | `Tools > Cogitations Plugins > PDF Publishing` |

## PDF Publishing

### Overview
The PDF Publishing panel allows you to configure how your notes will be formatted when printed or saved as PDF. All settings are stored as **YAML Front Matter** at the top of your notes, making it easy to customize each document individually.

### Accessing PDF Publishing
- **Menu**: `Tools > Cogitations Plugins > PDF Publishing`
- **Command Palette**: Press `Ctrl+Shift+P` (or `Cmd+Shift+P`) and search “PDF Publishing”

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
include_title_page: true
center_title_page_content: false
---

Your note content starts here...
```

### How Front Matter Works
1. **Two-Way Sync**: Changes made in the PDF Publishing panel automatically update the Front Matter in your note, and vice versa. This means you can:
   - Edit settings in the panel → Front Matter updates automatically
   - Edit Front Matter directly in your note → Click "Refresh from Note" to sync the panel

2. **Automatic Updates**: When you change a field in the PDF Publishing panel, the Front Matter in your current note is updated after a brief delay (debounced to avoid excessive updates).

3. **Note-Specific Settings**: Each note can have its own Front Matter, so different documents can have different formatting settings.

4. **Default Values**: If a setting is not specified in Front Matter, the panel will use sensible defaults:
   - Page Size: Letter
   - Margin: 2.5cm
   - Show Page Numbers: true

### PDF Publishing Panel

The panel includes three main sections:

#### Title Page
- **Document Title**: The main title (defaults to note title if not specified)
- **Subtitle**: Optional subtitle text
- **Author**: Document author name
- **Date**: Publication or document date
- **Logo URL/Path**: URL, filesystem path, `:/resourceId`, or a **note id** (uses the first embedded image from that note)
- **Include Title Page**: Toggle whether to include a title page
- **Center Title Page Content**: Center-align title page content (helpful for title-page logos)

#### Layout & Margins
- **Page Size**: Choose between Letter (8.5" × 11") or A4 (210mm × 297mm)
- **Margin**: Page margin in centimeters

#### Header & Footer
- **Header Text**: Text to appear at the top of each page
- **Footer Text**: Text to appear at the bottom of each page
- **Show Page Numbers**: Toggle page number display in the footer

### Panel Actions

| Button | Action | Description |
|--------|--------|-------------|
| **Refresh from Note** | Reloads settings | Reloads all settings from the current note's Front Matter. Use this if you've edited Front Matter directly in your note. |
| **Generate Preview** | Preview Document | Generates a live, paginated preview of how your document will look when printed or saved as a PDF. |

### Printing & Page Breaks

The AI Writing Toolkit uses a custom fragmentation engine to ensure your notes are properly paginated for PDF output.

#### Manual Page Breaks
You can force a new page at any point in your document by adding the following marker on its own line:
```markdown
---page-break---
```

#### How to Print / Save as PDF
1. Open the **PDF Publishing** panel.
2. Click **Generate Preview**.
3. In the preview window, click the **Print PDF** button.
4. When the system print dialog appears:
   - Select **Save as PDF** as the destination to create a file.
   - Select a physical printer to print directly.

#### Notes on Images & Attachments
- **Joplin attachment images** referenced as `![](:/resourceId)` are automatically resolved in the preview so they render correctly when printing/saving as PDF.

#### Pagination Features
- **Automatic Fragmentation**: Long sections of text are automatically broken into separate pages.
- **Title Page**: A dedicated title page is created using your front matter settings.
- **Headers & Footers**: Consistent headers, footers, and page numbers are applied to every page except the title page.

### Best Practices

1. **Edit in the Panel**: For most users, editing settings in the PDF Publishing panel is recommended, as it provides a user-friendly interface and ensures valid YAML syntax.

2. **Edit Front Matter Directly**: Advanced users can edit Front Matter directly in their notes. Remember to:
   - Keep valid YAML syntax (use `:` after keys, proper indentation)
   - Use `---` markers at the beginning and end
   - Click "Refresh from Note" in the panel to sync changes

3. **Consistent Formatting**: If you want consistent settings across multiple notes, consider:
   - Creating a template note with Front Matter already configured
   - Copying the Front Matter block when creating new documents

## Configuration
1. Open the plugin options dialog: **Tools > Cogitations Plugins > Cogitations Options**
2. Enter your **OpenAI API Key**.
3. Choose an **OpenAI Model** (or leave blank / choose auto-select to use the latest general model).
4. Adjust optional settings:
   - **Max Tokens**
   - **Reasoning Effort** (for GPT-5 and o-series models)
   - **Verbosity** (for GPT-5 and o-series models)
   - **Auto-save Changes**
   - **System Prompt** (edit directly inside the Options dialog)

## Testing & Contributing

### How to Test
1. **Clone the Repository**
   ```bash
   git clone https://github.com/ishapiro/joplin-ai-writing-tools.git
   cd joplin-ai-writing-tools  # (or whatever folder name you cloned into)
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

## Technical Discoveries

### Reliable Printing in Electron/Joplin
During development of the PDF preview system, we discovered that printing from an Electron-based webview can be finicky across repeated prints.

**The Problem:**
In many Electron environments, calling `window.print()` works perfectly the first time, but subsequent calls often fail to open the print dialog. This is due to Chromium's print preview process occasionally failing to release its lock on the renderer process after the dialog is closed.

**The Solution:**
We use a two-part strategy:
1. **Print with full content visible**: Before invoking `window.print()`, the preview temporarily shows all pages so the print output contains the full document.
2. **Afterprint reset**: We listen for `onafterprint` and then return from the preview back to the PDF Publishing settings panel. That transition rebuilds the panel DOM, which helps keep repeat printing stable.

This approach allows our PDF Publishing tool to provide a consistent, multi-print experience without requiring access to Electron's restricted Main Process APIs.

