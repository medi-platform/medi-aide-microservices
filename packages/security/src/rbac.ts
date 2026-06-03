import { Injectable } from '@nestjs/common';
import { UserRole, Permission } from './interfaces';

/**
 * Role-Permission Mapping
 * Defines what permissions each role has
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(Permission), // All permissions

  [UserRole.ADMIN]: [
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.PATIENT_CREATE,
    Permission.PATIENT_READ,
    Permission.PATIENT_UPDATE,
    Permission.PATIENT_DELETE,
    Permission.PATIENT_PHI_ACCESS,
    Permission.CAREGIVER_CREATE,
    Permission.CAREGIVER_READ,
    Permission.CAREGIVER_UPDATE,
    Permission.CAREGIVER_DELETE,
    Permission.SCHEDULE_CREATE,
    Permission.SCHEDULE_READ,
    Permission.SCHEDULE_UPDATE,
    Permission.SCHEDULE_DELETE,
    Permission.AGENCY_READ,
    Permission.AGENCY_UPDATE,
    Permission.BILLING_CREATE,
    Permission.BILLING_READ,
    Permission.BILLING_UPDATE,
    Permission.BILLING_PROCESS,
    Permission.REPORT_VIEW,
    Permission.REPORT_EXPORT,
    Permission.REPORT_PHI,
    Permission.COMPLIANCE_VIEW,
    Permission.COMPLIANCE_AUDIT,
    Permission.ADMIN_SETTINGS,
    Permission.ADMIN_USERS,
  ],

  [UserRole.AGENCY_ADMIN]: [
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.PATIENT_CREATE,
    Permission.PATIENT_READ,
    Permission.PATIENT_UPDATE,
    Permission.PATIENT_PHI_ACCESS,
    Permission.CAREGIVER_CREATE,
    Permission.CAREGIVER_READ,
    Permission.CAREGIVER_UPDATE,
    Permission.CAREGIVER_DELETE,
    Permission.SCHEDULE_CREATE,
    Permission.SCHEDULE_READ,
    Permission.SCHEDULE_UPDATE,
    Permission.SCHEDULE_DELETE,
    Permission.AGENCY_READ,
    Permission.AGENCY_UPDATE,
    Permission.BILLING_READ,
    Permission.BILLING_UPDATE,
    Permission.REPORT_VIEW,
    Permission.REPORT_EXPORT,
    Permission.COMPLIANCE_VIEW,
  ],

  [UserRole.MANAGER]: [
    Permission.USER_READ,
    Permission.PATIENT_READ,
    Permission.PATIENT_UPDATE,
    Permission.PATIENT_PHI_ACCESS,
    Permission.CAREGIVER_READ,
    Permission.CAREGIVER_UPDATE,
    Permission.SCHEDULE_CREATE,
    Permission.SCHEDULE_READ,
    Permission.SCHEDULE_UPDATE,
    Permission.AGENCY_READ,
    Permission.REPORT_VIEW,
  ],

  [UserRole.SCHEDULER]: [
    Permission.PATIENT_READ,
    Permission.CAREGIVER_READ,
    Permission.SCHEDULE_CREATE,
    Permission.SCHEDULE_READ,
    Permission.SCHEDULE_UPDATE,
    Permission.SCHEDULE_DELETE,
    Permission.AGENCY_READ,
  ],

  [UserRole.CAREGIVER]: [
    Permission.PATIENT_READ,
    Permission.PATIENT_PHI_ACCESS,
    Permission.SCHEDULE_READ,
  ],

  [UserRole.PATIENT]: [
    Permission.SCHEDULE_READ,
  ],

  [UserRole.FAMILY_MEMBER]: [
    Permission.PATIENT_READ,
    Permission.SCHEDULE_READ,
  ],

  [UserRole.BILLING]: [
    Permission.PATIENT_READ,
    Permission.BILLING_CREATE,
    Permission.BILLING_READ,
    Permission.BILLING_UPDATE,
    Permission.BILLING_PROCESS,
    Permission.REPORT_VIEW,
    Permission.REPORT_EXPORT,
  ],

  [UserRole.COMPLIANCE]: [
    Permission.PATIENT_READ,
    Permission.PATIENT_PHI_ACCESS,
    Permission.CAREGIVER_READ,
    Permission.REPORT_VIEW,
    Permission.REPORT_EXPORT,
    Permission.REPORT_PHI,
    Permission.COMPLIANCE_VIEW,
    Permission.COMPLIANCE_AUDIT,
  ],

  [UserRole.VIEWER]: [
    Permission.PATIENT_READ,
    Permission.CAREGIVER_READ,
    Permission.SCHEDULE_READ,
    Permission.AGENCY_READ,
    Permission.REPORT_VIEW,
  ],
};

/**
 * Role hierarchy - higher roles inherit from lower roles
 */
