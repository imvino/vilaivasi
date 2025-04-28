const { chromium } = require('playwright');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Config - you can adjust these as needed
const CHECKPOINT_FILE = path.join(__dirname, 'brand_checkpoint.json');
const BATCH_SIZE = 20; // Process brands in batches to reduce memory usage
const HEADLESS = false; // Run browser in headless mode for better performance
const REQUEST_TIMEOUT = 15000; // Timeout for requests
const NUM_TABS = 3; // Number of tabs to run in parallel
const BRANDS_TO_SKIP = ['Classic', 'jio']; // Brands to skip

async function main() {
    // Initialize PostgreSQL connection
    const pool = new Pool({
        user: 'postgres',
        host: 'localhost',
        database: 'flipkart',
        password: 'postgres',
        port: 5432,
    });

    // Configure browser with performance optimizations
    const browser = await chromium.launch({
        headless: HEADLESS,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-dev-shm-usage', // Overcome limited resource problems
            '--disable-gpu', // Disable GPU hardware acceleration
            '--disable-setuid-sandbox', // Disable the setuid sandbox
            '--no-sandbox', // Required when running as root
        ],
    });

    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        viewport: { width: 1366, height: 768 },
        deviceScaleFactor: 1,
        hasTouch: false,
        bypassCSP: true, // Bypass Content Security Policy
    });

    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS brand_amazon (
        id serial4 NOT NULL,
        brand_id varchar(255) NULL,
        "name" varchar(255) NOT NULL UNIQUE,
        product_count int4 DEFAULT 0 NULL,
        created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
        status varchar(10) NULL,
        CONSTRAINT brand_amazon_pkey PRIMARY KEY (id)
      )
    `);

        // Remove the unique constraint on brand_id if it exists
        try {
            await pool.query(`ALTER TABLE brand_amazon DROP CONSTRAINT IF EXISTS brand_amazon_brand_id_key`);
            console.log("Removed unique constraint on brand_id column");
        } catch (err) {
            console.log("No unique constraint to remove or already removed");
        }

        // Create index on brand_id and name for faster lookups
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_brand_amazon_brand_id ON brand_amazon(brand_id);
            CREATE INDEX IF NOT EXISTS idx_brand_amazon_name ON brand_amazon(name);
        `);

        // Step 1: Set up initial page and set pincode once
        const setupPage = await context.newPage();
        await setPincode(setupPage);
        await setupPage.close();

        // Step 2: Get the list of brands from the database
        const brandsResult = await pool.query('SELECT id, name FROM brands where name not iLIKE \'%Flipkart%\' ORDER BY name ASC');
        let allBrands = brandsResult.rows;

        // Filter out brands to skip
        allBrands = allBrands.filter(brand => {
            const normalizedName = normalizeBrandName(brand.name).toLowerCase();
            return !BRANDS_TO_SKIP.some(skipBrand =>
                normalizedName.includes(skipBrand.toLowerCase())
            );
        });

        console.log(`Found ${allBrands.length} total brands to process after filtering`);

        // Step 3: Get existing brands in brand_amazon to avoid duplicates
        const existingBrandsResult = await pool.query('SELECT brand_id, name FROM brand_amazon');

        // Create sets for both brand IDs and normalized names
        const existingBrandIds = new Set();
        const existingBrandNames = new Set();

        existingBrandsResult.rows.forEach(row => {
            if (row.brand_id) {
                existingBrandIds.add(row.brand_id);
            }
            existingBrandNames.add(normalizeBrandName(row.name).toLowerCase());
        });

        console.log(`Found ${existingBrandNames.size} brands already in database`);

        // Step 4: Load checkpoint if exists
        let lastProcessedIndices = Array(NUM_TABS).fill(-1);
        if (fs.existsSync(CHECKPOINT_FILE)) {
            try {
                const checkpointData = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
                if (Array.isArray(checkpointData.lastProcessedIndices)) {
                    lastProcessedIndices = checkpointData.lastProcessedIndices;
                } else if (typeof checkpointData.lastProcessedIndex === 'number') {
                    // Backward compatibility with old checkpoint format
                    lastProcessedIndices[0] = checkpointData.lastProcessedIndex;
                }
                console.log(`Resuming from checkpoint: ${JSON.stringify(lastProcessedIndices)}`);
            } catch (error) {
                console.error('Error reading checkpoint file:', error);
                // Continue with default lastProcessedIndices = [-1, -1, -1]
            }
        }

        // Step 5: Distribute brands among tabs and process in parallel
        // Calculate the portion of brands each tab will handle
        const brandsPerTab = Math.ceil(allBrands.length / NUM_TABS);

        // Create and process all tabs in parallel
        const tabPromises = [];
        for (let tabIndex = 0; tabIndex < NUM_TABS; tabIndex++) {
            const startBrandIndex = tabIndex * brandsPerTab;
            const endBrandIndex = Math.min((tabIndex + 1) * brandsPerTab, allBrands.length);

            // Skip if this tab has already processed all its brands
            if (lastProcessedIndices[tabIndex] >= endBrandIndex - 1) {
                console.log(`Tab ${tabIndex + 1} has already completed all its assigned brands`);
                continue;
            }

            // Process this tab's brands
            tabPromises.push(
                processTabBrands(
                    context,
                    pool,
                    allBrands,
                    startBrandIndex,
                    endBrandIndex,
                    tabIndex,
                    lastProcessedIndices,
                    existingBrandIds,
                    existingBrandNames
                )
            );
        }

        // Wait for all tabs to complete
        await Promise.all(tabPromises);

        console.log("All brands processed successfully!");
        // Clean up checkpoint file when done
        if (fs.existsSync(CHECKPOINT_FILE)) {
            fs.unlinkSync(CHECKPOINT_FILE);
            console.log("Checkpoint file removed.");
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
        await pool.end();
    }
}

