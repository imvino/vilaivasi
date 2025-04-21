const { Pool } = require('pg');

// Configure PostgreSQL connection
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'flipkart',
    password: 'postgres', // Replace with your actual password
    port: 5432,
});

// Function to insert or update a brand
async function upsertBrand(brandName) {
    const client = await pool.connect();
    try {
        // Check if brand exists
        const checkQuery = 'SELECT id FROM brands WHERE name = $1';
        const checkResult = await client.query(checkQuery, [brandName]);

        if (checkResult.rows.length > 0) {
            // Brand exists, return its ID
            return checkResult.rows[0].id;
        } else {
            // Brand doesn't exist, insert it
            const insertQuery = 'INSERT INTO brands (name) VALUES ($1) RETURNING id';
            const insertResult = await client.query(insertQuery, [brandName]);
            return insertResult.rows[0].id;
        }
    } finally {
        client.release();
    }
}

// Function to insert or update a product
async function upsertProduct(product, brandId) {
    const client = await pool.connect();
    try {
        // Extract product data
        const {
            id,
            title,
            image,
            url,
            mrp,
            price,
            qtyInfo,
            smartQty,
            variant,
            category,
            offer,
            pricePerUnit
        } = product;

        // Check if product exists
        const checkQuery = 'SELECT id FROM products WHERE id = $1';
        const checkResult = await client.query(checkQuery, [id]);

        if (checkResult.rows.length > 0) {
            // Product exists, update it
            const updateQuery = `
        UPDATE products SET 
          title = $1,
          image_url = $2,
          product_url = $3,
          mrp = $4,
          price = $5,
          qty_info = $6,
          smart_qty = $7,
          variant = $8,
          category = $9,
          offer = $10,
          brand_id = $11,
          pivot_qualifier = $12,
          pivot_value = $13,
          price_per_unit = $14,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $15
      `;

            await client.query(updateQuery, [
                title,
                image,
                url,
                mrp,
                price,
                qtyInfo,
                smartQty,
                variant,
                category,
                offer,
                brandId,
                pricePerUnit?.pivotQualifier || null,
                pricePerUnit?.pivotValue || null,
                pricePerUnit?.pricePerUnit || null,
                id
            ]);

            console.log(`Updated product: ${id}`);
        } else {
            // Product doesn't exist, insert it
            const insertQuery = `
        INSERT INTO products (
          id, title, image_url, product_url, mrp, price, 
          qty_info, smart_qty, variant, category, offer, brand_id,
          pivot_qualifier, pivot_value, price_per_unit
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        )
      `;

            await client.query(insertQuery, [
                id,
                title,
                image,
                url,
                mrp,
                price,
                qtyInfo,
                smartQty,
                variant,
                category,
                offer,
                brandId,
                pricePerUnit?.pivotQualifier || null,
                pricePerUnit?.pivotValue || null,
                pricePerUnit?.pricePerUnit || null
            ]);

            console.log(`Inserted product: ${id}`);
        }
    } finally {
        client.release();
    }
}

// Main function to process data and save to PostgreSQL
async function importData(data) {
    try {
        for (const item of data) {
            // Get brand name directly from the item
            const brandName = item.brand || 'Unknown';

            // Upsert brand and get brand ID
            const brandId = await upsertBrand(brandName);

            // Process each product in the array
            if (item.product && Array.isArray(item.product)) {
                for (const product of item.product) {
                    await upsertProduct(product, brandId);
                }
            }
        }

        console.log('Data import completed successfully');
    } catch (error) {
        console.error('Error processing data:', error);
    } finally {
        // Close the pool
        await pool.end();
    }
}

// Example usage:
// const data = require('./flipkart_data.json');
// importData(data);

module.exports = { importData };