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

// Function to calculate smart quantity based on price per unit
function calculateSmartQuantity(price, pricePerUnitStr, title) {
    if (!pricePerUnitStr || !price) {
        return { smartQty: null, pivotQualifier: null, pivotValue: null, pricePerUnit: null };
    }

    // Extract numbers and unit from the price per unit string
    // Format examples: (₹149₹149/l) or (₹49.20₹49.20/100 g)
    const regex = /₹([\d,.]+)\/(?:(\d+)\s*)?([a-zA-Z]+)/;
    const match = pricePerUnitStr.match(regex);

    if (!match) {
        return { smartQty: null, pivotQualifier: null, pivotValue: null, pricePerUnit: null };
    }

    // Extract components
    const ppu = parseFloat(match[1].replace(/,/g, ''));
    const pivotValue = match[2] ? parseInt(match[2]) : 1;
    let pivotQualifier = match[3].toLowerCase();

    // Normalize units
    if (pivotQualifier === 'l') pivotQualifier = 'L';
    if (pivotQualifier === 'count') pivotQualifier = 'Units';
    if (pivotQualifier === 'millilitre') pivotQualifier = 'ml';

    // Check if the title contains count/quantity information
    let titleQty = null;
    let titleUnit = null;

    // Look for count pattern like "144 Count" or "72 X Pack of 2"
    const countPattern = /(\d+)\s*(?:count|piece|capsule|tablet|wipe|pack)/i;
    const countMatch = title ? title.match(countPattern) : null;

    // Look for quantity pattern like "500 g" or "1 L"
    const qtyPattern = /(\d+(?:\.\d+)?)\s*(g|kg|ml|l|liter|litre)/i;
    const qtyMatch = title ? title.match(qtyPattern) : null;

    if (pivotQualifier === 'Units' && countMatch) {
        // Use count from title directly
        titleQty = parseInt(countMatch[1]);
        titleUnit = 'Units';
    } else if (qtyMatch) {
        titleQty = parseFloat(qtyMatch[1]);
        titleUnit = qtyMatch[2].toLowerCase();
        // Normalize units from title
        if (titleUnit === 'liter' || titleUnit === 'litre') titleUnit = 'L';
    }

    // Calculate total raw units
    const totalUnits = (price / ppu) * pivotValue;

    let quantity;
    let unit;

    switch (pivotQualifier) {
        case 'L':
            // If less than 1L, convert to ml
            if (totalUnits < 1) {
                quantity = totalUnits * 1000;
                unit = 'ml';
            } else {
                quantity = totalUnits;
                unit = 'L';
            }
            break;

        case 'ml':
            if (totalUnits >= 1000) {
                quantity = totalUnits / 1000;
                unit = 'L';
            } else {
                quantity = totalUnits;
                unit = 'ml';
            }
            break;

        case 'kg':
            // If less than 1kg, convert to g
            if (totalUnits < 1) {
                quantity = totalUnits * 1000;
                unit = 'g';
            } else {
                quantity = totalUnits;
                unit = 'kg';
            }
            break;

        case 'g':
            if (totalUnits >= 1000) {
                quantity = totalUnits / 1000;
                unit = 'kg';
            } else {
                quantity = totalUnits;
                unit = 'g';
            }
            break;

        default:
            quantity = totalUnits;
            unit = pivotQualifier || 'unit'; // fallback
    }

    // If we have count information from the title for "Units" and the calculated quantity is close enough,
    // use the exact count from the title
    if (titleQty && titleUnit === 'Units' && pivotQualifier === 'Units') {
        // Use count from title if it's within 10% of the calculated value
        const diff = Math.abs(quantity - titleQty) / titleQty;
        if (diff < 0.1) {
            quantity = titleQty;
        }
    }

    return {
        smartQty: `${quantity.toFixed(2)} ${unit}`,
        pivotQualifier,
        pivotValue,
        pricePerUnit: ppu
    };
}

