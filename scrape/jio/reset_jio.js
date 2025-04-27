const { Pool } = require('pg');
require('dotenv').config();

/**
 * Utility to reset sequence IDs to ensure sequential numbering without gaps
 */
async function resetSequences() {
    // Get database configuration
    const config = {
        user: 'postgres',
        host: 'localhost',
        database: 'flipkart',
        password: 'postgres',
        port: 5432,
    };

    const pool = new Pool(config);
    const client = await pool.connect();

    try {
        console.log('Resetting ID sequences...');

        // Begin transaction
        await client.query('BEGIN');

        // Get a list of all tables
        const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('brand_jio', 'products_jio')
    `;

        const tablesResult = await client.query(tablesQuery);

        // Process each table
        for (const table of tablesResult.rows) {
            const tableName = table.table_name;
            console.log(`Processing table: ${tableName}`);

            // Get the current maximum ID
            const maxIdQuery = `SELECT COALESCE(MAX(id), 0) as max_id FROM ${tableName}`;
            const maxIdResult = await client.query(maxIdQuery);
            const maxId = maxIdResult.rows[0].max_id;

            // Reset the sequence for the table's ID column - works for both SERIAL and IDENTITY columns
            const resetQuery = `
        SELECT setval(pg_get_serial_sequence('${tableName}', 'id'), ${maxId}, true)
      `;

            await client.query(resetQuery);
            console.log(`Reset sequence for ${tableName} to start at ${maxId + 1}`);
        }

        // Commit transaction
        await client.query('COMMIT');
        console.log('All sequences reset successfully!');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error resetting sequences:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run if called directly
if (require.main === module) {
    resetSequences().catch(console.error);
}

module.exports = { resetSequences };