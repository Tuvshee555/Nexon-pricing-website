"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, useInView, AnimatePresence } from "framer-motion";
import type {
  ContactApiResponse,
  ContactErrorCode,
  ContactField,
  ContactFormPayload,
} from "@/lib/contact";
import {
  CONTACT_COOLDOWN_SECONDS,
  CONTACT_ERROR_TO_FIELD,
  CONTACT_MIN_MESSAGE_LENGTH,
  CONTACT_MIN_NAME_VISIBLE_LENGTH,
  CONTACT_SUCCESS_RESET_MS,
  formatMongolianPhone,
  validateContactField,
  validateContactPayload,
} from "@/lib/contact";
import { trackEvent } from "@/lib/analytics";

type SubmitErrorCode = ContactErrorCode | "NETWORK_ERROR";

const emptyForm: ContactFormPayload = {
  name: "",
  phone: "",
  email: "",
  message: "",
  website: "",
};

export default function ContactSection() {
  const { t } = useLanguage();
  const [form, setForm] = useState<ContactFormPayload>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ContactField, ContactErrorCode>>>({});
  const [submitError, setSubmitError] = useState<SubmitErrorCode | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "success">("idle");
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  useEffect(() => {
    if (status !== "success") {
      return;
    }

    const timer = window.setTimeout(() => {
      setStatus("idle");
    }, CONTACT_SUCCESS_RESET_MS);

    return () => window.clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    if (cooldownRemaining <= 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setCooldownRemaining((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [cooldownRemaining]);

  const contactLinks = [
    {
      href: "tel:+97686185769",
      icon: (
        <svg
          className="w-5 h-5 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
          />
        </svg>
      ),
      bg: "bg-primary/10 border-primary/20 group-hover:bg-primary/20",
      label: t("contact_phone"),
      value: "+976 8618 5769",
    },
    {
      href: "mailto:nexondigitalnova@gmail.com",
      icon: (
        <svg
          className="w-5 h-5 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
      bg: "bg-primary/10 border-primary/20 group-hover:bg-primary/20",
      label: t("contact_email"),
      value: "nexondigitalnova@gmail.com",
    },
    {
      href: "https://www.instagram.com/nexon_digital_nova/",
      icon: (
        <svg
          className="w-5 h-5 text-pink-500"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
      bg: "bg-pink-500/10 border-pink-500/20 group-hover:bg-pink-500/20",
      label: "Instagram",
      value: "@nexon_digital_nova",
    },
    {
      href: "https://www.facebook.com/profile.php?id=61575512910743",
      icon: (
        <svg
          className="w-5 h-5 text-blue-500"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      bg: "bg-blue-500/10 border-blue-500/20 group-hover:bg-blue-500/20",
      label: "Facebook",
      value: "Nexon Digital Nova",
    },
  ];

  const formatText = (template: string, replacements: Record<string, string | number>) => {
    return Object.entries(replacements).reduce(
      (text, [key, value]) => text.replace(`{${key}}`, String(value)),
      template
    );
  };

  const getErrorMessage = (errorCode: SubmitErrorCode | null) => {
    switch (errorCode) {
      case "MISSING_NAME":
        return t("contact_error_name_required");
      case "NAME_TOO_SHORT":
        return formatText(t("contact_error_name_short"), {
          min: CONTACT_MIN_NAME_VISIBLE_LENGTH,
        });
      case "MISSING_EMAIL":
        return t("contact_error_email_required");
      case "INVALID_EMAIL":
        return t("contact_error_email_invalid");
      case "INVALID_PHONE":
        return t("contact_error_phone_invalid");
      case "MISSING_MESSAGE":
        return t("contact_error_message_required");
      case "MESSAGE_TOO_SHORT":
        return formatText(t("contact_error_message_short"), {
          min: CONTACT_MIN_MESSAGE_LENGTH,
        });
      case "NETWORK_ERROR":
        return t("contact_error_network");
      case "SEND_FAILED":
      default:
        return t("contact_error_send_failed");
    }
  };

  const updateField = (field: ContactField | "website", value: string) => {
    const nextForm = { ...form, [field]: value };
    setForm(nextForm);
    setSubmitError(null);

    if (field !== "website" && fieldErrors[field]) {
      const nextError = validateContactField(field, nextForm);
      setFieldErrors((prev) => {
        const nextErrors = { ...prev };
        if (nextError) {
          nextErrors[field] = nextError;
        } else {
          delete nextErrors[field];
        }
        return nextErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (status === "sending" || cooldownRemaining > 0) {
      return;
    }

    setSubmitError(null);

    const validation = validateContactPayload(form);
    if (validation.firstErrorCode) {
      setFieldErrors(validation.fieldErrors);
      return;
    }

    setFieldErrors({});
    setStatus("sending");
    trackEvent("contact_submit_started", { source: "landing_contact" });

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.sanitized),
      });

      const data = (await res.json().catch(() => null)) as ContactApiResponse | null;

      if (!res.ok || !data?.success) {
        const errorCode = data?.errorCode || "SEND_FAILED";
        trackEvent("contact_submit_failed", { source: "landing_contact", errorCode });
        const field = CONTACT_ERROR_TO_FIELD[errorCode];

        if (field) {
          setFieldErrors({ [field]: errorCode });
        } else {
          setSubmitError(errorCode);
        }

        setStatus("idle");
        return;
      }

      setForm({ ...emptyForm });
      setFieldErrors({});
      setSubmitError(null);
      setCooldownRemaining(CONTACT_COOLDOWN_SECONDS);
      setStatus("success");
      trackEvent("contact_submit_succeeded", { source: "landing_contact" });
    } catch {
      trackEvent("contact_submit_failed", { source: "landing_contact", errorCode: "NETWORK_ERROR" });
      setSubmitError("NETWORK_ERROR");
      setStatus("idle");
    }
  };

  const isSubmitDisabled = status === "sending" || cooldownRemaining > 0;
  const cooldownMessage =
    cooldownRemaining > 0
      ? formatText(t("contact_cooldown"), { seconds: cooldownRemaining })
      : null;

  return (
    <section
      id="contact"
      ref={ref}
      className="relative px-4 py-20 sm:px-6 lg:px-8 overflow-hidden"
    >
      <div className="absolute inset-0 bg-transparent" />
      <div
        className="pointer-events-none absolute left-1/2 bottom-0 h-[30rem] w-[60rem] -translate-x-1/2 rounded-full opacity-10"
        style={{
          background:
            "radial-gradient(ellipse, rgba(15,79,232,0.7) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="section-label justify-center">{t("contact_title")}</div>
          <h2 className="mt-5 text-4xl sm:text-5xl font-black tracking-[-0.03em] text-slate-950 mb-4">
            {t("contact_title")}
          </h2>
          <p className="text-slate-600 text-lg">{t("contact_subtitle")}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="space-y-4"
          >
            <div className="surface-panel relative overflow-hidden rounded-[30px] p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-5">
                {t("contact_info_title")}
              </h3>
              <div className="space-y-3">
                {contactLinks.map((link, i) => (
                  <motion.a
                    key={i}
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel={
                      link.href.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.3 + i * 0.08 }}
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-4 text-slate-600 hover:text-slate-900 transition-colors group"
                  >
                    <div
                      className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-colors ${link.bg}`}
                    >
                      {link.icon}
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">{link.label}</p>
                      <p className="font-medium">{link.value}</p>
                    </div>
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="surface-card relative overflow-hidden rounded-[30px] p-6"
          >
            <AnimatePresence mode="wait">
              {status === "success" ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center justify-center h-full py-12 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                    className="w-16 h-16 rounded-full bg-success/10 border border-success/30 flex items-center justify-center mb-4"
                    style={{ boxShadow: "0 0 30px rgba(16,185,129,0.3)" }}
                  >
                    <svg
                      className="w-8 h-8 text-success"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </motion.div>
                  <h3 className="text-xl font-bold text-text-primary mb-2">
                    {t("contact_success")}
                  </h3>
                  <p className="text-text-secondary">
                    {t("contact_success_subtitle")}
                  </p>
                  <button
                    onClick={() => setStatus("idle")}
                    className="mt-6 text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                  >
                    {t("contact_send_again")}
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  noValidate
                  className="space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div
                    className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
                    aria-hidden="true"
                  >
                    <label htmlFor="contact-website">Website</label>
                    <input
                      id="contact-website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={form.website || ""}
                      onChange={(e) => updateField("website", e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contact-name" className="block text-sm font-medium text-text-secondary mb-1.5">
                        {t("contact_name")}
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        value={form.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        autoComplete="name"
                        aria-invalid={Boolean(fieldErrors.name)}
                        aria-describedby={fieldErrors.name ? "contact-name-error" : undefined}
                        className={`w-full rounded-2xl border bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:shadow-[0_0_0_3px_rgba(15,23,42,0.08)] transition-all text-sm ${
                          fieldErrors.name ? "border-danger/50" : "border-slate-200 focus:border-slate-400"
                        }`}
                        placeholder={t("contact_placeholder_name")}
                      />
                      {fieldErrors.name && (
                        <p id="contact-name-error" role="alert" className="mt-2 text-sm text-danger">
                          {getErrorMessage(fieldErrors.name)}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="contact-phone" className="block text-sm font-medium text-text-secondary mb-1.5">
                        {t("contact_phone")}
                      </label>
                      <input
                        id="contact-phone"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => updateField("phone", formatMongolianPhone(e.target.value))}
                        autoComplete="tel"
                        inputMode="tel"
                        aria-invalid={Boolean(fieldErrors.phone)}
                        aria-describedby={fieldErrors.phone ? "contact-phone-error" : undefined}
                        className={`w-full rounded-2xl border bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:shadow-[0_0_0_3px_rgba(15,23,42,0.08)] transition-all text-sm ${
                          fieldErrors.phone ? "border-danger/50" : "border-slate-200 focus:border-slate-400"
                        }`}
                        placeholder={t("contact_placeholder_phone")}
                      />
                      {fieldErrors.phone && (
                        <p id="contact-phone-error" role="alert" className="mt-2 text-sm text-danger">
                          {getErrorMessage(fieldErrors.phone)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact-email" className="block text-sm font-medium text-text-secondary mb-1.5">
                      {t("contact_email")}
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      autoComplete="email"
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={fieldErrors.email ? "contact-email-error" : undefined}
                      className={`w-full rounded-2xl border bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:shadow-[0_0_0_3px_rgba(15,23,42,0.08)] transition-all text-sm ${
                        fieldErrors.email ? "border-danger/50" : "border-slate-200 focus:border-slate-400"
                      }`}
                      placeholder={t("contact_placeholder_email")}
                    />
                    {fieldErrors.email && (
                      <p id="contact-email-error" role="alert" className="mt-2 text-sm text-danger">
                        {getErrorMessage(fieldErrors.email)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-sm font-medium text-text-secondary mb-1.5">
                      {t("contact_message")}
                    </label>
                    <textarea
                      id="contact-message"
                      value={form.message}
                      onChange={(e) => updateField("message", e.target.value)}
                      rows={5}
                      aria-invalid={Boolean(fieldErrors.message)}
                      aria-describedby={fieldErrors.message ? "contact-message-error" : undefined}
                      className={`w-full resize-none rounded-2xl border bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:shadow-[0_0_0_3px_rgba(15,23,42,0.08)] transition-all text-sm ${
                        fieldErrors.message ? "border-danger/50" : "border-slate-200 focus:border-slate-400"
                      }`}
                      placeholder={t("contact_placeholder_message")}
                    />
                    {fieldErrors.message && (
                      <p id="contact-message-error" role="alert" className="mt-2 text-sm text-danger">
                        {getErrorMessage(fieldErrors.message)}
                      </p>
                    )}
                  </div>

                  {submitError && (
                    <motion.p
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-danger text-sm"
                    >
                      {getErrorMessage(submitError)}
                    </motion.p>
                  )}

                  {cooldownMessage && (
                    <p className="text-sm text-text-secondary">{cooldownMessage}</p>
                  )}

                  <motion.button
                    type="submit"
                    disabled={isSubmitDisabled}
                    whileHover={isSubmitDisabled ? undefined : { scale: 1.02 }}
                    whileTap={isSubmitDisabled ? undefined : { scale: 0.98 }}
                    className="w-full rounded-full bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {status === "sending" ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                        {t("contact_sending")}
                      </span>
                    ) : (
                      t("contact_send")
                    )}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
