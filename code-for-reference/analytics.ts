// app/api/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { BrandAnalytics } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // Get total brands count
    const totalBrandsResult = await query(
      `SELECT COUNT(DISTINCT brand_name) as count
       FROM products
       WHERE brand_name IS NOT NULL`
    );
    const totalBrands = parseInt(totalBrandsResult.rows[0].count);
    
    // Get total brand groups count
    const totalGroupsResult = await query(
      'SELECT COUNT(*) as count FROM brand_groups'
    );
    const totalGroups = parseInt(totalGroupsResult.rows[0].count);
    
    // Get matched brands count
    const matchedBrandsResult = await query(
      `SELECT COUNT(DISTINCT original_brand_name) as count
       FROM brand_mappings`
    );
    const matchedBrands = parseInt(matchedBrandsResult.rows[0].count);
    
    // Calculate unmatched brands
    const unmatchedBrands = totalBrands - matchedBrands;
    
    // Get source distribution
    const sourceDistributionResult = await query(
      `SELECT 
         s.name as source_name,
         COUNT(DISTINCT p.brand_name) as count
       FROM products p
       JOIN sources s ON p.source_id = s.id
       WHERE p.brand_name IS NOT NULL
       GROUP BY s.name
       ORDER BY count DESC`
    );
    
    const analytics: BrandAnalytics = {
      totalBrands,
      totalGroups,
      matchedBrands,
      unmatchedBrands,
      sourceDistribution: sourceDistributionResult.rows
    };
    
    return NextResponse.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching brand analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brand analytics' },
      { status: 500 }
    );
  }
}