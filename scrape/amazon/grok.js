const { Pool } = require('pg');
const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

// Load environment variables from .env file
dotenv.config();

// Progress tracking file
const PROGRESS_FILE = path.join(__dirname, 'extraction_progress.json');

// PostgreSQL connection
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'flipkart',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

// Available models and their rate limits
const GROQ_MODELS = {
    "llama-3.1-8b-instant": {
        requestsPerMinute: 30,
        tokensPerMinute: 6000,
        requestsPerDay: 14400
    },
    "gemma2-9b-it": {
        requestsPerMinute: 30,
        tokensPerMinute: 15000,
        requestsPerDay: 14400
    },
    "llama-3.3-70b-versatile": {
        requestsPerMinute: 30,
        tokensPerMinute: 12000,
        requestsPerDay: 1000
    },
    "llama-guard-3-8b": {
        requestsPerMinute: 30,
        tokensPerMinute: 15000,
        requestsPerDay: 14400
    },
    "mistral-saba-24b": {
        requestsPerMinute: 30,
        tokensPerMinute: 6000,
        requestsPerDay: 1000
    },
    "meta-llama/llama-4-scout-17b-16e-instruct": {
        requestsPerMinute: 30,
        tokensPerMinute: 30000,
        requestsPerDay: 1000
    }
};

// Default config and model selection
let config = {
    model: "gemma2-9b-it",
    batchSize: 25, // Default batch size (can be adjusted)
    apiKey: process.env.GROQ_API_KEY, // Store in .env file
    requestsPerMinute: 30, // Will be updated based on selected model
    tokensPerMinute: 15000, // Will be updated based on selected model
    maxRetries: 3, // Maximum number of retries for failed requests
    retryDelay: 1000, // Base delay for retries in ms
};

// Progress tracking
let progress = {
    lastProcessedId: 0,
    processedCount: 0,
    successCount: 0,
    fallbackCount: 0,
    failedIds: [],
    lastBatchTime: null,
    startTime: null,
    resumeCount: 0
};

// Create a readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Prompt the user for input
function prompt(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

// Configure the extraction process
async function configureExtraction() {
    console.log("Available Groq Models:");
    console.log("---------------------------------------------");
    Object.entries(GROQ_MODELS).forEach(([model, limits], index) => {
        console.log(`${index + 1}. ${model}`);
        console.log(`   Limits: ${limits.requestsPerDay} requests/day, ${limits.requestsPerMinute} requests/minute`);
    });
    console.log("---------------------------------------------");

    const modelIndex = parseInt(await prompt("Select a model (number): ")) - 1;
    if (modelIndex >= 0 && modelIndex < Object.keys(GROQ_MODELS).length) {
        config.model = Object.keys(GROQ_MODELS)[modelIndex];
        const limits = GROQ_MODELS[config.model];
        config.requestsPerMinute = limits.requestsPerMinute;
        config.tokensPerMinute = limits.tokensPerMinute;
    } else {
        console.log("Invalid selection. Using default model: " + config.model);
    }

    const batchSizeInput = await prompt(`Enter batch size (1-${config.requestsPerMinute}, default: ${config.requestsPerMinute}): `);
    if (batchSizeInput && !isNaN(parseInt(batchSizeInput))) {
        const batchSize = parseInt(batchSizeInput);
        if (batchSize > 0 && batchSize <= config.requestsPerMinute) {
            config.batchSize = batchSize;
        } else {
            console.log(`Invalid batch size. Using model's rate limit: ${config.requestsPerMinute}`);
            config.batchSize = config.requestsPerMinute;
        }
    } else {
        console.log(`Using model's rate limit as batch size: ${config.requestsPerMinute}`);
        config.batchSize = config.requestsPerMinute;
    }

    // Check if API key is set
    if (!config.apiKey) {
        const apiKeyInput = await prompt("Groq API Key not found in .env file. Please enter your Groq API Key: ");
        if (apiKeyInput) {
            config.apiKey = apiKeyInput;
        } else {
            throw new Error("API Key is required to continue.");
        }
    }

    console.log("\nConfiguration Complete:");
    console.log("---------------------------------------------");
    console.log(`Model: ${config.model}`);
    console.log(`Batch Size: ${config.batchSize}`);
    console.log(`Rate Limits: ${config.requestsPerMinute} requests/minute`);
    console.log("---------------------------------------------");

    const confirm = await prompt("Proceed with extraction? (y/n): ");
    if (confirm.toLowerCase() !== 'y') {
        throw new Error("Extraction cancelled by user.");
    }

    rl.close();
}

// Save progress to file
async function saveProgress() {
    try {
        progress.lastBatchTime = new Date().toISOString();
        await fs.writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2));
        console.log(`Progress saved to ${PROGRESS_FILE}`);
    } catch (error) {
        console.error('Error saving progress:', error);
    }
}

