import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = process.env.NEXT_PUBLIC_APP_URL || url.origin;
  const fail = (reason: string) => NextResponse.redirect(new URL(`/claim?error=${encodeURIComponent(reason)}`, origin));
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const session = await getSession();
  if (!code || !state || state !== session.oauthState) return fail("GitHub OAuth state did not match.");
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail("GitHub OAuth app credentials are not set.");
  const redirectUri = process.env.GITHUB_CALLBACK_URL || `${origin}/api/auth/github/callback`;
  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri }),
  });
  const tokenBody = (await tokenResponse.json()) as { access_token?: string; error?: string };
  if (!tokenBody.access_token) return fail(tokenBody.error || "GitHub did not return a token.");
  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${tokenBody.access_token}`,
      "User-Agent": "GitFuel",
    },
  });
  if (!userResponse.ok) return fail("GitHub user lookup failed.");
  const user = (await userResponse.json()) as { id?: number; login?: string };
  if (!user.id || !user.login) return fail("GitHub user id was missing.");
  session.githubUserId = user.id;
  session.githubLogin = user.login;
  session.accessToken = tokenBody.access_token;
  session.oauthState = undefined;
  await session.save();
  const next = url.searchParams.get("next") || "/claim";
  return NextResponse.redirect(new URL(next.startsWith("/") ? next : "/claim", origin));
}
