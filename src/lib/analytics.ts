"use client";

type EventProps = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (command: string, eventName: string, params?: EventProps) => void;
    plausible?: (eventName: string, options?: { props?: EventProps }) => void;
    posthog?: { capture?: (eventName: string, props?: EventProps) => void };
  }
}

export function trackEvent(eventName: string, props: EventProps = {}) {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...props,
  });

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, props);
  }

  if (typeof window.plausible === "function") {
    window.plausible(eventName, { props });
  }

  if (typeof window.posthog?.capture === "function") {
    window.posthog.capture(eventName, props);
  }
}

