import { subscriptionApi } from "@/lib/apiClient/apiClient";
import { useQuery } from "@tanstack/react-query";

export const subscriptionKeys = {
  all: ['subscription'] as const,
  lists: () => [...subscriptionKeys.all, 'list'] as const,
  list: (filters?: string) => [...subscriptionKeys.lists(), { filters }] as const,
  details: () => [...subscriptionKeys.all, 'detail'] as const,
  detail: (subscriptionId: string) => [...subscriptionKeys.details(), subscriptionId] as const,
  current: () => [...subscriptionKeys.all, 'current'] as const,
  history: () => [...subscriptionKeys.all, 'history'] as const,
};

// Current subscription
export const useSubscription = () => {
  return useQuery({
    queryKey: subscriptionKeys.current(),
    queryFn: subscriptionApi.getCurrentSubscription,
    staleTime: 10 * 60 * 1000,
  });
};

// Subscription history
export const useSubscriptionHistory = () => {
  return useQuery({
    queryKey: subscriptionKeys.history(),
    queryFn: subscriptionApi.getSubscriptionHistory,
    staleTime: 10 * 60 * 1000,
  });
};

// Specific subscription by ID (future use)
/* export const useSubscriptionDetail = (subscriptionId: string) => {
  return useQuery({
    queryKey: subscriptionKeys.detail(subscriptionId),
    queryFn: () => subscriptionApi.getSubscriptionById(subscriptionId),
    staleTime: 10 * 60 * 1000,
  });
}; */