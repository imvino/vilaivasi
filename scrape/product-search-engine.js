// product-search-engine.js
const { QdrantClient } = require('@qdrant/js-client-rest');
const { Pipeline } = require('@xenova/transformers');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const { Speller } = require('cspell-lib');
const Redis = require('ioredis');

// Initialize connections
const pgPool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'products',
  password: 'yourpassword',
  port: 5432,
});

const qdrantClient = new QdrantClient({ url: 'http://localhost:6333' });
const COLLECTION_NAME = 'product_embeddings';

// Redis for caching frequently accessed data
const redisClient = new Redis();

// Global spell checker instance
let speller = null;

// Initialize PostgreSQL extensions
async function initPostgresExtensions() {
  const client = await pgPool.connect();
  try {
    console.log('Installing and enabling PostgreSQL extensions...');
    
    // Install required extensions for advanced text search and indexing
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS pg_trgm;
      CREATE EXTENSION IF NOT EXISTS btree_gin;
      CREATE EXTENSION IF NOT EXISTS btree_gist;
      CREATE EXTENSION IF NOT EXISTS unaccent;
    `);
    
    console.log('PostgreSQL extensions successfully enabled');
  } catch (error) {
    console.error('Error installing PostgreSQL extensions:', error);
  } finally {
    client.release();
  }
}

// Initialize embedding model
async function initEmbeddingModel() {
  const pipeline = await Pipeline.pipeline(
    'feature-extraction',
    'Xenova/all-MiniLM-L6-v2'
  );
  return pipeline;
}

// Initialize spell correction with cspell
async function initSpellCorrection() {
  try {
    console.log('Initializing spell correction with cspell...');
    
    // Create a custom dictionary from product data
    const client = await pgPool.connect();
    const result = await client.query(`
      SELECT DISTINCT word, COUNT(*) as frequency FROM (
        SELECT regexp_split_to_table(lower(title), '\\s+') as word FROM unified_products
        UNION ALL
        SELECT regexp_split_to_table(lower(brand), '\\s+') as word FROM unified_products
        UNION ALL
        SELECT regexp_split_to_table(lower(category), '\\s+') as word FROM unified_products
      ) words
      WHERE length(word) > 2 AND word ~ '^[a-z0-9]+$'
      GROUP BY word
      ORDER BY frequency DESC
      LIMIT 100000
    `);
    client.release();
    
    // Create custom dictionary for cspell
    const customDictionary = {};
    for (const row of result.rows) {
      // Add entries with custom weight based on frequency
      const weight = Math.min(Math.log10(row.frequency) + 1, 10);
      customDictionary[row.word] = weight;
    }
    
    // Initialize the speller with custom dictionary
    speller = new Speller({
      dictionaries: [
        { name: 'en_US' },  // Include standard English dictionary
        { name: 'custom', dictionary: customDictionary }
      ],
      caseSensitive: false,
      maxNumberChanges: 3,
      numSuggestions: 5,
      allowCompoundWords: true,
      minWordLength: 3,
      useCache: true
    });
    
    await speller.loadDictionaries();
    console.log(`CSpell dictionary initialized with ${Object.keys(customDictionary).length} words`);
  } catch (error) {
    console.error('Error initializing spell correction:', error);
    // Continue without spell correction rather than crashing
  }
}

// Schema setup - create a unified products table
async function setupDatabaseSchema() {
  const client = await pgPool.connect();
  try {
    // Create tables with IF NOT EXISTS for all tables
    await client.query(`
      -- Unified products table
      CREATE TABLE IF NOT EXISTS unified_products (
        id SERIAL PRIMARY KEY,
        source_id VARCHAR(255) NOT NULL,  -- Original ID from source table
        source_table VARCHAR(50) NOT NULL, -- 'amazon', 'flipkart', etc.
        title VARCHAR(500) NOT NULL,
        brand VARCHAR(255),
        mrp NUMERIC(10, 2),
        price NUMERIC(10, 2),
        rating NUMERIC(10, 2),
        review_count INTEGER,
        image_url TEXT,
        product_url TEXT,
        category VARCHAR(255),
        variant VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Product groups table
      CREATE TABLE IF NOT EXISTS product_groups (
        group_id UUID PRIMARY KEY,
        canonical_title VARCHAR(500) NOT NULL,
        brand VARCHAR(255) NOT NULL,
        mrp NUMERIC(10, 2) NOT NULL,
        canonical_image_url TEXT,
        category VARCHAR(255),
        embedding_id VARCHAR(255), -- Reference to vector ID in Qdrant
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Product group members table
      CREATE TABLE IF NOT EXISTS product_group_members (
        id SERIAL PRIMARY KEY,
        group_id UUID REFERENCES product_groups(group_id),
        product_id INTEGER REFERENCES unified_products(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Search cache table for storing frequent searches
      CREATE TABLE IF NOT EXISTS search_cache (
        id SERIAL PRIMARY KEY,
        query TEXT NOT NULL,
        filters JSONB,
        results JSONB,
        hit_count INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Search performance log
      CREATE TABLE IF NOT EXISTS search_performance (
        id SERIAL PRIMARY KEY,
        query TEXT NOT NULL,
        duration_ms INTEGER NOT NULL,
        result_count INTEGER NOT NULL,
        filters JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- User search log (for OpenSearch compatibility)
      CREATE TABLE IF NOT EXISTS user_search_log (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NULL,  -- Optional user identifier
        session_id VARCHAR(255) NOT NULL,
        query TEXT NOT NULL,
        filters JSONB,
        result_count INTEGER NOT NULL,
        clicked_items JSONB,
        search_metadata JSONB,  -- For OpenSearch metadata compatibility
        ip_address VARCHAR(45),
        user_agent TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create indexes for better performance
    await client.query(`
      -- Indexes for unified_products
      CREATE INDEX IF NOT EXISTS idx_unified_brand ON unified_products(brand);
      CREATE INDEX IF NOT EXISTS idx_unified_price ON unified_products(price);
      CREATE INDEX IF NOT EXISTS idx_unified_rating ON unified_products(rating);
      CREATE INDEX IF NOT EXISTS idx_unified_source ON unified_products(source_table, source_id);
      CREATE INDEX IF NOT EXISTS idx_unified_category ON unified_products(category);
      
      -- Indexes for product_groups
      CREATE INDEX IF NOT EXISTS idx_group_brand ON product_groups(brand);
      CREATE INDEX IF NOT EXISTS idx_group_mrp ON product_groups(mrp);
      CREATE INDEX IF NOT EXISTS idx_group_category ON product_groups(category);
      
      -- Indexes for product_group_members
      CREATE INDEX IF NOT EXISTS idx_group_members ON product_group_members(group_id);
      CREATE INDEX IF NOT EXISTS idx_product_in_group ON product_group_members(product_id);
      
      -- Indexes for search_cache
      CREATE INDEX IF NOT EXISTS idx_search_query ON search_cache(query);
      CREATE INDEX IF NOT EXISTS idx_search_hits ON search_cache(hit_count DESC);
      
      -- Indexes for user_search_log for OpenSearch compatibility
      CREATE INDEX IF NOT EXISTS idx_user_search_query ON user_search_log(query);
      CREATE INDEX IF NOT EXISTS idx_user_search_timestamp ON user_search_log(timestamp);
      CREATE INDEX IF NOT EXISTS idx_user_search_user_id ON user_search_log(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_search_session ON user_search_log(session_id);
      CREATE INDEX IF NOT EXISTS idx_user_search_query_gin ON user_search_log USING GIN(query gin_trgm_ops);
      
      -- Add full-text search capabilities
      ALTER TABLE unified_products ADD COLUMN IF NOT EXISTS search_vector tsvector;
      CREATE INDEX IF NOT EXISTS idx_search_vector ON unified_products USING GIN(search_vector);
      
      -- Create function to update search vector
      CREATE OR REPLACE FUNCTION update_search_vector_trigger() RETURNS trigger AS $$
      BEGIN
        NEW.search_vector = 
          setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
          setweight(to_tsvector('english', COALESCE(NEW.brand, '')), 'B') ||
          setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'C');
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql;
      
      -- Create trigger for automatic updates
      DROP TRIGGER IF EXISTS update_unified_products_search_vector ON unified_products;
      CREATE TRIGGER update_unified_products_search_vector
      BEFORE INSERT OR UPDATE ON unified_products
      FOR EACH ROW EXECUTE FUNCTION update_search_vector_trigger();
    `);
    
    console.log('Database schema setup complete');
  } catch (error) {
    console.error('Error setting up database schema:', error);
  } finally {
    client.release();
  }
}

// Initialize Qdrant collection
async function initQdrant() {
  try {
    const collections = await qdrantClient.getCollections();
    const exists = collections.collections.some(c => c.name === COLLECTION_NAME);
    
    if (!exists) {
      await qdrantClient.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 384, // Size for all-MiniLM-L6-v2
          distance: 'Cosine'
        }
      });
      console.log('Qdrant collection created');
    }
  } catch (error) {
    console.error('Failed to initialize Qdrant:', error);
  }
}

// Generate embedding for a product
async function generateEmbedding(text, model) {
  const output = await model(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

// Create unified products from source tables
async function unifyProducts(sourceNames = [], truncateFirst = false) {
  const client = await pgPool.connect();
  try {
    // If explicitly requested, truncate the table first
    if (truncateFirst) {
      console.log('Truncating unified_products table by explicit request');
      await client.query('TRUNCATE unified_products RESTART IDENTITY CASCADE');
    }
    
    // If no source names provided, default to known sources
    if (!sourceNames || sourceNames.length === 0) {
      sourceNames = ['amazon', 'flipkart', 'jiomart'];
    }
    
    for (const source of sourceNames) {
      try {
        console.log(`Processing products from source: ${source}`);
        
        // Remove existing products from this source before adding new ones
        // This allows for incremental updates
        await client.query(`DELETE FROM unified_products WHERE source_table = $1`, [source]);
        
        // Check if the source table exists
        const tableCheck = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )`, [`products_${source}`]);
          
        if (!tableCheck.rows[0].exists) {
          console.log(`Table products_${source} does not exist. Skipping.`);
          continue;
        }
        
        // Insert products from the source table
        await client.query(`
          INSERT INTO unified_products (
            source_id, source_table, title, brand, mrp, price, 
            rating, review_count, image_url, product_url, category, variant
          )
          SELECT 
            product_id, $1, title, brand_name, mrp, price, 
            rating, review_count, image_url, product_url, category, variant
          FROM products_${source}
        `, [source]);
        
        console.log(`Imported products from ${source}`);
      } catch (error) {
        console.error(`Error importing from ${source}:`, error);
        // Continue with next source rather than failing entire process
      }
    }
    
    console.log('Unified products update complete');
  } catch (error) {
    console.error('Error unifying products:', error);
  } finally {
    client.release();
  }
}

// Add a direct import function for raw scraped data
async function importRawData(data, source) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.error('No valid data provided for import');
    return;
  }
  
  // Validate source name
  if (!source || typeof source !== 'string') {
    console.error('Valid source name required');
    return;
  }
  
  const client = await pgPool.connect();
  try {
    console.log(`Importing ${data.length} raw products from ${source}`);
    
    // Remove existing products from this source
    await client.query(`DELETE FROM unified_products WHERE source_table = $1`, [source]);
    
    // Create a prepared statement
    await client.query('BEGIN');
    
    const insertStatement = `
      INSERT INTO unified_products (
        source_id, source_table, title, brand, mrp, price, 
        rating, review_count, image_url, product_url, category, variant
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `;
    
    // Insert each product
    for (const product of data) {
      await client.query(insertStatement, [
        product.id || uuidv4(), // Use provided ID or generate one
        source,
        product.title || '',
        product.brand || product.brand_name || '',
        parseFloat(product.mrp || 0),
        parseFloat(product.price || 0),
        parseFloat(product.rating || 0),
        parseInt(product.review_count || 0),
        product.image_url || '',
        product.product_url || '',
        product.category || '',
        product.variant || ''
      ]);
    }
    
    await client.query('COMMIT');
    console.log(`Successfully imported ${data.length} products from ${source}`);
    
    // Return success
    return {
      success: true,
      count: data.length,
      source
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error importing raw data:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    client.release();
  }
}

// Process all products - generate embeddings
async function processAllProducts(batchSize = 500) {
  const model = await initEmbeddingModel();
  let offset = 0;
  let hasMore = true;
  
  console.log('Starting product processing...');
  
  while (hasMore) {
    const client = await pgPool.connect();
    try {
      const result = await client.query(
        'SELECT id, title, brand, mrp, category FROM unified_products LIMIT $1 OFFSET $2',
        [batchSize, offset]
      );
      
      if (result.rows.length === 0) {
        hasMore = false;
        continue;
      }
      
      console.log(`Processing batch of ${result.rows.length} products at offset ${offset}`);
      
      // Process batch
      const points = [];
      
      for (const product of result.rows) {
        // Create a rich context for embedding
        const embeddingContext = `${product.title} brand:${product.brand || ''} mrp:${product.mrp || ''}`;
        const embedding = await generateEmbedding(embeddingContext, model);
        
        points.push({
          id: `product_${product.id}`,
          vector: embedding,
          payload: {
            product_id: product.id,
            title: product.title,
            brand: product.brand,
            mrp: product.mrp,
            category: product.category
          }
        });
      }
      
      // Upload to Qdrant
      if (points.length > 0) {
        await qdrantClient.upsert(COLLECTION_NAME, {
          wait: true,
          points: points
        });
      }
      
      offset += batchSize;
    } catch (error) {
      console.error(`Error processing batch at offset ${offset}:`, error);
      // Continue with next batch instead of failing entire process
    } finally {
      client.release();
    }
  }
  
  console.log('Finished processing all products');
}

// Improved product grouping: first filter by brand+MRP, then use vector similarity
async function createProductGroups(similarityThreshold = 0.92, skipBrands = ['generic', 'private-label']) {
  const client = await pgPool.connect();
  try {
    // Only create new groups if needed
    const groupsExist = await client.query('SELECT COUNT(*) FROM product_groups');
    if (parseInt(groupsExist.rows[0].count) > 0) {
      console.log('Product groups already exist, skipping creation.');
      return;
    }
    
    console.log('Creating product groups...');
    
    // Get all products with brand and mrp
    const products = await client.query(`
      SELECT id, title, brand, mrp, category, image_url 
      FROM unified_products 
      WHERE brand IS NOT NULL AND mrp IS NOT NULL
      ORDER BY brand, mrp
    `);
    
    console.log(`Creating groups for ${products.rows.length} products`);
    
    const processedIds = new Set();
    const model = await initEmbeddingModel();
    
    // Process product by product
    for (let i = 0; i < products.rows.length; i++) {
      const product = products.rows[i];
      
      if (processedIds.has(product.id)) continue;
      
      // Skip certain brands if specified
      if (skipBrands.some(skipBrand => 
          product.brand.toLowerCase().includes(skipBrand.toLowerCase()))) {
        continue;
      }
      
      // First filter: Get products with the same brand and similar MRP
      const brandMrpMatches = products.rows.filter(p => 
        p.brand === product.brand && 
        Math.abs(p.mrp - product.mrp) < 5 &&
        !processedIds.has(p.id)
      );
      
      if (brandMrpMatches.length > 1) {
        // Create embedding for the current product
        const embeddingContext = `${product.title} brand:${product.brand} mrp:${product.mrp}`;
      const embedding = await generateEmbedding(embeddingContext, model);
      
        // Get embeddings for all matches
        const validMatches = [];
        for (const match of brandMrpMatches) {
          // Only calculate embeddings for unprocessed products
          if (match.id !== product.id) {
            const matchEmbeddingContext = `${match.title} brand:${match.brand} mrp:${match.mrp}`;
            const matchEmbedding = await generateEmbedding(matchEmbeddingContext, model);
            
            // Calculate cosine similarity
            const similarity = calculateCosineSimilarity(embedding, matchEmbedding);
            
            if (similarity >= similarityThreshold) {
              validMatches.push({
                product: match,
                similarity
              });
            }
          } else {
            // Add the current product with max similarity
            validMatches.push({
              product,
              similarity: 1.0
            });
          }
        }
        
        if (validMatches.length > 1) {
        // Create a new group
        const groupId = uuidv4();
        const qdrantEmbeddingId = `group_${groupId}`;
        
        // Save embedding for the group
        await qdrantClient.upsert(COLLECTION_NAME, {
          wait: true,
          points: [{
            id: qdrantEmbeddingId,
            vector: embedding,
            payload: {
              group_id: groupId,
              type: 'group',
              title: product.title,
              brand: product.brand,
              mrp: product.mrp,
              category: product.category
            }
          }]
        });
        
        // Insert group into database
        await client.query(`
          INSERT INTO product_groups (
            group_id, canonical_title, brand, mrp, canonical_image_url, category, embedding_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          groupId, 
          product.title, 
          product.brand, 
          product.mrp, 
          product.image_url,
          product.category,
          qdrantEmbeddingId
        ]);
        
        // Add members to the group
          for (const match of validMatches) {
          await client.query(`
            INSERT INTO product_group_members (
                group_id, product_id
              ) VALUES ($1, $2)
            `, [groupId, match.product.id]);
          
            processedIds.add(match.product.id);
            
            // Update product reference in Qdrant
            await qdrantClient.updatePayload(COLLECTION_NAME, {
              payload: { group_id: groupId },
              filter: {
                must: [
                  {
                    key: "product_id",
                    match: { value: match.product.id }
                  }
                ]
              }
            });
          }
        }
      }
      
      // Log progress
      if (i % 100 === 0) {
        console.log(`Processed ${i} products`);
      }
    }
    
    console.log('Finished creating product groups');
  } catch (error) {
    console.error('Error creating product groups:', error);
  } finally {
    client.release();
  }
}

// Helper function to calculate cosine similarity
function calculateCosineSimilarity(vectorA, vectorB) {
  if (vectorA.length !== vectorB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  return dotProduct / (normA * normB);
}

// Spell correction using cspell
function correctSpelling(query) {
  try {
    if (!speller) {
      return null;
    }
    
    // Skip correction for very short queries or multi-word complex queries
    if (query.length <= 3 || (query.split(' ').length > 3 && query.length > 15)) {
      return null;
    }
    
    // Check if the query needs correction
    const checkResult = speller.checkText(query);
    if (!checkResult.issues || checkResult.issues.length === 0) {
      return null; // No correction needed
    }
    
    // Build corrected query
    let correctedQuery = query;
    const corrections = [];
    
    // Sort issues by position to process from end to beginning (to avoid offset issues)
    const sortedIssues = [...checkResult.issues].sort((a, b) => b.offset - a.offset);
    
    for (const issue of sortedIssues) {
      if (issue.suggestions && issue.suggestions.length > 0) {
        const original = query.substring(issue.offset, issue.offset + issue.length);
        const corrected = issue.suggestions[0]; // Use the top suggestion
        
        // Record this correction
        corrections.push({ original, corrected });
        
        // Apply correction
        correctedQuery = 
          correctedQuery.substring(0, issue.offset) + 
          corrected + 
          correctedQuery.substring(issue.offset + issue.length);
      }
    }
    
    // Only return correction if something was actually changed
    if (correctedQuery !== query) {
      return {
        original: query,
        corrected: correctedQuery,
        corrections: corrections,
        distance: calculateLevenshteinDistance(query, correctedQuery)
      };
    }
    
    return null; // No correction needed or possible
  } catch (error) {
    console.error('Error correcting spelling:', error);
    return null;
  }
}

// Simple Levenshtein distance implementation
function calculateLevenshteinDistance(a, b) {
  const matrix = [];
  
  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i-1) === a.charAt(j-1)) {
        matrix[i][j] = matrix[i-1][j-1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i-1][j-1] + 1, // substitution
          Math.min(
            matrix[i][j-1] + 1, // insertion
            matrix[i-1][j] + 1  // deletion
          )
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

// Generate search suggestions
async function generateSearchSuggestions(query, limit = 5) {
  const client = await pgPool.connect();
  try {
    // Get term suggestions
    const result = await client.query(`
      SELECT brand, title, COUNT(*) as count
      FROM unified_products
      WHERE 
        search_vector @@ plainto_tsquery('english', $1)
      GROUP BY brand, title
      ORDER BY count DESC
      LIMIT $2
    `, [query, limit * 2]);
    
    // Format suggestions
    const suggestions = [];
    
    // Process brand suggestions
    const brandSuggestions = result.rows
      .filter(row => row.brand && row.brand.toLowerCase().includes(query.toLowerCase()))
      .slice(0, limit);
    
    for (const row of brandSuggestions) {
      suggestions.push({
        type: 'brand',
        text: row.brand,
        count: parseInt(row.count)
      });
    }
    
    // Process title suggestions
    const titleSuggestions = result.rows
      .filter(row => row.title && row.title.length > 10 && row.title.length < 50)
      .slice(0, limit);
    
    for (const row of titleSuggestions) {
        suggestions.push({
          type: 'product',
        text: row.title,
        count: parseInt(row.count)
        });
    }
    
    // Sort by relevance and limit
    return suggestions
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  } catch (error) {
    console.error('Error generating search suggestions:', error);
    return [];
  } finally {
    client.release();
  }
}

// Log user search for OpenSearch compatibility
async function logUserSearch(query, filters = {}, resultCount, options = {}) {
  try {
    const { 
      userId = null, 
      sessionId = uuidv4(), 
      clickedItems = [], 
      ipAddress = null, 
      userAgent = null 
    } = options;
    
    // Create search metadata in OpenSearch-compatible format
    const searchMetadata = {
      query_type: 'product_search',
      search_version: '1.0',
      applied_filters: filters,
      sort_order: options.sortOrder || 'relevance',
      page: options.page || 1,
      page_size: options.pageSize || 20,
      response_time_ms: options.responseTime || 0,
      suggestions_shown: options.spellCorrectionShown || false,
      query_expansion_applied: options.expansionApplied || false
    };
    
    // Log the search
    await pgPool.query(`
      INSERT INTO user_search_log(
        user_id, 
        session_id, 
        query, 
        filters, 
        result_count, 
        clicked_items, 
        search_metadata, 
        ip_address, 
        user_agent
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      userId,
      sessionId,
      query,
      JSON.stringify(filters),
      resultCount,
      JSON.stringify(clickedItems),
      JSON.stringify(searchMetadata),
      ipAddress,
      userAgent
    ]);
    
    return true;
  } catch (error) {
    console.error('Error logging user search:', error);
    return false;
  }
}

// Log when a user clicks on a search result (for future relevance tuning)
async function logSearchResultClick(searchId, productId, options = {}) {
  try {
    const { 
      userId = null, 
      sessionId, 
      position, 
      timeToClick 
    } = options;
    
    // First get the search entry
    const searchResult = await pgPool.query(
      'SELECT id, clicked_items FROM user_search_log WHERE id = $1',
      [searchId]
    );
    
    if (searchResult.rows.length === 0) {
      console.error(`Search log entry ${searchId} not found`);
      return false;
    }
    
    // Add this click to the clicked_items array
    const clickData = {
      product_id: productId,
      timestamp: new Date().toISOString(),
      position: position || 0,
      time_to_click_ms: timeToClick || 0
    };
    
    let clickedItems = searchResult.rows[0].clicked_items || [];
    if (!Array.isArray(clickedItems)) {
      clickedItems = [];
    }
    
    clickedItems.push(clickData);
    
    // Update the record
    await pgPool.query(
      'UPDATE user_search_log SET clicked_items = $1 WHERE id = $2',
      [JSON.stringify(clickedItems), searchId]
    );
    
    return true;
  } catch (error) {
    console.error('Error logging search result click:', error);
    return false;
  }
}

// Hybrid search with improved performance
async function hybridSearch(query, filters = {}, page = 1, pageSize = 20, sessionInfo = {}) {
  const startTime = Date.now();
  try {
    // Check cache first for exact same query/filters
    const cacheKey = `search:${query}:${JSON.stringify(filters)}:${page}:${pageSize}`;
    const cachedResult = await redisClient.get(cacheKey);
    
    if (cachedResult) {
      // Log cache hit and return cached result
      const duration = Date.now() - startTime;
      const result = JSON.parse(cachedResult);
      console.log(`Cache hit for "${query}" - served in ${duration}ms`);
      
      // Track performance in background
      pgPool.query(
        'INSERT INTO search_performance(query, duration_ms, result_count, filters) VALUES($1, $2, $3, $4)',
        [query, duration, result.totalResults, JSON.stringify(filters)]
      ).catch(err => console.error('Error logging search performance:', err));
      
      // Log the search for future OpenSearch migration
      logUserSearch(query, filters, result.totalResults, {
        sessionId: sessionInfo.sessionId || uuidv4(),
        userId: sessionInfo.userId,
        ipAddress: sessionInfo.ipAddress,
        userAgent: sessionInfo.userAgent,
        page: page,
        pageSize: pageSize,
        responseTime: duration,
        spellCorrectionShown: result.spellCorrection ? true : false
      }).catch(err => console.error('Error logging user search:', err));
      
      return result;
    }
    
    // Check for spelling correction
    const spellCorrection = correctSpelling(query);
    const searchQuery = query; // Use original query for search
    
    // Perform parallel searches for better performance
    const [
      vectorSearchPromise, 
      textSearchPromise, 
      countPromise
    ] = await Promise.all([
      // Run vector search
      (async () => {
        // Initialize model and generate embedding
        const model = await initEmbeddingModel();
        const embedding = await generateEmbedding(searchQuery, model);
        
        // Get vector search results from Qdrant
        return qdrantClient.search(COLLECTION_NAME, {
          vector: embedding,
          limit: pageSize * 2, // Get more to account for filtering
          with_payload: true
        });
      })(),
      
      // Run text search
      (async () => {
        // Build query conditions
        let queryConditions = "search_vector @@ plainto_tsquery('english', $1)";
        const queryParams = [searchQuery];
        let paramIndex = 2;
        
        // Add filters
        if (filters.minPrice) {
          queryConditions += ` AND price >= $${paramIndex}`;
          queryParams.push(filters.minPrice);
          paramIndex++;
        }
        
        if (filters.maxPrice) {
          queryConditions += ` AND price <= $${paramIndex}`;
          queryParams.push(filters.maxPrice);
          paramIndex++;
        }
        
        if (filters.brands && filters.brands.length) {
          queryConditions += ` AND brand = ANY($${paramIndex}::varchar[])`;
          queryParams.push(filters.brands);
          paramIndex++;
        }
        
        if (filters.categories && filters.categories.length) {
          queryConditions += ` AND category = ANY($${paramIndex}::varchar[])`;
          queryParams.push(filters.categories);
          paramIndex++;
        }
        
        if (filters.minRating) {
          queryConditions += ` AND rating >= $${paramIndex}`;
          queryParams.push(filters.minRating);
          paramIndex++;
        }
        
        // Perform text search with ranking
        const client = await pgPool.connect();
        try {
          const textSearchResult = await client.query(`
            SELECT 
              id, 
              ts_rank(search_vector, plainto_tsquery('english', $1)) AS text_score
            FROM 
              unified_products
            WHERE 
              ${queryConditions}
            ORDER BY 
              text_score DESC
            LIMIT $${paramIndex}
            OFFSET $${paramIndex + 1}
          `, [...queryParams, pageSize * 2, (page - 1) * pageSize]);
          
          return textSearchResult.rows;
        } finally {
          client.release();
        }
      })(),
      
      // Get count for pagination
      (async () => {
        // Build query conditions for count
        let queryConditions = "search_vector @@ plainto_tsquery('english', $1)";
        const queryParams = [searchQuery];
        let paramIndex = 2;
        
        // Add filters
        if (filters.minPrice) {
          queryConditions += ` AND price >= $${paramIndex}`;
          queryParams.push(filters.minPrice);
          paramIndex++;
        }
        
        if (filters.maxPrice) {
          queryConditions += ` AND price <= $${paramIndex}`;
          queryParams.push(filters.maxPrice);
          paramIndex++;
        }
        
        if (filters.brands && filters.brands.length) {
          queryConditions += ` AND brand = ANY($${paramIndex}::varchar[])`;
          queryParams.push(filters.brands);
          paramIndex++;
        }
        
        if (filters.categories && filters.categories.length) {
          queryConditions += ` AND category = ANY($${paramIndex}::varchar[])`;
          queryParams.push(filters.categories);
          paramIndex++;
        }
        
        if (filters.minRating) {
          queryConditions += ` AND rating >= $${paramIndex}`;
          queryParams.push(filters.minRating);
          paramIndex++;
        }
        
        // Get count of total results
        const client = await pgPool.connect();
        try {
          const countResult = await client.query(`
            SELECT COUNT(*) FROM unified_products
            WHERE ${queryConditions}
          `, queryParams);
          
          return parseInt(countResult.rows[0].count);
        } finally {
          client.release();
        }
      })()
    ]);
    
    // Parse vector search results
    const vectorSearchResponse = await vectorSearchPromise;
    const vectorProductIds = vectorSearchResponse
      .filter(item => item.payload.product_id)
      .map(item => parseInt(item.payload.product_id));
    
    // Extract scores from vector search
    const vectorScores = {};
    vectorSearchResponse.forEach(item => {
      if (item.payload.product_id) {
        vectorScores[item.payload.product_id] = item.score;
      }
    });
    
    // Parse text search results
    const textResults = await textSearchPromise;
    const textProductIds = textResults.map(item => item.id);
    const textScores = {};
    textResults.forEach(item => {
      textScores[item.id] = parseFloat(item.text_score);
    });
    
    // Get total count
    const totalResults = await countPromise;
    
    // Combine results from both approaches
    const combinedProductIds = new Set([...vectorProductIds, ...textProductIds]);
    const combinedResults = Array.from(combinedProductIds).map(id => {
      // Calculate combined score (adjust weights as needed)
      const vectorScore = vectorScores[id] || 0;
      const textScore = textScores[id] || 0;
      const finalScore = (vectorScore * 0.6) + (textScore * 0.4);
      
      return {
        id,
        finalScore,
        vectorScore,
        textScore
      };
    });
    
    // Sort by final score
    combinedResults.sort((a, b) => b.finalScore - a.finalScore);
    
    // Get top results after filtering and sorting
    const topResults = combinedResults.slice(0, pageSize);
    const topProductIds = topResults.map(item => item.id);
    
    // Fetch full product details with grouping
    const groupedResults = await getGroupedProductDetails(topProductIds);
    
    // Format final response
    const finalResponse = {
      query,
      page,
      pageSize,
      totalResults,
      results: groupedResults,
      responseTime: Date.now() - startTime
    };
    
    // Add spelling correction message if available
    if (spellCorrection) {
      finalResponse.spellCorrection = {
        original: spellCorrection.original,
        corrected: spellCorrection.corrected,
        message: `Showing results for "${spellCorrection.corrected}". Did you mean "${spellCorrection.original}"?`
      };
    }
    
    // Cache result for 5 minutes
    await redisClient.set(cacheKey, JSON.stringify(finalResponse), 'EX', 300);
    
    // Update search cache for frequently searched queries
    if (totalResults > 0) {
      pgPool.query(`
        INSERT INTO search_cache (query, filters, results) 
        VALUES ($1, $2, $3)
        ON CONFLICT (query) DO UPDATE 
        SET hit_count = search_cache.hit_count + 1, 
            updated_at = CURRENT_TIMESTAMP
      `, [
        query, 
        JSON.stringify(filters), 
        JSON.stringify({
          total: totalResults,
          sample: groupedResults.slice(0, 3)
        })
      ]).catch(err => console.error('Error updating search cache:', err));
    }
    
    // Log performance in background
    pgPool.query(
      'INSERT INTO search_performance(query, duration_ms, result_count, filters) VALUES($1, $2, $3, $4)',
      [query, Date.now() - startTime, totalResults, JSON.stringify(filters)]
    ).catch(err => console.error('Error logging search performance:', err));
    
    // Log the search for future OpenSearch migration
    logUserSearch(query, filters, totalResults, {
      sessionId: sessionInfo.sessionId || uuidv4(),
      userId: sessionInfo.userId,
      ipAddress: sessionInfo.ipAddress,
      userAgent: sessionInfo.userAgent,
      page: page,
      pageSize: pageSize,
      responseTime: Date.now() - startTime,
      spellCorrectionShown: spellCorrection ? true : false
    }).catch(err => console.error('Error logging user search:', err));
    
    console.log(`Search "${query}" completed in ${Date.now() - startTime}ms, found ${totalResults} results`);
    
    return finalResponse;
  } catch (error) {
    console.error('Error performing hybrid search:', error);
    const errorTime = Date.now() - startTime;
    
    // Log search errors
    pgPool.query(
      'INSERT INTO search_performance(query, duration_ms, result_count, filters) VALUES($1, $2, $3, $4)',
      [query, errorTime, 0, JSON.stringify({ error: error.message, ...filters })]
    ).catch(err => console.error('Error logging search performance:', err));
    
    // Log the failed search for analytics
    logUserSearch(query, filters, 0, {
      sessionId: sessionInfo.sessionId || uuidv4(),
      userId: sessionInfo.userId,
      ipAddress: sessionInfo.ipAddress,
      userAgent: sessionInfo.userAgent,
      page: page,
      pageSize: pageSize,
      responseTime: errorTime,
      searchMetadata: { error: error.message }
    }).catch(err => console.error('Error logging user search:', err));
    
    return {
      query,
      page,
      pageSize,
      totalResults: 0,
      results: [],
      error: "An error occurred during search",
      responseTime: errorTime
    };
  }
}

// Get detailed product information with grouping
async function getGroupedProductDetails(productIds) {
  if (!productIds.length) return [];
  
  const client = await pgPool.connect();
  try {
    // Get all products with their group info
    const placeholders = productIds.map((_, i) => `$${i + 1}`).join(',');
    const productsQuery = `
      SELECT p.*, pg.group_id, pg.canonical_title
      FROM unified_products p
      LEFT JOIN product_group_members pgm ON p.id = pgm.product_id
      LEFT JOIN product_groups pg ON pgm.group_id = pg.group_id
      WHERE p.id IN (${placeholders})
    `;
    
    const productsResult = await client.query(productsQuery, productIds);
    
    // Group products by group_id
    const groupedProducts = {};
    
    for (const product of productsResult.rows) {
      const groupId = product.group_id || `ungrouped_${product.id}`;
      
      if (!groupedProducts[groupId]) {
        groupedProducts[groupId] = {
          group_id: product.group_id,
          canonical_title: product.canonical_title || product.title,
          brand: product.brand,
          mrp: product.mrp,
          category: product.category,
          products: []
        };
      }
      
      groupedProducts[groupId].products.push({
        id: product.id,
        title: product.title,
        source: product.source_table,
        price: product.price,
        rating: product.rating,
        review_count: product.review_count,
        image_url: product.image_url,
        product_url: product.product_url
      });
    }
    
    // Convert to array and sort groups
    return Object.values(groupedProducts).sort((a, b) => {
      // Sort by number of products in group (descending)
      return b.products.length - a.products.length;
    });
  } catch (error) {
    console.error('Error getting grouped product details:', error);
    return [];
  } finally {
    client.release();
  }
}

// Handle natural language query
async function handleNaturalLanguageQuery(query, filters = {}, page = 1, pageSize = 20) {
  try {
    // Check for spelling correction
    const spellCorrection = correctSpelling(query);
    const searchQuery = query; // Use original query for search
    
    // Perform search
    return await hybridSearch(searchQuery, filters, page, pageSize);
  } catch (error) {
    console.error('Error handling natural language query:', error);
    return {
      query,
      page,
      pageSize,
      totalResults: 0,
      results: []
    };
  }
}

// Consolidated product grouping function 
async function groupProducts(similarityThreshold = 0.92, skipBrands = ['generic', 'private-label', 'own brand']) {
  const client = await pgPool.connect();
  try {
    // First handle existing groups 
    const groupsExist = await client.query('SELECT COUNT(*) FROM product_groups');
    
    if (parseInt(groupsExist.rows[0].count) === 0) {
      console.log('No existing product groups, creating initial groups');
      await groupProductsInternal(null, similarityThreshold, skipBrands);
    } else {
      console.log('Found existing product groups, processing new products only');
      // Find products that aren't in any group yet
      const newProductsResult = await client.query(`
        SELECT up.id
        FROM unified_products up
        LEFT JOIN product_group_members pgm ON up.id = pgm.product_id
        WHERE pgm.id IS NULL
      `);
      
      if (newProductsResult.rows.length === 0) {
        console.log('No new products to group');
        return;
      }
      
      console.log(`Found ${newProductsResult.rows.length} new products to group`);
      const newProductIds = newProductsResult.rows.map(row => row.id);
      await groupProductsInternal(newProductIds, similarityThreshold, skipBrands);
    }
  } catch (error) {
    console.error('Error in product grouping:', error);
  } finally {
    client.release();
  }
}

// Internal product grouping implementation used by groupProducts
async function groupProductsInternal(productIds = null, similarityThreshold = 0.92, skipBrands = ['generic', 'private-label']) {
  const client = await pgPool.connect();
  try {
    // Get products to process
    let productsQuery;
    let queryParams = [];
    
    if (productIds) {
      // Only process specific products
      const placeholders = productIds.map((_, i) => `$${i + 1}`).join(',');
      productsQuery = `
        SELECT id, title, brand, mrp, category, image_url 
        FROM unified_products 
        WHERE id IN (${placeholders})
        AND brand IS NOT NULL AND mrp IS NOT NULL
        ORDER BY brand, mrp
      `;
      queryParams = productIds;
    } else {
      // Process all products
      productsQuery = `
        SELECT id, title, brand, mrp, category, image_url 
        FROM unified_products 
        WHERE brand IS NOT NULL AND mrp IS NOT NULL
        ORDER BY brand, mrp
      `;
    }
    
    const products = await client.query(productsQuery, queryParams);
    console.log(`Processing ${products.rows.length} products for grouping`);
    
    const processedIds = new Set();
    const model = await initEmbeddingModel();
    
    // First pass: Try to add products to existing groups
    if (productIds) {
      for (const product of products.rows) {
        if (processedIds.has(product.id)) continue;
        
        // Skip certain brands if specified
        if (skipBrands.some(skipBrand => 
            product.brand.toLowerCase().includes(skipBrand.toLowerCase()))) {
          continue;
        }
        
        // Find existing groups with matching brand and similar MRP
        const existingGroups = await client.query(`
          SELECT pg.group_id, pg.canonical_title, pg.embedding_id
          FROM product_groups pg
          WHERE pg.brand = $1 AND ABS(pg.mrp - $2) < 5
        `, [product.brand, product.mrp]);
        
        // If matching groups found, check vector similarity
        if (existingGroups.rows.length > 0) {
          const productEmbeddingContext = `${product.title} brand:${product.brand} mrp:${product.mrp}`;
          const productEmbedding = await generateEmbedding(productEmbeddingContext, model);
          
          let bestMatch = null;
          let bestSimilarity = 0;
          
          // Find best matching group
          for (const group of existingGroups.rows) {
            // Get the group's vector from Qdrant
            const response = await qdrantClient.retrieve(COLLECTION_NAME, {
              ids: [group.embedding_id]
            });
            
            if (response.length > 0) {
              const groupVector = response[0].vector;
              const similarity = calculateCosineSimilarity(productEmbedding, groupVector);
              
              if (similarity >= similarityThreshold && similarity > bestSimilarity) {
                bestMatch = group;
                bestSimilarity = similarity;
              }
            }
          }
          
          // If good match found, add product to existing group
          if (bestMatch) {
            await client.query(`
              INSERT INTO product_group_members (group_id, product_id)
              VALUES ($1, $2)
            `, [bestMatch.group_id, product.id]);
            
            // Update product reference in Qdrant
            await qdrantClient.updatePayload(COLLECTION_NAME, {
              payload: { group_id: bestMatch.group_id },
              filter: {
                must: [
                  {
                    key: "product_id",
                    match: { value: product.id }
                  }
                ]
              }
            });
            
            processedIds.add(product.id);
            continue;
          }
        }
      }
    }
    
    // Second pass: Create new groups for remaining products
    for (let i = 0; i < products.rows.length; i++) {
      const product = products.rows[i];
      
      if (processedIds.has(product.id)) continue;
      
      // Skip certain brands if specified
      if (skipBrands.some(skipBrand => 
          product.brand.toLowerCase().includes(skipBrand.toLowerCase()))) {
        continue;
      }
      
      // First filter: Get products with the same brand and similar MRP
      const brandMrpMatches = products.rows.filter(p => 
        p.brand === product.brand && 
        Math.abs(p.mrp - product.mrp) < 5 &&
        !processedIds.has(p.id)
      );
      
      if (brandMrpMatches.length > 1) {
        // Create embedding for the current product
        const embeddingContext = `${product.title} brand:${product.brand} mrp:${product.mrp}`;
        const embedding = await generateEmbedding(embeddingContext, model);
        
        // Get embeddings for all matches
        const validMatches = [];
        for (const match of brandMrpMatches) {
          // Only calculate embeddings for unprocessed products
          if (match.id !== product.id) {
            const matchEmbeddingContext = `${match.title} brand:${match.brand} mrp:${match.mrp}`;
            const matchEmbedding = await generateEmbedding(matchEmbeddingContext, model);
            
            // Calculate cosine similarity
            const similarity = calculateCosineSimilarity(embedding, matchEmbedding);
            
            if (similarity >= similarityThreshold) {
              validMatches.push({
                product: match,
                similarity
              });
            }
          } else {
            // Add the current product with max similarity
            validMatches.push({
              product,
              similarity: 1.0
            });
          }
        }
        
        if (validMatches.length > 1) {
          // Create a new group
          const groupId = uuidv4();
          const qdrantEmbeddingId = `group_${groupId}`;
          
          // Save embedding for the group
          await qdrantClient.upsert(COLLECTION_NAME, {
            wait: true,
            points: [{
              id: qdrantEmbeddingId,
              vector: embedding,
              payload: {
                group_id: groupId,
                type: 'group',
                title: product.title,
                brand: product.brand,
                mrp: product.mrp,
                category: product.category
              }
            }]
          });
          
          // Insert group into database
          await client.query(`
            INSERT INTO product_groups (
              group_id, canonical_title, brand, mrp, canonical_image_url, category, embedding_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            groupId, 
            product.title, 
            product.brand, 
            product.mrp, 
            product.image_url,
            product.category,
            qdrantEmbeddingId
          ]);
          
          // Add members to the group
          for (const match of validMatches) {
            await client.query(`
              INSERT INTO product_group_members (
                group_id, product_id
              ) VALUES ($1, $2)
            `, [groupId, match.product.id]);
            
            processedIds.add(match.product.id);
            
            // Update product reference in Qdrant
            await qdrantClient.updatePayload(COLLECTION_NAME, {
              payload: { group_id: groupId },
              filter: {
                must: [
                  {
                    key: "product_id",
                    match: { value: match.product.id }
                  }
                ]
              }
            });
          }
        }
      }
      
      // Log progress
      if (i % 100 === 0) {
        console.log(`Processed ${i} products`);
      }
    }
    
    console.log(`Grouped ${processedIds.size} products out of ${products.rows.length}`);
  } catch (error) {
    console.error('Error in internal product grouping:', error);
  } finally {
    client.release();
  }
}

// Initialize the entire system
async function initSystem(options = {}) {
  try {
    console.log('Initializing search system...');
    
    // Install and enable PostgreSQL extensions
    await initPostgresExtensions();
    
    // Setup database schema
    await setupDatabaseSchema();
    
    // Initialize vector search
    await initQdrant();
    
    // Unify products from source tables (don't truncate by default)
    if (options.sources) {
      await unifyProducts(options.sources, options.truncateFirst || false);
    } else {
      await unifyProducts([], options.truncateFirst || false);
    }
    
    // Initialize spell correction
    await initSpellCorrection();
    
    // Process products (generate embeddings)
    await processAllProducts(options.batchSize || 500);
    
    // Group products efficiently
    await groupProducts();
    
    console.log('Search system initialization complete!');
  } catch (error) {
    console.error('Error initializing system:', error);
  }
}

// Export package.json dependencies for easy reference
const DEPENDENCIES = {
  "@qdrant/js-client-rest": "^1.5.0",
  "@xenova/transformers": "^2.6.1",
  "pg": "^8.11.0",
  "uuid": "^9.0.0",
  "cspell-lib": "^6.31.1",
  "ioredis": "^5.3.2"
};

module.exports = {
  initSystem,
  hybridSearch,
  handleNaturalLanguageQuery,
  generateSearchSuggestions,
  getGroupedProductDetails,
  importRawData,  // Export new function for direct import
  logUserSearch,
  logSearchResultClick,
  DEPENDENCIES  // Export dependencies for reference
};