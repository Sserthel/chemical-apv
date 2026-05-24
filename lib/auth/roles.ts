export type UserRole = "admin" | "employee";

export const ADMIN_EMAIL = "rasmus.berthel@gmail.com";

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export function resolveRoleForEmail(email: string | null | undefined): UserRole {
  if (email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return "admin";
  }
  return "employee";
}

export function roleLabel(role: UserRole): string {
  return role === "admin" ? "Admin" : "Medarbejder";
}

/** Rolle fra profil – admin-e-mail har altid forrang */
export function resolveUserRole(
  email: string | null | undefined,
  profileRole: UserRole | null | undefined
): UserRole | null {
  const emailRole = email ? resolveRoleForEmail(email) : null;
  if (emailRole === "admin") return "admin";
  if (profileRole) return profileRole;
  return emailRole;
}

export function isAdminUser(
  email: string | null | undefined,
  profileRole: UserRole | null | undefined
): boolean {
  return resolveUserRole(email, profileRole) === "admin";
}
