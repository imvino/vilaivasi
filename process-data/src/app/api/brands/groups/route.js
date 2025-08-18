import { getBrandGroups } from '@/lib/db';

export async function GET() {
  try {
    const groups = await getBrandGroups();
    return Response.json({ groups });
  } catch (error) {
    console.error('Error fetching brand groups:', error);
    return Response.json({ error: error.message, groups: [] }, { status: 500 });
  }
}
