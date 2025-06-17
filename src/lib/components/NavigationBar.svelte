<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { currentLanguage } from '$lib/stores/language.js';
  import { siteConfig } from '../../../site.config.js';

  export let navbarItems = [];
  export let activePath = ''; // Assumed to be lang-agnostic, e.g., /blog, /about
  
  let isMenuOpen = false;
  
  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }

  const i18n = siteConfig.internationalization;

  function switchLanguage(selectedLang) {
    if ($currentLanguage === selectedLang) return;

    currentLanguage.set(selectedLang);

    const currentPathname = $page.url.pathname;
    const pathSegments = currentPathname.split('/').filter(Boolean);
    let newPath;

    if (pathSegments.length > 0 && i18n && i18n.languages.includes(pathSegments[0])) {
      // Path starts with a known language code, replace it
      pathSegments[0] = selectedLang;
      newPath = '/' + pathSegments.join('/');
    } else {
      // Path does not start with a known language code, or is empty
      // Prepend the selected language.
      // If currentPathname is '/', newPath becomes '/selectedLang'
      // Otherwise, '/selectedLang/current/path'
      newPath = '/' + selectedLang + (currentPathname === '/' ? '' : currentPathname);
    }

    // Ensure newPath starts with a single slash
    if (newPath.charAt(0) !== '/') {
        newPath = '/' + newPath;
    }
    // Remove potential double slashes if currentPathname was '/' and newPath became '//segment'
    newPath = newPath.replace(/\/\//g, '/');

    goto(newPath, { invalidateAll: true });
  }

  // Helper to generate language-prefixed URLs for navigation items
  function langLink(basePath) {
    if (basePath === '/') return `/${$currentLanguage}`;
    return `/${$currentLanguage}${basePath.startsWith('/') ? basePath : '/' + basePath}`;
  }

</script>

<nav class="bg-black text-white border-b border-gray-800 shadow-lg fixed w-full top-0 z-50">
  <div class="container mx-auto px-4">
    <div class="flex items-center justify-between h-16">
      <div class="flex items-center">
        <a href={langLink('/')} class="flex items-center space-x-2">
          <!-- Logo icon - custom SVG similar to BotGauge -->
          <div class="text-green-500 w-8 h-8">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
              <path d="M8 12H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M12 8L12 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <span class="font-bold text-xl">
            <span class="text-green-500">Statue</span>SSG
          </span>
        </a>
      </div>
      
      <!-- Desktop Menu -->
      <div class="hidden md:flex items-center space-x-1"> {/* Reduced space for more items */}
        <a 
          href={langLink('/')}
          class="py-2 px-3 font-medium text-sm transition-colors duration-200 {activePath === '/' || activePath === '' ? 'text-green-400' : 'text-gray-300 hover:text-white'}"
        >
          Home
        </a>
        <a 
          href={langLink('/about')}
          class="py-2 px-3 font-medium text-sm transition-colors duration-200 {activePath === '/about' ? 'text-green-400' : 'text-gray-300 hover:text-white'}"
        >
          About
        </a>
        {#each navbarItems as item}
          {#if item.name !== 'legal'}
            <a 
              href={langLink(item.url)}
              class="py-2 px-3 font-medium text-sm transition-colors duration-200 {activePath === item.url ? 'text-green-400' : 'text-gray-300 hover:text-white'}"
            >
              {item.title}
            </a>
          {/if}
        {/each}
        
        <a href={langLink('/docs')} class="ml-2 px-3 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors duration-200">
          Documentation
        </a>

        <!-- Language Switcher - Desktop -->
        {#if i18n && i18n.enabled}
          <div class="ml-2 flex items-center space-x-1 border-l border-gray-700 pl-2">
            {#each i18n.languages as langCode}
              <button
                on:click={() => switchLanguage(langCode)}
                class="px-2 py-1 rounded-md text-xs font-medium transition-colors duration-200 { $currentLanguage === langCode ? 'bg-green-500 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}"
                title="Switch to {langCode.toUpperCase()}"
              >
                {langCode.toUpperCase()}
              </button>
            {/each}
          </div>
        {/if}
      </div>
      
      <!-- Mobile menu button -->
      <div class="md:hidden">
        <button on:click={toggleMenu} class="text-gray-400 hover:text-white focus:outline-none">
          {#if isMenuOpen}
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          {:else}
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          {/if}
        </button>
      </div>
    </div>
  </div>
  
  <!-- Mobile Menu -->
  {#if isMenuOpen}
    <div class="md:hidden bg-gray-900 border-t border-gray-800">
      <div class="px-2 pt-2 pb-3 space-y-1">
        <a 
          href={langLink('/')}
          class="block px-3 py-2 rounded-md text-base font-medium {activePath === '/' || activePath === '' ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}"
          on:click={() => isMenuOpen = false}
        >
          Home
        </a>
        <a
          href={langLink('/about')}
          class="block px-3 py-2 rounded-md text-base font-medium {activePath === '/about' ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}"
          on:click={() => isMenuOpen = false}
        >
          About
        </a>
        {#each navbarItems as item}
          {#if item.name !== 'legal'}
            <a 
              href={langLink(item.url)}
              class="block px-3 py-2 rounded-md text-base font-medium {activePath === item.url ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}"
              on:click={() => isMenuOpen = false}
            >
              {item.title}
            </a>
          {/if}
        {/each}
        
        <a href={langLink('/docs')} class="block px-3 py-2 rounded-md text-base font-medium bg-green-500 hover:bg-green-600 text-white mt-3" on:click={() => isMenuOpen = false}>
          Documentation
        </a>

        <!-- Language Switcher - Mobile -->
        {#if i18n && i18n.enabled}
          <div class="pt-2 mt-2 border-t border-gray-700">
            <div class="flex items-center justify-center space-x-2">
              {#each i18n.languages as langCode}
                <button
                  on:click={() => { switchLanguage(langCode); isMenuOpen = false; }}
                  class="px-3 py-1 rounded-md text-sm font-medium { $currentLanguage === langCode ? 'bg-green-500 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}"
                >
                  {langCode.toUpperCase()}
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</nav>

<!-- Spacer for fixed navbar -->
<div class="h-16"></div> 