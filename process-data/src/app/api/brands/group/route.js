import { createBrandGroup } from '@/lib/db';

export async function POST(req) {
  try {
    const { canonicalName, brandEntries } = await req.json();
    
    // Validate input
    if (!canonicalName || !canonicalName.trim()) {
      return Response.json({ error: 'Canonical name is required' }, { status: 400 });
    }
    
    if (!brandEntries || !Array.isArray(brandEntries) || brandEntries.length < 2) {
      return Response.json({ error: 'At least two brand entries are required' }, { status: 400 });
    }
    
    // Validate each brand entry
    for (const entry of brandEntries) {
      if (!entry.brandName || !entry.source) {
        return Response.json({ 
          error: 'Each brand entry must have brandName and source',
          invalidEntry: entry 
        }, { status: 400 });
      }
    }
    
    const groupId = await createBrandGroup(canonicalName, brandEntries);
    return Response.json({ success: true, groupId });
  } catch (error) {
    console.error('Error creating brand group:', error);
    return Response.json({ 
      success: false, 
      error: error.message || 'An error occurred while creating the brand group'
    }, { status: 500 });
  }
}