// Process brands for a specific tab
async function processTabBrands(
    context,
    pool,
    allBrands,
    startBrandIndex,
    endBrandIndex,
    tabIndex,
    lastProcessedIndices,
    existingBrandIds,
    existingBrandNames
) {
    console.log(`Tab ${tabIndex + 1} processing brands from index ${startBrandIndex} to ${endBrandIndex - 1}`);

    const page = await context.newPage();
    await setPincode(page);  // Set pincode for this tab

    // Resume from the last processed index for this tab
    let lastProcessedIndex = lastProcessedIndices[tabIndex];

    // Process brands in batches
    for (let startIdx = Math.max(startBrandIndex, lastProcessedIndex + 1); startIdx < endBrandIndex; startIdx += BATCH_SIZE) {
        const endIdx = Math.min(startIdx + BATCH_SIZE, endBrandIndex);
        const brandBatch = allBrands.slice(startIdx, endIdx);

        console.log(`Tab ${tabIndex + 1}: Processing batch: ${startIdx} to ${endIdx - 1} of range ${startBrandIndex}-${endBrandIndex - 1}`);

        // Process each brand in the current batch
        for (let i = 0; i < brandBatch.length; i++) {
            const brand = brandBatch[i];
            const currentIndex = startIdx + i;
            const startTime = Date.now();

            // Normalize the brand name for comparison
            const normalizedBrandName = normalizeBrandName(brand.name).toLowerCase();

            // Skip if already processed - compare by normalized name
            if (existingBrandNames.has(normalizedBrandName)) {
                console.log(`Tab ${tabIndex + 1} [${currentIndex + 1}/${allBrands.length}] Skipping brand ${brand.name} - already in database by name`);
                continue;
            }

            console.log(`Tab ${tabIndex + 1} [${currentIndex + 1}/${allBrands.length}] Processing brand: ${brand.name}`);

            try {
                // Search for the brand on Amazon
                const brandInfo = await searchAndExtractBrandInfo(page, brand.name);

                if (brandInfo) {
                    // Check if this brand ID already exists in the database
                    if (brandInfo.id && existingBrandIds.has(brandInfo.id)) {
                        console.log(`Tab ${tabIndex + 1}: Brand ID ${brandInfo.id} already exists in database, setting to null`);
                        brandInfo.id = null;
                    }

                    // Determine status based on brandInfo results
                    let status = null;

                    // If the brand ID is '0', set status to '0' and set brandInfo.id to null
                    if (brandInfo.id === '0') {
                        status = '0';
                        brandInfo.id = null;
                        console.log(`Tab ${tabIndex + 1}: Brand ID is 0 for ${brandInfo.name}, setting brandId to null`);
                    }

                    // Insert brand into brand_amazon table
                    await pool.query(
                        'INSERT INTO brand_amazon (brand_id, name, product_count, status) VALUES ($1, $2, $3, $4)',
                        [brandInfo.id, brandInfo.name, 0, status]
                    );

                    // Add to our tracking sets to avoid duplicates in the current run
                    if (brandInfo.id) {
                        existingBrandIds.add(brandInfo.id);
                    }
                    existingBrandNames.add(normalizeBrandName(brandInfo.name).toLowerCase());

                    console.log(`Tab ${tabIndex + 1}: Saved brand: ${brandInfo.name} with ID: ${brandInfo.id || 'NULL'}, Status: ${status || 'NULL'}`);
                } else {
                    // Brand not found, set status as 'n/a'
                    await pool.query(
                        'INSERT INTO brand_amazon (brand_id, name, product_count, status) VALUES ($1, $2, $3, $4)',
                        [null, brand.name, 0, 'n/a']
                    );

                    // Add to existing names set
                    existingBrandNames.add(normalizedBrandName);

                    console.log(`Tab ${tabIndex + 1}: Brand not found on Amazon: ${brand.name}, Status: n/a`);
                }

                // Update this tab's last processed index
                lastProcessedIndices[tabIndex] = currentIndex;

                // Save checkpoint after each brand
                saveCheckpoint(lastProcessedIndices);

                // Calculate and log processing time
                const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);
                console.log(`Tab ${tabIndex + 1}: Processing time: ${processingTime}s`);
            } catch (error) {
                console.error(`Tab ${tabIndex + 1}: Error processing brand ${brand.name}:`, error);
                // Save checkpoint before continuing
                saveCheckpoint(lastProcessedIndices);
            }

            // Small delay to avoid rate limiting
            await page.waitForTimeout(1000);
        }
    }

    // Close this tab's page when finished
    await page.close();
    console.log(`Tab ${tabIndex + 1} completed processing brands from ${startBrandIndex} to ${endBrandIndex - 1}`);
}

