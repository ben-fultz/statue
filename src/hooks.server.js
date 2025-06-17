import { getAllContent, getContentDirectories } from '$lib/cms/content-processor';
import { siteConfig } from '../site.config'; // Adjusted path
import { redirect } from '@sveltejs/kit';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  const { internationalization } = siteConfig;

  if (internationalization && internationalization.enabled) {
    const supportedLanguages = internationalization.languages || ['en'];
    const defaultLanguage = internationalization.defaultLanguage || 'en';

    const pathSegments = event.url.pathname.split('/').filter(Boolean);
    let detectedLang = defaultLanguage;
    let langSegmentPresent = false;

    // Check if the first segment is a supported language
    if (pathSegments.length > 0 && supportedLanguages.includes(pathSegments[0])) {
      detectedLang = pathSegments[0];
      langSegmentPresent = true;
      event.locals.lang = detectedLang;
      // Assuming routes are structured like src/routes/[lang]/...
      // If not, the path might need modification here, e.g., event.url.pathname = `/${pathSegments.slice(1).join('/') || ''}`;
    } else {
      event.locals.lang = defaultLanguage;
    }

    // Redirect root path or paths missing a language prefix (excluding assets and _app)
    if (event.url.pathname === '/') {
      throw redirect(307, `/${defaultLanguage}`);
    } else if (!langSegmentPresent &&
               pathSegments.length > 0 &&
               !pathSegments[0].startsWith('_app') &&
               !pathSegments[0].includes('.') && // Basic asset check
               event.request.method === 'GET') { // Only redirect GET requests
      const newPath = `/${defaultLanguage}${event.url.pathname}`;
      throw redirect(307, newPath);
    }
  } else {
    // If i18n is not enabled, set a default lang to event.locals anyway for consistency
    event.locals.lang = siteConfig.internationalization?.defaultLanguage || 'en';
  }

  // Existing logic for /api/content-paths
  if (event.url.pathname === '/api/content-paths') {
    // Scan all content in the Content folder
    const allContent = getAllContent();
    const directories = getContentDirectories();
    
    // Combine all content URLs and directory URLs
    let contentPaths = allContent.map(content => content.url);
    const directoryPaths = directories.map(dir => dir.url);
    
    // Filter problematic URLs (remove those containing [slug])
    contentPaths = contentPaths.filter(path => !path.includes('[slug]'));
    
    // Create a list of all possible paths
    const allPaths = [
      ...contentPaths,
      ...directoryPaths,
      '/' // Home page
    ];
    
    return new Response(JSON.stringify(allPaths), {
      headers: {
        'content-type': 'application/json'
      }
    });
  }
  
  // Normal route processing
  return await resolve(event);
}

/** @type {import('@sveltejs/kit').HandleServerError} */
export function handleError({ error }) {
  console.error('Server error occurred:', error);

  return {
    message: 'Server error occurred, see logs for details'
  };
}

// Create a list of all pages to be statically generated
/** @type {import('@sveltejs/kit').PrerenderExtendEntries} */
export async function entries() {
  const allContent = getAllContent();
  
  // Filter problematic URLs
  const contentPaths = allContent
    .map(content => content.url)
    .filter(url => !url.includes('[slug]'));
  
  // Return content URLs
  return contentPaths;
} 