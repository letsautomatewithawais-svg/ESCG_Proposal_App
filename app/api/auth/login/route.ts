import { NextResponse } from "next/server";
import {
  createSessionToken,
  matchesAdminPassword,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth";
import { getClientIp, isLoginLocked, recordLoginFailure, recordLoginSuccess } from "@/lib/rateLimit";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (await isLoginLocked(ip)) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again in a few minutes." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const password = isRecord(body) && typeof body.password === "string" ? body.password : "";

  if (!matchesAdminPassword(password)) {
    await recordLoginFailure(ip);
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  await recordLoginSuccess(ip);

  const response = NextResponse.json({ success: true }, { status: 200 });
  response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
