"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [prevPath, setPrevPath] = useState("");

  const complete = useCallback(() => {
    setProgress(100);
    const t = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const currentPath = pathname + searchParams.toString();
    if (prevPath && prevPath !== currentPath) {
      complete();
    }
    setPrevPath(currentPath);
  }, [pathname, searchParams, prevPath, complete]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("http") ||
        anchor.hasAttribute("download") ||
        anchor.target === "_blank"
      ) {
        return;
      }

      const currentPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
      if (href === currentPath) return;

      setVisible(true);
      setProgress(20);

      const t1 = setTimeout(() => setProgress(40), 100);
      const t2 = setTimeout(() => setProgress(60), 300);
      const t3 = setTimeout(() => setProgress(75), 600);
      const t4 = setTimeout(() => setProgress(85), 1500);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[9999] h-[3px]">
      <div
        className="h-full bg-primary transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
