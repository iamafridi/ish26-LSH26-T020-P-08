import { NextResponse } from "next/server";
import { getBatch } from "../../../lib/engine";

export async function GET() {
  const batch = getBatch() as any;
  return NextResponse.json({ cases: batch.cases.map((c: any) => c.summary), global: batch.globalSummary, meta: batch.meta });
}
