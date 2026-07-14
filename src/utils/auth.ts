import { UserRole } from '../types';

type SupabaseAuthUser = {
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

/**
 * The administrator role is read exclusively from app_metadata.
 * app_metadata can only be set via the Supabase dashboard (service role) — not by the client.
 */
export function getUserRole(user: SupabaseAuthUser): UserRole {
  if (user.app_metadata?.role === UserRole.ADMIN) {
    return UserRole.ADMIN;
  }
  return UserRole.CLIENT;
}
