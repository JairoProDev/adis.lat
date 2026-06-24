import { createServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export type ClaimOrphanResult = {
  ok: boolean;
  business_id?: string;
  error?: string;
};

/**
 * Asigna un perfil huérfano (sin user_id) al usuario autenticado.
 * Si hay pending_owner_email, el correo del usuario debe coincidir.
 */
export async function claimOrphanBusinessBySlug(slug: string): Promise<ClaimOrphanResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'not_authenticated' };
  }

  const { data: profile, error: fetchError } = await supabaseAdmin
    .from('business_profiles')
    .select('id, user_id, pending_owner_email, slug')
    .eq('slug', slug)
    .maybeSingle();

  if (fetchError || !profile) {
    return { ok: false, error: 'not_found' };
  }

  if (profile.user_id) {
    if (profile.user_id === user.id) {
      return { ok: true, business_id: profile.id };
    }
    return { ok: false, error: 'already_owned' };
  }

  const userEmail = user.email?.trim().toLowerCase();
  const pending = profile.pending_owner_email?.trim().toLowerCase();

  if (pending && userEmail !== pending) {
    return { ok: false, error: 'reserved_for_other_email' };
  }

  const { error: updateError } = await supabaseAdmin
    .from('business_profiles')
    .update({
      user_id: user.id,
      pending_owner_email: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id)
    .is('user_id', null);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  await supabaseAdmin.from('business_members').upsert(
    {
      business_profile_id: profile.id,
      user_id: user.id,
      role: 'owner',
      status: 'active',
      accepted_at: new Date().toISOString(),
      invited_by: user.id,
    },
    { onConflict: 'business_profile_id,user_id' }
  );

  return { ok: true, business_id: profile.id };
}
