import { getContentByUrl } from '$lib/cms/content-processor';
import { getContentDirectories } from '$lib/cms/content-processor';

// Make this page pre-rendered as a static page
export const prerender = true;

/** @type {import('./$types').PageServerLoad} */
export function load({ params }) { // params will include lang and slug
  // Add slash to the beginning of the URL for content lookup (slug does not include lang)
  const url = `/${params.slug}`;

  // DEBUG: Log URL parameter and generated URL to console
  console.log('Params:', params);
  console.log('Generated URL for content lookup:', url);
  console.log('Language from params:', params.lang);

  // Disable problematic routes (this logic might need review with [lang] prefix)
  // If slug itself could be 'blog/[slug]' this check is problematic.
  // Assuming slug is just the final part after any directory structure within the lang folder.
  if (params.slug && (params.slug.startsWith('blog/[slug]') || params.slug.startsWith('docs/[slug]'))) {
    // This check likely needs to be smarter or handled by ensuring `getContentByUrl` returns null
    // for placeholder-like URLs if they are not actual content.
    // For now, keeping similar logic but it's a weak point.
    console.warn(`Potentially problematic slug pattern: ${params.slug}`);
    // throw new Error('This route pattern seems problematic'); // Or handle differently
  }

  // Find content using the language from params
  const content = getContentByUrl(url, params.lang);

  // DEBUG: Log found content to console
  console.log('Found content:', content ? `YES (lang: ${content.lang})` : 'NO');
  if (content) {
    console.log('Content URL:', content.url);
    console.log('Content Directory:', content.directory);
  }

  // Get folders in content directory for navigation links
  // TODO: getContentDirectories might also need to be lang-aware if it's used for nav specific to a lang
  const directories = getContentDirectories();

  // If content is not found
  if (!content) {
    // Allow SvelteKit to handle routing
    // If a Svelte component exists, it will be shown, otherwise it will return 404
    return { notFound: true, directories, lang: params.lang }; // Pass lang for context
  }

  // Return content
  return {
    content,
    directories,
    lang: params.lang // Pass lang for context
  };
}
