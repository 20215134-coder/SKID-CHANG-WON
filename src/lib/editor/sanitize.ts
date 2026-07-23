import sanitizeHtml from "sanitize-html";

// jsdom 기반 라이브러리(isomorphic-dompurify)는 Vercel 서버리스 환경에서 모듈 로드 자체가
// 실패해 이 함수를 import하는 라우트 전체가 500을 내는 문제가 있었다. sanitize-html은
// DOM 없이 순수 JS 파서로 동작해 서버리스에서도 안전하다.
export function sanitizeJournalHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "strong", "em", "s", "u", "h1", "h2", "h3", "ul", "ol", "li", "blockquote", "code", "pre", "a"],
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
  });
}
