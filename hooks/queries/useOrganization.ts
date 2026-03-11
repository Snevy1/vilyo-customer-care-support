import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Organization } from "@/@types/types"; 
import { toast } from "react-toastify";
import { organizationApi } from "@/lib/apiClient/apiClient";

export const organizationKeys = {
  all: ['organization'] as const,
  lists: () => [...organizationKeys.all, 'list'] as const,
  list: (filters: string) => [...organizationKeys.lists(), { filters }] as const,
  details: () => [...organizationKeys.all, 'detail'] as const,
  detail: (orgId: string) => [...organizationKeys.details(), orgId] as const,
};

export const useOrganization = ({ org_id }: { org_id: string }) => {
  return useQuery<Organization>({
    queryKey: organizationKeys.detail(org_id), // include org_id in key
    queryFn: () => organizationApi.getCurrentOrganization(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateOrganization = ({ organizationId }: { organizationId: string }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      organizationId,
      updates,
    }: {
      organizationId: string;
      updates: Partial<Organization>;
    }) => organizationApi.updateOrganization(organizationId, updates),
    onSuccess: (updatedOrg) => {
      queryClient.setQueryData( organizationKeys.detail(organizationId), updatedOrg);
      toast.success("Organization updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update organization");
    },
  });
};