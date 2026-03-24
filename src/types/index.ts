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

export interface Transaction {
  id: string;
  business_id: string;
  amount: number;
  credits_added: number;
  payment_method: "qpay" | "manual";
  qpay_invoice_id?: string;
  qpay_payment_id?: string;
  status: TransactionStatus;
  paid_at?: string;
}

export interface PlatformAccount {
  id: string;
  business_id: string;
  platform: Platform;
  external_id: string;
}

export interface CreditPack {
  amount: number;
  credits: number;
  popular?: boolean;
}

export const CREDIT_PACKS: CreditPack[] = [
  { amount: 10000, credits: 300 },
  { amount: 25000, credits: 700 },
  { amount: 50000, credits: 1400, popular: true },
];

export const MONTHLY_PLANS = [
  {
    tier: "basic" as MonthlyTier,
    nameMn: "Үндсэн",
    nameEn: "Basic",
    price: 49000,
    messageLimit: 1500,
    popular: false,
  },
  {
    tier: "standard" as MonthlyTier,
    nameMn: "Стандарт",
    nameEn: "Standard",
    price: 89000,
    messageLimit: 4000,
    popular: true,
  },
  {
    tier: "premium" as MonthlyTier,
    nameMn: "Премиум",
    nameEn: "Premium",
    price: 149000,
    messageLimit: Infinity,
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
