// app/api/brand-groups/[id]/mappings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Add a new brand mapping to a group
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = parseInt(params.id);
    
    if (isNaN(groupId)) {
      return NextResponse.json(
        { error: 'Invalid brand group ID' },
        { status: 400 }
      );
    }
    
    // Check if the brand group exists
    const groupResult = await query(
      'SELECT id FROM brand_groups WHERE id = $1',
      [groupId]
    );
    
    if (groupResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Brand group not found' },
        { status: 404 }
      );
    }
    
    const { source_id, original_brand_name, match_confidence = 1.0 } = await request.json();
    
    if (!source_id || !original_brand_name) {
      return NextResponse.json(
        { error: 'Source ID and original brand name are required' },
        { status: 400 }
      );
    }
    
    // Check if this brand mapping already exists
    const existingMapping = await query(
      `SELECT id FROM brand_mappings 
       WHERE original_brand_name = $1 AND source_id = $2`,
      [original_brand_name, source_id]
    );
    
    if (existingMapping.rows.length > 0) {
      return NextResponse.json(
        { error: 'This brand is already mapped to a group' },
        { status: 409 }
      );
    }
    
    // Create the mapping
    const result = await query(
      `INSERT INTO brand_mappings 
       (brand_group_id, source_id, original_brand_name, match_confidence, is_manual_match)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, brand_group_id, source_id, original_brand_name, 
                match_confidence, is_manual_match, created_at, updated_at`,
      [groupId, source_id, original_brand_name, match_confidence]
    );
    
    // Get the source name
    const sourceResult = await query(
      'SELECT name FROM sources WHERE id = $1',
      [source_id]
    );
    
    const mapping = {
      ...result.rows[0],
      source_name: sourceResult.rows[0]?.name
    };
    
    return NextResponse.json({
      success: true,
      data: mapping
    });
  } catch (error) {
    console.error('Error adding brand mapping:', error);
    return NextResponse.json(
      { error: 'Failed to add brand mapping' },
      { status: 500 }
    );
  }
}