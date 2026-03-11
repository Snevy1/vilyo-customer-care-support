import axios, { AxiosInstance } from 'axios';
import { User, Organization, Subscription } from '@/@types/types';
import { PaymentProcessor } from '@/components/subscriptions/subscription-checkout';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * 1. Centralized Axios Instance
 * This replaces the need to create an instance inside every function.
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Replaces credentials: 'include' from fetch
});

// Request Interceptor: Add tokens if you're using them (LocalStorage/Cookies)
apiClient.interceptors.request.use((config) => {
  // If you store your token in localStorage, handle it here:
  // const token = localStorage.getItem('token');
  // if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response Interceptor: Global Error Handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Request failed';
    // Handle 401 Unauthorized globally if needed
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // window.location.href = '/login'; 
    }
    return Promise.reject(new Error(message));
  }
);

/**
 * 2. API Modules
 */

// User API
export const userApi = {
  getProfile: () => 
    apiClient.get<User>('/api/admin/profile').then(res => res.data),

  updateProfile: (userId: string, updates: Partial<User>) => 
    apiClient.put<User>(`/api/admin/users/${userId}`, updates).then(res => res.data),

  updateProfilePicture: async (userId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.put<{ profileUrl: string }>(
      `/api/admin/updateprofile/${userId}`, 
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  },

  updatePassword: (userId: string, oldPassword: string, newPassword: string) => 
    apiClient.put(`/api/admin/users/${userId}`, { oldPassword, password: newPassword }),

  updateNotificationInterval: (userId: string, interval: number) => 
    apiClient.put<User>(`/api/admin/users/${userId}`, { 
      messageNotificationInterval: interval 
    }).then(res => res.data),
};

// Organization API
export const organizationApi = {
  getCurrentOrganization: () => 
    apiClient.get<Organization>('/api/organization/fetch').then(res => res.data),

  getOrganizations: () => 
    apiClient.get<Organization[]>('/api/admin/organizations').then(res => res.data),

  updateOrganization: (orgId: string, updates: Partial<Organization>) => 
    apiClient.put<Organization>(`/api/admin/organizations/${orgId}`, updates).then(res => res.data),
};

// Subscription API
export const subscriptionApi = {
  getCurrentSubscription: () => 
    apiClient.get<Subscription>('/api/subscription/current').then(res => res.data),

  getSubscriptionHistory: () => 
    apiClient.get<Subscription[]>('/api/subscription/history').then(res => res.data),

  cancelSubscription: () => 
    apiClient.delete<Subscription>('/api/admin/subscription/cancel').then(res => res.data),
  verifySubscription: (data:{
    subscriptionId: string,
          paymentProvider: string,
          organizationId: string,
          planId: string,
  })=> apiClient.post<{id:string, provider:string, status:string, plan:string}>('/api/subscriptions/verify',data).then(res=>res.data),
  createCheckoutSession: (data: {
    organizationId: string;
    productType: string;
    planTier: string;
    paymentProvider: string;
    planId: string;
    tenantId?: string;
    successUrl?: string;
    cancelUrl?: string;
    callbackUrl?: string;
    metadata?: {
            planName:string,
            planPrice: number,
            planInterval: string,
          }
  }) => 
    apiClient.post<{ id: string; url?: string, subscriptionId?:string, authorization_url?:string }>('/api/subscriptions/checkout', data)
      .then(res => res.data),
};

// Auth API
export const authApi = {
  login: (email: string, password: string) => 
    apiClient.post<{ user: User; organization: Organization }>('/api/auth/login', { 
      email, 
      password 
    }).then(res => res.data),

  logout: () => apiClient.post('/api/auth/logout'),

  checkAuth: () => 
    apiClient.get<{ user: User; organization: Organization }>('/api/auth/me').then(res => res.data),
};

// Payment processors


export const paymentProcessorsApi = {
    PaymentProcessors: () => 
    apiClient.get<{processors: PaymentProcessor[]}>('/api/subscriptions/payment-processors').then(res => res.data),
    StripeKey: () =>
    apiClient.get<{ publishableKey: string }>('/api/subscriptions/payment-processors/stripe/key').then(res => res.data),
    PaypalClientId: () =>
    apiClient.get<{ clientId: string }>('/api/subscriptions/payment-processors/paypal/client-id').then(res => res.data),
};