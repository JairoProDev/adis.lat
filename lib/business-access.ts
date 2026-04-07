import type { BusinessProfile } from '@/types/business';

/** Mirrors DB enum `business_member_role` */
export type BusinessMemberRole = 'owner' | 'admin' | 'editor' | 'viewer';

export type BusinessPermission =
  | 'business:read'
  | 'business:write'
  | 'business:delete'
  | 'business:publish'
  | 'team:read'
  | 'team:invite'
  | 'team:remove'
  | 'team:change_role'
  | 'catalog:read'
  | 'catalog:write'
  | 'analytics:read';

const ROLE_RANK: Record<BusinessMemberRole, number> = {
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

/** Minimum role required per permission (hierarchical). */
const PERMISSION_MIN_ROLE: Record<BusinessPermission, BusinessMemberRole> = {
  'business:read': 'viewer',
  'analytics:read': 'viewer',
  'catalog:read': 'viewer',
  'business:write': 'editor',
  'catalog:write': 'editor',
  'business:publish': 'editor',
  'team:read': 'editor',
  'team:invite': 'admin',
  'team:remove': 'admin',
  'team:change_role': 'admin',
  'business:delete': 'owner',
};

export function hasPermission(role: BusinessMemberRole, permission: BusinessPermission): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[PERMISSION_MIN_ROLE[permission]];
}

export interface BusinessWithRole {
  profile: BusinessProfile;
  role: BusinessMemberRole;
}
