// Node.js specific modules should only run on the server side
// This file should only be imported on the server side

// Node.js modules
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import matter from 'gray-matter';

// Import site configuration
import siteConfig from '../../../site.config.js';

// This error check is to provide an early warning when this module is attempted to be used in the browser
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
if (isBrowser) {
  console.error('content-processor.js should only be used on the server side!');
  throw new Error('Content processor cannot run on the client side!');
}

// Function to remove the first h1 heading from HTML content
const removeFirstH1 = (html) => {
  // Find the first heading and remove it
  // This regex matches the first <h1> tag and its content up to the closing </h1>
  return html.replace(/<h1[^>]*>(.*?)<\/h1>/, '');
};

// Scans all markdown files and folders in the content directory
const scanContentDirectory = () => {
  const contentEntries = [];
  const i18nConfig = siteConfig.internationalization;

  // The scanDir function, now defined inside scanContentDirectory to capture contentEntries
  // and to be callable for different base paths and languages.
  // basePathForScan is the root path for the current scan (e.g., 'content/en' or 'content')
  // currentLang is the language code for the content being scanned.
  function scanDir(basePathForScan, currentLang, currentRelativePath = '') {
    if (!fs.existsSync(basePathForScan)) {
      console.warn(`Content folder not found for language ${currentLang}: ${basePathForScan}`);
      return;
    }

    const entries = fs.readdirSync(path.join(basePathForScan, currentRelativePath));

    for (const entry of entries) {
      const itemPathInLangDir = path.join(currentRelativePath, entry); // Path relative to basePathForScan (e.g., blog/post.md)
      const fullPath = path.join(basePathForScan, itemPathInLangDir); // Full system path
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        scanDir(basePathForScan, currentLang, itemPathInLangDir);
      } else if (stats.isFile() && entry.endsWith('.md')) {
        const slug = entry.replace('.md', '');

        // directoryPath is relative to the language folder (e.g., "blog" or "" for root)
        const directoryPath = currentRelativePath.replace(/\\/g, '/');

        const url = `/${directoryPath ? `${directoryPath}/` : ''}${slug}`;

        const content = fs.readFileSync(fullPath, 'utf-8');
        const { data, content: markdownContent } = matter(content);
        
        const processedMarkdownContent = processTemplateVariables(markdownContent);
        const processedMetadata = {};
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'string') {
            processedMetadata[key] = processTemplateVariables(value);
          } else {
            processedMetadata[key] = value;
          }
        }
        
        const finalMetadata = {
          title: processedMetadata.title || formatTitle(slug),
          description: processedMetadata.description || '',
          date: processedMetadata.date || null,
          author: processedMetadata.author || null,
          ...processedMetadata
        };
        
        const html = removeFirstH1(marked.parse(processedMarkdownContent));
        
        const mainDirectory = directoryPath.split('/')[0] || 'root';
        
        contentEntries.push({
          slug,
          path: itemPathInLangDir.replace(/\\/g, '/'), // Path relative to language dir
          url, // URL without language prefix
          directory: directoryPath, // Directory relative to language dir
          mainDirectory, // Main directory relative to language dir
          depth: directoryPath === '' ? 0 : directoryPath.split('/').length,
          content: html,
          metadata: finalMetadata,
          lang: currentLang // Add language information
        });
      }
    }
  }

  if (i18nConfig && i18nConfig.enabled) {
    for (const lang of i18nConfig.languages) {
      const langContentPath = path.resolve('content', lang);
      scanDir(langContentPath, lang); // Initial relative path is ''
    }
  } else {
    const defaultContentPath = path.resolve('content');
    const defaultLang = i18nConfig ? i18nConfig.defaultLanguage : 'en'; // Fallback if i18n block is missing
    scanDir(defaultContentPath, defaultLang); // Initial relative path is ''
  }
  
  return contentEntries;
};

