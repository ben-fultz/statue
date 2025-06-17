import { getContentDirectories } from '$lib/cms/content-processor';

// Ensure this page is pre-rendered as a static page
export const prerender = true;

/** @type {import('./$types').PageServerLoad} */
export function load({ params }) { // params will include lang
  const currentLang = params.lang;
  console.log(`[lang]/about +page.server.js: Loading for lang "${currentLang}"`);

  // Get content directories for navigation
  // TODO: getContentDirectories might also need to be lang-aware if it's used for nav specific to a lang
  // If it were, we would pass currentLang to it: getContentDirectories(currentLang)
  const directories = getContentDirectories();

  // Enhance directories with proper URLs (original logic)
  // This mapping might not be strictly necessary if directories already have what's needed.
  const enhancedDirectories = directories.map(directory => {
    return {
      ...directory
      // No specific lang transformation needed here for directory structure itself yet
    };
  });

  // The actual content for the "About" page is in +page.svelte.
  // If we wanted to fetch content for "/about" from markdown, it would be:
  // const aboutPageContent = getContentByUrl('/about', currentLang);
  // And then return aboutPageContent.

  return {
    directories: enhancedDirectories,
    lang: currentLang // Pass current language to the page
  };
}
