i was thinking to use brand to compare. but you see some brand avail only in flipkart and some brand avail only in amazon. there are few common brand and in which spelling might be different like LAKMÉ and LAKME, VIM and vim, Horlicks Women and Horlicks
how to find common and different brand from table, using postgress or use a match score using fuz and mannally verify using a nextjs interface ?

// current brand table struct.
CREATE TABLE public.brand_flipkart ( id serial4 NOT NULL, "name" varchar(255) NOT NULL, product_count int4 DEFAULT 0 NULL, created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL, CONSTRAINT brands_name_key UNIQUE (name), CONSTRAINT brands_pkey PRIMARY KEY (id) );
CREATE TABLE public.brand_amazon ( id serial4 NOT NULL, brand_id varchar(255) NULL, "name" varchar(255) NOT NULL, product_count int4 DEFAULT 0 NULL, created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL, status varchar(10) NULL, CONSTRAINT brand_amazon_name_key UNIQUE (name), CONSTRAINT brand_amazon_pkey PRIMARY KEY (id) );

give me complete nextjs and api code for matching brand, using fuzzy match score help i can mannually verify and match the brand and insert in a new table. example in flipkart 3 roses, broke bond contain 2 brand but in amazon it is broke bond 3roses as 1 brand. so i need a option to group all this as 1brand, 
like i can select all three and click match it shld give me a pop up with predefined name and option to change the brand name and the save the group in a table with relavant id for reference

use latest shadcn ui components to buid the dashboard

System Architecture Summary
Database Structure:
Create a unified system with these tables:
sources - List of e-commerce platforms (Amazon, Flipkart, etc.)
products - Unified product table with source_id reference
product_groups - Groups of equivalent products across platforms
product_group_members - Maps products to their groups
brand_mappings - Maps variant brand names to canonical names
Key SQL Schemas:
CREATE TABLE sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE
);
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
CREATE TABLE product_groups (
    group_id SERIAL PRIMARY KEY,
    canonical_name VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE product_group_members (
    id SERIAL PRIMARY KEY,
    group_id INT NOT NULL REFERENCES product_groups(group_id),
    product_id INT NOT NULL REFERENCES products(id),
    match_confidence NUMERIC(5,4) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_product_group_membership UNIQUE(group_id, product_id)
);
CREATE TABLE brand_mappings (
    id SERIAL PRIMARY KEY,
    canonical_brand_name VARCHAR(255) NOT NULL,
    variant_brand_name VARCHAR(255) NOT NULL,
    source_id INT NOT NULL REFERENCES sources(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_brand_per_source UNIQUE(variant_brand_name, source_id)
);