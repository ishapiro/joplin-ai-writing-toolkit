import * as yaml from 'js-yaml';

export interface PublishingSettings {
  title?: string;
  subtitle?: string;
  author?: string;
  date?: string;
  logo?: string;
  page_size?: string;
  margin?: string;
  header?: string;
  footer?: string;
  show_page_numbers?: boolean;
}

const FRONT_MATTER_REGEX = /^---\n([\s\S]*?)\n---\n/;

export function parseFrontMatter(noteBody: string): PublishingSettings {
  const match = noteBody.match(FRONT_MATTER_REGEX);
  if (match) {
    try {
      const data = yaml.load(match[1]) as any;
      return {
        title: data.title,
        subtitle: data.subtitle,
        author: data.author,
        date: data.date,
        logo: data.logo,
        page_size: data.page_size,
        margin: data.margin,
        header: data.header,
        footer: data.footer,
        show_page_numbers: data.show_page_numbers
      };
    } catch (e) {
      console.error('Error parsing front matter:', e);
    }
  }
  return {};
}

export function updateFrontMatter(noteBody: string, settings: PublishingSettings): string {
  const currentSettings = parseFrontMatter(noteBody);
  const newSettings = { ...currentSettings, ...settings };
  
  // Clean up undefined values
  Object.keys(newSettings).forEach(key => {
    if ((newSettings as any)[key] === undefined || (newSettings as any)[key] === '') {
      delete (newSettings as any)[key];
    }
  });

  const yamlString = yaml.dump(newSettings);
  const frontMatterBlock = `---\n${yamlString}---\n`;

  if (FRONT_MATTER_REGEX.test(noteBody)) {
    return noteBody.replace(FRONT_MATTER_REGEX, frontMatterBlock);
  } else {
    return frontMatterBlock + noteBody;
  }
}