// Function to scrape products for a specific brand
async function scrapeProductsByBrand(page, brandId, brandName) {
    console.log(`Starting to scrape products for brand: ${brandName} (${brandId})`);

    // Navigate to brand-specific Amazon URL
    const brandUrl = `https://www.amazon.in/s?srs=${brandId}&rh=p_85%3A10440599031`; // prime refinement handler
    await page.goto(brandUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
    });

    let productCount = 0;
    let pageNum = 1;

    // Process pages until there's no next page button
    while (true) {
        console.log(`Processing ${brandName} - Page ${pageNum}`);

        // Wait for product listings
        try {
            await page.waitForSelector('[data-asin]', { timeout: 10000 });
        } catch (err) {
            console.log(`No products found for brand ${brandName} on page ${pageNum}`);
            break;
        }

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
        const products = await page.evaluate((currentBrandName) => {
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
                let brand = null;
                let pricePerUnitText = '';

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

                // Brand - using the provided selector
                const brandElem = element.querySelector('.s-featured-result-item span.a-size-base-plus, .s-widget-container > span span.a-size-base-plus');
                if (brandElem) brand = brandElem.textContent.trim();

                // Price per unit - using the provided selector
                const ppuElem = element.querySelector('div.a-spacing-none:nth-of-type(3) .a-link-normal > span.a-color-secondary');
                if (ppuElem) pricePerUnitText = ppuElem.textContent.trim();

                items.push({
                    product_id: asin,
                    title: title || 'Unknown Product',
                    image_url: imageUrl,
                    product_url: productUrl,
                    mrp: mrp,
                    price: price,
                    qty_info: pricePerUnitText || '',
                    brand_name: brand || currentBrandName, // Use the passed brand name if not found in the page
                    price_per_unit_text: pricePerUnitText || ''
                });
            });

            return items;
        }, brandName);

        // Process each product with manual ID handling
        for (const product of products) {
            // Add brand_id to each product
            product.brand_id = brandId;

            if (product.product_id && product.title) {
                try {
                    // Calculate smart quantity
                    const quantityInfo = calculateSmartQuantity(product.price, product.price_per_unit_text, product.title);

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
                            brand_id = $9,
                            smart_qty = $10,
                            pivot_qualifier = $11,
                            pivot_value = $12,
                            price_per_unit = $13,
                            updated_at = $14
                          WHERE product_id = $1
                        `, [
                            product.product_id,
                            product.title,
                            product.image_url,
                            product.product_url,
                            product.mrp,
                            product.price,
                            product.price_per_unit_text,
                            product.brand_name,
                            product.brand_id,
                            quantityInfo.smartQty,
                            quantityInfo.pivotQualifier,
                            quantityInfo.pivotValue,
                            quantityInfo.pricePerUnit,
                            now
                        ]);

                        console.log(`Updated product ID: ${product.product_id}, Smart Qty: ${quantityInfo.smartQty}`);
                    } else {
                        // Find the maximum ID and ensure sequential insertion
                        const maxIdQuery = 'SELECT COALESCE(MAX(id), 0) as max_id FROM products_amazon';
                        const maxIdResult = await pool.query(maxIdQuery);
                        const nextId = maxIdResult.rows[0].max_id + 1;

                        // Insert new product with explicit ID
                        await pool.query(`
                          INSERT INTO products_amazon (
                            id, product_id, title, image_url, product_url, mrp, price, 
                            qty_info, brand_name, brand_id, smart_qty, pivot_qualifier, pivot_value, price_per_unit,
                            created_at, updated_at
                          )
                          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                        `, [
                            nextId,
                            product.product_id,
                            product.title,
                            product.image_url,
                            product.product_url,
                            product.mrp,
                            product.price,
                            product.price_per_unit_text,
                            product.brand_name,
                            product.brand_id,
                            quantityInfo.smartQty,
                            quantityInfo.pivotQualifier,
                            quantityInfo.pivotValue,
                            quantityInfo.pricePerUnit,
                            now,
                            now
                        ]);

                        console.log(`Inserted new product with ID: ${nextId}, product_id: ${product.product_id}, Smart Qty: ${quantityInfo.smartQty}`);
                        productCount++;
                    }
                } catch (err) {
                    console.error(`Error saving product ${product.product_id}:`, err.message);
                }
            }
        }

        console.log(`Processed ${products.length} products from ${brandName} - page ${pageNum}`);

        // Check if there's a next page
        const hasNext = await page.evaluate(() => {
            const nextButton = document.querySelector('a.s-pagination-next');
            return nextButton !== null && !nextButton.classList.contains('s-pagination-disabled');
        });

        if (hasNext) {
            await page.click('a.s-pagination-next');
            await page.waitForTimeout(3000);
            pageNum++;
        } else {
            console.log(`No more pages available for brand ${brandName}`);
            break;
        }
    }

    return productCount;
}

(async () => {
    // Make sure we have the necessary tables
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
        brand_id VARCHAR(255),
        smart_qty VARCHAR(255),
        pivot_qualifier VARCHAR(50),
        pivot_value INTEGER,
        price_per_unit DECIMAL(10, 3),
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

        // Get brands from the database
        const brandQuery = 'SELECT * FROM brand_amazon WHERE brand_id IS NOT NULL order by brand_id limit 1 ';
        const brandResult = await pool.query(brandQuery);
        const brands = brandResult.rows;

        console.log(`Found ${brands.length} brands to process`);

        // Process each brand
        for (const brand of brands) {
            try {
                const productCount = await scrapeProductsByBrand(page, brand.brand_id, brand.name);

                // Update the product count in the brand_amazon table
                await pool.query(`
                    UPDATE brand_amazon 
                    SET product_count = (
                        SELECT COUNT(*) 
                        FROM products_amazon 
                        WHERE brand_id = $1
                    ) 
                    WHERE brand_id = $1
                `, [brand.brand_id]);

                console.log(`Updated product count for brand ${brand.name}`);
            } catch (err) {
                console.error(`Error processing brand ${brand.name}:`, err.message);
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