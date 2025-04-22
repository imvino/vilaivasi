// multi-sort-and-brand-flipkart-scraper.js
const { chromium } = require('playwright');
const { Pool } = require('pg');
const { getProductInfo } = require('./flipHelper');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'flipkart',
  password: 'postgres', // Replace with actual password
  port: 5432,
});

// Function to handle database connection errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Function to save products to database
async function saveProductsToDB(client, products) {
  console.log(`Processing ${products.length} product groups...`);

  // Process each product group
  for (const productGroup of products) {
    // Get brand name
    const brandName = productGroup.brand;
    console.log(`Processing products for brand: ${brandName}`);

    // Process each product variant
    for (const product of productGroup.product) {
      try {
        // Safely handle null pricePerUnit
        let pivotQualifier = null;
        let pivotValue = null;
        let pricePerUnitValue = null;

        // Only try to extract values if pricePerUnit exists
        if (product.pricePerUnit) {
          pivotQualifier = product.pricePerUnit.pivotQualifier || null;
          pivotValue = product.pricePerUnit.pivotValue || null;
          pricePerUnitValue = product.pricePerUnit.pricePerUnit || null;
        }

        // Convert string MRP to number if needed
        const mrp = typeof product.mrp === 'string' ? parseFloat(product.mrp) : product.mrp;

        // Fix image URL by replacing placeholder values
        const imageUrl = product.image.replace(/{@width}/g, '500').replace(/{@height}/g, '500').replace(/{@quality}/g, '70');

        // Insert or update product - CHANGED to use product_id instead of id for uniqueness
        const productQuery = `
          INSERT INTO products (
            product_id, title, image_url, product_url, mrp, price, 
            qty_info, smart_qty, variant, category, offer, 
            brand_name, pivot_qualifier, pivot_value, price_per_unit
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          ON CONFLICT (product_id) DO UPDATE SET
            title = $2,
            image_url = $3,
            product_url = $4,
            mrp = $5,
            price = $6,
            qty_info = $7,
            smart_qty = $8,
            variant = $9,
            category = $10,
            offer = $11,
            brand_name = $12,
            pivot_qualifier = $13,
            pivot_value = $14,
            price_per_unit = $15,
            updated_at = NOW()
        `;

        await client.query(productQuery, [
          product.id,               // $1 - This is now product_id
          product.title,            // $2
          imageUrl,                 // $3
          product.url,              // $4
          mrp,                      // $5
          product.price,            // $6
          product.qtyInfo,          // $7
          product.smartQty,         // $8
          product.variant,          // $9
          product.category,         // $10
          product.offer,            // $11
          brandName,                // $12 - Store brand name directly
          pivotQualifier,           // $13
          pivotValue,               // $14
          pricePerUnitValue,        // $15
        ]);

        console.log(`Saved product: ${product.id} - ${product.title}`);
      } catch (productError) {
        console.error(`Error saving product ${product.id}:`, productError);
        // Continue with other products even if one fails
      }
    }
  }
}

// Function to update brand product counts across all products
async function updateAllBrandCounts(client) {
  console.log('Updating all brand product counts...');

  // Get all existing brands
  const allBrandsResult = await client.query('SELECT name FROM brands');

  // Update count for each brand
  for (const row of allBrandsResult.rows) {
    const brandName = row.name;

    // Count products for this brand
    const countResult = await client.query(
        'SELECT COUNT(*) as count FROM products WHERE brand_name = $1',
        [brandName]
    );
    const productCount = parseInt(countResult.rows[0].count, 10);

    // Update the brand count
    await client.query(
        'UPDATE brands SET product_count = $1 WHERE name = $2',
        [productCount, brandName]
    );
    console.log(`Updated brand: ${brandName} with ${productCount} products`);
  }
}

// Function to insert new brands that don't exist yet
async function insertNewBrands(client) {
  console.log('Inserting new brands from products table...');

  // First, get all existing brands
  const existingBrandsResult = await client.query('SELECT name FROM brands');
  const existingBrands = new Set(existingBrandsResult.rows.map(row => row.name));

  // Get distinct brands from products
  const distinctBrandsResult = await client.query(`
    SELECT DISTINCT brand_name 
    FROM products 
    WHERE brand_name IS NOT NULL
  `);

  // Insert only brands that don't exist yet
  for (const row of distinctBrandsResult.rows) {
    const brandName = row.brand_name;

    if (!existingBrands.has(brandName)) {
      // Insert the new brand with count 0 (will update counts later)
      await client.query(
          'INSERT INTO brands (name, product_count) VALUES ($1, 0)',
          [brandName]
      );
      console.log(`Added new brand: ${brandName}`);
    }
  }
}