export const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  [UserRole.SUPER_ADMIN]: [
    UserRole.ADMIN,
    UserRole.AGENCY_ADMIN,
    UserRole.MANAGER,
    UserRole.SCHEDULER,
    UserRole.CAREGIVER,
    UserRole.BILLING,
    UserRole.COMPLIANCE,
    UserRole.VIEWER,
  ],
  [UserRole.ADMIN]: [
    UserRole.AGENCY_ADMIN,
    UserRole.MANAGER,
    UserRole.SCHEDULER,
    UserRole.CAREGIVER,
    UserRole.BILLING,
    UserRole.COMPLIANCE,
    UserRole.VIEWER,
  ],
  [UserRole.AGENCY_ADMIN]: [UserRole.MANAGER, UserRole.SCHEDULER, UserRole.VIEWER],
  [UserRole.MANAGER]: [UserRole.SCHEDULER, UserRole.VIEWER],
  [UserRole.SCHEDULER]: [UserRole.VIEWER],
  [UserRole.CAREGIVER]: [],
  [UserRole.PATIENT]: [],
  [UserRole.FAMILY_MEMBER]: [],
  [UserRole.BILLING]: [UserRole.VIEWER],
  [UserRole.COMPLIANCE]: [UserRole.VIEWER],
  [UserRole.VIEWER]: [],
};

/**
 * RBAC Service
 */
@Injectable()
export class RBACService {
  /**
   * Get all permissions for a role (including inherited)
   */
  getPermissionsForRole(role: UserRole): Permission[] {
    const directPermissions = ROLE_PERMISSIONS[role] || [];
    const inheritedRoles = ROLE_HIERARCHY[role] || [];

    const inheritedPermissions = inheritedRoles.flatMap(
      (inheritedRole) => ROLE_PERMISSIONS[inheritedRole] || [],
    );

    return [...new Set([...directPermissions, ...inheritedPermissions])];
  }

  /**
   * Check if a role has a specific permission
   */
  hasPermission(role: UserRole, permission: Permission): boolean {
    const permissions = this.getPermissionsForRole(role);
    return permissions.includes(permission);
  }

  /**
   * Check if a role has all specified permissions
   */
  hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
    const rolePermissions = this.getPermissionsForRole(role);
    return permissions.every((p) => rolePermissions.includes(p));
  }

  /**
   * Check if a role has any of the specified permissions
   */
  hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
    const rolePermissions = this.getPermissionsForRole(role);
    return permissions.some((p) => rolePermissions.includes(p));
  }

  /**
   * Check if roleA is higher than roleB in hierarchy
   */
  isRoleHigher(roleA: UserRole, roleB: UserRole): boolean {
    const subordinates = ROLE_HIERARCHY[roleA] || [];
    return subordinates.includes(roleB);
  }

  /**
   * Get role display name
   */
  getRoleDisplayName(role: UserRole): string {
    const displayNames: Record<UserRole, string> = {
      [UserRole.SUPER_ADMIN]: 'Super Administrator',
      [UserRole.ADMIN]: 'Administrator',
      [UserRole.AGENCY_ADMIN]: 'Agency Administrator',
      [UserRole.MANAGER]: 'Manager',
      [UserRole.SCHEDULER]: 'Scheduler',
      [UserRole.CAREGIVER]: 'Caregiver',
      [UserRole.PATIENT]: 'Patient',
      [UserRole.FAMILY_MEMBER]: 'Family Member',
      [UserRole.BILLING]: 'Billing Specialist',
      [UserRole.COMPLIANCE]: 'Compliance Officer',
      [UserRole.VIEWER]: 'Viewer',
    };
    return displayNames[role] || role;
  }
}
