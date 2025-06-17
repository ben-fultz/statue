<script>
  import Footer from '$lib/components/Footer.svelte';
  import { page } from '$app/stores';
  import { siteConfig } from '../../site.config.js';
  
  export let data;
  
  $: globalDirectories = data.globalDirectories;
  $: currentPath = $page.url.pathname;
  
  // Get current theme colors
  $: currentTheme = siteConfig.theme.presets[siteConfig.theme.preset];
  $: themeColors = currentTheme.colors;
</script>

<main class="{themeColors.background} min-h-screen">
  <slot />
</main>

<Footer directories={globalDirectories} {currentPath} {themeColors} />

<style>
  :global(body) {
    background-color: #000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
</style> 
