import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET before GitHub sign-in." }, { status: 500 });
  }
  const session = await getSession();
  const state = crypto.randomUUID();
  session.oauthState = state;
  await session.save();
  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const redirectUri = process.env.GITHUB_CALLBACK_URL || `${origin}/api/auth/github/callback`;
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "read:user");
  url.searchParams.set("state", state);
  return NextResponse.redirect(url);
}
