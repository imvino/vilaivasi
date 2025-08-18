/**
 * Reset all product IDs to sequential values starting from 1
 * A simpler approach without temporary tables
 * @param {Object} pool - PostgreSQL connection pool
 * @returns {Promise<Object>} - Results of the operation
 */
async function resetProductIds(pool) {
    // Create a client from the pool
    const client = await pool.connect();
    
    try {
      // Start a transaction
      await client.query('BEGIN');
      
      console.log('Starting product ID reset operation...');
      
      // 1. Check if there are any foreign key constraints referencing products.id
      const fkResult = await client.query(`
        SELECT tc.table_name, kcu.column_name, tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE constraint_type = 'FOREIGN KEY'
          AND ccu.table_name = 'products'
          AND ccu.column_name = 'id'
      `);
      
      // 2. Temporarily disable foreign key constraints if they exist
      for (const fk of fkResult.rows) {
        console.log(`Temporarily disabling constraint: ${fk.constraint_name}`);
        await client.query(`ALTER TABLE ${fk.table_name} DROP CONSTRAINT ${fk.constraint_name}`);
      }
      
      // 3. Get the current max ID to use as a temporary offset
      const maxIdResult = await client.query('SELECT MAX(id) FROM products');
      const maxId = parseInt(maxIdResult.rows[0].max) || 0;
      const tempOffset = maxId + 1000000; // Use a large offset to avoid conflicts
      
      console.log(`Current max ID: ${maxId}, using temporary offset: ${tempOffset}`);
      
      // 4. First update all IDs to temporary high values to avoid conflicts
      await client.query(`
        UPDATE products
        SET id = id + ${tempOffset}
      `);
      
      // 5. Now update to the final sequential IDs
      await client.query(`
        UPDATE products
        SET id = subquery.new_id
        FROM (
          SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS new_id
          FROM products
        ) AS subquery
        WHERE products.id = subquery.id
      `);
      
      console.log('Product IDs reset successfully');
      
      // 6. Reset the sequence
      await client.query(`
        SELECT setval('products_id_seq', (SELECT MAX(id) FROM products), true)
      `);
      
      // 7. Re-create foreign key constraints if they existed
      for (const fk of fkResult.rows) {
        console.log(`Restoring foreign key constraint on ${fk.table_name}.${fk.column_name}`);
        
        // This is a simplified version - you might need to adjust the exact constraint creation
        // to match your original constraints
        await client.query(`
          ALTER TABLE ${fk.table_name}
          ADD CONSTRAINT ${fk.constraint_name}
          FOREIGN KEY (${fk.column_name})
          REFERENCES products(id)
        `);
      }
      
      // Commit the transaction
      await client.query('COMMIT');
      
      return { 
        success: true, 
        message: 'Product IDs have been reset to sequential values starting from 1',
        newMaxId: await client.query('SELECT MAX(id) FROM products').then(res => res.rows[0].max)
      };
      
    } catch (err) {
      // If anything fails, roll back the transaction
      await client.query('ROLLBACK');
      console.error('Error resetting product IDs:', err);
      
      return { 
        success: false, 
        message: 'Failed to reset product IDs', 
        error: err.message 
      };
      
    } finally {
      // Release the client back to the pool
      client.release();
    }
  }
  
  // Example usage:
 
  const { Pool } = require('pg');
  
  const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'flipkart',
    password: 'postgres',
    port: 5432,
  });
  
  // Execute the function
  resetProductIds(pool)
    .then(result => {
      console.log(result);
      pool.end(); // Close the pool when done
    })
    .catch(err => {
      console.error('Error in main execution:', err);
      pool.end(); // Make sure to close the pool on error
    });
  