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
