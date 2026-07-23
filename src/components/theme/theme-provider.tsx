"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

// Next.js 16.2 + React 19 조합에서 next/script(beforeInteractive)로 넣은 테마 초기화 스크립트에도
// "Encountered a script tag while rendering React component" 경고가 뜨는 알려진 업스트림 버그가 있다
// (next/script의 beforeInteractive 구현 자체가 React 트리를 거쳐 <script>를 렌더링하기 때문).
// 스크립트는 SSR HTML에 정상적으로 삽입되어 실행되므로 기능상 문제는 없고, 이 특정 경고만 개발 모드에서
// 좁게(정확히 이 문구만) 필터링한다. Next.js가 패치되면 이 블록을 지우면 된다.
// 참고: https://github.com/vercel/next.js/issues (next/script beforeInteractive script tag warning)
if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("Encountered a script tag while rendering React component")) {
      return;
    }
    originalConsoleError(...args);
  };
}

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const STORAGE_KEY = "theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

// 테마 전환 시 트랜지션이 번쩍이지 않도록, 클래스를 바꾸는 한 프레임 동안만 모든 트랜지션을 끈다.
function applyThemeWithoutTransition(resolved: ResolvedTheme) {
  const style = document.createElement("style");
  style.textContent = "*,*::before,*::after{transition:none!important}";
  document.head.appendChild(style);
  applyTheme(resolved);
  // 강제 reflow를 유도해 위 스타일이 적용된 뒤에 클래스 변경이 반영되게 한다.
  void window.getComputedStyle(style).opacity;
  requestAnimationFrame(() => {
    document.head.removeChild(style);
  });
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial = stored ?? "system";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage(외부 시스템)를 읽어 마운트 시점에 한 번 동기화한다.
    setThemeState(initial);
    setResolvedTheme(initial === "system" ? getSystemTheme() : initial);
  }, []);

  useEffect(() => {
    if (theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    function handleChange() {
      const next = getSystemTheme();
      setResolvedTheme(next);
      applyThemeWithoutTransition(next);
    }
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    const resolved = next === "system" ? getSystemTheme() : next;
    applyThemeWithoutTransition(resolved);
    setThemeState(next);
    setResolvedTheme(resolved);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  return <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
