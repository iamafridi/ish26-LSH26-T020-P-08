import { NextResponse } from "next/server";
import { getBatch } from "../../../lib/engine";

export async function GET() {
  const batch = getBatch() as any;
  return NextResponse.json({ status: "ok", version: "1.0.0-next", uptime: process.uptime(), cases: batch.globalSummary.totalCases });
}
