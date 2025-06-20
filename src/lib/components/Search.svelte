<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import Fuse from 'fuse.js';

  // Component props
  export let placeholder = 'Search posts and docs...';
  export let maxResults = 10;
  export let minQueryLength = 2;

  // Component state
  let query = '';
  let results = [];
  let searchIndex = null;
  let fuse = null;
  let isLoading = false;
  let isOpen = false;
  let selectedIndex = -1;
  let searchInput;
  let searchContainer;
  let searchTimeout;
  let clickOutsideHandler;

  // Fuse.js configuration
  const fuseOptions = {
    keys: [
      {
        name: 'title',
        weight: 0.6
      },
      {
        name: 'description',
        weight: 0.3
      },
      {
        name: 'excerpt',
        weight: 0.2
      },
      {
        name: 'keywords',
        weight: 0.4
      },
      {
        name: 'content',
        weight: 0.1
      }
    ],
    threshold: 0.3, // Lower threshold = more strict matching
    distance: 100,
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2,
    ignoreLocation: true,
    useExtendedSearch: false
  };

  // Load search index on mount
  onMount(async () => {
    if (browser) {
      try {
        const response = await fetch('/search-index.json');
        if (response.ok) {
          searchIndex = await response.json();
          // Initialize Fuse.js with the search data
          fuse = new Fuse(searchIndex.items, fuseOptions);
          console.log(`Search index loaded: ${searchIndex.totalItems} items`);
        } else {
          console.warn('Search index not found - search functionality will be disabled');
          searchIndex = { items: [] };
          fuse = new Fuse([], fuseOptions);
        }
      } catch (error) {
        console.error('Failed to load search index:', error);
        searchIndex = { items: [] };
        fuse = new Fuse([], fuseOptions);
      }
    }

    // Setup click outside handler
    clickOutsideHandler = (event) => {
      if (searchContainer && !searchContainer.contains(event.target)) {
        closeSearch();
      }
    };

    // Cleanup function
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      if (clickOutsideHandler) {
        document.removeEventListener('click', clickOutsideHandler);
      }
    };
  });

  // Fuse.js search implementation
  function performSearch(searchQuery) {
    if (!searchQuery || searchQuery.length < minQueryLength || !fuse) {
      return [];
    }

    const fuseResults = fuse.search(searchQuery, { limit: maxResults });
    
    // Transform Fuse.js results to match our expected format
    return fuseResults.map(result => ({
      ...result.item,
      score: result.score,
      matches: result.matches
    }));
  }

  // Handle search input with proper debouncing
  function handleSearch() {
    if (!fuse) {
      results = [];
      return;
    }

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Don't search if query is too short
    if (query.length < minQueryLength) {
      results = [];
      isOpen = false;
      isLoading = false;
      return;
    }

    isLoading = true;
    
    // Debounce search
    searchTimeout = setTimeout(() => {
      try {
        results = performSearch(query);
        isOpen = results.length > 0;
        selectedIndex = -1;
      } catch (error) {
        console.error('Search error:', error);
        results = [];
        isOpen = false;
      } finally {
        isLoading = false;
      }
    }, 200);
  }

  // Handle keyboard navigation
  function handleKeydown(event) {
    if (!isOpen) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, -1);
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          navigateToResult(results[selectedIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        closeSearch();
        break;
    }
  }

  // Close search results
  function closeSearch() {
    isOpen = false;
    selectedIndex = -1;
  }

  // Navigate to selected result
  function navigateToResult(result) {
    if (result && result.url) {
      closeSearch();
      window.location.href = result.url;
    }
  }

  // Focus search input
  export function focus() {
    if (searchInput) {
      searchInput.focus();
    }
  }

  // Clear search
  export function clear() {
    query = '';
    results = [];
    closeSearch();
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
  }

  // Reactive statements
  $: if (query !== undefined) handleSearch();
  $: if (browser && isOpen && clickOutsideHandler) {
    document.addEventListener('click', clickOutsideHandler);
  } else if (browser && !isOpen && clickOutsideHandler) {
    document.removeEventListener('click', clickOutsideHandler);
  }

  // Format date for display
  function formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Highlight search terms in text using Fuse.js matches
  function highlightSearchTerms(text, searchQuery, matches = []) {
    if (!searchQuery || !text) return text;
    
    // If we have Fuse.js matches, use those for more accurate highlighting
    if (matches && matches.length > 0) {
      let highlighted = text;
      const matchedTerms = new Set();
      
      matches.forEach(match => {
        if (match.indices && match.indices.length > 0) {
          match.indices.forEach(([start, end]) => {
            const matchedText = text.substring(start, end + 1);
            if (matchedText.length > 2) {
              matchedTerms.add(matchedText.toLowerCase());
            }
          });
        }
      });
      
      // Highlight the matched terms
      matchedTerms.forEach(term => {
        const regex = new RegExp(`(${term})`, 'gi');
        highlighted = highlighted.replace(regex, '<mark>$1</mark>');
      });
      
      return highlighted;
    }
    
    // Fallback to simple word-based highlighting
    const words = searchQuery.toLowerCase().split(/\s+/);
    let highlighted = text;
    
    words.forEach(word => {
      if (word.length > 1) {
        const regex = new RegExp(`(${word})`, 'gi');
        highlighted = highlighted.replace(regex, '<mark>$1</mark>');
      }
    });
    
    return highlighted;
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="search-container" bind:this={searchContainer}>
  <div class="search-input-wrapper">
    <div class="search-icon">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
    </div>
    
    <input
      bind:this={searchInput}
      bind:value={query}
      type="text"
      {placeholder}
      class="search-input"
      class:has-results={isOpen}
      autocomplete="off"
      spellcheck="false"
      aria-label="Search"
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      aria-activedescendant={selectedIndex >= 0 ? `search-result-${selectedIndex}` : null}
    />
    
    {#if query}
      <button 
        class="clear-button" 
        on:click={clear}
        type="button"
        aria-label="Clear search"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    {/if}
    
    {#if isLoading}
      <div class="loading-spinner" aria-label="Searching...">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12a9 9 0 11-6.219-8.56"/>
        </svg>
      </div>
    {/if}
  </div>
  
  {#if isOpen && results.length > 0}
    <div class="search-results" role="listbox" aria-label="Search results">
      {#each results as result, index}
        <a 
          href={result.url}
          class="search-result"
          class:selected={index === selectedIndex}
          role="option"
          aria-selected={index === selectedIndex}
          id="search-result-{index}"
          on:mouseenter={() => selectedIndex = index}
          on:click|preventDefault={() => navigateToResult(result)}
        >
          <div class="result-header">
            <h3 class="result-title">
              {@html highlightSearchTerms(result.title, query, result.matches?.filter(m => m.key === 'title'))}
            </h3>
            <span class="result-category category-{result.category}">
              {result.category}
            </span>
          </div>
          
          {#if result.description}
            <p class="result-description">
              {@html highlightSearchTerms(result.description, query, result.matches?.filter(m => m.key === 'description'))}
            </p>
          {/if}
          
          <p class="result-excerpt">
            {@html highlightSearchTerms(result.excerpt, query, result.matches?.filter(m => m.key === 'excerpt'))}
          </p>
          
          <div class="result-meta">
            {#if result.date}
              <span class="result-date">
                {formatDate(result.date)}
              </span>
            {/if}
            {#if result.author}
              <span class="result-author">
                by {result.author}
              </span>
            {/if}
          </div>
        </a>
      {/each}
    </div>
  {:else if isOpen && query.length >= minQueryLength}
    <div class="search-results">
      <div class="no-results">
        <p>No results found for "{query}"</p>
        <p class="no-results-hint">Try different keywords or check spelling</p>
      </div>
    </div>
  {/if}
</div>

<style>
  .search-container {
    position: relative;
    width: 100%;
    max-width: 500px;
  }

  .search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 12px;
    color: #64748b;
    pointer-events: none;
    z-index: 1;
  }

  .search-input {
    width: 100%;
    padding: 12px 16px 12px 44px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 16px;
    background: #f1f5f9;
    color: #334155;
    transition: all 0.2s ease;
    outline: none;
  }

  .search-input::placeholder {
    color: #64748b; /* Adjust if necessary */
  }

  .search-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .search-input.has-results {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    border-bottom-color: #e2e8f0;
  }

  .clear-button {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .clear-button:hover {
    background: #f1f5f9;
    color: #334155;
  }

  .loading-spinner {
    position: absolute;
    right: 12px;
    color: #3b82f6;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .search-results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 2px solid #e2e8f0;
    border-top: none;
    border-radius: 0 0 8px 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    max-height: 400px;
    overflow-y: auto;
    z-index: 50;
  }

  .search-result {
    display: block;
    padding: 16px;
    border-bottom: 1px solid #f1f5f9;
    text-decoration: none;
    color: inherit;
    transition: background-color 0.2s ease;
  }

  .search-result:hover,
  .search-result.selected {
    background: #f8fafc;
  }

  .search-result:last-child {
    border-bottom: none;
  }

  .result-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .result-title {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
    line-height: 1.4;
  }

  .result-category {
    font-size: 12px;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .category-blog {
    background: #fef3c7;
    color: #92400e;
  }

  .category-docs {
    background: #dbeafe;
    color: #1e40af;
  }

  .result-description {
    font-size: 14px;
    color: #475569;
    margin: 0 0 8px 0;
    line-height: 1.5;
  }

  .result-excerpt {
    font-size: 14px;
    color: #64748b;
    margin: 0 0 8px 0;
    line-height: 1.5;
  }

  .result-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    color: #94a3b8;
  }

  .no-results {
    padding: 24px;
    text-align: center;
    color: #64748b;
  }

  .no-results p {
    margin: 0 0 8px 0;
  }

  .no-results-hint {
    font-size: 14px;
    color: #94a3b8;
  }

  /* Highlight styling */
  :global(.search-container mark) {
    background: #fef3c7;
    color: #92400e;
    padding: 1px 2px;
    border-radius: 2px;
    font-weight: 500;
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .search-container {
      max-width: none;
    }
    
    .result-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
    
    .result-meta {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }
  }
</style>
