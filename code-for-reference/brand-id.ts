// app/api/brand-groups/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';

// Get a specific brand group
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid brand group ID' },
        { status: 400 }
      );
    }
    
    const result = await query(
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
       WHERE bg.id = $1
       GROUP BY bg.id`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Brand group not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching brand group:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brand group' },
      { status: 500 }
    );
  }
}

// Update a brand group
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid brand group ID' },
        { status: 400 }
      );
    }
    
    const { canonical_name } = await request.json();
    
    if (!canonical_name) {
      return NextResponse.json(
        { error: 'Canonical name is required' },
        { status: 400 }
      );
    }
    
    const result = await query(
      `UPDATE brand_groups
       SET canonical_name = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, canonical_name, created_at, updated_at`,
      [canonical_name, id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Brand group not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating brand group:', error);
    return NextResponse.json(
      { error: 'Failed to update brand group' },
      { status: 500 }
    );
  }
}

// Delete a brand group
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid brand group ID' },
        { status: 400 }
      );
    }
    
    // Use a transaction to ensure we delete all related mappings
    await withTransaction(async (client) => {
      // First delete all mappings
      await client.query(
        'DELETE FROM brand_mappings WHERE brand_group_id = $1',
        [id]
      );
      
      // Then delete the group
      const result = await client.query(
        'DELETE FROM brand_groups WHERE id = $1 RETURNING id',
        [id]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Brand group not found');
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Brand group deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting brand group:', error);
    
    if ((error as Error).message === 'Brand group not found') {
      return NextResponse.json(
        { error: 'Brand group not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete brand group' },
      { status: 500 }
    );
  }
}