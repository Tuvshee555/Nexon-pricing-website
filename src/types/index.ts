export type UserRole = "admin" | "client";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export type BusinessStatus = "active" | "paused" | "cancelled";
export type Platform = "instagram" | "messenger";

export interface Business {
  id: string;
  user_id: string;
  name: string;
  platforms: Platform[];
  bot_prompt: string;
  contact_phone: string;
  contact_email: string;
  status: BusinessStatus;
  virtual_balance: number;
  subscription_price: number;
  next_billing_date: string | null;
  billing_active: boolean;
  // Self-service fields
  onboarding_step: number;
  onboarding_done: boolean;
  bot_name: string;
  welcome_message: string;
  bot_tone: "friendly" | "formal" | "professional" | "casual";
  business_type: string;
}

export type PlanType = "monthly" | "credit";
export type MonthlyTier = "basic" | "standard" | "premium" | "enterprise";

export interface Plan {
  id: string;
  business_id: string;
  plan_type: PlanType;
  monthly_tier?: MonthlyTier;
  monthly_message_limit?: number;
  monthly_price?: number;
  billing_cycle_start?: string;
}

export interface Credits {
  id: string;
  business_id: string;
  balance: number;
  total_purchased: number;
  low_credit_alert_active?: boolean;
  low_credit_alert_sent_at?: string | null;
}

export interface MessageLog {
  id: string;
  business_id: string;
  platform: Platform;
  message_count: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  credits_used: number;
  source: "manual" | "api";
  logged_at: string;
}

export type TransactionStatus = "pending" | "paid" | "failed" | "cancelled";

export type TransactionType = "topup" | "subscription" | "message_pack" | "manual";

export interface Transaction {
  id: string;
  business_id: string;
  amount: number;
  credits_added: number;
  payment_method: "qpay" | "manual";
  qpay_invoice_id?: string;
  qpay_payment_id?: string;
  status: TransactionStatus;
  transaction_type?: TransactionType;
  paid_at?: string;
}

export interface PlatformAccount {
  id: string;
  business_id: string;
  platform: Platform;
  external_id: string;
  // Self-service fields
  page_access_token?: string;
  page_name?: string;
  page_id?: string;
  instagram_account_id?: string;
  token_expires_at?: string;
}

export interface CreditPack {
  amount: number;
  credits: number;
  popular?: boolean;
}

export const SETUP_FEE = 75000;

export const CREDIT_PACKS: CreditPack[] = [
  { amount: 25000, credits: 150 },
  { amount: 50000, credits: 400, popular: true },
  { amount: 100000, credits: 900 },
];

export const MONTHLY_PLANS = [
  {
    tier: "basic" as MonthlyTier,
    nameMn: "Үндсэн",
    nameEn: "Basic",
    price: 79000,
    messageLimit: 600,
    popular: false,
  },
  {
    tier: "standard" as MonthlyTier,
    nameMn: "Стандарт",
    nameEn: "Standard",
    price: 129000,
    messageLimit: 1500,
    popular: true,
  },
  {
    tier: "premium" as MonthlyTier,
    nameMn: "Премиум",
    nameEn: "Premium",
    price: 199000,
    messageLimit: 3000,
    popular: false,
  },
  {
    tier: "enterprise" as MonthlyTier,
    nameMn: "Энтерпрайз",
    nameEn: "Enterprise",
    price: 0,
    messageLimit: Infinity,
    popular: false,
  },
];
