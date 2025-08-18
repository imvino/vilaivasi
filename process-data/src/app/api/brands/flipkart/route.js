import { getFlipkartBrands } from '@/lib/db';

export async function GET() {
  try {
    const brands = await getFlipkartBrands();
    return Response.json({ brands });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