// Load progress from file
async function loadProgress() {
    try {
        const exists = await fs.access(PROGRESS_FILE).then(() => true).catch(() => false);
        if (exists) {
            const data = await fs.readFile(PROGRESS_FILE, 'utf8');
            const savedProgress = JSON.parse(data);
            progress = { ...progress, ...savedProgress };
            progress.resumeCount++;
            console.log(`Resumed from previous run. Last processed ID: ${progress.lastProcessedId}`);
            console.log(`Previously processed: ${progress.processedCount} products`);
        } else {
            progress.startTime = new Date().toISOString();
            console.log('Starting new processing job');
        }
    } catch (error) {
        console.error('Error loading progress:', error);
        // Continue with default progress values
    }
}

// Setup database for processing
async function setupDatabase() {
    try {
        // Add quantity_processed column if it doesn't exist
        await pool.query(`
            ALTER TABLE products_amazon 
            ADD COLUMN IF NOT EXISTS quantity_processed BOOLEAN DEFAULT FALSE
        `);
        console.log('Database setup complete');
    } catch (error) {
        console.error('Error setting up database:', error);
        throw error; // Re-throw to stop execution
    }
}

// Prompt template for LLM
const createPrompt = (product) => {
    return `Extract the exact quantity from this product information:
Title: ${product.title}
Price per unit: ${product.qty_info}
Price: ${product.price}

Rules:
1. Return ONLY the quantity with unit (g, kg, ml, L, or units/pieces).
2. Use "g" for grams, "kg" for kilograms, "ml" for milliliters, "L" for liters, "units" for count items.
3. For weight/volume, use up to 2 decimal places (e.g., 1.25 L).
4. For counts/units, round to whole numbers (e.g., 5 units, not 5.2 units).
5. For promotional packs (e.g., "450 + 100g"), add the quantities together.
6. For "Buy X Get Y" format, count the total number of items.
7. If the price and price-per-unit information indicates a specific quantity, use that for verification.

Extract only the final quantity with unit. Format: [NUMBER] [UNIT]`;
};