// Function that detects folders in the content directory
// TODO: This function might need i18n adjustments later if used for navigation based on top-level folders.
// For now, it still looks at the root 'content' folder.
const getContentDirectories = () => {
  const contentPath = path.resolve('content');
  const directories = [];
  
  if (!fs.existsSync(contentPath)) {
    console.warn('Content folder not found!');
    return directories;
  }
  
  const entries = fs.readdirSync(contentPath);
  
  for (const entry of entries) {
    const fullPath = path.join(contentPath, entry);
    if (fs.statSync(fullPath).isDirectory()) {
      directories.push({
        name: entry,
        path: `content/${entry}`,
        title: formatTitle(entry),
        url: `/${entry}`
      });
    }
  }
  
  return directories;
};

// Function that shortens markdown content up to a specific length
const truncateContent = (content, maxLength = 200) => {
  if (content.length <= maxLength) return content;
  
  return content.substring(0, maxLength) + '...';
};

// Function to create a title from a slug
const formatTitle = (slug) => {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// To scan all content once and cache it
let cachedContent = null;

// Get all content (using cache)
const getAllContent = () => {
  if (cachedContent) return cachedContent;
  
  cachedContent = scanContentDirectory();
  return cachedContent;
};

// Get content for a specific URL
const getContentByUrl = (url, lang = null) => {
  let contentToSearch = getAllContent();
  const i18nConfig = siteConfig.internationalization;

  // Remove trailing slash (/) from URL
  const normalizedUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  
  let logMessage = `Normalized URL for lookup: "${normalizedUrl}"`;

  if (i18nConfig && i18nConfig.enabled && lang) {
    logMessage += `, Language filter: "${lang}"`;
    contentToSearch = contentToSearch.filter(entry => entry.lang === lang);
  }
  console.log(logMessage);
  
  // Check content URLs and find matching content
  const result = contentToSearch.find(entry => {
    // Remove trailing slash from content URL as well
    const entryUrl = entry.url.endsWith('/') ? entry.url.slice(0, -1) : entry.url;
    // console.log(`Comparing: "${entryUrl}" (lang: ${entry.lang}) vs "${normalizedUrl}"`); // More verbose logging
    return entryUrl === normalizedUrl;
  });
  
  console.log('Match result:', result ? `Found: ${result.url} (lang: ${result.lang})` : 'Not found');
  return result;
};

// Get content from a specific directory
const getContentByDirectory = (directory, lang = null) => {
  let contentToSearch = getAllContent();
  const i18nConfig = siteConfig.internationalization;

  if (i18nConfig && i18nConfig.enabled && lang) {
    contentToSearch = contentToSearch.filter(entry => entry.lang === lang);
  }
  
  // Direct matching for main directories
  if (directory === 'root') {
    return contentToSearch.filter(entry => entry.directory === 'root' || entry.directory === ''); // entry.directory can be '' for root items
  }
  
  // Get all content that starts with the specified directory, including subdirectories
  return contentToSearch.filter(entry => {
    // 1. Exact match case (e.g., 'blog' directory for 'blog')
    // 2. Subdirectory match (e.g., 'blog/category' directory for 'blog')
    return entry.directory === directory || entry.directory.startsWith(directory + '/');
  });
};

// Clear cache (might be necessary in development mode)
const clearContentCache = () => {
  cachedContent = null;
};

// Function to find subdirectories - returns subdirectories for a specific directory
const getSubDirectories = (directory, lang = null) => {
  let contentToSearch = getAllContent();
  const i18nConfig = siteConfig.internationalization;

  if (i18nConfig && i18nConfig.enabled && lang) {
    contentToSearch = contentToSearch.filter(entry => entry.lang === lang);
  }

  const subdirs = new Set();
  
  // If not the main directory, filter relevant content
  // Operate on contentToSearch
  const contents = contentToSearch.filter(entry =>
    entry.directory !== 'root' && 
    entry.directory !== '' && // Ensure we don't try to replace on root items if they slip through
    (entry.directory === directory || entry.directory.startsWith(directory + '/'))
  );
  
  // Extract subdirectories from contents
  contents.forEach(entry => {
    // Get only subdirectories by skipping the main directory
    const relativePath = entry.directory.replace(directory + '/', '');
    if (relativePath && relativePath.includes('/')) {
      // Get the first subdirectory level (e.g., 'blog/category/js' -> 'category')
      const firstLevel = relativePath.split('/')[0];
      subdirs.add(firstLevel);
    }
  });
  
  return Array.from(subdirs).map(subdir => ({
    name: subdir,
    path: `${directory}/${subdir}`,
    title: formatTitle(subdir),
    url: `/${directory}/${subdir}`
  }));
};

// Function to process template variables
const processTemplateVariables = (content) => {
  // Get variables from configuration
  const variables = {
    // Site information
    'site.name': siteConfig.site.name,
    'site.description': siteConfig.site.description,
    'site.url': siteConfig.site.url,
    'site.author': siteConfig.site.author,
    
    // Contact information
    'contact.email': siteConfig.contact.email,
    'contact.privacyEmail': siteConfig.contact.privacyEmail,
    'contact.supportEmail': siteConfig.contact.supportEmail,
    'contact.phone': siteConfig.contact.phone,
    'contact.address.street': siteConfig.contact.address.street,
    'contact.address.city': siteConfig.contact.address.city,
    'contact.address.state': siteConfig.contact.address.state,
    'contact.address.zipCode': siteConfig.contact.address.zipCode,
    'contact.address.country': siteConfig.contact.address.country,
    'contact.address.full': `${siteConfig.contact.address.street}, ${siteConfig.contact.address.city}, ${siteConfig.contact.address.state} ${siteConfig.contact.address.zipCode}`,
    
    // Social media
    'social.twitter': siteConfig.social.twitter,
    'social.github': siteConfig.social.github,
    'social.linkedin': siteConfig.social.linkedin,
    'social.facebook': siteConfig.social.facebook,
    'social.instagram': siteConfig.social.instagram,
    'social.youtube': siteConfig.social.youtube,
    
    // Legal information
    'legal.privacyPolicyLastUpdated': siteConfig.legal.privacyPolicyLastUpdated,
    'legal.termsLastUpdated': siteConfig.legal.termsLastUpdated,
    'legal.doNotSell.processingTime': siteConfig.legal.doNotSell.processingTime,
    
    // Dynamic date functions
    'date.now': new Date().toLocaleDateString('en-US'),
    'date.year': new Date().getFullYear().toString(),
    'date.month': new Date().toLocaleDateString('en-US', { month: 'long' }),
    'date.day': new Date().getDate().toString()
  };
  
  // Replace template variables
  // Support {{variable.name}} format variables
  let processedContent = content;
  
  // First process JavaScript expressions (e.g.: {new Date().toLocaleDateString('en-US')})
  processedContent = processedContent.replace(/\{([^}]+)\}/g, (match, expression) => {
    try {
      // Allow only specific functions for safe eval
      if (expression.includes('new Date()')) {
        return eval(expression);
      }
      return match; // Leave unchanged expressions as they are
    } catch (error) {
      console.warn(`Template expression error: ${expression}`, error);
      return match;
    }
  });
  
  // Then process {{variable}} format variables
  processedContent = processedContent.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
    const trimmedName = variableName.trim();
    if (variables.hasOwnProperty(trimmedName)) {
      return variables[trimmedName];
    }
    console.warn(`Template variable not found: ${trimmedName}`);
    return match; // Leave unfound variables as they are
  });
  
  return processedContent;
};

// Export functions
export {
  scanContentDirectory,
  getContentDirectories,
  truncateContent,
  formatTitle,
  getAllContent,
  getContentByUrl,
  getContentByDirectory,
  clearContentCache,
  getSubDirectories,
  processTemplateVariables
}; 