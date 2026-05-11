const GA_ID = "G-VQW3Z9GBFL";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function trackPageView(path: string, title?: string) {
  if (typeof window.gtag !== "function") return;
  window.gtag("config", GA_ID, {
    page_path: path,
    page_title: title || document.title,
  });
}

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  if (typeof window.gtag !== "function") return;
  window.gtag("event", eventName, params);
}
