const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'flipkart',
    password: 'postgres',
    port: 5432,
});

// Helper function to execute queries
async function query(text, params) {
    const client = await pool.connect();
    try {
        const result = await client.query(text, params);
        return result;
    } finally {
        client.release();
    }
}

// Initialize database with required tables if they don't exist
async function initializeDatabase() {
    // Create sources table
    await query(`
        CREATE TABLE IF NOT EXISTS sources (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            code VARCHAR(20) NOT NULL UNIQUE
        );
    `);

    // Insert default sources if they don't exist
    await query(`
        INSERT INTO sources (name, code)
        VALUES ('Amazon', 'amazon'), ('Flipkart', 'flipkart')
        ON CONFLICT (code) DO NOTHING;
    `);

    // Create brand_mappings table
    await query(`
        CREATE TABLE IF NOT EXISTS brand_mappings (
            id SERIAL PRIMARY KEY,
            canonical_brand_name VARCHAR(255) NOT NULL,
            variant_brand_name VARCHAR(255) NOT NULL,
            source_id INT NOT NULL REFERENCES sources(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT unique_brand_per_source UNIQUE(variant_brand_name, source_id)
        );
    `);

    // Create brand_groups table
    await query(`
        CREATE TABLE IF NOT EXISTS brand_groups (
            id SERIAL PRIMARY KEY,
            canonical_name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Create brand_group_members table
    await query(`
        CREATE TABLE IF NOT EXISTS brand_group_members (
            id SERIAL PRIMARY KEY,
            group_id INT NOT NULL REFERENCES brand_groups(id),
            brand_name VARCHAR(255) NOT NULL,
            source_id INT NOT NULL REFERENCES sources(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT unique_brand_group_membership UNIQUE(group_id, brand_name, source_id)
        );
    `);

    console.log('Database initialized successfully');
}

// Get all brands from Amazon
async function getAmazonBrands() {
    const result = await query(`
        SELECT id, name, brand_id, product_count 
        FROM brand_amazon where status is null or status = '0'
        ORDER BY name
    `);
    return result.rows;
}

// Get all brands from Flipkart
async function getFlipkartBrands() {
    const result = await query(`
        SELECT id, name, product_count 
        FROM brand_flipkart 
        ORDER BY name
    `);
    return result.rows;
}

// Get all brand mappings
async function getBrandMappings() {
    const result = await query(`
        SELECT bm.id, bm.canonical_brand_name, bm.variant_brand_name, s.code as source
        FROM brand_mappings bm
        JOIN sources s ON bm.source_id = s.id
        ORDER BY bm.canonical_brand_name
    `);
    return result.rows;
}

// Create a new brand mapping
async function createBrandMapping(canonicalName, variantName, sourceCode) {
    const sourceResult = await query('SELECT id FROM sources WHERE code = $1', [sourceCode]);
    if (sourceResult.rows.length === 0) {
        throw new Error(`Source with code ${sourceCode} not found`);
    }
    const sourceId = sourceResult.rows[0].id;

    const result = await query(`
        INSERT INTO brand_mappings (canonical_brand_name, variant_brand_name, source_id)
        VALUES ($1, $2, $3)
        RETURNING id
    `, [canonicalName, variantName, sourceId]);
    
    return result.rows[0].id;
}

// Create a new brand group
async function createBrandGroup(canonicalName, brandEntries) {
    // Start a transaction
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Ensure sources table exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS sources (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                code VARCHAR(20) NOT NULL UNIQUE
            )
        `);
        
        // Insert default sources if they don't exist
        await client.query(`
            INSERT INTO sources (name, code)
            VALUES ('Amazon', 'amazon'), ('Flipkart', 'flipkart')
            ON CONFLICT (code) DO NOTHING
        `);
        
        // Ensure brand_groups table exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS brand_groups (
                id SERIAL PRIMARY KEY,
                canonical_name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Ensure brand_group_members table exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS brand_group_members (
                id SERIAL PRIMARY KEY,
                group_id INT NOT NULL REFERENCES brand_groups(id),
                brand_name VARCHAR(255) NOT NULL,
                source_id INT NOT NULL REFERENCES sources(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT unique_brand_group_membership UNIQUE(group_id, brand_name, source_id)
            )
        `);
        
        // Create the brand group
        const groupResult = await client.query(`
            INSERT INTO brand_groups (canonical_name)
            VALUES ($1)
            RETURNING id
        `, [canonicalName]);
        
        const groupId = groupResult.rows[0].id;
        
        // Add members to the group
        for (const entry of brandEntries) {
            const sourceResult = await client.query('SELECT id FROM sources WHERE code = $1', [entry.source]);
            if (sourceResult.rows.length === 0) {
                throw new Error(`Source with code ${entry.source} not found`);
            }
            const sourceId = sourceResult.rows[0].id;
            
            await client.query(`
                INSERT INTO brand_group_members (group_id, brand_name, source_id)
                VALUES ($1, $2, $3)
            `, [groupId, entry.brandName, sourceId]);
        }
        
        await client.query('COMMIT');
        console.log(`Successfully created brand group "${canonicalName}" with ID ${groupId}`);
        return groupId;
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error creating brand group:', e);
        throw e;
    } finally {
        client.release();
    }
}

// Get all brand groups with their members
async function getBrandGroups() {
    try {
        // First check if the brand_groups table exists
        const tableCheck = await query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'brand_groups'
            )
        `);
        
        if (!tableCheck.rows[0].exists) {
            return []; // Return empty array if table doesn't exist yet
        }
        
        // Check if there are any groups
        const countCheck = await query(`
            SELECT COUNT(*) FROM brand_groups
        `);
        
        if (parseInt(countCheck.rows[0].count) === 0) {
            return []; // Return empty array if no groups exist
        }
        
        const result = await query(`
            SELECT 
                bg.id,
                bg.canonical_name,
                COALESCE(json_agg(
                    json_build_object(
                        'id', bgm.id,
                        'brand_name', bgm.brand_name,
                        'source', s.code
                    )
                ) FILTER (WHERE bgm.id IS NOT NULL), '[]'::json) as members
            FROM brand_groups bg
            LEFT JOIN brand_group_members bgm ON bg.id = bgm.group_id
            LEFT JOIN sources s ON bgm.source_id = s.id
            GROUP BY bg.id, bg.canonical_name
            ORDER BY bg.canonical_name
        `);
        return result.rows;
    } catch (error) {
        console.error('Error in getBrandGroups:', error);
        return []; // Return empty array on error
    }
}

