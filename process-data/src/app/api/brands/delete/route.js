import { deleteBrandGroup } from '@/lib/db';

export async function DELETE(req) {
  try {
    const { groupId } = await req.json();
    
    if (!groupId) {
      return Response.json({ error: 'Group ID is required' }, { status: 400 });
    }
    
    const result = await deleteBrandGroup(groupId);
    return Response.json({ success: true, message: `Group "${result.deletedName}" deleted successfully` });
  } catch (error) {
    console.error('Error deleting brand group:', error);
    return Response.json({ 
      success: false, 
      error: error.message || 'An error occurred while deleting the brand group'
    }, { status: 500 });
  }
}
