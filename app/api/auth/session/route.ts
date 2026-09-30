import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  return NextResponse.json({
    authenticated: Boolean(session.githubLogin && session.githubUserId),
    login: session.githubLogin || null,
    githubUserId: session.githubUserId || null,
  });
}

export async function DELETE() {
  const session = await getSession();
  session.destroy();
  return NextResponse.json({ authenticated: false });
}
