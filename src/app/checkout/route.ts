import { Checkout } from "@polar-sh/nextjs";
import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";

/**
 * Polar checkout: pre-fills email/name from logged-in user when query omits them.
 * @see https://github.com/polarsource/polar — `customerEmail` / `customerName` query params
 */
const polarCheckoutHandler = Checkout({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?checkout_id={CHECKOUT_ID}`,
});

export async function GET(req: NextRequest) {
  const url = req.nextUrl.clone();

  if (!url.searchParams.has("customerEmail")) {
    const user = await getAuthUser();
    if (user?.email) {
      url.searchParams.set("customerEmail", user.email);
    }
    if (user?.name && !url.searchParams.has("customerName")) {
      url.searchParams.set("customerName", user.name);
    }
  }

  const forwarded = new NextRequest(url, {
    headers: req.headers,
    method: req.method,
  });

  return polarCheckoutHandler(forwarded);
}
