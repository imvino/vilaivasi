// app/api/brand-groups/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import type { BrandGroupCreationData, BrandGroup, PaginatedResult } from '@/types';

// Get all brand groups
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Build the WHERE clause
    let whereClause = '';
    const queryParams: any[] = [];
    
    if (search) {
      whereClause = 'WHERE bg.canonical_name ILIKE $1';
      queryParams.push(`%${search}%`);
    }
    
    // Get total count for pagination
    const countResult = await query(
      `SELECT COUNT(*) as total
       FROM brand_groups bg
       ${whereClause}`,
      search ? queryParams : []
    );
    
    const total = parseInt(countResult.rows[0].total);
    
    // Query for brand groups with their mappings
    const groupsResult = await query(
      `SELECT 
         bg.id,
         bg.canonical_name,
         bg.created_at,
         bg.updated_at,
         COALESCE(
           json_agg(
             json_build_object(
               'id', bm.id,
               'brand_group_id', bm.brand_group_id,
               'source_id', bm.source_id,
               'source_name', s.name,
               'original_brand_name', bm.original_brand_name,
               'match_confidence', bm.match_confidence,
               'is_manual_match', bm.is_manual_match,
               'created_at', bm.created_at,
               'updated_at', bm.updated_at
             )
           ) FILTER (WHERE bm.id IS NOT NULL),
           '[]'
         ) as mappings
       FROM brand_groups bg
       LEFT JOIN brand_mappings bm ON bg.id = bm.brand_group_id
       LEFT JOIN sources s ON bm.source_id = s.id
       ${whereClause}
       GROUP BY bg.id
       ORDER BY bg.canonical_name
       LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
      [...queryParams, limit, offset]
    );
    
    // Format the response
    const response: PaginatedResult<BrandGroup> = {
      data: groupsResult.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching brand groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brand groups' },
      { status: 500 }
    );
  }
}

// Create a new brand group
export async function POST(request: NextRequest) {
  try {
    const data: BrandGroupCreationData = await request.json();
    
    if (!data.canonical_name || !data.brand_names || data.brand_names.length === 0) {
      return NextResponse.json(
        { error: 'Canonical name and at least one brand name are required' },
        { status: 400 }
      );
    }
    
    const result = await withTransaction(async (client) => {
      // Create brand group
      const groupResult = await client.query(
        `INSERT INTO brand_groups (canonical_name)
         VALUES ($1)
         RETURNING id, canonical_name, created_at, updated_at`,
        [data.canonical_name]
      );
      
      const brandGroup = groupResult.rows[0];
      const mappings = [];
      
      // Create brand mappings
      for (let i = 0; i < data.brand_names.length; i++) {
        const brandName = data.brand_names[i];
        const sourceId = data.source_ids[i];
        
        const mappingResult = await client.query(
          `INSERT INTO brand_mappings 
           (brand_group_id, source_id, original_brand_name, match_confidence, is_manual_match)
           VALUES ($1, $2, $3, $4, true)
           RETURNING id, brand_group_id, source_id, original_brand_name, match_confidence, 
                    is_manual_match, created_at, updated_at`,
          [brandGroup.id, sourceId, brandName, 1.0]
        );
        
        mappings.push({
          ...mappingResult.rows[0],
          source_name: (await client.query('SELECT name FROM sources WHERE id = $1', [sourceId])).rows[0].name
        });
      }
      
      return {
        ...brandGroup,
        mappings
      };
    });
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error creating brand group:', error);
    return NextResponse.json(
      { error: 'Failed to create brand group' },
      { status: 500 }
    );
  }
}