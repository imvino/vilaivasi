import { getFlipkartBrands, getAmazonBrands, getBrandsInGroups } from '@/lib/db';
import fuzzyUtils from '@/lib/fuzzy';

export async function POST(req) {
  try {
    const { source, threshold = 80 } = await req.json();
    let brands1 = [];
    let brands2 = [];
    let brandsInGroups = [];
    
    // Get brands already in groups to filter them out
    brandsInGroups = await getBrandsInGroups();
    
    if (source === 'flipkart-amazon') {
      // Get all brands
      const flipkartBrands = await getFlipkartBrands();
      const amazonBrands = await getAmazonBrands();
      
      // Filter out brands that are already in groups
      brands1 = flipkartBrands.filter(brand => 
        !brandsInGroups.some(groupBrand => 
          groupBrand.brand_name.toLowerCase() === brand.name.toLowerCase() && 
          groupBrand.source === 'flipkart'
        )
      );
      
      brands2 = amazonBrands.filter(brand => 
        !brandsInGroups.some(groupBrand => 
          groupBrand.brand_name.toLowerCase() === brand.name.toLowerCase() && 
          groupBrand.source === 'amazon'
        )
      );
    } else {
      return Response.json({ error: 'Invalid source' }, { status: 400 });
    }
    
    // Make sure we have brands to compare
    if (!brands1.length || !brands2.length) {
      console.log('No brands found for matching after filtering grouped brands:', { 
        flipkartCount: brands1.length, 
        amazonCount: brands2.length 
      });
      return Response.json({ 
        matches: [],
        message: 'No brands available for matching',
        counts: { flipkart: brands1.length, amazon: brands2.length }
      });
    }
    
    // Process brand names to improve matching
    const processedBrands1 = brands1.map(brand => ({
      ...brand,
      processedName: fuzzyUtils.normalizeBrandName(brand.name)
    }));
    
    const processedBrands2 = brands2.map(brand => ({
      ...brand,
      processedName: fuzzyUtils.normalizeBrandName(brand.name)
    }));
    
    // Find matches using processed names but return original data
    const matches = [];
    for (const brand1 of processedBrands1) {
      for (const brand2 of processedBrands2) {
        const score = fuzzyUtils.getScore(brand1.processedName, brand2.processedName);
        if (score >= threshold) {
          matches.push({
            brand1: {
              id: brand1.id,
              name: brand1.name,
              product_count: brand1.product_count
            },
            brand2: {
              id: brand2.id,
              name: brand2.name,
              product_count: brand2.product_count
            },
            score
          });
        }
      }
    }
    
    // Sort matches by score (highest first)
    matches.sort((a, b) => b.score - a.score);
    
    // Limit to top 100 matches to avoid overwhelming the UI
    const topMatches = matches.slice(0, 100);
    
    return Response.json({ 
      matches: topMatches,
      totalMatches: matches.length,
      displayedMatches: topMatches.length
    });
  } catch (error) {
    console.error('Error in brand matching:', error);
    return Response.json({ error: error.message, matches: [] }, { status: 500 });
  }
}
