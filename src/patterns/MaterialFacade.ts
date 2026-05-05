import { supabase } from '../lib/supabase';
import { notificationBus } from './NotificationObserver';
import { Material, Profile } from '../types';

// Facade Pattern - simplifies complex material operations behind one interface
export class MaterialFacade {

  static async submitMaterial(
    sellerId: string,
    data: Omit<Material, 'id' | 'seller_id' | 'status' | 'view_count' | 'created_at' | 'updated_at' | 'seller'>
  ): Promise<{ data: Material | null; error: string | null }> {
    const { data: material, error } = await supabase
      .from('materials')
      .insert({ ...data, seller_id: sellerId, status: 'pending' })
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    // Observer Pattern — notify the seller via the notification bus
    notificationBus.notify({
      event: 'general',
      title: 'Material Submitted',
      body: `Your material "${data.title}" is pending admin approval.`,
      link: '/dashboard',
      targetUserId: sellerId,
    });

    return { data: material, error: null };
  }

  static async approveMaterial(
    materialId: string,
    allUserIds: string[]
  ): Promise<{ error: string | null }> {
    // Profile type used explicitly — seller is typed as Material & { seller: Profile }
    const { data: material, error: fetchError } = await supabase
      .from('materials')
      .select('*, seller:profiles(*)')
      .eq('id', materialId)
      .single() as { data: (Material & { seller: Profile }) | null; error: any };

    if (fetchError || !material) return { error: fetchError?.message ?? 'Material not found' };

    const { error } = await supabase
      .from('materials')
      .update({ status: 'approved' })
      .eq('id', materialId);

    if (error) return { error: error.message };

    // Notify the seller — we now have typed access to seller.full_name
    await supabase.from('notifications').insert({
      user_id: material.seller_id,
      title: 'Material Approved',
      body: `Hi ${material.seller.full_name}, your material "${material.title}" is now live!`,
      type: 'material_approved',
      link: `/materials/${materialId}`,
    });

    // Notify all other users
    const otherUsers = allUserIds.filter(id => id !== material.seller_id);
    if (otherUsers.length > 0) {
      await supabase.from('notifications').insert(
        otherUsers.map(uid => ({
          user_id: uid,
          title: 'New Material Available',
          body: `"${material.title}" is now available in the marketplace.`,
          type: 'new_material',
          link: `/materials/${materialId}`,
        }))
      );
    }

    return { error: null };
  }

  static async rejectMaterial(materialId: string): Promise<{ error: string | null }> {
    // Typed as Material so we get seller_id and title safely
    const { data: material } = await supabase
      .from('materials')
      .select('seller_id, title')
      .eq('id', materialId)
      .single() as { data: Pick<Material, 'seller_id' | 'title'> | null };

    const { error } = await supabase
      .from('materials')
      .update({ status: 'rejected' })
      .eq('id', materialId);

    if (error) return { error: error.message };

    if (material) {
      await supabase.from('notifications').insert({
        user_id: material.seller_id,
        title: 'Material Rejected',
        body: `Your material "${material.title}" was not approved. Please review and resubmit.`,
        type: 'material_rejected',
        link: '/dashboard',
      });
    }

    return { error: null };
  }

  static async deleteMaterial(materialId: string, sellerId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', materialId)
      .eq('seller_id', sellerId); // ownership check — only seller can delete their own
    return { error: error ? error.message : null };
  }

  static async incrementViewCount(materialId: string): Promise<void> {
    await supabase.rpc('increment_view_count', { material_id: materialId });
  }
}