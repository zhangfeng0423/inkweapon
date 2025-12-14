import { authClient } from '@/lib/auth-client';

export const useCurrentUser = () => {
  const { data: session, error, isPending } = authClient.useSession();

  // 在加载过程中返回 null，避免错误日志
  if (isPending) {
    return null;
  }

  // 只有在是真正的错误时才记录日志，而不是简单的 "unauthenticated"
  if (error && error.message !== 'UNAUTHORIZED') {
    console.error('useCurrentUser, error:', error);
  }

  return session?.user || null;
};
