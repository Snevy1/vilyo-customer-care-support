type SourceType = "website" | "docs" | "upload" | "text";

type SourceStatus = "active" | "training" | "error" | "excluded";


interface SectionFormData {
    name: string;
    description: string;
    tone: Tone;
    allowedTopics:string;
    blockedTopics: string;
    fallbackBehavior: string;
}

interface Section {
    id: string;
    name: string;
    description: string;
    sourceCount: number;
    source_ids?: string[];
    tone: Tone;
    scopeLabel: string;
    allowed_topics?:string;
    blocked_topics?: string;
    status: SectionStatus;
}


interface LeadInfo {
    first_name?: string; 
    last_name?:string,
     email?:string;
     notes?:string
     phoneNumber?: string;
}

interface NotificationProps{
    email?: string, 
    phone?: string,
    reason:string,
    user_message:string,
    sessionId:string

}

export interface KnowledgeSource {
    id: string;
    user_email: string;
    type:string;
    name:string;
    status: string;
    source_url: string | null;
    content: string | null;
    meta_data: string | null;
    last_updated: string | null;
    created_at: string | null;
}

 type SectionStatus = "active" | "draft" | "disabled";
type Tone = "strict" | "neutral" | "friendly" | "empathetic";



export interface ProfilePicture {
  imageUrl?: string;
  thumbnailUrl?: string;
  // Add other image properties if needed
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role?: string;
  profilePicture?: ProfilePicture;
  messageNotificationInterval?: number;
  createdAt?: Date;
  updatedAt?: Date;
  // Add other user properties as needed
}

export interface Organization {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  industry?: string;
  size?: string;
  settings?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Subscription {
  _id: string;
  planId: string;
  planName: string;
  status: 'active' | 'canceled' | 'past_due' | 'inactive';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd?: boolean;
  features?: Record<string, boolean | number>;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface OrganizationState {
  currentOrganization: Organization | null;
  organizations: Organization[];
  isLoading: boolean;
}

export interface SubscriptionState {
  currentSubscription: Subscription | null;
  subscriptionHistory: Subscription[];
  isLoading: boolean;
}


// For AI providers


export interface AIModel {
  _id: string;
  name: string;
  apiKey: string;
  price: number;
  visible: boolean;
  pros: string[];
  cons: string[];
  isActive: boolean;
  logoUrl?: string;
  file_id?: string;
  fileType?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AddAIModelPayload {
  name: string;
  apiKey: string;
  price: number;
  visible: boolean;
  pros: string[];
  cons: string[];
  isActive: boolean;
  image?: File;
}




export interface Feature {
  _id: string;
  name: string;
  type?: "item" | "extra" | "benefit";
  minQty?: number;
  maxQty?: number;
  price?: number;
  description?: string;
  qty?: number;
  customPrice?: number;
}

export interface SubscriptionPackage {
  _id: string;
  name: string;
  subtitle?: string;
  basePriceMin?: number;
  basePriceMax?: number;
  minItems?: number;
  benefits: string[];
  features: Feature[];
}





// Add these to your existing subscription types
export interface FeatureItem {
  _id: string;
  name: string;
  description?: string;
  price?: number;
  type?: "item" | "benefit" | "extra";
}

export interface PackageFeature {
  _id?: {
    name: string;
    price: number;
    type: "item" | "benefit" | "extra";
    description?: string;
  };
  name?: string;
  qty: number;
  minQty: number;
  maxQty: number;
  customPrice?: number;
  type?: "item" | "benefit" | "extra";
  price?: number;
  description?: string;
}

export interface SubscriptionPackageData {
  _id: string;
  name: string;
  subtitle?: string;
  basePriceMin?: number;
  basePriceMax?: number;
  minItems?: number;
  benefits?: string[];
  features: PackageFeature[];
}


// Social Media


export interface SocialLink {
  id: string;
  name: string;
  link: string;
  icon?: string; // URL or React component
  platform?: string;
}

export interface SocialLinkFormData {
  name: string;
  link: string;
  icon?: string;
}




export interface PaymentProcessor {
  _id: string;
  name: string;
  apiKey: string;
  secretKey: string;
  authKey: string;
  logoUrl: string;
  isEnabled?: boolean;
  priority?: number;
  is_top_priority?: boolean;

  // Add the missing ones here so everything uses the same shape
  provider: string;
  customerPortalLink?: string;
  webhookSecretKey?: string;
  userTypes?: string[] | string;
  orgTypes?: string[] | string;
}