import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  console.log("PATH:", req.nextUrl.pathname);
  console.log("AUTH:", req.auth);

  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);

    console.log("REDIRECT:", loginUrl.toString());

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
