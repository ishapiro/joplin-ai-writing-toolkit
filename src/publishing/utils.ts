import * as yaml from 'js-yaml';

export interface PublishingSettings {
  title?: string;
  subtitle?: string;
  author?: string;
  date?: string;
  logo?: string;
  pageSize?: string;
  margin?: string;
  header?: string;
  footer?: string;
  showPageNumbers?: boolean;
}

export function parseFrontMatter(body: string): PublishingSettings {
  if (!body) return {};
  const match = body.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  try {
    const result = yaml.load(match[1]) as any;
    // Map YAML keys to our settings keys, supporting both camelCase and snake_case
    return {
      title: result.title,
      subtitle: result.subtitle,
      author: result.author,
      date: result.date,
      logo: result.logo,
      pageSize: result.pageSize || result.page_size,
      margin: result.margin,
      header: result.header,
      footer: result.footer,
      showPageNumbers: result.showPageNumbers !== undefined ? result.showPageNumbers : result.show_page_numbers
    };
  } catch (e) {
    console.error('Failed to parse front matter', e);
    return {};
  }
}

// Convert webview settings (snake_case) to plugin settings (camelCase)
export function webviewToPluginSettings(webviewSettings: any): PublishingSettings {
  return {
    title: webviewSettings.title,
    subtitle: webviewSettings.subtitle,
    author: webviewSettings.author,
    date: webviewSettings.date,
    logo: webviewSettings.logo,
    pageSize: webviewSettings.page_size,
    margin: webviewSettings.margin,
    header: webviewSettings.header,
    footer: webviewSettings.footer,
    showPageNumbers: webviewSettings.show_page_numbers
  };
}

// Convert plugin settings (camelCase) to webview settings (snake_case)
export function pluginToWebviewSettings(pluginSettings: PublishingSettings): any {
  return {
    title: pluginSettings.title,
    subtitle: pluginSettings.subtitle,
    author: pluginSettings.author,
    date: pluginSettings.date,
    logo: pluginSettings.logo,
    page_size: pluginSettings.pageSize,
    margin: pluginSettings.margin,
    header: pluginSettings.header,
    footer: pluginSettings.footer,
    show_page_numbers: pluginSettings.showPageNumbers
  };
}

export function updateFrontMatter(body: string, settings: PublishingSettings): string {
  const existingSettings = parseFrontMatter(body);
  
  // Merge, but only update fields that are present in settings (if we want partial updates)
  // or allow clearing.
  // For simplicity, let's treat 'settings' as the complete source of truth for the fields it contains.
  
  const mergedSettings = { ...existingSettings, ...settings };
  
  // Clean up undefined keys to keep YAML clean
  const cleanSettings: any = {};
  for (const key in mergedSettings) {
    if ((mergedSettings as any)[key] !== undefined && (mergedSettings as any)[key] !== '') {
      cleanSettings[key] = (mergedSettings as any)[key];
    }
  }

  const yamlStr = yaml.dump(cleanSettings);
  const frontMatterBlock = `---\n${yamlStr}\n---`;
  
  if (body.match(/^---\n([\s\S]*?)\n---/)) {
    return body.replace(/^---\n([\s\S]*?)\n---/, frontMatterBlock);
  } else {
    return `${frontMatterBlock}\n\n${body}`;
  }
}

