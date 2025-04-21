// config.js
module.exports = {
    // Database configuration
    database: {
        user: 'postgres',
        host: 'localhost',
        database: 'flipkart', // Change this to your database name
        password: 'postgres', // Replace with your actual password
        port: 5432,
    },

    // Scraper configuration
    scraper: {
        pincode: '600001', // Chennai pincode
        searchUrl: 'https://www.flipkart.com/grocery/pr?sid=73z&marketplace=GROCERY&p%5B%5D=facets.brand%255B%255D%3DVim',

        // Additional search URLs for other brands/categories
        additionalUrls: [
            // Add more URLs here to scrape multiple categories
            // 'https://www.flipkart.com/grocery/pr?sid=73z&marketplace=GROCERY&p%5B%5D=facets.brand%255B%255D%3DTata',
            // 'https://www.flipkart.com/grocery/pr?sid=73z&marketplace=GROCERY&p%5B%5D=facets.brand%255B%255D%3DMaggi'
        ],

        // Browser configuration
        browser: {
            headless: false, // Set to true for production use
            slowMo: 50, // Slow down operations to avoid detection (ms)
        }
    },

    // Application settings
    app: {
        logLevel: 'info', // 'debug', 'info', 'warn', 'error'
        saveScreenshots: false, // Whether to save screenshots during scraping
        screenshotDir: './screenshots',
    }
};