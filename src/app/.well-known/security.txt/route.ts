import { NextResponse } from "next/server";

/**
 * RFC 9116 security.txt — vulnerability disclosure contact.
 * https://www.rfc-editor.org/rfc/rfc9116.html
 */
export function GET() {
  const expires = "2027-03-15T00:00:00.000Z";

  const body = `Contact: mailto:security@citeplex.io
Expires: ${expires}
Preferred-Languages: en, tr
Canonical: https://www.citeplex.io/.well-known/security.txt
`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
