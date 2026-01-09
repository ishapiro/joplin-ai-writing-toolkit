# Joplin AI Writing Toolkit - Development Guide

## Project Overview
This is a **Joplin plugin** that adds AI writing assistance and PDF publishing features to the Joplin note-taking application. Built with TypeScript and Webpack, it runs within Joplin's plugin sandbox using the Joplin Plugin API.

## Architecture

### Plugin Entry Point
- **`src/index.ts`**: Main plugin registration and initialization. Sets up two primary panels (chat and publishing), registers commands, and initializes message handlers
- Panels use webviews for UI, with bidirectional communication via `postMessage` API

### Core Components
- **`src/api.ts`**: OpenAI API integration - handles model fetching, chat completions, and API key management
- **`src/handlers.ts`**: `PanelHandler` class processes webview messages and orchestrates actions (append/replace/insert text, create notes)
- **`src/panel.ts`** & **`src/webview.ts`**: Chat panel UI (HTML generation) and client-side logic (message handling, markdown parsing)
- **`src/publishing/`**: PDF publishing subsystem with separate panel, preview, and front matter utilities

### Data Flow Pattern
1. User interacts with webview UI → fires `webviewApi.postMessage()`
2. Message routed to handler in `src/index.ts` via `onMessage` callbacks
3. Handler executes Joplin API calls (`joplin.workspace`, `joplin.data`, `joplin.commands`)
4. Results posted back to webview via `joplin.views.panels.postMessage()`

### Front Matter System
- **YAML Front Matter** stored in note body (delimited by `---`)
- Two utility modules: `src/frontmatter.ts` (original) and `src/publishing/utils.ts` (newer, handles camelCase ↔ snake_case conversion)
- Settings sync bidirectionally between panel UI and note content
- Use `parseFrontMatter()` and `updateFrontMatter()` for all front matter operations

## Build & Development

### Commands
- **`npm run build`**: Builds plugin with Webpack, creates `.jpl` archive in `publish/` directory
- **`npm run install-plugin`**: Copies built `.jpl` to OS-specific Joplin plugins directory (macOS: `~/Library/Application Support/Joplin/plugins`, Windows/Linux/WSL: `~/.config/joplin-desktop/plugins`)
- **`npm run dist`**: Runs `build` then `install-plugin` - builds and auto-installs to Joplin
- **`npm run updateVersion`**: Bumps version in both `package.json` and `src/manifest.json`
- **No test suite**: Manual testing in Joplin required (restart Joplin after running `npm run dist`)

### Webpack Configuration
- **`webpack.config.js`**: Generates plugin bundle + info JSON. Uses `copy-webpack-plugin` to bundle webview scripts
- **Plugin outputs**: `dist/index.js` (main), webview scripts, and packaged `.jpl` file
- **External scripts** listed in `plugin.config.json` get bundled separately (e.g., `src/webview.ts`, `src/publishing/webview.ts`)

### Dependencies
- **`js-yaml`**: YAML parsing for front matter
- **`markdown-it`**: Markdown processing (imported but minimal usage in current code)
- No external UI frameworks - vanilla JS/TypeScript for webviews

## Joplin Plugin API Patterns

### Command Registration
Commands registered with `joplin.commands.register()` and exposed via:
- Command palette (`Ctrl+Shift+P`)
- Tools menu (via manifest or menuItemLocation)
- Keyboard shortcuts (use `joplin.commands.execute('replaceSelection', text)` for editor insertion)

### Accessing Notes
- **`joplin.workspace.selectedNote()`**: Current active note (may be cached)
- **`joplin.data.get(['notes', noteId])`**: Direct note fetch (use for latest content)
- **`joplin.data.put(['notes', noteId], null, {body: newBody})`**: Update note content
- **`joplin.workspace.selectedNoteIds()`**: Check if note is selected before editor operations

### Panel Management
- Show/hide panels: `joplin.views.panels.show()` / `.hide()`
- **Critical**: Always hide one panel before showing another (avoid both visible simultaneously)
- Use `joplin.views.panels.visible()` to check state
- `setHtml()` triggers full re-render; addScript() runs on each setHtml call

## Project-Specific Conventions

### Message Types
Webview-to-plugin messages use `type` field for routing:
- `sendMessage`: Send chat prompt to OpenAI
- `getCurrentModel` / `updateModel`: Model selection
- `updatePublishingSetting`: Update single front matter field
- `generatePreview`: Switch publishing panel to preview mode
- Actions like `appendToNote`, `replaceNote`, `insertAtCursor` handled separately via `handleAction()`

### Dual Front Matter Modules
- **Legacy**: `src/frontmatter.ts` uses `PublishingSettings` interface
- **Current**: `src/publishing/utils.ts` has naming conversion functions
- When editing publishing features, use `src/publishing/utils.ts` functions (`webviewToPluginSettings`, `pluginToWebviewSettings`)

### Model Management
- Models fetched once from OpenAI API, cached in `joplin.data` under plugin-specific keys
- Settings dropdown populates from cache or defaults (e.g., `gpt-5.1`, `gpt-4.1`, `o3-mini`)
- Auto-selects "latest general model" (non-variant) if user hasn't chosen one

### Preview System
Publishing panel has two modes:
- **Settings mode**: Form inputs for front matter (default HTML from `getPublishingPanelHtml()`)
- **Preview mode**: Live paginated preview (HTML from `getPreviewPanelHtml()`)
- Mode toggled by setting `isPreviewMode` flag and calling `setHtml()` - entire panel is replaced

## Key Files to Reference
- **Plugin manifest**: `src/manifest.json` (ID, version, metadata)
- **API types**: `src/types.ts` (shared interfaces)
- **Utility functions**: `src/utils.ts` (note operations, clipboard, system prompt file)
- **Settings registration**: `src/settings.ts` (defines plugin settings UI in Joplin preferences)

## Common Pitfalls
- **Don't** call `setHtml()` repeatedly in quick succession - causes flicker and re-executes scripts
- **Always** sanitize data keys for Joplin data storage with `sanitizeDataKey()`
- **Remember** Joplin API calls are async - await all operations
- **Check** if note is selected before executing editor commands like `replaceSelection`
- **Use** `setTimeout()` with ~200ms delay after showing panel before posting initial data (webview needs time to initialize)
