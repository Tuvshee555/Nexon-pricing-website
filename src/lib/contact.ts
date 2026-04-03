export type ContactField = "name" | "phone" | "email" | "message";

export type ContactErrorCode =
  | "MISSING_NAME"
  | "NAME_TOO_SHORT"
  | "MISSING_EMAIL"
  | "INVALID_EMAIL"
  | "INVALID_PHONE"
  | "MISSING_MESSAGE"
  | "MESSAGE_TOO_SHORT"
  | "SEND_FAILED";

export interface ContactFormPayload {
  name: string;
  phone: string;
  email: string;
  message: string;
  website?: string;
}

export interface ContactValidationResult {
  sanitized: ContactFormPayload;
  fieldErrors: Partial<Record<ContactField, ContactErrorCode>>;
  firstErrorCode: ContactErrorCode | null;
}

export interface ContactApiResponse {
  success: boolean;
  errorCode?: ContactErrorCode;
}

export const CONTACT_MIN_NAME_VISIBLE_LENGTH = 2;
export const CONTACT_MIN_MESSAGE_LENGTH = 10;
export const CONTACT_SUCCESS_RESET_MS = 5000;
export const CONTACT_COOLDOWN_SECONDS = 10;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CONTACT_ERROR_TO_FIELD: Partial<Record<ContactErrorCode, ContactField>> = {
  MISSING_NAME: "name",
  NAME_TOO_SHORT: "name",
  MISSING_EMAIL: "email",
  INVALID_EMAIL: "email",
  INVALID_PHONE: "phone",
  MISSING_MESSAGE: "message",
  MESSAGE_TOO_SHORT: "message",
};

export function getVisibleCharacterCount(value: string): number {
  return value.replace(/\s+/g, "").length;
}

export function getMongolianPhoneDigits(input: string): string {
  let digits = input.replace(/\D/g, "");

  if (digits.startsWith("976")) {
    digits = digits.slice(3);
  }

  return digits.slice(0, 8);
}

export function formatMongolianPhone(input: string): string {
  const digits = getMongolianPhoneDigits(input);

  if (!digits) {
    return "";
  }

  if (digits.length <= 4) {
    return `+976 ${digits}`;
  }

  return `+976 ${digits.slice(0, 4)} ${digits.slice(4)}`;
}

export function isValidMongolianPhone(input: string): boolean {
  return getMongolianPhoneDigits(input).length === 8;
}

export function sanitizeContactPayload(
  payload: Partial<ContactFormPayload>
): ContactFormPayload {
  return {
    name: typeof payload.name === "string" ? payload.name.trim().replace(/\s+/g, " ") : "",
    phone: typeof payload.phone === "string" ? formatMongolianPhone(payload.phone) : "",
    email: typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "",
    message: typeof payload.message === "string" ? payload.message.trim() : "",
    website: typeof payload.website === "string" ? payload.website.trim() : "",
  };
}

export function validateContactField(
  field: ContactField,
  payload: Partial<ContactFormPayload>
): ContactErrorCode | null {
  const sanitized = sanitizeContactPayload(payload);

  switch (field) {
    case "name":
      if (!sanitized.name) {
        return "MISSING_NAME";
      }
      if (getVisibleCharacterCount(sanitized.name) < CONTACT_MIN_NAME_VISIBLE_LENGTH) {
        return "NAME_TOO_SHORT";
      }
      return null;
    case "email":
      if (!sanitized.email) {
        return "MISSING_EMAIL";
      }
      if (!EMAIL_REGEX.test(sanitized.email)) {
        return "INVALID_EMAIL";
      }
      return null;
    case "phone":
      if (!sanitized.phone) {
        return null;
      }
      return isValidMongolianPhone(sanitized.phone) ? null : "INVALID_PHONE";
    case "message":
      if (!sanitized.message) {
        return "MISSING_MESSAGE";
      }
      if (sanitized.message.length < CONTACT_MIN_MESSAGE_LENGTH) {
        return "MESSAGE_TOO_SHORT";
      }
      return null;
    default:
      return null;
  }
}

export function validateContactPayload(
  payload: Partial<ContactFormPayload>
): ContactValidationResult {
  const sanitized = sanitizeContactPayload(payload);
  const fields: ContactField[] = ["name", "email", "phone", "message"];
  const fieldErrors: Partial<Record<ContactField, ContactErrorCode>> = {};

  for (const field of fields) {
    const errorCode = validateContactField(field, sanitized);
    if (errorCode) {
      fieldErrors[field] = errorCode;
    }
  }

  return {
    sanitized,
    fieldErrors,
    firstErrorCode: fields.map((field) => fieldErrors[field]).find(Boolean) || null,
  };
}
