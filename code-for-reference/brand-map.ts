// app/api/brand-groups/[groupId]/mappings/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Delete a specific brand mapping
export async function DELETE(
  request: NextRequest,
  { params }: { params: { groupId: string, id: string } }
) {
  try {
    const groupId = parseInt(params.groupId);
    const mappingId = parseInt(params.id);
    
    if (isNaN(groupId) || isNaN(mappingId)) {
      return NextResponse.json(
        { error: 'Invalid group ID or mapping ID' },
        { status: 400 }
      );
    }
    
    // Delete the mapping
    const result = await query(
      `DELETE FROM brand_mappings
       WHERE id = $1 AND brand_group_id = $2
       RETURNING id`,
      [mappingId, groupId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Brand mapping not found' },
        { status: 404 }
      );
    }
    
    // Check if this was the last mapping for the group
    const remainingMappings = await query(
      'SELECT COUNT(*) as count FROM brand_mappings WHERE brand_group_id = $1',
      [groupId]
    );
    
    const mappingsLeft = parseInt(remainingMappings.rows[0].count);
    
    // If no mappings left, we could optionally delete the group too
    let groupDeleted = false;
    if (mappingsLeft === 0) {
      await query('DELETE FROM brand_groups WHERE id = $1', [groupId]);
      groupDeleted = true;
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: mappingId,
        groupDeleted
      }
    });
  } catch (error) {
    console.error('Error deleting brand mapping:', error);
    return NextResponse.json(
      { error: 'Failed to delete brand mapping' },
      { status: 500 }
    );
  }
}

// Update a specific brand mapping
export async function PUT(
  request: NextRequest,
  { params }: { params: { groupId: string, id: string } }
) {
  try {
    const groupId = parseInt(params.groupId);
    const mappingId = parseInt(params.id);
    
    if (isNaN(groupId) || isNaN(mappingId)) {
      return NextResponse.json(
        { error: 'Invalid group ID or mapping ID' },
        { status: 400 }
      );
    }
    
    const { match_confidence } = await request.json();
    
    if (match_confidence === undefined || match_confidence < 0 || match_confidence > 1) {
      return NextResponse.json(
        { error: 'Match confidence must be a number between 0 and 1' },
        { status: 400 }
      );
    }
    
    // Update the mapping
    const result = await query(
      `UPDATE brand_mappings
       SET match_confidence = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND brand_group_id = $3
       RETURNING id, brand_group_id, source_id, original_brand_name, 
                match_confidence, is_manual_match, created_at, updated_at`,
      [match_confidence, mappingId, groupId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Brand mapping not found' },
        { status: 404 }
      );
    }
    
    // Get the source name
    const sourceResult = await query(
      'SELECT name FROM sources WHERE id = $1',
      [result.rows[0].source_id]
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
    console.error('Error updating brand mapping:', error);
    return NextResponse.json(
      { error: 'Failed to update brand mapping' },
      { status: 500 }
    );
  }
}