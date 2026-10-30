import sanitizeHtml from "sanitize-html";
export function cleanContent(html) {
  return sanitizeHtml(html || "", {
    allowedTags: ["p", "br", "h2", "h3", "strong", "em", "u", "s", "ul", "ol", "li", "blockquote", "hr", "a", "img", "pre", "code"],
    allowedAttributes: { a: ["href", "title"], img: ["src", "alt", "title"], ol: ["start"] },
    allowedSchemes: ["https", "http", "mailto"],
    allowedSchemesByTag: { img: ["https", "http"] },
    allowProtocolRelative: false,
  });
}
export const contentText = html => sanitizeHtml(html || "", { allowedTags: [], allowedAttributes: {} }).replace(/&nbsp;/g, " ").trim();
