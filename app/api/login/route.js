import { NextResponse } from "next/server";
import { getExpectedToken, AUTH_COOKIE_NAME } from "../../../lib/auth";

export async function POST(request) {
  const { password } = await request.json();

  if (password !== process.env.SITE_PASSWORD) {
    return NextResponse.json({ ok: false, error: "Parola gresita" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE_NAME, await getExpectedToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 zile
  });
  return response;
}
