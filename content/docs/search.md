# Search

Statue SSG includes built-in client-side search powered by [Pagefind](https://pagefind.app/), providing fast, scalable search for static sites of any size.

## Features

- **Fast & Scalable**: Chunked index loading means optimal performance even for large sites
- **Zero Configuration**: Works out of the box with sensible defaults
- **Fully Customizable**: Configure search behavior via `site.config.js`
- **Great UX**: Dropdown results, keyboard navigation, and mobile-friendly
- **Accessible**: Full ARIA support and screen reader compatible
- **MIT Licensed**: Pagefind is MIT licensed, compatible with Statue's license

## Quick Start

### 1. Enable Search

Edit your `site.config.js`:

```js
export const siteConfig = {
  // ... other config

  search: {
    enabled: true
  }
};
```

### 2. Add Search Component

You have two options for integrating search:

#### Option A: Integrated in NavigationBar (Recommended)

The NavigationBar automatically shows search when `search.enabled` is true in your config. No additional props needed!

```svelte
<script>
  import { NavigationBar } from 'statue-ssg';
  export let data;
</script>

<NavigationBar
  navbarItems={data.directories}
  activePath={data.activePath}
/>
```

**Optional:** You can override the config setting on specific pages:

```svelte
<!-- Force search on this page even if disabled in config -->
<NavigationBar {navbarItems} {activePath} showSearch={true} />

<!-- Or hide search on this page even if enabled in config -->
<NavigationBar {navbarItems} {activePath} showSearch={false} />
```

#### Option B: Standalone Component

Place the Search component anywhere in your layout:

```svelte
<script>
  import { Search, NavigationBar } from 'statue-ssg';
  export let data;
</script>

<header>
  <NavigationBar navbarItems={data.directories} activePath={data.activePath} />
  <div class="search-wrapper">
    <Search />
  </div>
</header>
```

### 3. Build Your Site

Search indexes are generated automatically during build:

```bash
npm run build
```

The `postbuild` script runs Pagefind, which creates the search index in `build/_pagefind/`.

### 4. Deploy

Deploy your `build/` directory to any static host. The search index is included automatically.

## Configuration

### Search Settings

Configure search behavior in `site.config.js`:

```js
export const siteConfig = {
  search: {
    // Enable/disable search
    enabled: true,

    // UI options
    placeholder: 'Search...',
    noResultsText: 'No results found',

    // Search behavior
    debounceMs: 300,        // Delay before search executes (ms)
    minQueryLength: 2,      // Minimum characters to trigger search
    maxResults: 10,         // Maximum results to display

    // Result display
    showCategories: true,   // Show category badges
    showDates: true,        // Show dates in results
    showExcerpts: true,     // Show content excerpts
    excerptLength: 30       // Words in excerpt
  }
};
```

### Component Props

Customize the Search component with props:

```svelte
<Search
  placeholder="Search documentation..."
  debounceMs={200}
  minQueryLength={3}
  maxResults={15}
  showCategories={true}
  showDates={false}
  showExcerpts={true}
  containerClass="custom-search"
  inputClass="custom-input"
  resultsClass="custom-results"
/>
```

#### Available Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `placeholder` | `string` | `'Search...'` | Input placeholder text |
| `debounceMs` | `number` | `300` | Search delay in milliseconds |
| `minQueryLength` | `number` | `2` | Minimum query length to trigger search |
| `maxResults` | `number` | `10` | Maximum results to display |
| `showCategories` | `boolean` | `true` | Show category badges in results |
| `showDates` | `boolean` | `true` | Show dates in results |
| `showExcerpts` | `boolean` | `true` | Show content excerpts in results |
| `containerClass` | `string` | `''` | Additional container CSS classes |
| `inputClass` | `string` | `''` | Additional input CSS classes |
| `resultsClass` | `string` | `''` | Additional results dropdown CSS classes |

## Usage Tips

### Keyboard Navigation

- **Type**: Start searching (auto-debounced)
- **Arrow Down/Up**: Navigate through results
- **Enter**: Go to selected result
- **Escape**: Close search results
- **Click Outside**: Close search results

### Excluding Content from Search

To exclude specific content from being indexed, add the `no-search` class or use Pagefind's data attributes:

```html
<!-- Exclude entire section -->
<div class="no-search">
  This content won't be indexed by search
</div>

<!-- Or use Pagefind's data attribute -->
<div data-pagefind-ignore>
  This also won't be indexed
</div>
```

You can configure excluded selectors in `pagefind.config.js` (optional):

```js
// pagefind.config.js
export default {
  site: 'build',
  exclude_selectors: [
    'header',
    'footer',
    'nav',
    '.no-search',
    '#comments'
  ]
};
```

### Customizing Search Results

Search automatically indexes:
- Page titles
- Content text
- Meta descriptions
- Categories (from URL structure)
- Dates (from frontmatter)

To improve search results, add descriptive frontmatter to your markdown files:

```markdown
---
title: Getting Started with Statue SSG
description: Learn how to create your first static site with Statue
date: 2025-01-15
author: Your Name
---

# Getting Started with Statue SSG

Your content here...
```

## Styling

### Using CSS Variables

The Search component uses Statue's CSS variables for theming:

```css
/* Customize search appearance */
.search-container {
  --color-primary: #your-color;
  --color-foreground: #your-color;
  --color-background: #your-color;
  --color-card: #your-color;
  --color-border: #your-color;
  --color-muted: #your-color;
}
```

### Custom Styling

Add custom classes via props:

```svelte
<Search
  containerClass="my-custom-search"
  inputClass="my-search-input"
  resultsClass="my-search-results"
/>
```

Then style in your CSS:

```css
.my-custom-search {
  max-width: 600px;
  margin: 0 auto;
}

.my-search-input {
  font-size: 1.1rem;
  padding: 0.75rem 1rem;
}

.my-search-results {
  max-height: 500px;
}
```

## Performance

### How It Works

1. **Build Time**: Pagefind indexes your built HTML files
2. **Initial Load**: Only ~1KB of JavaScript loads initially
3. **First Search**: Search index chunks load on-demand
4. **Subsequent Searches**: Cached for instant results

### Optimization Tips

- **Small Sites** (<100 pages): All features work great out of the box
- **Medium Sites** (100-500 pages): Consider reducing `maxResults`
- **Large Sites** (500+ pages): Pagefind's chunking shines here

Pagefind automatically splits the search index into chunks, so larger sites don't impact initial page load.

## Troubleshooting

### Search not working in development

Search requires a production build to generate the index:

```bash
npm run build
npm run preview
```

In development mode (`npm run dev`), the search index doesn't exist yet.

### "Failed to load Pagefind" error

This error occurs if:
1. You haven't run `npm run build` yet
2. The `pagefind` directory is missing from your build output
3. Pagefind wasn't installed: `npm install -D pagefind`

### Search results not updating

After adding new content:
1. Rebuild your site: `npm run build`
2. The search index regenerates automatically

### No results for certain pages

Check that:
1. Pages are being built (check `build/` directory)
2. Content isn't in excluded sections (header, footer, nav)
3. Pages have actual text content to index

## Advanced Configuration

### Custom Pagefind Configuration

Create `pagefind.config.js` in your project root:

```js
export default {
  site: 'build',
  output_path: 'pagefind',
  bundle_dir: '_pagefind',
  glob: '**/*.{html}',
  exclude_selectors: [
    'header',
    'footer',
    'nav',
    '.no-search'
  ],
  force_language: 'en',
  verbose: false
};
```

### Multi-language Support

Pagefind supports multiple languages. Set in `pagefind.config.js`:

```js
export default {
  site: 'build',
  force_language: 'en', // or 'es', 'fr', 'de', etc.
};
```

### Search Analytics

Track search queries by adding an event listener:

```svelte
<script>
  import { Search } from 'statue-ssg';
  import { browser } from '$app/environment';

  function handleSearch(query) {
    if (browser && window.analytics) {
      window.analytics.track('search', { query });
    }
  }
</script>

<Search on:search={handleSearch} />
```

## Examples

### Blog with Search

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import { NavigationBar, Footer, Search } from 'statue-ssg';
  export let data;
</script>

<NavigationBar
  navbarItems={data.directories}
  activePath={data.currentPath}
  showSearch={true}
/>

<main>
  <slot />
</main>

<Footer directories={data.directories} currentPath={data.currentPath} />
```

### Documentation Site with Standalone Search

```svelte
<!-- src/routes/docs/+layout.svelte -->
<script>
  import { DocsLayout, Search } from 'statue-ssg';
  export let data;
</script>

<DocsLayout
  sidebarItems={data.sidebarItems}
  activePath={data.activePath}
>
  <!-- Search at top of docs -->
  <div slot="before-content" class="mb-8">
    <Search
      placeholder="Search documentation..."
      showDates={false}
      showCategories={false}
    />
  </div>

  <slot />
</DocsLayout>
```

## Further Reading

- [Pagefind Documentation](https://pagefind.app/)
- [Component API Reference](/docs/components#search)
- [Site Configuration Guide](/docs/site-config)
- [Theming Guide](/docs/themes)
