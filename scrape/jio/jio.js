const { Pool } = require('pg');

// PostgreSQL connection configuration
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'flipkart',
    password: 'postgres',
    port: 5432,
});

// Function to upsert brand data - without incrementing product count
async function upsertBrand(brand) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check if brand exists first
        const checkQuery = `
            SELECT id, brand_id, product_count 
            FROM brand_jio 
            WHERE brand_id = $1
        `;
        const checkResult = await client.query(checkQuery, [brand.brand_id]);
        const brandExists = checkResult.rows.length > 0;

        // Upsert into brand_jio table without modifying product_count
        let brandQuery;
        let params;

        if (brandExists) {
            // Update existing brand without changing product_count
            brandQuery = `
                UPDATE brand_jio
                SET name = $2
                WHERE brand_id = $1
                RETURNING id, brand_id
            `;
            params = [brand.brand_id, brand.name];
        } else {
            // Insert new brand with product_count = 0
            brandQuery = `
                INSERT INTO brand_jio (brand_id, name, product_count)
                VALUES ($1, $2, 0)
                RETURNING id, brand_id
            `;
            params = [brand.brand_id, brand.name];
        }

        const brandResult = await client.query(brandQuery, params);

        await client.query('COMMIT');
        return brandResult.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error upserting brand:', error);
        throw error;
    } finally {
        client.release();
    }
}

// This function is no longer needed as we're directly checking in the upsertProduct function

// Function to upsert product data
async function upsertProduct(product) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // First ensure the brand exists (without incrementing product_count)
        if (product.brand_id && product.brand_name) {
            await upsertBrand({
                brand_id: product.brand_id,
                name: product.brand_name
            });
        }

        // Check if the product already exists to determine if this is an insert or update
        const checkQuery = 'SELECT id FROM products_jio WHERE product_id = $1';
        const checkResult = await client.query(checkQuery, [product.product_id]);
        const productExists = checkResult.rows.length > 0;

        let productResult;
        const now = new Date();

        if (productExists) {
            // Update existing product - don't touch the id
            const updateQuery = `
                UPDATE products_jio SET
                    title = $2,
                    image_url = $3,
                    product_url = $4,
                    mrp = $5,
                    price = $6,
                    qty_info = $7,
                    variants = $8,
                    categories = $9,
                    brand_name = $10,
                    ext_attributes = $11,
                    brand_id = $12,
                    updated_at = $13
                WHERE product_id = $1
                RETURNING *
            `;

            productResult = await client.query(updateQuery, [
                product.product_id,
                product.title,
                product.image_url,
                product.product_url,
                product.mrp,
                product.price,
                product.qty_info,
                JSON.stringify(product.variants || {}),
                JSON.stringify(product.categories || {}),
                product.brand_name,
                JSON.stringify(product.ext_attributes || {}),
                product.brand_id,
                now
            ]);
        } else {
            // Find the maximum ID and ensure sequential insertion
            const maxIdQuery = 'SELECT COALESCE(MAX(id), 0) as max_id FROM products_jio';
            const maxIdResult = await client.query(maxIdQuery);
            const nextId = maxIdResult.rows[0].max_id + 1;

            // Insert new product with explicit ID
            const insertQuery = `
                INSERT INTO products_jio (
                    id, product_id, title, image_url, product_url, mrp, price, 
                    qty_info, variants, categories, brand_name, 
                    ext_attributes, brand_id, created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                RETURNING *
            `;

            productResult = await client.query(insertQuery, [
                nextId,
                product.product_id,
                product.title,
                product.image_url,
                product.product_url,
                product.mrp,
                product.price,
                product.qty_info,
                JSON.stringify(product.variants || {}),
                JSON.stringify(product.categories || {}),
                product.brand_name,
                JSON.stringify(product.ext_attributes || {}),
                product.brand_id,
                now,
                now
            ]);
        }

        await client.query('COMMIT');
        return productResult.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error upserting product:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Function to update brand product counts
