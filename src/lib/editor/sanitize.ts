import DOMPurify from "isomorphic-dompurify";

export function sanitizeJournalHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "s",
      "u",
      "h1",
      "h2",
      "h3",
      "ul",
      "ol",
      "li",
      "blockquote",
      "code",
      "pre",
      "a",
    ],
    ALLOWED_ATTR: ["href", "target", "rel"],
  });
}
