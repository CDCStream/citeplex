import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * DEV ONLY: Sets the demo session cookie to bypass Google OAuth.
 * Remove this file before production deployment.
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const cookieStore = await cookies();
  cookieStore.set("authjs.session-token", "demo-session-token", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
  });

  return NextResponse.redirect(new URL("/dashboard", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
}
