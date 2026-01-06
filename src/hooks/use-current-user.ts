import { authClient } from '@/lib/auth-client';

/**
 * Get the current user from the session
 *
 * Note: better-auth's useSession returns an error when the user is not logged in,
 * which is expected behavior. We silently handle this and return null.
 */
export const useCurrentUser = () => {
  const { data: session } = authClient.useSession();
  return session?.user;
};