// Function to call Groq API with retries and rate limiting
async function callGroqAPI(product) {
    let retries = 0;

    while (retries <= config.maxRetries) {
        try {
            const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
                model: config.model,
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant that extracts product quantities from text. Respond with only the quantity and unit, nothing else."
                    },
                    {
                        role: "user",
                        content: createPrompt(product)
                    }
                ],
                temperature: 0.1,
                max_tokens: 20,
            }, {
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            const generatedText = response.data.choices[0].message.content.trim();
            return generatedText;
        } catch (error) {
            retries++;

            // Handle rate limiting (429) or server errors (5xx) with exponential backoff
            if ((error.response && (error.response.status === 429 || error.response.status >= 500)) || !error.response) {
                const delay = config.retryDelay * Math.pow(2, retries - 1);
                console.warn(`API error for product ${product.product_id}, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                console.error(`Error calling Groq API for product ${product.product_id}:`, error.message);
                if (error.response) {
                    console.error('API response:', error.response.data);
                }

                if (retries >= config.maxRetries) {
                    return null;
                }
            }
        }
    }

    return null;
}

// Validate and standardize the extracted quantity
function validateQuantity(extractedQty, product) {
    if (!extractedQty) return null;

    // Clean up the response
    extractedQty = extractedQty.trim();

    // Basic validation patterns
    const weightPattern = /^(\d+(\.\d{1,2})?\s*(g|kg))$/i;
    const volumePattern = /^(\d+(\.\d{1,2})?\s*(ml|l))$/i;
    const unitPattern = /^(\d+\s*(units?|pieces?|pcs))$/i;

    // Check if it matches any of our expected patterns
    if (weightPattern.test(extractedQty) || volumePattern.test(extractedQty) || unitPattern.test(extractedQty)) {
        return extractedQty;
    }

    // Try to extract numeric value and unit
    const generalPattern = /^(\d+(\.\d{1,2})?)\s*([a-z]+)$/i;
    const match = extractedQty.match(generalPattern);

    if (match) {
        const value = parseFloat(match[1]);
        let unit = match[3].toLowerCase();

        // Standardize units
        if (['gram', 'grams', 'gm'].includes(unit)) unit = 'g';
        if (['kilogram', 'kilograms', 'kilo', 'kilos'].includes(unit)) unit = 'kg';
        if (['milliliter', 'milliliters', 'millilitre'].includes(unit)) unit = 'ml';
        if (['liter', 'liters', 'litre', 'litres'].includes(unit)) unit = 'L';
        if (['piece', 'pieces', 'pcs', 'count', 'counts', 'item', 'items'].includes(unit)) {
            unit = 'units';
            // Round to nearest integer for units
            return `${Math.round(value)} ${unit}`;
        }

        if (['g', 'kg', 'ml', 'l', 'L'].includes(unit)) {
            // Format to 2 decimal places
            return `${value.toFixed(2)} ${unit}`;
        }
    }

    console.warn(`Could not validate quantity "${extractedQty}" for product ${product.product_id}`);
    return null;
}

// Calculate smart quantity as fallback (simplified version of original function)
function calculateSmartQuantity(price, pricePerUnitStr) {
    if (!pricePerUnitStr || !price) {
        return null;
    }

    // Extract numbers and unit from the price per unit string
    const regex = /₹([\d,.]+)\/(?:(\d+)\s*)?([a-zA-Z]+)/;
    const match = pricePerUnitStr.match(regex);

    if (!match) {
        return null;
    }

    // Extract components
    const ppu = parseFloat(match[1].replace(/,/g, ''));
    const pivotValue = match[2] ? parseInt(match[2]) : 1;
    let pivotQualifier = match[3].toLowerCase();

    // Normalize units
    if (pivotQualifier === 'l') pivotQualifier = 'L';
    if (pivotQualifier === 'count') pivotQualifier = 'units';
    if (pivotQualifier === 'millilitre') pivotQualifier = 'ml';

    // Calculate total raw units
    const totalUnits = (price / ppu) * pivotValue;

    let quantity;
    let unit;

    switch (pivotQualifier) {
        case 'L':
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
        case 'units':
            quantity = Math.round(totalUnits); // Always round units to integers
            unit = 'units';
            break;
        default:
            quantity = totalUnits;
            unit = pivotQualifier || 'units';
    }

    return `${quantity.toFixed(2)} ${unit}`;
}

// Main function to process products in batches with improved rate limiting and resume capability
async function processProducts() {
    try {
        // Load previous progress if exists
        await loadProgress();

        // Setup database (add required columns)
        await setupDatabase();

        // Get products that need smart_qty updating and haven't been processed yet
        const query = `
            SELECT id, product_id, title, price, qty_info, smart_qty
            FROM products_amazon
            WHERE price IS NOT NULL 
              AND qty_info IS NOT NULL
              AND quantity_processed = FALSE
              AND id > $1
            ORDER BY id
            LIMIT 10000
        `;

        const result = await pool.query(query, [progress.lastProcessedId]);
        const products = result.rows;
        const totalProducts = products.length;

        if (totalProducts === 0) {
            console.log('No more products to process. Job complete!');
            return;
        }

        console.log(`Found ${totalProducts} products to process`);

        // Rate limiting constants (based on selected model limits)
        const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute in milliseconds

        // Create batches - we'll process up to config.batchSize products concurrently
        for (let i = 0; i < products.length; i += config.batchSize) {
            const batchStartTime = Date.now();
            const batch = products.slice(i, i + config.batchSize);
            const batchNumber = Math.floor(i/config.batchSize) + 1;
            const totalBatches = Math.ceil(products.length/config.batchSize);
            console.log(`Processing batch ${batchNumber} of ${totalBatches}`);

            // Process each product in the batch with controlled concurrency
            const promises = batch.map(async (product, index) => {
                try {
                    // Add a small staggered delay within the batch to smooth out API calls
                    await new Promise(resolve => setTimeout(resolve, 100 * index));

                    // Call Groq API to extract quantity
                    const extractedQty = await callGroqAPI(product);

                    // Validate and standardize the extracted quantity
                    let smartQty = validateQuantity(extractedQty, product);

                    // If validation fails, fall back to calculation
                    if (!smartQty) {
                        smartQty = calculateSmartQuantity(product.price, product.qty_info);
                        progress.fallbackCount++;
                        console.log(`Using fallback calculation for product ${product.product_id}: ${smartQty}`);
                    } else {
                        progress.successCount++;
                        console.log(`Successfully extracted quantity for product ${product.product_id}: ${smartQty}`);
                    }

                    // Update the product in the database and mark as processed
                    if (smartQty) {
                        await pool.query(
                            'UPDATE products_amazon SET smart_qty = $1, quantity_processed = TRUE, updated_at = NOW() WHERE product_id = $2',
                            [smartQty, product.product_id]
                        );
                    }

                    // Update progress tracking
                    progress.processedCount++;
                    progress.lastProcessedId = product.id;

                    // Log progress
                    if (progress.processedCount % 100 === 0) {
                        console.log(`Progress: ${progress.processedCount} products processed`);
                        await saveProgress();
                    }

                    return { product_id: product.product_id, smartQty, success: true };
                } catch (error) {
                    console.error(`Error processing product ${product.product_id}:`, error.message);
                    progress.failedIds.push(product.product_id);
                    return { product_id: product.product_id, error: error.message, success: false };
                }
            });

            // Wait for all products in the batch to be processed
            const results = await Promise.all(promises);

            // Save progress after each batch
            await saveProgress();

            // Calculate time spent and enforce rate limiting window if needed
            const batchEndTime = Date.now();
            const batchDuration = batchEndTime - batchStartTime;

            // If we processed faster than our rate limit window, wait until the window completes
            if (batchDuration < RATE_LIMIT_WINDOW_MS) {
                const waitTime = RATE_LIMIT_WINDOW_MS - batchDuration;
                console.log(`Batch processed in ${batchDuration}ms. Waiting ${waitTime}ms to respect rate limits...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }

            // Log batch statistics
            const successfulInBatch = results.filter(r => r.success).length;
            console.log(`Batch ${batchNumber} complete: ${successfulInBatch}/${batch.length} successful`);
        }

        console.log('\nBatch processing complete!');
        console.log(`Total products processed: ${progress.processedCount}`);
        console.log(`Successful extractions: ${progress.successCount}`);
        console.log(`Fallback calculations: ${progress.fallbackCount}`);
        console.log(`Failed products: ${progress.failedIds.length}`);
        console.log(`Success rate: ${(progress.successCount/progress.processedCount*100).toFixed(1)}%`);

        // Check if there are more products to process
        const remainingQuery = `
            SELECT COUNT(*) as count
            FROM products_amazon
            WHERE price IS NOT NULL 
              AND qty_info IS NOT NULL
              AND quantity_processed = FALSE
        `;

        const remainingResult = await pool.query(remainingQuery);
        const remainingCount = parseInt(remainingResult.rows[0].count);

        if (remainingCount > 0) {
            console.log(`\n${remainingCount} more products remain to be processed.`);
            console.log('Run this script again to continue processing.');
        } else {
            console.log('\nAll products have been processed successfully!');
        }

    } catch (error) {
        console.error('Error in main process:', error);
    } finally {
        await saveProgress();
        await pool.end();
        console.log('Database connection closed');
    }
}

