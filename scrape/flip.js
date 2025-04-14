const { chromium } = require('playwright');
const fs = require('fs');
const { getProductInfo } = require('./flipHelper');

(async () => {
  // Configure browser with basic anti-detection settings
  const browser = await chromium.launch({
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

  // Create a client to access the Chrome DevTools Protocol
  const page = await context.newPage();

  // Enable request interception
  await page.route('**', (route) => route.continue());

  // Store the response here
  let docResponse = null;

  // Listen for network responses and capture the HTML document
  page.on('response', async (response) => {
    const url = response.url();
    const contentType = response.headers()['content-type'] || '';

    // Only process main document HTML responses (the ones shown in "Doc" filter)
    if (
      url.includes('/grocery/pr?sid=73z&marketplace=GROCERY') &&
      contentType.includes('text/html') &&
      response.status() === 200
    ) {
      try {
        // Store the text for later parsing
        docResponse = await response.text();
        console.log('Captured HTML document response!');
      } catch (err) {
        console.log('Error capturing response:', err.message);
      }
    }
  });

  try {
    // First navigate to Flipkart Grocery
    console.log('Navigating to Flipkart Grocery...');
    await page.goto(
      'https://www.flipkart.com/grocery/pr?sid=73z&marketplace=GROCERY&p%5B%5D=facets.brand%255B%255D%3DVim',
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

      // Wait for a moment to ensure pincode is applied
      await page.waitForTimeout(2000);
    }

    // Now force a complete reload to get a fresh response with pincode already set
    console.log('Reloading page to get fresh data...');
    docResponse = null; // Clear previous response

    // Wait for the reload and network idle
    await page.reload({ waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000); // Extra wait to ensure response is captured

    // Process the captured document response
    if (docResponse) {
      console.log('Processing captured network response...');

      // Extract the JSON data from the script tag using regex
      const scriptRegex =
        /<script[^>]*id=["']is_script["'][^>]*>([\s\S]*?)<\/script>/i;
      const scriptMatch = docResponse.match(scriptRegex);

      if (scriptMatch && scriptMatch[1]) {
        console.log('Found is_script tag in response');

        // Extract the INITIAL_STATE using regex
        const stateRegex = /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});/;
        const stateMatch = scriptMatch[1].match(stateRegex);

        if (stateMatch && stateMatch[1]) {
          console.log('Found __INITIAL_STATE__ in script');

          try {
            // Parse the JSON data
            const stateData = JSON.parse(stateMatch[1]);
            console.log('Successfully parsed JSON data');

            // Look for 10003 data
            // const data10003 = [
            //   ...(stateData?.pageDataV4?.page?.data?.[10003]?.[1]?.widget?.data?.products?.map(
            //     (v) => v.productInfo
            //   ) || []),
            //   ...(stateData?.pageDataV4?.page?.data?.[10003]?.[2]?.widget?.data?.products?.map(
            //     (v) => v.productInfo
            //   ) || []),
            //   ...(stateData?.pageDataV4?.page?.data?.[10003]?.[3]?.widget?.data?.products?.map(
            //     (v) => v.productInfo
            //   ) || []),
            // ].map((v) => getProductInfo(v.value));

            const data10003 = (() => {
              const allProducts = [];

              // Loop from index 1 to 10
              for (let i = 1; i <= 10; i++) {
                // Get products from the current index if they exist
                const products =
                  stateData?.pageDataV4?.page?.data?.[10003]?.[i]?.widget?.data
                    ?.products;

                // If products exist, map them and add to our array
                if (products && Array.isArray(products)) {
                  const mappedProducts = products.map((v) => v.productInfo);
                  allProducts.push(...mappedProducts);
                }
              }

              // Apply getProductInfo to each product
              return allProducts.map((v) => getProductInfo(v.value));
            })();

            if (data10003) {
              console.log('Found 10003 data!');
              // console.log(JSON.stringify(data10003[1]));
              fs.writeFileSync(
                'flipkart_data_10003.json',
                JSON.stringify(data10003, null, 2)
              );
              console.log('Data saved to flipkart_data_10003.json');
            } else {
              console.log('10003 data not found in state object');

              // Save full state for debugging
              fs.writeFileSync(
                'flipkart_full_state.json',
                JSON.stringify(stateData, null, 2)
              );
              console.log('Full state saved to flipkart_full_state.json');

              // Log available keys
              if (stateData.pageDataV4?.page?.data) {
                console.log(
                  'Available data keys:',
                  Object.keys(stateData.pageDataV4.page.data)
                );
              }
            }
          } catch (e) {
            console.log('Failed to parse JSON data:', e.message);
          }
        } else {
          console.log('Could not find __INITIAL_STATE__ in script tag');
        }
      } else {
        console.log('Could not find is_script tag in response');

        // Try a more general approach to find any script with INITIAL_STATE
        const generalStateRegex =
          /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});/;
        const generalMatch = docResponse.match(generalStateRegex);

        if (generalMatch && generalMatch[1]) {
          console.log('Found __INITIAL_STATE__ using general search');

          try {
            const stateData = JSON.parse(generalMatch[1]);
            const data10003 = stateData?.pageDataV4?.page?.data?.[10003];

            if (data10003) {
              console.log('Found 10003 data with general search!');
              fs.writeFileSync(
                'flipkart_data_10003.json',
                JSON.stringify(data10003, null, 2)
              );
              console.log('Data saved to flipkart_data_10003.json');
            } else {
              console.log('10003 data not found with general search');
            }
          } catch (e) {
            console.log('Failed to parse general JSON data:', e.message);
          }
        }
      }
    } else {
      console.log('No document response was captured');

      // Try a last resort approach from the page itself
      console.log('Trying last resort approach from page...');
      const pageState = await page.evaluate(() => {
        if (window.__INITIAL_STATE__) {
          return window.__INITIAL_STATE__;
        }
        return null;
      });

      if (pageState) {
        console.log('Found state data with page evaluation');
        const data10003 = pageState?.pageDataV4?.page?.data?.[10003];

        if (data10003) {
          console.log('Found 10003 data with page evaluation!');
          fs.writeFileSync(
            'flipkart_data_10003.json',
            JSON.stringify(data10003, null, 2)
          );
        } else {
          console.log('10003 data not found with page evaluation');
        }
      }
    }
  } catch (error) {
    console.log('Error occurred:', error.message);
  } finally {
    // await browser.close();
  }
})();
