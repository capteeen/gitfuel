import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type GitfuelSession = {
  githubUserId?: number;
  githubLogin?: string;
  accessToken?: string;
  oauthState?: string;
};

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_PASSWORD || "development-only-gitfuel-session-secret-change",
  cookieName: "gitfuel_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  },
};

export async function getSession() {
  return getIronSession<GitfuelSession>(await cookies(), sessionOptions);
}
