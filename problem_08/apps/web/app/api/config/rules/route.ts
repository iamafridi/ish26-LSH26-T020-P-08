import { NextResponse } from "next/server";
import { defaultRuleConfig } from "../../../../lib/engine";

export async function GET() {
  return NextResponse.json(defaultRuleConfig.getRules());
}

export async function PUT(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (token !== "admin-token") {
    return NextResponse.json({ error: "Unauthorized: Bearer admin-token required" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const updated = defaultRuleConfig.update(body);
  return NextResponse.json({ message: "Rules updated (Next.js, in-memory)", version: updated.version, rules: updated });
}
