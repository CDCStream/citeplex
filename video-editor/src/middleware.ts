import { NextRequest, NextResponse } from "next/server";
import path from "path";

/**
 * Proxy requests for static video assets to the video project's public folder.
 * Remotion's staticFile() resolves to "/<filename>", so the browser requests
 * these from the Next.js dev server. We intercept and serve from video/public/.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only proxy known video asset paths
  if (
    pathname.startsWith("/marketing/") ||
    pathname.startsWith("/screenshots/")
  ) {
    const url = req.nextUrl.clone();
    url.pathname = `/api/static${pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/marketing/:path*", "/screenshots/:path*"],
};
