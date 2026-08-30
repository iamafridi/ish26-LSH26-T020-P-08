import { NextResponse } from "next/server";
import { getCase, buildCheckingLists } from "../../../../../lib/engine";

export async function GET(req: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const c = getCase(decodeURIComponent(caseId));
  if (!c) return NextResponse.json({ error: `Case ${caseId} not found` }, { status: 404 });
  const lists = buildCheckingLists(c.results);
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  if (type && !["optional", "practical", "absent"].includes(type)) {
    return NextResponse.json({ error: "type must be optional|practical|absent" }, { status: 400 });
  }
  // @ts-ignore
  return NextResponse.json(type ? { [type]: lists[type] } : lists);
}
