-- Create sources table to store different e-commerce platforms
CREATE TABLE sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE
);

-- Insert initial sources
INSERT INTO sources (name, code) VALUES 
('Amazon', 'amazon'),
('Flipkart', 'flipkart');

-- Create a unified product table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    source_id INT NOT NULL REFERENCES sources(id),
    external_id VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    brand_name VARCHAR(255) NULL,
    mrp NUMERIC(10, 2) NULL,
    price NUMERIC(10, 2) NULL,
    image_url TEXT NULL,
    product_url TEXT NULL,
    qty_info TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_product_per_source UNIQUE(source_id, external_id)
);

-- Import data from existing tables
INSERT INTO products (source_id, external_id, brand_name, product_count, created_at)
SELECT 1, id::varchar, name, product_count, created_at
FROM public.brand_amazon;

INSERT INTO products (source_id, external_id, brand_name, product_count, created_at)
SELECT 2, id::varchar, name, product_count, created_at
FROM public.brand_flipkart;

-- Create brand groups table
CREATE TABLE brand_groups (
    id SERIAL PRIMARY KEY,
    canonical_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create brand mappings table to link variant brand names to canonical names
CREATE TABLE brand_mappings (
    id SERIAL PRIMARY KEY,
    brand_group_id INT NOT NULL REFERENCES brand_groups(id),
    source_id INT NOT NULL REFERENCES sources(id),
    original_brand_name VARCHAR(255) NOT NULL,
    match_confidence NUMERIC(5,2) DEFAULT 0,
    is_manual_match BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_brand_mapping UNIQUE(original_brand_name, source_id)
);

-- Create an index for faster lookups
CREATE INDEX idx_brand_mappings_brand_group ON brand_mappings(brand_group_id);
CREATE INDEX idx_brand_mappings_source ON brand_mappings(source_id);
CREATE INDEX idx_brand_mappings_name ON brand_mappings(original_brand_name);