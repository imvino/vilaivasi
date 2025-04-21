// fixed-direct-to-db.js
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

        // Insert or update product
        const productQuery = `
          INSERT INTO products (
            id, title, image_url, product_url, mrp, price, 
            qty_info, smart_qty, variant, category, offer, 
            brand_name, pivot_qualifier, pivot_value, price_per_unit
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          ON CONFLICT (id) DO UPDATE SET
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
          product.id,               // $1
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
      // Count products for this brand
      const countResult = await client.query(
          'SELECT COUNT(*) as count FROM products WHERE brand_name = $1',
          [brandName]
      );
      const productCount = parseInt(countResult.rows[0].count, 10);

      // Insert the new brand
      await client.query(
          'INSERT INTO brands (name, product_count) VALUES ($1, $2)',
          [brandName, productCount]
      );
      console.log(`Added new brand: ${brandName} with ${productCount} products`);
    }
  }
}

// Main function to scrape data and save to DB
(async () => {
  const client = await pool.connect();
  let browser = null;

  try {
    // Start a transaction
    await client.query('BEGIN');

    // Configure browser
    browser = await chromium.launch({
      headless: false,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
    });

    // Create context with realistic browser settings
    const context = await browser.newContext({
      userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      viewport: { width: 1366, height: 768 },
      deviceScaleFactor: 1,
    });

    const page = await context.newPage();

    // Enable request interception
    await page.route('**', (route) => route.continue());

    // Variable to store state data
    let stateData = null;

    // Listen for responses to capture the INITIAL_STATE
    page.on('response', async (response) => {
      const url = response.url();
      const contentType = response.headers()['content-type'] || '';

      if (
          url.includes('/grocery/pr?sid=73z&marketplace=GROCERY') &&
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

    // Navigate to Flipkart Grocery
    console.log('Navigating to Flipkart Grocery...');
    await page.goto(
        'https://www.flipkart.com/grocery/pr?sid=73z&marketplace=GROCERY&p[]=facets.rating[]=4★+%26+above&sort=popularity',
        {
          waitUntil: 'networkidle',
          timeout: 60000,
        }
    );

    // Enter pincode if the popup appears
    console.log('Setting pincode...');
    const pincodeInputVisible = await page.isVisible(
        'input[placeholder="Enter pincode"]',
        { timeout: 5000 }
    );

    if (pincodeInputVisible) {
      const pincodeInput = page.locator('input[placeholder="Enter pincode"]');
      await pincodeInput.click();
      await pincodeInput.type('600001', { delay: 50 });
      await page.keyboard.press('Enter');

      // Wait for pincode to be applied
      await page.waitForTimeout(2000);
    }

    // Reload to get fresh data with pincode
    console.log('Reloading page to get fresh data...');
    await page.reload({ waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000); // Extra wait to ensure response is captured

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

    if (stateData) {
      console.log('Processing state data...');

      // Extract products data
      const productData = (() => {
        const allProducts = [];

        // Check if data exists at the expected path
        if (stateData?.pageDataV4?.page?.data?.[10003]) {
          // Loop through all items in data[10003]
          for (let i = 1; i <= 20; i++) { // Increased from 10 to 20 to catch more products
            const products = stateData.pageDataV4.page.data[10003][i]?.widget?.data?.products;

            // If products exist, process them
            if (products && Array.isArray(products)) {
              const mappedProducts = products.map((v) => v.productInfo);
              allProducts.push(...mappedProducts);
            }
          }
        } else {
          console.log('Product data not found at expected path');

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
                    const mappedProducts = products.map((v) => v.productInfo);
                    allProducts.push(...mappedProducts);
                    console.log(`Found ${mappedProducts.length} products in path: ${key}[${i}]`);
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
              return getProductInfo(v.value);
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
        console.log(`Found ${productData.length} product groups to save`);

        // Save products directly to database
        await saveProductsToDB(client, productData);

        // Insert only new brands
        await insertNewBrands(client);

        // Commit the transaction
        await client.query('COMMIT');
        console.log('All data saved successfully to database!');
      } else {
        console.log('No products found to save');
        await client.query('ROLLBACK');
      }
    } else {
      console.log('No state data was captured');
      await client.query('ROLLBACK');
    }

  } catch (error) {
    // Rollback the transaction in case of an error
    await client.query('ROLLBACK');
    console.error('Error during scraping and saving process:', error);
  } finally {
    // Release the client back to the pool
    client.release();

    // Close browser if it was opened
    if (browser) {
      // await browser.close();
    }

    // Close the pool
    pool.end();
  }
})();