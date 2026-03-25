import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { logActivity } from "@/lib/activity-logger";

const PROTECTED_ROUTES = ["/dashboard", "/settings", "/onboarding", "/checkout"];
const AUTH_ROUTES = ["/login"];
const PAGE_ROUTES = ["/dashboard", "/settings", "/onboarding"];

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const path = request.nextUrl.pathname;

  const isProtected = PROTECTED_ROUTES.some(
    (r) => path === r || path.startsWith(r + "/"),
  );
  const isAuthRoute = AUTH_ROUTES.some(
    (r) => path === r || path.startsWith(r + "/"),
  );

  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  const isResetPassword = path === "/login/reset-password";
  if (isAuthRoute && user && !isResetPassword) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (user && PAGE_ROUTES.some((r) => path === r || path.startsWith(r + "/"))) {
    logActivity({
      action: "page.view",
      userId: user.id,
      resourceType: "page",
      metadata: { path },
    });
  }

  return response;
}

export const config = {
  matcher: [
    // Skip SEO / crawler files — no auth cookies needed; avoids edge cases with Googlebot
    "/((?!_next/static|_next/image|favicon.ico|sitemap\\.xml|robots\\.txt|llms\\.txt|\\.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
