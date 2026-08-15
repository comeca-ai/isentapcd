import { trpc } from "@/providers/trpc";

/**
 * Hook de autenticação custom (e-mail + senha, JWT em cookie httpOnly).
 * `user` é null quando deslogado, undefined enquanto carrega.
 */
export function useAuth() {
  const utils = trpc.useUtils();
  const me = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 60_000,
  });

  const login = trpc.auth.login.useMutation({
    onSuccess: () => utils.auth.me.invalidate(),
  });
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      // limpa todo o cache para não vazar dados privados entre sessões
      utils.invalidate();
    },
  });
  const register = trpc.auth.register.useMutation({
    onSuccess: () => utils.auth.me.invalidate(),
  });

  // UNAUTHORIZED no me = deslogado (não é erro de rede)
  const isUnauthenticated = me.error?.data?.code === "UNAUTHORIZED";

  return {
    user: me.data?.user ?? null,
    isLoading: me.isLoading,
    isAuthenticated: Boolean(me.data?.user),
    isUnauthenticated,
    login,
    logout,
    register,
    refetch: me.refetch,
  };
}
