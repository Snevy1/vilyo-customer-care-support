import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { User } from "@/@types/types"; 
import { toast } from "react-toastify";
import { userApi } from "@/lib/apiClient/apiClient";

// Query Keys - centralized for consistency
export const userKeys = {
  all: ['user'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: string) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
  detail: (userId: string) => [...userKeys.details(), userId] as const,
};

// Get user profile by ID
export const useUser = (userId: string) => {
  return useQuery<User>({
    queryKey: userKeys.detail(userId),
    queryFn: () => userApi.getProfile(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

// Update user profile
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: Partial<User> }) =>
      userApi.updateProfile(userId, updates),
    onSuccess: (updatedUser) => {
      // Update the cache with the new user data
      queryClient.setQueryData(userKeys.profile(), updatedUser);
      toast.success("Profile updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update profile");
    },
  });
};

// Update profile picture
export const useUpdateProfilePicture = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, file }: { userId: string; file: File }) =>
      userApi.updateProfilePicture(userId, file),
    onSuccess: (data, variables) => {
      // Optimistically update the cache
      queryClient.setQueryData(userKeys.profile(), (oldData: User | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          profilePicture: {
            ...oldData.profilePicture,
            imageUrl: data.profileUrl,
          },
        };
      });
      toast.success("Profile picture updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload image");
    },
  });
};

// Update password
export const useUpdatePassword = () => {
  return useMutation({
    mutationFn: ({
      userId,
      oldPassword,
      newPassword,
    }: {
      userId: string;
      oldPassword: string;
      newPassword: string;
    }) => userApi.updatePassword(userId, oldPassword, newPassword),
    onSuccess: () => {
      toast.success("Password updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update password");
    },
  });
};

// Update notification interval
 export const useUpdateNotificationInterval = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, interval }: { userId: string; interval: number }) =>
      userApi.updateNotificationInterval(userId, interval),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(userKeys.profile(), updatedUser);
      toast.success("Notification interval updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update notification interval");
    },
  });
}; 