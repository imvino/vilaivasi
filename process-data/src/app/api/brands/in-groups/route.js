import { getBrandsInGroups } from '@/lib/db';

export async function GET() {
  try {
    const brandsInGroups = await getBrandsInGroups();
    return Response.json({ brandsInGroups });
  } catch (error) {
    console.error('Error fetching brands in groups:', error);
    return Response.json({ error: error.message, brandsInGroups: [] }, { status: 500 });
  }
}
