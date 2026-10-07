import { aj } from "@/lib/arcjet";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const decision = await aj.protect(request);

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      const resetTime = decision.reason.resetTime as number | undefined;
      const resetSeconds = resetTime 
        ? Math.ceil((resetTime - Date.now()) / 1000) 
        : 60;
      return NextResponse.json(
        { error: "Rate limit exceeded", message: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(resetSeconds) } }
      );
    }
    if (decision.reason.isBot()) {
      return NextResponse.json(
        { error: "Bot detected", message: "Automated access is not allowed" },
        { status: 403 }
      );
    }
    if (decision.reason.isShield()) {
      return NextResponse.json(
        { error: "Security violation", message: "Request blocked by security rules" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Access denied", message: "Request blocked by security rules" },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/inngest|_next/static|_next/image|favicon.ico).*)"],
};