import { NextResponse } from "next/server";
import { getCase } from "../../../../../lib/engine";

export async function GET(_req: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const c = getCase(decodeURIComponent(caseId));
  if (!c) return NextResponse.json({ error: `Case ${caseId} not found` }, { status: 404 });
  return NextResponse.json({ case_id: caseId, summary: c.summary, results: c.results });
}
