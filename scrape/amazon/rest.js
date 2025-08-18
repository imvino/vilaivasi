const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'flipkart',
    password: 'postgres',
    port: 5432,
});

async function completeReset() {
    const client = await pool.connect();

    try {
        // Start a transaction
        await client.query('BEGIN');

        // Create a temporary table with the same structure but without constraints
        await client.query(`
      CREATE TEMP TABLE temp_brand_amazon AS
      SELECT brand_id, name, product_count, created_at, status
      FROM brand_amazon
      ORDER BY id;
    `);

        // Count how many records we're preserving
        const countResult = await client.query('SELECT COUNT(*) FROM temp_brand_amazon');
        const recordCount = parseInt(countResult.rows[0].count);

        // Truncate the original table (removes all data)
        await client.query('TRUNCATE brand_amazon RESTART IDENTITY');

        // Insert data back with auto-generated IDs starting from 1
        await client.query(`
      INSERT INTO brand_amazon(brand_id, name, product_count, created_at, status)
      SELECT brand_id, name, product_count, created_at, status FROM temp_brand_amazon;
    `);

        // Drop the temporary table
        await client.query('DROP TABLE temp_brand_amazon');

        // Commit the transaction
        await client.query('COMMIT');

        console.log(`Successfully reset and renumbered ${recordCount} records. IDs now start from 1.`);
    } catch (error) {
        // Rollback in case of error
        await client.query('ROLLBACK');
        console.error('Error during reset and renumbering:', error);
    } finally {
        client.release();
        pool.end();
    }
}

completeReset();