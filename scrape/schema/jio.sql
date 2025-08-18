-- Create brand_jio table
CREATE TABLE IF NOT EXISTS brand_jio (
id SERIAL PRIMARY KEY,
brand_id VARCHAR(255) UNIQUE NOT NULL,
name VARCHAR(255) NOT NULL,
product_count INTEGER DEFAULT 0,
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create products_jio table
CREATE TABLE IF NOT EXISTS products_jio (
id SERIAL PRIMARY KEY,
product_id VARCHAR(255) UNIQUE NOT NULL,
title TEXT NOT NULL,
image_url TEXT,
product_url TEXT,
mrp DECIMAL(10, 2),
price DECIMAL(10, 2),
qty_info TEXT,
variants JSONB,
categories JSONB,
brand_name VARCHAR(255),
ext_attributes JSONB,
brand_id VARCHAR(255),
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
-- FOREIGN KEY (brand_id) REFERENCES brand_jio(brand_id)
);