// Function to scroll to the bottom of the page
async function scrollToBottom(page) {
  console.log('Scrolling to bottom of page...');

  // Get initial page height
  const initialHeight = await page.evaluate(() => document.body.scrollHeight);

  let lastHeight = 0;
  let currentHeight = initialHeight;

  // Scroll down in increments until we can't scroll further
  while (lastHeight < currentHeight) {
    lastHeight = currentHeight;

    // Scroll down in smaller increments to appear more human-like
    for (let i = 0; i < lastHeight; i += 200) {
      await page.evaluate(position => window.scrollTo(0, position), i);
      // Random delay between scrolls (100-300ms)
      await page.waitForTimeout(100 + Math.random() * 200);
    }

    // Wait a bit for any lazy-loaded content
    await page.waitForTimeout(1000);

    // Get new page height
    currentHeight = await page.evaluate(() => document.body.scrollHeight);

    // If we've been scrolling for too long, break
    if (currentHeight > initialHeight * 3) {
      console.log('Page appears to have infinite scroll, stopping');
      break;
    }
  }

  // Final scroll to bottom
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2000);

  console.log('Scrolling complete');
}

// Function to set pincode once
async function setPincodeIfNeeded(page) {
  console.log('Checking if pincode needs to be set...');
  const pincodeInputVisible = await page.isVisible(
      'input[placeholder="Enter pincode"]',
      { timeout: 5000 }
  );

  if (pincodeInputVisible) {
    console.log('Setting pincode...');
    const pincodeInput = page.locator('input[placeholder="Enter pincode"]');
    await pincodeInput.click();
    await pincodeInput.type('600083', { delay: 50 });
    await page.keyboard.press('Enter');

    // Wait for pincode to be applied
    await page.waitForTimeout(2000);

    // Reload the page to get fresh data with pincode
    console.log('Reloading page to get fresh data with pincode...');
    await page.reload({ waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000); // Extra wait to ensure state data is loaded

    return true;
  }

  return false;
}

// Process a single page of products
async function processPage(page, pageUrl, pageNum, sortOption, client) {
  await extractAndProcessPageData(page, pageUrl, 'sort', pageNum, sortOption, client);
}

// Common function to extract and process page data
async function extractAndProcessPageData(page, pageUrl, pageType, pageNum, sortOptionOrBrand, client) {
  let pageName = pageType === 'sort'
      ? `${sortOptionOrBrand} - page ${pageNum}`
      : `brand search for ${sortOptionOrBrand} - page ${pageNum}`;

  console.log(`\n========= Processing ${pageName} =========\n`);

  // Variable to store state data
  let stateData = null;

  // Determine the URL pattern to look for in the response
  const urlPattern = pageType === 'sort'
      ? '/grocery/pr?sid=73z&marketplace=GROCERY'
      : '/search?q=';

  // Listen for responses to capture the INITIAL_STATE
  page.on('response', async (response) => {
    const url = response.url();
    const contentType = response.headers()['content-type'] || '';

    if (
        (url.includes(urlPattern) || url.includes(`&page=${pageNum}`)) &&
        contentType.includes('text/html') &&
        response.status() === 200
    ) {
      try {
        // Get the HTML content
        const html = await response.text();

        // Extract the INITIAL_STATE using regex
        const generalStateRegex = /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});/;
        const generalMatch = html.match(generalStateRegex);

        if (generalMatch && generalMatch[1]) {
          console.log('Found __INITIAL_STATE__ in response');
          stateData = JSON.parse(generalMatch[1]);
        }
      } catch (err) {
        console.log('Error capturing response:', err.message);
      }
    }
  });

  // Navigate to the page
  console.log(`Navigating to: ${pageUrl}`);
  await page.goto(pageUrl, {
    waitUntil: 'networkidle',
    timeout: 60000,
  });

  // Scroll to the bottom of the page to load all content and avoid scrape blocks
  await scrollToBottom(page);

  // If we still don't have state data, try to get it from the page
  if (!stateData) {
    console.log('Trying to get state data directly from page...');
    stateData = await page.evaluate(() => {
      if (window.__INITIAL_STATE__) {
        return window.__INITIAL_STATE__;
      }
      return null;
    });
  }

  // If we still don't have state data, reload the page one more time
  if (!stateData) {
    console.log('State data not found, reloading page...');
    await page.reload({ waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    // Try to get state data again
    stateData = await page.evaluate(() => {
      if (window.__INITIAL_STATE__) {
        return window.__INITIAL_STATE__;
      }
      return null;
    });
  }

  if (stateData) {
    console.log('Processing state data...');

    // Start a transaction for this page
    await client.query('BEGIN');

    // Extract products data based on page type
    const productData = (() => {
      const allProducts = [];

      if (pageType === 'sort') {
        // Category page extraction logic
        if (stateData?.pageDataV4?.page?.data?.[10003]) {
          // Loop through all items in data[10003]
          for (let i = 1; i <= 20; i++) {
            const products = stateData.pageDataV4.page.data[10003][i]?.widget?.data?.products;

            // If products exist, process them
            if (products && Array.isArray(products)) {
              const mappedProducts = products.map((v) => v.productInfo);
              allProducts.push(...mappedProducts);
            }
          }
        }
      } else {
        // Brand search page extraction logic
        if (stateData?.pageDataV4?.page?.data?.SEARCH_RESULT_DATA) {
          const searchData = stateData.pageDataV4.page.data.SEARCH_RESULT_DATA;

          // Check if search results contain products
          if (searchData.products && Array.isArray(searchData.products)) {
            allProducts.push(...searchData.products);
            console.log(`Found ${searchData.products.length} products in SEARCH_RESULT_DATA.products`);
          }
        }
      }

      // If we didn't find products in the expected path, look in alternative paths
      if (allProducts.length === 0) {
        console.log('Product data not found at expected path, checking alternatives...');

        // Fallback: Look through all keys in page.data to find products
        if (stateData?.pageDataV4?.page?.data) {
          console.log('Searching for products in alternative paths...');
          const dataKeys = Object.keys(stateData.pageDataV4.page.data);
          for (const key of dataKeys) {
            const section = stateData.pageDataV4.page.data[key];
            if (Array.isArray(section)) {
              for (let i = 0; i < section.length; i++) {
                const widget = section[i]?.widget;
                const products = widget?.data?.products;
                if (products && Array.isArray(products)) {
                  const mappedProducts = products.map((v) => v.productInfo || v);
                  allProducts.push(...mappedProducts);
                  console.log(`Found ${mappedProducts.length} products in path: ${key}[${i}]`);
                }
              }
            } else if (typeof section === 'object' && section !== null) {
              // Check if this object has numeric keys
              const sectionKeys = Object.keys(section);
              for (const sectionKey of sectionKeys) {
                const subSection = section[sectionKey];
                // Check for products in widget data
                if (subSection?.widget?.data?.products) {
                  const products = subSection.widget.data.products;
                  const mappedProducts = products.map((v) => v.productInfo || v);
                  allProducts.push(...mappedProducts);
                  console.log(`Found ${mappedProducts.length} products in path: ${key}.${sectionKey}`);
                }

                // Check for direct products array (search results)
                if (subSection?.products && Array.isArray(subSection.products)) {
                  allProducts.push(...subSection.products);
                  console.log(`Found ${subSection.products.length} products in path: ${key}.${sectionKey}.products`);
                }
              }
            }
          }
        }
      }

      try {
        // Apply getProductInfo to each product with error handling
        return allProducts.map((v) => {
          try {
            // Handle different product data structures
            const productValue = v.value || v;
            return getProductInfo(productValue);
          } catch (error) {
            console.error('Error processing product:', error);
            return null;
          }
        }).filter(p => p !== null); // Remove any null results
      } catch (error) {
        console.error('Error mapping products:', error);
        return [];
      }
    })();

    if (productData && productData.length > 0) {
      console.log(`Found ${productData.length} product groups on ${pageName}`);

      // Save products directly to database
      await saveProductsToDB(client, productData);

      // Add new brands if any (without updating counts yet)
      await insertNewBrands(client);

      console.log(`${pageName} data saved to database!`);

      // Commit transaction for this page
      await client.query('COMMIT');
    } else {
      console.log(`No products found on ${pageName}`);
      // Rollback empty transaction
      await client.query('ROLLBACK');
    }
  } else {
    console.log(`No state data was captured for ${pageName}`);
    // No transaction started, so no need to rollback
  }

  // Clean up event listeners before moving to next page to avoid memory leaks
  page.removeAllListeners('response');

  // For brand searches, check pagination to determine if there are more pages
  if (pageType === 'brand') {
    // Check page information using the provided selector
    const paginationInfo = await page.evaluate(() => {
      // Try to find the pagination info using the provided selector
      const paginationElement = document.querySelector('._1G0WLw > span:nth-of-type(1)');

      if (paginationElement) {
        const paginationText = paginationElement.textContent || '';
        // Extract current page and total pages from text like "Page 1 of 4"
        const match = paginationText.match(/Page\s+(\d+)\s+of\s+(\d+)/i);

        if (match && match.length >= 3) {
          return {
            currentPage: parseInt(match[1], 10),
            totalPages: parseInt(match[2], 10)
          };
        }
      }

      // No pagination info found
      return { currentPage: null, totalPages: null };
    });

    // Determine if we should continue to the next page
    let hasNextPage = false;

    if (paginationInfo.currentPage && paginationInfo.totalPages) {
      // If we have page info, check if we're not at the last page
      console.log(`Current page ${paginationInfo.currentPage} of ${paginationInfo.totalPages}`);
      hasNextPage = paginationInfo.currentPage < paginationInfo.totalPages;
    } else {
      console.log('No pagination information found, assuming no more pages');
      hasNextPage = false;
    }

    return hasNextPage;
  }
}

// Function to process a brand search page with improved pagination logic
async function processBrandSearchPage(page, brandName, pageUrl, pageNum, client) {
  return await extractAndProcessPageData(page, pageUrl, 'brand', pageNum, brandName, client);
}

// Function to process all brand searches
async function processBrandSearches(page, client) {
  console.log('\n========= Starting brand-specific searches =========\n');

  // Get all brands from the database
  const brandsResult = await client.query('SELECT name FROM brands ORDER BY name');
  const brands = brandsResult.rows.map(row => row.name);

  console.log(`Found ${brands.length} brands to search for`);

  // Track execution time for brand searches
  const brandSearchStartTime = Date.now();

  // Process each brand sequentially
  for (const brandName of brands) {
    console.log(`\n========= Processing brand search for: ${brandName} =========\n`);

    // Track time for this brand
    const brandStartTime = Date.now();

    // Start with page 1
    let pageNum = 1;
    let hasNextPage = true;

    // Process pages until there are no more pages
    while (hasNextPage) {
      // Build the URL with page number
      const baseUrl = `https://www.flipkart.com/search?q=${encodeURIComponent(brandName)}&marketplace=GROCERY`;
      const pageUrl = pageNum === 1 ? baseUrl : `${baseUrl}&page=${pageNum}`;

      // Process this page and check if there's a next page
      hasNextPage = await processBrandSearchPage(page, brandName, pageUrl, pageNum, client);

      // If there's a next page, move to the next one
      if (hasNextPage) {
        pageNum++;

        // Add a short random delay between pages (1-2 seconds)
        const delay = 1000 + Math.floor(Math.random() * 1000);
        console.log(`Waiting ${delay/1000} seconds before moving to next page...`);
        await page.waitForTimeout(delay);
      }
    }

    // Calculate execution time for this brand
    const brandExecutionTime = (Date.now() - brandStartTime) / 1000;
    console.log(`\n========= Completed ${brandName} brand search =========`);
    console.log(`Total time for ${brandName}: ${Math.floor(brandExecutionTime / 60)} minutes and ${Math.floor(brandExecutionTime % 60)} seconds`);

    // Add a random delay between brands (2-5 seconds)
    const brandDelay = 2000 + Math.floor(Math.random() * 3000);
    console.log(`\nWaiting ${brandDelay/1000} seconds before starting next brand search...\n`);
    await page.waitForTimeout(brandDelay);
  }

  // Calculate total brand search execution time
  const totalBrandSearchTime = (Date.now() - brandSearchStartTime) / 1000;
  const minutes = Math.floor(totalBrandSearchTime / 60);
  const seconds = Math.floor(totalBrandSearchTime % 60);
  console.log(`\n========= All Brand Searches Complete =========`);
  console.log(`Total brand search execution time: ${minutes} minutes and ${seconds} seconds`);
}

// Main function to scrape data and save to DB
(async () => {
  const client = await pool.connect();
  let browser = null;

  // Track total execution time
  const startTime = Date.now();

  try {
    // Configure browser
    browser = await chromium.launch({
      headless: false,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
    });

    // Create a single browser context for the entire session
    const context = await browser.newContext({
      userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      viewport: { width: 1366, height: 768 },
      deviceScaleFactor: 1,
    });

    // Create a single page that will be reused
    const page = await context.newPage();

    // Enable request interception
    await page.route('**', (route) => route.continue());

    // Define all sort options to process
    const sortOptions = ['popularity', 'relevance', 'price_asc', 'price_desc', 'discount'];

    // First, set pincode once at the beginning
    const initialUrl = `https://www.flipkart.com/grocery/pr?sid=73z&marketplace=GROCERY&p[]=facets.rating[]=4★+%26+above&sort=popularity`;

    console.log(`Navigating to: ${initialUrl}`);
    await page.goto(initialUrl, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });

    // Set pincode if needed - this will happen only once for the entire session
    const pincodeWasSet = await setPincodeIfNeeded(page);

    // Process each sort option sequentially using the same page
    for (const sortOption of sortOptions) {
      console.log(`\n========= Starting to process sort option: ${sortOption} =========\n`);

      // Track execution time for this sort option
      const sortStartTime = Date.now();

      // Process each page from 1 to 25
      for (let pageNum = 1; pageNum <= 25; pageNum++) {
        // Build the URL with page number
        const baseUrl = `https://www.flipkart.com/grocery/pr?sid=73z&marketplace=GROCERY&p[]=facets.rating[]=4★+%26+above&sort=${sortOption}`;
        const pageUrl = pageNum === 1 ? baseUrl : `${baseUrl}&page=${pageNum}`;

        // Process this page
        await processPage(page, pageUrl, pageNum, sortOption, client);

        // Add a shorter random delay between pages (2-3 seconds)
        const delay = 2000 + Math.floor(Math.random() * 1000);
        console.log(`Waiting ${delay/1000} seconds before moving to next page...`);
        await page.waitForTimeout(delay);
      }

      // Calculate execution time for this sort option
      const sortExecutionTime = (Date.now() - sortStartTime) / 1000;
      const sortMinutes = Math.floor(sortExecutionTime / 60);
      const sortSeconds = Math.floor(sortExecutionTime % 60);
      console.log(`\n========= Completed ${sortOption} sort =========`);
      console.log(`Total time for ${sortOption}: ${sortMinutes} minutes and ${sortSeconds} seconds`);

      // Add a longer delay between sort options (2-3 seconds)
      const sortDelay = 2000 + Math.floor(Math.random() * 5000);
      console.log(`\nWaiting ${sortDelay/1000} seconds before starting next sort option...\n`);
      await new Promise(resolve => setTimeout(resolve, sortDelay));
    }

    // After processing all sort options, process brand searches
    // This reuses the same session to maintain the pincode setting
    await processBrandSearches(page, client);

    // Start final transaction for updating brand counts
    await client.query('BEGIN');

    // After processing all pages, sorts, and brand searches, update brand product counts
    console.log('\n========= Finalizing brand product counts =========\n');
    await updateAllBrandCounts(client);

    // Commit the final transaction
    await client.query('COMMIT');

    // Calculate and display total execution time
    const totalExecutionTime = (Date.now() - startTime) / 1000;
    const minutes = Math.floor(totalExecutionTime / 60);
    const seconds = Math.floor(totalExecutionTime % 60);
    console.log(`\n========= Job Complete =========`);
    console.log(`Total execution time: ${minutes} minutes and ${seconds} seconds`);
    console.log('All data from all sort options and brand searches saved successfully to database!');

    // Close the page and context at the end
    await page.close();
    await context.close();

  } catch (error) {
    // Rollback the current transaction in case of an error
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }
    console.error('Error during scraping and saving process:', error);
  } finally {
    // Release the client back to the pool
    client.release();

    // Close browser if it was opened
    if (browser) {
      await browser.close();
    }

    // Close the pool
    pool.end();
  }
})();