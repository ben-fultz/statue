import { getContentDirectories, getContentByDirectory, getSubDirectories } from '$lib/cms/content-processor';

// Make this page prerendered as a static page
export const prerender = true;

/** @type {import('./$types').PageServerLoad} */
export function load({ params }) { // params will include lang and directory
  // Get directory name and language
  const directoryName = params.directory;
  const currentLang = params.lang;

  console.log(`[lang]/[directory] +page.server.js: Loading for directory "${directoryName}", lang "${currentLang}"`);

  // For blog/ or docs/ directories, show the top-level route,
  // but don't show sublevel "[slug]" routes (This comment might be less relevant now with lang)
  if (directoryName === 'blog' || directoryName === 'docs') {
    // Continue to get content from this directory
  }

  // Get all directories (potentially for global navigation)
  // TODO: getContentDirectories might also need to be lang-aware if it's used for nav specific to a lang
  const directories = getContentDirectories();

  // Get content from specific directory (including content from subdirectories), filtered by language
  const directoryContent = getContentByDirectory(directoryName, currentLang);

  // Find subdirectories of this directory, filtered by language
  const subDirectories = getSubDirectories(directoryName, currentLang);

  // Get directory information
  // The `directories` from `getContentDirectories` are not lang-specific yet.
  // This might lead to currentDirectory not having specific lang info if we rely on it.
  // For now, it finds based on name, title is generic.
  const currentDirectory = directories.find(dir => dir.name === directoryName) || {
    name: directoryName,
    title: directoryName.charAt(0).toUpperCase() + directoryName.slice(1) // Generic title
  };

  return {
    directories, // Global nav items
    directoryContent, // Content for the current directory and its subdirs, filtered by lang
    subDirectories, // Subdirectories of the current directory, filtered by lang
    currentDirectory, // Info about the current directory (name, title)
    lang: currentLang // Pass current language to the page
  };
}