// Main entry point
async function main() {
    console.log('Starting Product Quantity Extraction Process');
    console.log('--------------------------------------------');

    try {
        // Configure extraction process
        await configureExtraction();

        console.log(`Using model: ${config.model}`);
        console.log(`Batch size: ${config.batchSize}`);
        console.log('--------------------------------------------');

        await processProducts();

        console.log('\nProcessing completed');

        // Display statistics
        const endTime = new Date();
        const startTime = progress.startTime ? new Date(progress.startTime) : endTime;
        const totalDuration = (endTime - startTime) / 1000 / 60; // in minutes

        console.log('\nFinal Statistics:');
        console.log('--------------------------------------------');
        console.log(`Total products processed: ${progress.processedCount}`);
        console.log(`Successful LLM extractions: ${progress.successCount}`);
        console.log(`Fallback calculations: ${progress.fallbackCount}`);
        console.log(`Failed products: ${progress.failedIds.length}`);
        console.log(`Success rate: ${(progress.successCount/progress.processedCount*100).toFixed(1)}%`);
        console.log(`Total processing time: ${totalDuration.toFixed(1)} minutes`);
        console.log(`Number of script restarts: ${progress.resumeCount}`);
        console.log('--------------------------------------------');
    } catch (error) {
        console.error('Fatal error:', error);
    }
}

// Run the main function
if (require.main === module) {
    main().catch(console.error);
}

// Export functions for testing
module.exports = {
    calculateSmartQuantity,
    validateQuantity,
    processProducts
};