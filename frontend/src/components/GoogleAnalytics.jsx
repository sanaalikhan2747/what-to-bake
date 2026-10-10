import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export default function GoogleAnalytics() {
  const { pathname, search } = useLocation();
  const measurementId = process.env.REACT_APP_GA_MEASUREMENT_ID;
  const previousPage = useRef(null);

  useEffect(() => {
    if (!measurementId) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() {
      window.dataLayer.push(arguments);
    };

    if (window.__whatToBakeGaMeasurementId === measurementId) return;

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);

    window.gtag("js", new Date());
    window.gtag("config", measurementId, { send_page_view: false });
    window.__whatToBakeGaMeasurementId = measurementId;
  }, [measurementId]);

  useEffect(() => {
    if (!measurementId || typeof window.gtag !== "function") return;

    const pagePath = `${pathname}${search}`;
    if (previousPage.current === pagePath) return;
    previousPage.current = pagePath;

    window.gtag("event", "page_view", {
      page_path: pagePath,
      page_title: document.title,
      page_location: window.location.href,
    });
  }, [measurementId, pathname, search]);

  return null;
}