// Get all brand mappings for a specific source
async function getBrandMappingsForSource(sourceCode) {
    const sourceResult = await query('SELECT id FROM sources WHERE code = $1', [sourceCode]);
    if (sourceResult.rows.length === 0) {
        throw new Error(`Source with code ${sourceCode} not found`);
    }
    const sourceId = sourceResult.rows[0].id;

    const result = await query(`
        SELECT bm.id, bm.canonical_brand_name, bm.variant_brand_name
        FROM brand_mappings bm
        WHERE bm.source_id = $1
        ORDER BY bm.canonical_brand_name
    `, [sourceId]);
    return result.rows;
}

// Get all brand groups for a specific source
async function getBrandGroupsForSource(sourceCode) {
    const sourceResult = await query('SELECT id FROM sources WHERE code = $1', [sourceCode]);
    if (sourceResult.rows.length === 0) {
        throw new Error(`Source with code ${sourceCode} not found`);
    }
    const sourceId = sourceResult.rows[0].id;

    const result = await query(`
        SELECT 
            bg.id,
            bg.canonical_name,
            json_agg(
                json_build_object(
                    'id', bgm.id,
                    'brand_name', bgm.brand_name
                )
            ) as members
        FROM brand_groups bg
        JOIN brand_group_members bgm ON bg.id = bgm.group_id
        WHERE bgm.source_id = $1
        GROUP BY bg.id, bg.canonical_name
        ORDER BY bg.canonical_name
    `, [sourceId]);
    return result.rows;
}

// Check if a brand mapping exists for a specific source and variant brand name
async function brandMappingExists(sourceCode, variantBrandName) {
    const sourceResult = await query('SELECT id FROM sources WHERE code = $1', [sourceCode]);
    if (sourceResult.rows.length === 0) {
        throw new Error(`Source with code ${sourceCode} not found`);
    }
    const sourceId = sourceResult.rows[0].id;

    const result = await query(`
        SELECT EXISTS (
            SELECT 1
            FROM brand_mappings bm
            WHERE bm.source_id = $1 AND bm.variant_brand_name = $2
        )
    `, [sourceId, variantBrandName]);
    return result.rows[0].exists;
}

// Check if a brand group exists for a specific source and canonical brand name
async function brandGroupExists(sourceCode, canonicalBrandName) {
    const sourceResult = await query('SELECT id FROM sources WHERE code = $1', [sourceCode]);
    if (sourceResult.rows.length === 0) {
        throw new Error(`Source with code ${sourceCode} not found`);
    }
    const sourceId = sourceResult.rows[0].id;

    const result = await query(`
        SELECT EXISTS (
            SELECT 1
            FROM brand_groups bg
            JOIN brand_group_members bgm ON bg.id = bgm.group_id
            WHERE bgm.source_id = $1 AND bg.canonical_name = $2
        )
    `, [sourceId, canonicalBrandName]);
    return result.rows[0].exists;
}

// Delete a brand group and its members
async function deleteBrandGroup(groupId) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // First delete all members of the group
        await client.query(`
            DELETE FROM brand_group_members
            WHERE group_id = $1
        `, [groupId]);
        
        // Then delete the group itself
        const result = await client.query(`
            DELETE FROM brand_groups
            WHERE id = $1
            RETURNING canonical_name
        `, [groupId]);
        
        if (result.rows.length === 0) {
            throw new Error(`Brand group with ID ${groupId} not found`);
        }
        
        await client.query('COMMIT');
        console.log(`Successfully deleted brand group "${result.rows[0].canonical_name}" with ID ${groupId}`);
        return { success: true, deletedName: result.rows[0].canonical_name };
    } catch (e) {
        await client.query('ROLLBACK');
        console.error(`Error deleting brand group ${groupId}:`, e);
        throw e;
    } finally {
        client.release();
    }
}

// Get all brands that are already in groups
async function getBrandsInGroups() {
    try {
        // Check if the brand_group_members table exists
        const tableCheck = await query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'brand_group_members'
            )
        `);
        
        if (!tableCheck.rows[0].exists) {
            return []; // Return empty array if table doesn't exist
        }
        
        const result = await query(`
            SELECT bgm.brand_name, s.code as source
            FROM brand_group_members bgm
            JOIN sources s ON bgm.source_id = s.id
        `);
        
        return result.rows;
    } catch (error) {
        console.error('Error getting brands in groups:', error);
        return [];
    }
}

module.exports = {
    query,
    initializeDatabase,
    getAmazonBrands,
    getFlipkartBrands,
    getBrandMappings,
    createBrandMapping,
    createBrandGroup,
    getBrandGroups,
    getBrandMappingsForSource,
    getBrandGroupsForSource,
    brandMappingExists,
    brandGroupExists,
    deleteBrandGroup,
    getBrandsInGroups
};
