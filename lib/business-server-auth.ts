/**
 * Server-side membership resolution for API routes (many businesses + team).
 * Uses the same RLS-backed client as the logged-in user.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { BusinessMemberRole } from '@/lib/business-access';
import { hasPermission, type BusinessPermission } from '@/lib/business-access';
import type { NextRequest } from 'next/server';

export type ResolvedBusinessForUser = {
    id: string;
    user_id: string;
    slug: string;
    name: string;
    created_at: string;
    role: BusinessMemberRole;
};

export async function listBusinessMembershipsForServer(
    supabase: SupabaseClient,
    userId: string
): Promise<ResolvedBusinessForUser[]> {
    const { data, error } = await supabase
        .from('business_members')
        .select(
            `
      role,
      business_profiles (
        id,
        user_id,
        slug,
        name,
        created_at
      )
    `
        )
        .eq('user_id', userId)
        .eq('status', 'active');

    if (error) {
        console.error('listBusinessMembershipsForServer:', error);
        return [];
    }

    const out: ResolvedBusinessForUser[] = [];
    for (const row of data || []) {
        const rawBp = row as {
            role: BusinessMemberRole;
            business_profiles:
                | {
                      id: string;
                      user_id: string;
                      slug: string;
                      name: string;
                      created_at: string;
                  }
                | {
                      id: string;
                      user_id: string;
                      slug: string;
                      name: string;
                      created_at: string;
                  }[]
                | null;
        };
        const prof = rawBp.business_profiles;
        const single = Array.isArray(prof) ? prof[0] : prof;
        if (!single) continue;
        out.push({
            id: single.id,
            user_id: single.user_id,
            slug: single.slug,
            name: single.name,
            created_at: single.created_at,
            role: rawBp.role,
        });
    }

    out.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return out;
}

/**
 * Resolve which business the request applies to.
 * If businessProfileId is omitted, uses the user's oldest membership (backward compatible).
 */
export async function resolveBusinessForUser(
    supabase: SupabaseClient,
    userId: string,
    businessProfileId?: string | null
): Promise<ResolvedBusinessForUser | null> {
    const list = await listBusinessMembershipsForServer(supabase, userId);
    if (!list.length) return null;
    if (businessProfileId) {
        return list.find((b) => b.id === businessProfileId) ?? null;
    }
    return list[0];
}

export function getBusinessIdFromRequest(
    request: NextRequest,
    body?: Record<string, unknown> | null
): string | null {
    const { searchParams } = new URL(request.url);
    const q =
        searchParams.get('business_id') ||
        searchParams.get('business_profile_id') ||
        searchParams.get('business');
    if (q) return q;
    if (body && typeof body.business_id === 'string') return body.business_id;
    if (body && typeof body.business_profile_id === 'string') return body.business_profile_id;
    return null;
}

export function assertBusinessPermission(
    role: BusinessMemberRole,
    permission: BusinessPermission
): boolean {
    return hasPermission(role, permission);
}
