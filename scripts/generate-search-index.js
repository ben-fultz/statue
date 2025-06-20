// Search index generator for static site
// This script generates a search index JSON file during build time

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the content processor
import { getAllContent } from '../src/lib/cms/content-processor.js';

// Function to strip HTML tags and get plain text
const stripHtml = (html) => {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&[^;]+;/g, '') // Remove HTML entities
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
};

// Function to create search-friendly excerpt
const createExcerpt = (content, maxLength = 200) => {
  const plainText = stripHtml(content);
  if (plainText.length <= maxLength) return plainText;
  
  // Find last complete word within limit
  const truncated = plainText.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
};

// Function to generate content hash for change detection
const generateContentHash = (content) => {
  return crypto.createHash('md5').update(content).digest('hex');
};

// Function to load existing search index
const loadExistingIndex = (indexPath) => {
  if (!fs.existsSync(indexPath)) {
    return { items: [], metadata: {} };
  }
  
  try {
    const existingData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    return {
      items: existingData.items || [],
      metadata: existingData.metadata || {}
    };
  } catch (error) {
    console.warn('Failed to load existing search index, rebuilding from scratch');
    return { items: [], metadata: {} };
  }
};

// Function to check if content has changed
const hasContentChanged = (entry, existingMetadata) => {
  const entryKey = `${entry.mainDirectory}-${entry.slug}`;
  const existing = existingMetadata[entryKey];
  
  if (!existing) {
    return true; // New content
  }
  
  // Check if file modification time has changed
  const currentMtime = entry.stats?.mtime?.getTime();
  if (currentMtime && existing.mtime && currentMtime !== existing.mtime) {
    return true;
  }
  
  // Check content hash as fallback
  const currentHash = generateContentHash(entry.content + JSON.stringify(entry.metadata));
  return currentHash !== existing.hash;
};

// Common stop words to filter out
const STOP_WORDS = new Set([
  'the', 'and', 'but', 'for', 'are', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use', 'with', 'have', 'this', 'will', 'your', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were'
]);

// Function to extract keywords from content
const extractKeywords = (title, description, content) => {
  const text = `${title} ${description} ${stripHtml(content)}`.toLowerCase();
  
  // Simple keyword extraction - split by common delimiters and filter
  const words = text
    .split(/[\s\n\r\t,.!?;:()\[\]{}"'-]+/)
    .filter(word => 
      word.length > 2 && // Minimum length
      word.length < 20 && // Maximum length
      !/^\d+$/.test(word) && // Not just numbers
      !STOP_WORDS.has(word) // Not a stop word
    );
  
  // Count frequency and return most common words
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10) // Top 10 keywords
    .map(([word]) => word);
};

// Main function to generate search index with incremental updates
const generateSearchIndex = () => {
  console.log('🔍 Generating search index...');
  
  try {
    // Ensure static directory exists
    const staticDir = path.resolve(__dirname, '../static');
    if (!fs.existsSync(staticDir)) {
      fs.mkdirSync(staticDir, { recursive: true });
    }
    
    const indexPath = path.join(staticDir, 'search-index.json');
    
    // Load existing index
    const existingIndex = loadExistingIndex(indexPath);
    console.log(`📋 Loaded existing index with ${existingIndex.items.length} items`);
    
    // Get all content from the CMS
    const allContent = getAllContent();
    
    // Filter content for blog and docs only
    const searchableContent = allContent.filter(entry => 
      entry.mainDirectory === 'blog' || entry.mainDirectory === 'docs'
    );
    
    console.log(`Found ${searchableContent.length} searchable items`);
    
    // Track changes
    let newItems = 0;
    let updatedItems = 0;
    let unchangedItems = 0;
    
    // Create a map of existing items for quick lookup
    const existingItemsMap = new Map();
    existingIndex.items.forEach(item => {
      existingItemsMap.set(item.id, item);
    });
    
    // Process content and build new index
    const searchIndex = [];
    const newMetadata = {};
    
    for (const entry of searchableContent) {
      const entryId = `${entry.mainDirectory}-${entry.slug}`;
      const hasChanged = hasContentChanged(entry, existingIndex.metadata);
      
      if (hasChanged) {
        // Content has changed or is new, reprocess it
        const excerpt = createExcerpt(entry.content);
        const keywords = extractKeywords(entry.metadata.title, entry.metadata.description || '', entry.content);
        
        const indexEntry = {
          id: entryId,
          title: entry.metadata.title,
          description: entry.metadata.description || '',
          excerpt,
          url: entry.url,
          category: entry.mainDirectory,
          date: entry.metadata.date || null,
          author: entry.metadata.author || null,
          keywords,
          // Combined text content for Fuse.js to search across
          content: `${entry.metadata.title} ${entry.metadata.description || ''} ${excerpt} ${keywords.join(' ')}`
        };
        
        searchIndex.push(indexEntry);
        
        // Track metadata for future incremental updates
        newMetadata[entryId] = {
          mtime: entry.stats?.mtime?.getTime(),
          hash: generateContentHash(entry.content + JSON.stringify(entry.metadata))
        };
        
        if (existingItemsMap.has(entryId)) {
          updatedItems++;
          console.log(`🔄 Updated: ${entry.metadata.title}`);
        } else {
          newItems++;
          console.log(`✨ New: ${entry.metadata.title}`);
        }
      } else {
        // Content unchanged, reuse existing index entry
        const existingItem = existingItemsMap.get(entryId);
        if (existingItem) {
          searchIndex.push(existingItem);
          // Preserve existing metadata
          newMetadata[entryId] = existingIndex.metadata[entryId];
          unchangedItems++;
        }
      }
    }
    
    // Remove items that no longer exist
    const currentIds = new Set(searchableContent.map(entry => `${entry.mainDirectory}-${entry.slug}`));
    const removedItems = existingIndex.items.filter(item => !currentIds.has(item.id));
    
    // Write updated search index
    fs.writeFileSync(indexPath, JSON.stringify({
      version: '1.0.0',
      generated: new Date().toISOString(),
      totalItems: searchIndex.length,
      items: searchIndex,
      metadata: newMetadata
    }, null, 2));
    
    console.log(`✅ Search index generated: ${indexPath}`);
    console.log(`📊 Total items: ${searchIndex.length}`);
    console.log(`✨ New items: ${newItems}`);
    console.log(`🔄 Updated items: ${updatedItems}`);
    console.log(`📋 Unchanged items: ${unchangedItems}`);
    if (removedItems.length > 0) {
      console.log(`🗑️  Removed items: ${removedItems.length}`);
      removedItems.forEach(item => console.log(`   - ${item.title}`));
    }
    
    // Log categories
    const categories = [...new Set(searchIndex.map(item => item.category))];
    console.log(`📂 Categories: ${categories.join(', ')}`);
    
    // Performance summary
    const totalProcessed = newItems + updatedItems;
    const percentageSkipped = Math.round((unchangedItems / searchableContent.length) * 100);
    console.log(`⚡ Performance: Processed ${totalProcessed}/${searchableContent.length} items (${percentageSkipped}% skipped)`);
    
  } catch (error) {
    console.error('❌ Error generating search index:', error);
    process.exit(1);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateSearchIndex();
}

export { generateSearchIndex };
