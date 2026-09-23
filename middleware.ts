import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  if (!req.auth) {
    const url = new URL(req.url);
    url.pathname = "/login";
    url.search = `callbackUrl=${encodeURIComponent(req.nextUrl.pathname)}`;

    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
