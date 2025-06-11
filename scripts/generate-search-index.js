// Search index generator for static site
// This script generates a search index JSON file during build time

import fs from 'fs';
import path from 'path';
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
      !['the', 'and', 'but', 'for', 'are', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word)
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

// Main function to generate search index
const generateSearchIndex = () => {
  console.log('🔍 Generating search index...');
  
  try {
    // Get all content from the CMS
    const allContent = getAllContent();
    
    // Filter content for blog and docs only
    const searchableContent = allContent.filter(entry => 
      entry.mainDirectory === 'blog' || entry.mainDirectory === 'docs'
    );
    
    console.log(`Found ${searchableContent.length} searchable items`);
    
    // Create search index entries
    const searchIndex = searchableContent.map(entry => {
      const excerpt = createExcerpt(entry.content);
      const keywords = extractKeywords(entry.metadata.title, entry.metadata.description || '', entry.content);
      
      return {
        id: `${entry.mainDirectory}-${entry.slug}`,
        title: entry.metadata.title,
        description: entry.metadata.description || '',
        excerpt,
        url: entry.url,
        category: entry.mainDirectory,
        date: entry.metadata.date || null,
        author: entry.metadata.author || null,
        keywords,
        // For search scoring
        searchText: `${entry.metadata.title} ${entry.metadata.description || ''} ${excerpt}`.toLowerCase()
      };
    });
    
    // Ensure static directory exists
    const staticDir = path.resolve(__dirname, '../static');
    if (!fs.existsSync(staticDir)) {
      fs.mkdirSync(staticDir, { recursive: true });
    }
    
    // Write search index to static directory
    const indexPath = path.join(staticDir, 'search-index.json');
    fs.writeFileSync(indexPath, JSON.stringify({
      version: '1.0.0',
      generated: new Date().toISOString(),
      totalItems: searchIndex.length,
      items: searchIndex
    }, null, 2));
    
    console.log(`✅ Search index generated: ${indexPath}`);
    console.log(`📊 Indexed ${searchIndex.length} items`);
    
    // Log categories
    const categories = [...new Set(searchIndex.map(item => item.category))];
    console.log(`📂 Categories: ${categories.join(', ')}`);
    
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