// Save checkpoint to file for resuming - now with multiple tab indices
function saveCheckpoint(lastProcessedIndices) {
    const checkpointData = {
        lastProcessedIndices: lastProcessedIndices,
        timestamp: new Date().toISOString()
    };
    fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpointData, null, 2));
}

async function setPincode(page) {
    console.log('Setting pincode...');

    try {
        // Navigate to Amazon
        await page.goto('https://www.amazon.in/s?i=nowstore', {
            waitUntil: 'domcontentloaded',
            timeout: REQUEST_TIMEOUT,
        });

        await page.waitForTimeout(1000);

        // Click location button
        const locationButton = page.locator('#nav-global-location-popover-link');
        await locationButton.waitFor({ timeout: REQUEST_TIMEOUT });
        await locationButton.click();

        // Wait for popup
        await page.waitForSelector('#GLUXZipUpdateInput', { timeout: REQUEST_TIMEOUT });
        await page.waitForTimeout(500);

        // Fill pincode
        const pincodeInput = page.locator('#GLUXZipUpdateInput');
        await pincodeInput.click();
        await pincodeInput.fill('600001');

        await page.waitForTimeout(500);

        // Click apply
        const applyButton = page.locator('#GLUXZipUpdate span.a-button-text');
        await applyButton.click();

        // Wait for update
        await page.waitForTimeout(1000);

        // Handle "Done" button if it appears
        try {
            const doneButton = page.locator('#GLUXConfirmClose');
            if (await doneButton.isVisible({ timeout: 2000 })) {
                await doneButton.click();
            }
        } catch (err) {
            console.log('No Done button found');
        }

        await page.waitForTimeout(1000);
        console.log('Pincode set successfully');
    } catch (error) {
        console.error('Error setting pincode:', error);
        console.log('Continuing anyway - will try to work without pincode');
    }
}

