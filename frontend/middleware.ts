import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const INDEXABLE_PATHS = new Set(["/", "/robots.txt", "/sitemap.xml"]);

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const pathname = request.nextUrl.pathname;

  if (INDEXABLE_PATHS.has(pathname)) {
    if (pathname === "/") {
      response.headers.set("X-Robots-Tag", "index, follow");
    }
    return response;
  }

  response.headers.set(
    "X-Robots-Tag",
    "noindex, nofollow, noarchive, nosnippet"
  );

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
