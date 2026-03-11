import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { userKeys } from "./useUser";
import { organizationKeys } from "./useOrganization";

export const authKeys = {
  all: ['auth'] as const,
  status: () => [...authKeys.all, 'status'] as const,
  session: () => [...authKeys.all, 'session'] as const,
  detail: (userId: string) => [...authKeys.all, 'detail', userId] as const,
};

// Check authentication status
/* export const useAuthStatus = () => {
  return useQuery({
    queryKey: authKeys.status(),
    queryFn: authApi.checkAuth,
    retry: false,
    staleTime: Infinity,
  });
};

// Login mutation
export const useLogin = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: (data) => {
      queryClient.setQueryData(userKeys.profile(), data.user);
      queryClient.setQueryData(organizationKeys.current(data.organization.id), data.organization);
      queryClient.setQueryData(authKeys.status(), data);

      toast.success("Login successful!");
      router.push("/dashboard");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Login failed");
    },
  });
}; */