async function searchAndExtractBrandInfo(page, brandName) {
    try {
        // Normalize brand name for search and comparison
        const normalizedBrandName = normalizeBrandName(brandName);
        const encodedBrandName = encodeURIComponent(brandName);
        const searchUrl = `https://www.amazon.in/s?k=${encodedBrandName}&i=nowstore`;

        console.log(`Searching for ${brandName} at ${searchUrl}`);
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: REQUEST_TIMEOUT });

        // Wait for search results
        await page.waitForTimeout(1000);

        // Extract products using the same selectors as your sample code
        const products = await page.evaluate((normalizedBrand) => {
            const items = [];
            const productElements = document.querySelectorAll('[data-asin]');

            productElements.forEach((element) => {
                const asin = element.getAttribute('data-asin');
                if (!asin || asin.trim() === '') return;

                let title = '';
                let productUrl = '';

                // URL
                const linkElem = element.querySelector('a.a-link-normal');
                if (linkElem) productUrl = 'https://www.amazon.in' + linkElem.getAttribute('href');

                // Title
                const titleElem = element.querySelector('.a-size-base-plus.a-color-base');
                if (titleElem) title = titleElem.textContent.trim();

                // Normalize title for comparison
                const normalizedTitle = title.toLowerCase()
                                             .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove diacritics
                                             .replace(/['']/g, ''); // Handle special quotes

                // Push only if title is not empty and product URL exists
                if (title && productUrl) {
                    items.push({
                        title,
                        productUrl,
                        // Add a score to indicate how likely this is to be the brand we're looking for
                        // Simple matching based on whether the normalized title contains the normalized brand
                        score: normalizedTitle.includes(normalizedBrand) ? 1 : 0
                    });
                }
            });

            return items;
        }, normalizedBrandName.toLowerCase());

        console.log(`Found ${products.length} products in search results`);

        // Filter products that are likely to match the brand and sort by score
        const matchingProducts = products
            .filter(p => p.score > 0)
            .sort((a, b) => b.score - a.score);

        if (matchingProducts.length === 0) {
            // No good match, try the first product as fallback
            if (products.length > 0) {
                console.log(`No exact brand match found, trying first product for ${brandName}`);
                matchingProducts.push(products[0]);
            } else {
                console.log(`No products found for brand ${brandName}`);
                return null;
            }
        }

        // Take the best matching product
        const bestMatch = matchingProducts[0];
        console.log(`Selected product: "${bestMatch.title}" for brand ${brandName}`);

        // Navigate to the product page
        await page.goto(bestMatch.productUrl, { waitUntil: 'domcontentloaded', timeout: REQUEST_TIMEOUT });
        await page.waitForTimeout(1000);

        // Check if brand info link exists
        const brandInfoExists = await page.locator('a#bylineInfo').count() > 0;

        if (!brandInfoExists) {
            console.log(`No brand info found for ${brandName}`);
            return null;
        }

        // Extract brand name and URL
        const brandInfoLink = page.locator('a#bylineInfo');
        const brandNameFromAmazon = await brandInfoLink.textContent();
        const brandUrl = await brandInfoLink.getAttribute('href');

        console.log(`Found brand info: ${brandNameFromAmazon}, URL: ${brandUrl}`);

        // Extract brand ID from URL
        let brandId = null;
        if (brandUrl) {
            // Match both patterns: web_12345 and dp_merchant_link
            const webMatches = brandUrl.match(/web_(\d+)/);
            const dpMatches = brandUrl.match(/dp_merchant_link.*seller=([A-Z0-9]+)/);

            if (webMatches && webMatches[1]) {
                brandId = webMatches[1];
            } else if (dpMatches && dpMatches[1]) {
                brandId = dpMatches[1];
            } else if (brandUrl.includes('web_0')) {
                // Special case for web_0
                brandId = '0';
            }
        }

        // Clean up brand name from Amazon (remove "Visit the", "Brand:", etc.)
        const cleanBrandName = brandNameFromAmazon
            .replace(/Visit the |Visit |Brand:|Store$/gi, '')
            .replace(/\s+/g, ' ')
            .trim();

        return {
            name: cleanBrandName || brandName, // Fall back to original if cleaning fails
            id: brandId
        };

    } catch (error) {
        console.error(`Error while searching for ${brandName}:`, error);
        return null;
    }
}

// Helper function to normalize brand names for comparison
function normalizeBrandName(name) {
    return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics (é -> e)
        .replace(/['']/g, '') // Handle special quotes
        .replace(/[&+,]/g, ' ') // Replace special chars with space
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();
}

// Run the main function
main().catch(console.error);