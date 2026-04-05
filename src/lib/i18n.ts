import mn from "@/lib/i18n/mn";
import en from "@/lib/i18n/en";

export type Language = "mn" | "en";

export const translations = { mn, en };

export type TranslationKey = keyof typeof mn;
