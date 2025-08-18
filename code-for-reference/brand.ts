// app/api/brands/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { Brand, PaginatedResult, QueryParams } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const sourceId = searchParams.get('source_id') ? parseInt(searchParams.get('source_id')!) : undefined;
    const grouped = searchParams.get('grouped') === 'true';
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Build the WHERE clause
    let whereClause = '';
    const queryParams: any[] = [];
    
    if (search) {
      whereClause += 'AND p.brand_name ILIKE $' + (queryParams.length + 1);
      queryParams.push(`%${search}%`);
    }
    
    if (sourceId !== undefined) {
      whereClause += ' AND p.source_id = $' + (queryParams.length + 1);
      queryParams.push(sourceId);
    }
    
    if (grouped) {
      whereClause += ' AND EXISTS (SELECT 1 FROM brand_mappings bm WHERE bm.original_brand_name = p.brand_name AND bm.source_id = p.source_id)';
    } else if (grouped === false) {
      whereClause += ' AND NOT EXISTS (SELECT 1 FROM brand_mappings bm WHERE bm.original_brand_name = p.brand_name AND bm.source_id = p.source_id)';
    }
    
    // Get total count for pagination
    const countResult = await query(
      `SELECT COUNT(*) as total
       FROM products p
       JOIN sources s ON p.source_id = s.id
       WHERE brand_name IS NOT NULL ${whereClause}`,
      queryParams
    );
    
    const total = parseInt(countResult.rows[0].total);
    
    // Query for brands
    const brandsResult = await query(
      `SELECT 
         p.id,
         p.external_id,
         p.brand_name as name,
         p.source_id,
         s.name as source_name,
         p.product_count,
         p.created_at
       FROM products p
       JOIN sources s ON p.source_id = s.id
       WHERE brand_name IS NOT NULL ${whereClause}
       ORDER BY p.brand_name
       LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
      [...queryParams, limit, offset]
    );
    
    // Format the response
    const response: PaginatedResult<Brand> = {
      data: brandsResult.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brands' },
      { status: 500 }
    );
  }
}

// Get information about a specific brand
export async function POST(request: NextRequest) {
  try {
    const { id, source_id } = await request.json();
    
    if (!id || !source_id) {
      return NextResponse.json(
        { error: 'Brand ID and source ID are required' },
        { status: 400 }
      );
    }
    
    const result = await query(
      `SELECT 
        p.id,
        p.external_id,
        p.brand_name as name,
        p.source_id,
        s.name as source_name,
        p.product_count,
        p.created_at,
        (
          SELECT json_build_object(
            'id', bg.id,
            'canonical_name', bg.canonical_name,
            'created_at', bg.created_at
          )
          FROM brand_mappings bm
          JOIN brand_groups bg ON bm.brand_group_id = bg.id
          WHERE bm.original_brand_name = p.brand_name
          AND bm.source_id = p.source_id
          LIMIT 1
        ) as brand_group
      FROM products p
      JOIN sources s ON p.source_id = s.id
      WHERE p.id = $1 AND p.source_id = $2`,
      [id, source_id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching brand details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brand details' },
      { status: 500 }
    );
  }
}