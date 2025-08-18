// app/api/match/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { calculateSimilarity, normalizeBrandName, suggestCanonicalName } from '@/lib/utils';
import type { Brand, BrandMatchResult } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { brandIds, threshold = 0.8 } = await request.json();
    
    if (!brandIds || !Array.isArray(brandIds) || brandIds.length < 2) {
      return NextResponse.json(
        { error: 'At least two brand IDs are required' },
        { status: 400 }
      );
    }
    
    // Fetch brand details
    const brandsResult = await query(
      `SELECT 
         p.id,
         p.brand_name as name,
         p.source_id,
         s.name as source_name,
         p.product_count,
         p.created_at
       FROM products p
       JOIN sources s ON p.source_id = s.id
       WHERE p.id = ANY($1)`,
      [brandIds]
    );
    
    if (brandsResult.rows.length < 2) {
      return NextResponse.json(
        { error: 'Could not find enough brands with the provided IDs' },
        { status: 404 }
      );
    }
    
    const brands: Brand[] = brandsResult.rows;
    
    // Calculate similarity scores between all pairs of brands
    const matchResults: BrandMatchResult[] = [];
    
    for (let i = 0; i < brands.length; i++) {
      for (let j = i + 1; j < brands.length; j++) {
        const brand1 = brands[i];
        const brand2 = brands[j];
        
        const normalizedName1 = normalizeBrandName(brand1.name);
        const normalizedName2 = normalizeBrandName(brand2.name);
        
        const similarity = calculateSimilarity(normalizedName1, normalizedName2);
        
        matchResults.push({
          brand1,
          brand2,
          similarity
        });
      }
    }
    
    // Sort by similarity score (highest first)
    matchResults.sort((a, b) => b.similarity - a.similarity);
    
    // Generate a suggested canonical name
    const suggestedName = suggestCanonicalName(brands.map(b => b.name));
    
    return NextResponse.json({
      success: true,
      data: {
        matches: matchResults,
        suggestedCanonicalName: suggestedName,
        brands
      }
    });
  } catch (error) {
    console.error('Error matching brands:', error);
    return NextResponse.json(
      { error: 'Failed to match brands' },
      { status: 500 }
    );
  }
}

// Helper function to find similar brand names in the database
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const brandName = searchParams.get('brandName');
    const sourceId = searchParams.get('sourceId') ? parseInt(searchParams.get('sourceId')!) : undefined;
    const threshold = parseFloat(searchParams.get('threshold') || '0.7');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    if (!brandName) {
      return NextResponse.json(
        { error: 'Brand name is required' },
        { status: 400 }
      );
    }
    
    // Get all brands
    let brandsQuery = `
      SELECT 
        p.id,
        p.brand_name as name,
        p.source_id,
        s.name as source_name,
        p.product_count,
        p.created_at
      FROM products p
      JOIN sources s ON p.source_id = s.id
      WHERE p.brand_name IS NOT NULL
    `;
    
    const queryParams: any[] = [];
    
    // Filter by source if provided
    if (sourceId !== undefined) {
      brandsQuery += ' AND p.source_id != $1';
      queryParams.push(sourceId);
    }
    
    // Limit the initial dataset
    brandsQuery += ' ORDER BY p.product_count DESC LIMIT 1000';
    
    const brandsResult = await query(brandsQuery, queryParams);
    const brands: Brand[] = brandsResult.rows;
    
    // Calculate similarity scores in memory
    const matches = brands
      .map(brand => {
        const similarity = calculateSimilarity(
          normalizeBrandName(brandName),
          normalizeBrandName(brand.name)
        );
        return { brand, similarity };
      })
      .filter(match => match.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
    
    return NextResponse.json({
      success: true,
      data: matches
    });
  } catch (error) {
    console.error('Error finding similar brands:', error);
    return NextResponse.json(
      { error: 'Failed to find similar brands' },
      { status: 500 }
    );
  }
}