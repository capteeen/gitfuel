import { NextResponse } from "next/server";
import { policyPayload } from "@/lib/policy";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(policyPayload);
}
