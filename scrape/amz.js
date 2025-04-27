const { chromium } = require('playwright');
const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'flipkart',
  password: 'postgres',
  port: 5432,
});

(async () => {

  await pool.query(`
      CREATE TABLE IF NOT EXISTS products_amazon (
        id INTEGER PRIMARY KEY,
        product_id VARCHAR(255) UNIQUE NOT NULL,
        title TEXT NOT NULL,
        image_url TEXT,
        product_url TEXT,
        mrp DECIMAL(10, 2),
        price DECIMAL(10, 2),
        qty_info TEXT,
        brand_name VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

  // Configure browser
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 1,
    hasTouch: false,
  });

  const page = await context.newPage();
  let currentPage = 1;
  const maxPages = 5;

  try {
    // Navigate to Amazon
    await page.goto('https://www.amazon.in/s?i=nowstore', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    await page.waitForTimeout(2000);

    // Click location button
    const locationButton = page.locator('#nav-global-location-popover-link');
    await locationButton.waitFor();
    await locationButton.click();

    // Wait for popup
    await page.waitForSelector('#GLUXZipUpdateInput');
    await page.waitForTimeout(1000);

    // Fill pincode
    const pincodeInput = page.locator('#GLUXZipUpdateInput');
    await pincodeInput.click();
    await pincodeInput.fill('600001');

    await page.waitForTimeout(1000);

    // Click apply
    const applyButton = page.locator('#GLUXZipUpdate span.a-button-text');
    await applyButton.click();

    // Wait for update
    await page.waitForTimeout(2000);

    // Handle "Done" button if it appears
    try {
      const doneButton = page.locator('#GLUXConfirmClose');
      if (await doneButton.isVisible()) {
        await doneButton.click();
      }
    } catch (err) {
      console.log('No Done button found');
    }

    await page.waitForTimeout(2000);

    // Process pages
    while (currentPage <= maxPages) {
      console.log(`Processing Page ${currentPage}`);

      // Wait for product listings
      await page.waitForSelector('[data-asin]');

      // Scroll through the page
      let previousHeight = 0;
      let currentHeight = await page.evaluate(() => document.body.scrollHeight);

      while (currentHeight > previousHeight) {
        previousHeight = currentHeight;

        await page.evaluate(() => {
          window.scrollBy(0, 500);
        });

        await page.waitForTimeout(1000);
        currentHeight = await page.evaluate(() => document.body.scrollHeight);
      }

      // Extract product information
      const products = await page.evaluate(() => {
        const items = [];
        const productElements = document.querySelectorAll('[data-asin]');

        productElements.forEach((element) => {
          const asin = element.getAttribute('data-asin');
          if (!asin || asin.trim() === '') return;

          let title = '';
          let imageUrl = '';
          let productUrl = '';
          let price = null;
          let mrp = null;
          let brand = '';

          // Image
          const imgElem = element.querySelector('img.s-image');
          if (imgElem) imageUrl = imgElem.getAttribute('src');

          // URL
          const linkElem = element.querySelector('a.a-link-normal');
          if (linkElem) productUrl = 'https://www.amazon.in' + linkElem.getAttribute('href');

          // Price
          const priceElement = element.querySelector('.a-price-whole');
          if (priceElement) {
            price = parseFloat(priceElement.textContent.replace(/[^0-9.]/g, ''));
          }

          // MRP
          const mrpElement = element.querySelector('.a-price.a-text-price[data-a-strike="true"] .a-offscreen');
          if (mrpElement) {
            const mrpText = mrpElement.textContent;
            mrp = parseFloat(mrpText.replace(/[^0-9.]/g, ''));
          }

          // Title
          const titleElem = element.querySelector('.a-size-base-plus.a-color-base');
          if (titleElem) title = titleElem.textContent.trim();

          items.push({
            product_id: asin,
            title: title || 'Unknown Product',
            image_url: imageUrl,
            product_url: productUrl,
            mrp: mrp,
            price: price,
            qty_info: '',
            brand_name: brand
          });
        });

        return items;
      });

      // Process each product with manual ID handling
      for (const product of products) {
        if (product.product_id && product.title) {
          try {
            // Check if the product already exists
            const checkQuery = 'SELECT id FROM products_amazon WHERE product_id = $1';
            const checkResult = await pool.query(checkQuery, [product.product_id]);
            const productExists = checkResult.rows.length > 0;

            const now = new Date();

            if (productExists) {
              // Update existing product - don't touch the id
              await pool.query(`
                UPDATE products_amazon SET
                  title = $2,
                  image_url = $3,
                  product_url = $4,
                  mrp = $5,
                  price = $6,
                  qty_info = $7,
                  brand_name = $8,
                  updated_at = $9
                WHERE product_id = $1
              `, [
                product.product_id,
                product.title,
                product.image_url,
                product.product_url,
                product.mrp,
                product.price,
                product.qty_info,
                product.brand_name,
                now
              ]);

              console.log(`Updated product ID: ${product.product_id}`);
            } else {
              // Find the maximum ID and ensure sequential insertion
              const maxIdQuery = 'SELECT COALESCE(MAX(id), 0) as max_id FROM products_amazon';
              const maxIdResult = await pool.query(maxIdQuery);
              const nextId = maxIdResult.rows[0].max_id + 1;

              // Insert new product with explicit ID
              await pool.query(`
                INSERT INTO products_amazon (
                  id, product_id, title, image_url, product_url, mrp, price, 
                  qty_info, brand_name, created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
              `, [
                nextId,
                product.product_id,
                product.title,
                product.image_url,
                product.product_url,
                product.mrp,
                product.price,
                product.qty_info,
                product.brand_name,
                now,
                now
              ]);

              console.log(`Inserted new product with ID: ${nextId}, product_id: ${product.product_id}`);
            }
          } catch (err) {
            console.error(`Error saving product ${product.product_id}:`, err.message);
          }
        }
      }

      console.log(`Processed ${products.length} products from page ${currentPage}`);

      // Check if there's a next page and we haven't reached our limit
      if (currentPage < maxPages) {
        const hasNext = await page.evaluate(() => {
          const nextButton = document.querySelector('a.s-pagination-next');
          return nextButton !== null && !nextButton.classList.contains('s-pagination-disabled');
        });

        if (hasNext) {
          await page.click('a.s-pagination-next');
          await page.waitForTimeout(3000);
          currentPage++;
        } else {
          console.log('No more pages available');
          break;
        }
      } else {
        console.log(`Reached maximum page limit (${maxPages})`);
        break;
      }
    }

    console.log('Scraping completed successfully');

  } catch (error) {
    console.error('Error occurred:', error);
  } finally {
    await pool.end();
    // Comment this out if you want to keep the browser open
    // await browser.close();
    console.log('Script completed. Browser left open for verification.');
  }
})();