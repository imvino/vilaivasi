const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  // Configure browser with reasonable fingerprint settings
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
  });

  // Create context with more human-like settings
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 1,
    hasTouch: false,
  });

  const page = await context.newPage();
  let allProducts = [];
  let currentPage = 1;
  const expectedProductsPerPage = 24;

  try {
    // Add human-like delays
    const humanDelay = () => Math.floor(Math.random() * 500) + 500;

    // Navigate to Amazon
    await page.goto('https://www.amazon.in/s?i=nowstore', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    await page.waitForTimeout(humanDelay());

    // Click location button
    const locationButton = page.locator('#nav-global-location-popover-link');
    await locationButton.waitFor();
    await locationButton.click();

    // Wait for popup
    await page.waitForSelector('#GLUXZipUpdateInput');
    await page.waitForTimeout(humanDelay());

    // Fill pincode
    const pincodeInput = page.locator('#GLUXZipUpdateInput');
    await pincodeInput.click();
    await pincodeInput.fill('600001');

    await page.waitForTimeout(humanDelay());

    // Click apply
    const applyButton = page.locator('#GLUXZipUpdate span.a-button-text');
    await applyButton.click();

    // Wait for update
    await page.waitForTimeout(1500);

    // Extract and verify text
    const locationSpan = page.locator(
      'span.nav-progressive-content.nav-line-2'
    );
    const locationText = await locationSpan.textContent();

    if (locationText.includes('600001')) {
      console.log('Verified: ' + locationText.trim());
    } else {
      console.log('Not found: ' + locationText.trim());
    }

    // Process pages until there is no more "next" button
    let hasNextPage = true;

    while (hasNextPage) {
      console.log(`\n===== Processing Page ${currentPage} =====`);

      // Wait for product listings to load
      await page.waitForSelector('[data-asin]');

      // Scroll through the entire page to ensure all products are loaded
      console.log('Scrolling through the page to load all products...');

      // Scroll slowly through the page with human-like behavior
      let previousHeight = 0;
      let currentHeight = await page.evaluate(() => document.body.scrollHeight);
      let scrollAttempts = 0;
      const maxScrollAttempts = 15; // Adjust as needed

      while (
        currentHeight > previousHeight &&
        scrollAttempts < maxScrollAttempts
      ) {
        previousHeight = currentHeight;

        // Perform smooth scrolling
        await page.evaluate(() => {
          // Scroll down by a random amount between 500 and 1000 pixels
          const scrollAmount = Math.floor(Math.random() * 500) + 500;
          window.scrollBy(0, scrollAmount);
        });

        // Wait for lazy-loaded content
        await page.waitForTimeout(1000);

        // Get new height
        currentHeight = await page.evaluate(() => document.body.scrollHeight);

        // Get current product count
        const productCount = await page.evaluate(() => {
          return document.querySelectorAll('[data-asin]').length;
        });

        console.log(
          `Scroll attempt ${
            scrollAttempts + 1
          }: Found ${productCount} products, page height: ${currentHeight}`
        );
        scrollAttempts++;
      }

      // Final scroll to bottom to make sure we get everything
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      // Wait for any final lazy-loaded content
      await page.waitForTimeout(2000);

      // Extract product information (price, MRP, ASIN)
      console.log('Extracting product information...');

      const pageProducts = await page.evaluate(() => {
        const productData = [];

        // Get all product elements with data-asin
        const productElements = document.querySelectorAll('[data-asin]');

        productElements.forEach((element) => {
          const asin = element.getAttribute('data-asin');
          if (!asin || asin.trim() === '') return;

          let price = null;
          let mrp = null;

          // Try to find the price
          const priceElement = element.querySelector('.a-price-whole');
          if (priceElement) {
            price = parseInt(
              priceElement.textContent.replace(/[^0-9]/g, ''),
              10
            );
          }

          // Try to find the MRP (if exists)
          const mrpElement = element.querySelector(
            '.a-price.a-text-price[data-a-strike="true"] .a-offscreen, .a-price.a-text-price[data-a-strike="true"] span[aria-hidden="true"]'
          );
          if (mrpElement) {
            // Extract number from text like "₹735"
            const mrpText = mrpElement.textContent;
            mrp = parseInt(mrpText.replace(/[^0-9]/g, ''), 10);
          }

          // Add all products with ASIN
          productData.push({
            asin,
            price: price || null,
            mrp: mrp || null,
            page: window.location.href,
          });
        });

        return productData;
      });

      // Filter out products without price for final results
      const productsWithPrice = pageProducts.filter(
        (product) => product.price !== null
      );

      console.log(
        `Total products found on page ${currentPage}: ${pageProducts.length}`
      );
      console.log(
        `Products with price information: ${productsWithPrice.length}`
      );

      // Check if we found fewer than expected products
      if (pageProducts.length < expectedProductsPerPage) {
        console.log(
          `\n⚠️ WARNING: Found only ${pageProducts.length} products on page ${currentPage}, expected ${expectedProductsPerPage}`
        );
        console.log(
          'Pausing pagination process. Please check the data and restart if needed.'
        );

        // Save the current page products
        allProducts = [...allProducts, ...productsWithPrice];

        // Save data and exit the loop
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        fs.writeFileSync(
          `amazon-products-incomplete-${timestamp}.json`,
          JSON.stringify(allProducts, null, 2)
        );
        console.log(
          `Exported ${allProducts.length} products to amazon-products-incomplete-${timestamp}.json`
        );

        // Exit the pagination loop
        break;
      }

      // Add products to our collection
      allProducts = [...allProducts, ...productsWithPrice];

      // Save data after each page
      fs.writeFileSync(
        `amazon-products-page-${currentPage}.json`,
        JSON.stringify(productsWithPrice, null, 2)
      );
      console.log(
        `Saved data for page ${currentPage} with ${productsWithPrice.length} products`
      );

      // Check if there's a next page button
      const hasNext = await page.evaluate(() => {
        const nextButton = document.querySelector('a.s-pagination-next');
        return (
          nextButton !== null &&
          !nextButton.classList.contains('s-pagination-disabled')
        );
      });

      if (hasNext) {
        console.log(`\nMoving to page ${currentPage + 1}...`);

        // Click next button
        await page.click('a.s-pagination-next');

        // Wait for the new page to load
        await page.waitForTimeout(3000);
        await page.waitForSelector('[data-asin]', { timeout: 10000 });

        currentPage++;
      } else {
        console.log('\nReached the last page. No more pages to process.');
        hasNextPage = false;
      }
    }

    // Export all data to a consolidated file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.writeFileSync(
      `amazon-products-all-${timestamp}.json`,
      JSON.stringify(allProducts, null, 2)
    );
    console.log(
      `\nExported ${allProducts.length} products from ${currentPage} pages to amazon-products-all-${timestamp}.json`
    );
  } catch (error) {
    console.error('Error occurred:', error);

    // Save whatever data we have so far
    if (allProducts.length > 0) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      fs.writeFileSync(
        `amazon-products-error-${timestamp}.json`,
        JSON.stringify(allProducts, null, 2)
      );
      console.log(
        `Saved ${allProducts.length} products collected before error to amazon-products-error-${timestamp}.json`
      );
    }
  } finally {
    // Leave browser open for verification
    // await browser.close(); // Uncomment this line to close the browser automatically
    console.log('\nScript completed. Browser left open for verification.');
  }
})();