async function updateAllBrandProductCounts() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Get counts of products per brand
        const countQuery = `
            SELECT brand_id, COUNT(*) as product_count
            FROM products_jio
            WHERE brand_id IS NOT NULL
            GROUP BY brand_id
        `;

        const countResult = await client.query(countQuery);

        // Update each brand's product count
        for (const row of countResult.rows) {
            const updateQuery = `
                UPDATE brand_jio
                SET product_count = $1
                WHERE brand_id = $2
            `;

            await client.query(updateQuery, [row.product_count, row.brand_id]);
            console.log(`Updated brand ${row.brand_id} with product count: ${row.product_count}`);
        }

        await client.query('COMMIT');
        console.log('Brand product counts updated successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating brand product counts:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Main function to fetch data and insert into database
async function main() {
    try {
        // Fetch products from API
        const res = await fetch("https://3yp0hp3wsh-dsn.algolia.net/1/indexes/*/queries?x-algolia-agent=Algolia%20for%20JavaScript%20(4.5.1)%3B%20Browser%3B%20instantsearch.js%20(4.59.0)%3B%20JS%20Helper%20(3.15.0)", {
            "headers": {
                "accept": "*/*",
                "accept-language": "en-US,en;q=0.7",
                "content-type": "application/x-www-form-urlencoded",
                "sec-ch-ua": "\"Brave\";v=\"135\", \"Not-A.Brand\";v=\"8\", \"Chromium\";v=\"135\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"macOS\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "cross-site",
                "sec-gpc": "1",
                "x-algolia-api-key": "aace3f18430a49e185d2c1111602e4b1",
                "x-algolia-application-id": "3YP0HP3WSH",
                "Referer": "https://www.jiomart.com/",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            "body": "{\"requests\":[{\"indexName\":\"prod_mart_master_vertical_products_popularity\",\"params\":\"analyticsTags=%5B%22Category%20PLP%22%5D&attributesToHighlight=%5B%5D&attributesToRetrieve=%5B%22*%22%2C%22-algolia_facet%22%2C%22-alt_class_keywords%22%2C%22-available_stores%22%2C%22-avg_discount%22%2C%22-avg_discount_pct%22%2C%22-avg_discount_rate%22%2C%22-avg_mrp%22%2C%22-avg_selling_price%22%2C%22-search_keywords%22%5D&clickAnalytics=true&distinct=false&enableRules=true&facets=%5B%22algolia_facet.*%22%2C%22avg_discount_pct%22%2C%22avg_selling_price%22%2C%22brand%22%2C%22category_level.level4%22%5D&filters=category_ids%3A28989%20AND%20(mart_availability%3AJIO%20OR%20mart_availability%3AJIO_WA)%20AND%20(available_stores%3AT1IP%20OR%20available_stores%3APANINDIAGROCERIES)%20AND%20((inventory_stores%3AALL%20OR%20inventory_stores%3ATKW4%20OR%20inventory_stores_3p%3AALL%20OR%20inventory_stores_3p%3Agroceries_zone_non-essential_services%20OR%20inventory_stores_3p%3Ageneral_zone%20OR%20inventory_stores_3p%3Agroceries_zone_essential_services))&highlightPostTag=__%2Fais-highlight__&highlightPreTag=__ais-highlight__&hitsPerPage=500&maxValuesPerFacet=50&page=1&query=&ruleContexts=%5B%22PLP%22%5D&tagFilters=\"}]}",
            "method": "POST"
        });

        const resp = await res.json();

        // Process each product
        console.log(`Processing ${resp.results[0].hits.length} products...`);

        for (const jsonItem of resp.results[0].hits) {
            const product = {
                product_id: jsonItem.product_code,
                title: jsonItem.display_name,
                image_url: `https://www.jiomart.com/images/product/original/${jsonItem.image_path}?im=Resize=(420,420)`,
                product_url: jsonItem.url_path,
                mrp: jsonItem.mrp || null,
                price: jsonItem.selling_price || null,
                qty_info: jsonItem.size,
                variants: jsonItem.variants,
                categories: jsonItem.categories,
                brand_name: jsonItem.brand,
                ext_attributes: jsonItem.ext_attributes,
                brand_id: jsonItem.brand_id
            };

            // Insert product into database
            const result = await upsertProduct(product);
            console.log(`Upserted product ID: ${product.product_id}`);
        }

        // After all products are processed, update brand product counts
        await updateAllBrandProductCounts();

        console.log('Data import completed successfully!');
    } catch (error) {
        console.error('Error in main function:', error);
    } finally {
        // Close the pool
        await pool.end();
    }
}

// If this file is run directly
if (require.main === module) {
    main().catch(err => {
        console.error('Unhandled error in main:', err);
        process.exit(1);
    });
}