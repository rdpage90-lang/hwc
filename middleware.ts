import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  console.log("PATH:", req.nextUrl.pathname);
  console.log("ORIGIN:", req.nextUrl.origin);
  console.log("AUTH:", req.auth);

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
