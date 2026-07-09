import { UserRole } from '../types';

type SupabaseAuthUser = {
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

/**
 * Rola administratora jest odczytywana wyłącznie z app_metadata.
 * app_metadata może ustawić tylko panel Supabase (service role) — nie klient.
 */
export function getUserRole(user: SupabaseAuthUser): UserRole {
  if (user.app_metadata?.role === UserRole.ADMIN) {
    return UserRole.ADMIN;
  }
  return UserRole.CLIENT;
}
