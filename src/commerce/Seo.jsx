import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useStore } from "./StoreContext";
import { preview } from "../shared/api";

export default function Seo() {
  const { data } = useStore();
  const location = useLocation();
  useEffect(() => {
    if (!data) return;
    const item = [...data.products, ...data.posts, ...data.policies].find(
      (entry) => location.pathname.endsWith(`/${entry.slug}`),
    );
    document.title =
      item?.seoTitle || item?.title || item?.name || data.settings.seoTitle;
    const meta = (name, value) => {
      let element = document.head.querySelector(`meta[name="${name}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.name = name;
        document.head.append(element);
      }
      element.content = value;
    };
    meta(
      "description",
      item?.seoDescription ||
        item?.excerpt ||
        item?.description ||
        data.settings.seoDescription,
    );
    meta(
      "robots",
      preview ||
        /^\/(admin|cart|account|checkout|login|register|forgot-password|reset-password)/.test(
          location.pathname,
        )
        ? "noindex, nofollow"
        : "index, follow",
    );
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.append(canonical);
    }
    canonical.href = window.location.origin + location.pathname;
  }, [data, location.pathname]);
  return null;
}
