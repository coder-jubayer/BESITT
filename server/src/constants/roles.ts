export const USER_ROLES = [
  'app_admin',
  'building_admin',
  'committee',
  'guard',
  'resident',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  app_admin: 'App Admin',
  building_admin: 'Building Admin',
  committee: 'Committee',
  guard: 'Security Guard',
  resident: 'Resident',
};

export const BUILDING_ADMIN_CREATABLE_ROLES: UserRole[] = [
  'committee',
  'guard',
  'resident',
];

export const APP_ADMIN_CREATABLE_ROLES: UserRole[] = [
  'building_admin',
  'committee',
  'guard',
  'resident',
];

export function isAppAdmin(role?: string | null): boolean {
  return role === 'app_admin' || role === 'admin';
}

export function isBuildingAdmin(role?: string | null): boolean {
  return role === 'building_admin';
}

export function isCommittee(role?: string | null): boolean {
  return role === 'committee';
}

export function isResident(role?: string | null): boolean {
  return role === 'resident';
}

export function canManageUsers(role?: string | null): boolean {
  return isAppAdmin(role) || isBuildingAdmin(role);
}

export function canPostNotices(role?: string | null): boolean {
  return isCommittee(role) || isBuildingAdmin(role) || isAppAdmin(role);
}

export function canManageExpenses(role?: string | null): boolean {
  return isCommittee(role) || isBuildingAdmin(role) || isAppAdmin(role);
}

export function canManageDirectory(role?: string | null): boolean {
  return isCommittee(role) || isBuildingAdmin(role) || isAppAdmin(role);
}

export function creatableRolesFor(role?: string | null): UserRole[] {
  if (isAppAdmin(role)) return [...APP_ADMIN_CREATABLE_ROLES];
  if (isBuildingAdmin(role)) return [...BUILDING_ADMIN_CREATABLE_ROLES];
  return [];
}
