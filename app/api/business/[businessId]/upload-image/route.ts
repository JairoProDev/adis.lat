import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isPlatformAdminEmail, isPlatformAdminProfile } from '@/lib/platform-admin';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const BUCKET = 'catalog-images';

async function userCanManageBusiness(userId: string, email: string | undefined, businessId: string) {
  const { data: profile } = await supabaseAdmin
    .from('business_profiles')
    .select('id, user_id')
    .eq('id', businessId)
    .single();

  if (!profile) return false;
  if (profile.user_id === userId) return true;

  const { data: membership } = await supabaseAdmin
    .from('business_members')
    .select('role')
    .eq('business_profile_id', businessId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (membership?.role && ['owner', 'admin', 'editor'].includes(membership.role)) {
    return true;
  }

  if (isPlatformAdminEmail(email)) return true;

  const { data: adminProfile } = await supabaseAdmin
    .from('profiles')
    .select('rol, is_platform_admin')
    .eq('id', userId)
    .maybeSingle();

  return isPlatformAdminProfile(adminProfile);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { businessId } = await params;
    const allowed = await userCanManageBusiness(user.id, user.email, businessId);
    if (!allowed) {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
    }

    const form = await req.formData();
    const file = form.get('file');
    const type = String(form.get('type') || 'banner');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const contentType =
      ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : ext === 'svg' ? 'image/svg+xml' : 'image/jpeg';
    const storagePath = `${businessId}/brand/${type}-${Date.now()}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabaseAdmin.storage.from(BUCKET).upload(storagePath, buffer, {
      contentType,
      cacheControl: '31536000',
      upsert: true,
    });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(storagePath);
    return NextResponse.json({ url: data.publicUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al subir';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
